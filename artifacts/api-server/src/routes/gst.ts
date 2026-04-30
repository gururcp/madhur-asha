import { Router, type IRouter } from "express";
import { requireApproved } from "../lib/auth.js";

const router: IRouter = Router();

// Helper function to convert text to Title Case
function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// GST Lookup Route
router.get("/lookup", requireApproved, async (req, res, next) => {
  try {
    const { gstin } = req.query;
    
    // 1. Validate GSTIN format
    // GSTIN format: 2 digits (state code) + 10 alphanumeric (PAN) + 1 alphabet (entity code) + 1 alphabet/digit (default 'Z') + 1 check digit
    // Position 14 can be Z, C, D, F, etc. depending on entity type
    const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[A-Z\d]{1}[A-Z\d]{1}$/;
    if (!gstin || typeof gstin !== 'string' || !gstinRegex.test(gstin)) {
      return res.status(400).json({
        error: "Invalid GSTIN format. Must be 15 characters matching pattern: 27XXXXX0000X1XX"
      });
    }
    
    // 2. Call RapidAPI
    const response = await fetch(
      `https://gst-insights-api.p.rapidapi.com/getGSTDetailsUsingGST/${gstin}`,
      {
        headers: {
          'x-rapidapi-host': 'gst-insights-api.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPID_GST_API || ''
        }
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "GSTIN not found in GST records" });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: "Too many requests. Please try again later." });
      }
      throw new Error(`RapidAPI error: ${response.status}`);
    }
    
    const apiData = await response.json() as any;
    
    // Log the full response for debugging
    console.log('GST API Response for', gstin, ':', JSON.stringify(apiData, null, 2));
    
    if (!apiData.success || !apiData.data) {
      return res.status(404).json({ error: "GSTIN not found in GST records" });
    }
    
    // 3. Map response - Handle both array and object formats
    // Sometimes API returns data as array, sometimes as object
    let data = apiData.data;
    if (Array.isArray(data)) {
      data = data[0]; // Take first element if array
    }
    
    if (!data) {
      return res.status(404).json({ error: "No GST data found" });
    }
    
    const principalAddr = data?.principalAddress?.address || {};
    
    // Get state - try multiple fields as API structure varies
    const stateRaw = principalAddr.stateCode ||
                     principalAddr.statecd ||
                     principalAddr.streetcd ||
                     data?.stateJurisdiction ||
                     '';
    
    // Extract state name if it contains underscore (e.g., "MAHARASHTRA_701" -> "MAHARASHTRA")
    const stateName = stateRaw && stateRaw.includes('_') ? stateRaw.split('_')[0] : stateRaw;
    
    // Build address from available fields
    const addressParts = [
      principalAddr.buildingNumber,
      principalAddr.buildingName,
      principalAddr.floorNumber,
      principalAddr.street,
      principalAddr.location,
      principalAddr.locality,
      principalAddr.district
    ].filter(part => part && part.trim());
    
    const mappedData = {
      name: toTitleCase(data?.legalName || data?.tradeName || ''),
      gstStatus: data?.status || '',
      address: addressParts.map(toTitleCase).join(', '),
      state: toTitleCase(stateName || ''),
      pincode: principalAddr.pincode || ''
    };
    
    console.log('Mapped data:', mappedData);
    
    res.json(mappedData);
    
  } catch (err) {
    next(err);
  }
});

export default router;

// Made with Bob
