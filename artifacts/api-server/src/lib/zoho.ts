import { logger } from "./logger.js";

interface ZohoTokens {
  accessToken: string;
  expiresAt: number; // timestamp in milliseconds
}

// In-memory token cache - never exposed to frontend
let tokenCache: ZohoTokens | null = null;

/**
 * Get a valid Zoho access token, refreshing if necessary
 * Tokens are cached in memory and refreshed automatically when they expire
 */
async function getValidAccessToken(): Promise<string> {
  // Check if we have a valid cached token (expires in more than 5 minutes)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    logger.debug("Using cached Zoho access token");
    return tokenCache.accessToken;
  }

  logger.info("Refreshing Zoho access token");

  try {
    const response = await fetch("https://accounts.zoho.in/oauth/v2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zoho token refresh failed: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;

    if (!data.access_token) {
      throw new Error("No access token in Zoho response");
    }

    // Cache the token with expiry time
    tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    logger.info("Zoho access token refreshed successfully");
    return tokenCache.accessToken;
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to refresh Zoho access token");
    throw new Error(`Zoho authentication failed: ${error.message}`);
  }
}

/**
 * Push a contact (customer or vendor) to Zoho Books
 */
export async function pushContact(
  data: any,
  type: "customer" | "vendor"
): Promise<{ success: boolean; zohoId?: string; error?: string }> {
  try {
    const token = await getValidAccessToken();

    // Map our data to Zoho's format
    const payload: any = {
      contact_name: data.contactPerson || data.name || data.businessName,
      company_name: data.name || data.businessName,
      contact_type: type,
    };

    // Add GST information if available
    if (data.gstin) {
      payload.gst_no = data.gstin;
      payload.gst_treatment = "business_gst";
    } else {
      payload.gst_treatment = "consumer";
    }

    // Add billing address if available
    if (data.address || data.state || data.pincode) {
      payload.billing_address = {
        address: data.address || "",
        state: data.state || "",
        zip: data.pincode || "",
        country: "India",
      };
    }

    // Add contact info
    if (data.contactInfo || data.contact) {
      payload.phone = data.contactInfo || data.contact;
    }

    // Add payment terms for vendors
    if (type === "vendor" && data.paymentTerms) {
      payload.payment_terms = parseInt(data.paymentTerms.replace(/\D/g, "")) || 0;
      payload.payment_terms_label = data.paymentTerms;
    }

    logger.info({ type, payload }, "Pushing contact to Zoho Books");

    const response = await fetch(
      `${process.env.ZOHO_API_DOMAIN}/books/v3/contacts?organization_id=${process.env.ZOHO_ORGANIZATION_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json() as any;

    if (result.code === 0 && result.contact) {
      logger.info({ zohoId: result.contact.contact_id }, "Contact pushed to Zoho successfully");
      return {
        success: true,
        zohoId: result.contact.contact_id,
      };
    } else {
      const errorMessage = result.message || "Unknown Zoho API error";
      logger.error({ result }, "Zoho API returned error");
      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to push contact to Zoho");
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Push an item to Zoho Books
 */
export async function pushItem(
  data: any
): Promise<{ success: boolean; zohoId?: string; error?: string }> {
  try {
    const token = await getValidAccessToken();

    // Map our data to Zoho's format
    const payload: any = {
      name: data.name,
      description: data.description || "",
      rate: parseFloat(data.sellingRate),
      purchase_rate: parseFloat(data.purchaseRate),
      unit: data.unit,
      item_type: "sales_and_purchases", // Zoho accepts: sales_and_purchases, sales, or purchases
      tax_percentage: parseFloat(data.gstRate),
    };

    // Only include HSN/SAC if provided and not the default "0000"
    if (data.hsnCode && data.hsnCode.trim() !== "" && data.hsnCode !== "0000") {
      payload.hsn_or_sac = data.hsnCode;
    }

    logger.info({
      itemId: data.id,
      itemName: data.name,
      payload,
      rawData: {
        hsnCode: data.hsnCode,
        sellingRate: data.sellingRate,
        purchaseRate: data.purchaseRate,
        gstRate: data.gstRate,
        unit: data.unit
      }
    }, "Pushing item to Zoho Books - Full payload details");

    const response = await fetch(
      `${process.env.ZOHO_API_DOMAIN}/books/v3/items?organization_id=${process.env.ZOHO_ORGANIZATION_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json() as any;

    logger.info({
      itemId: data.id,
      itemName: data.name,
      httpStatus: response.status,
      zohoResponse: result
    }, "Zoho API response received");

    if (result.code === 0 && result.item) {
      logger.info({
        itemId: data.id,
        itemName: data.name,
        zohoId: result.item.item_id
      }, "Item pushed to Zoho successfully");
      return {
        success: true,
        zohoId: result.item.item_id,
      };
    } else {
      const errorMessage = result.message || "Unknown Zoho API error";
      logger.error({
        itemId: data.id,
        itemName: data.name,
        zohoCode: result.code,
        zohoMessage: result.message,
        fullResult: result
      }, "Zoho API returned error");
      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error: any) {
    logger.error({
      itemId: data.id,
      itemName: data.name,
      error: error.message,
      stack: error.stack
    }, "Failed to push item to Zoho - Exception caught");
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Validate Zoho configuration
 */
export function validateZohoConfig(): boolean {
  const required = [
    "ZOHO_CLIENT_ID",
    "ZOHO_CLIENT_SECRET",
    "ZOHO_REFRESH_TOKEN",
    "ZOHO_ORGANIZATION_ID",
    "ZOHO_API_DOMAIN",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error({ missing }, "Missing required Zoho configuration");
    return false;
  }

  return true;
}

// Made with Bob
