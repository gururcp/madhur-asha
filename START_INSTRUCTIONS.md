# 🚀 Madhur-Asha Ledger - Server Startup Instructions

This guide provides step-by-step instructions to manually start the backend and frontend servers for the Madhur-Asha Ledger application.

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Node.js installed (v18 or higher)
- ✅ pnpm package manager installed
- ✅ All dependencies installed (`pnpm install` in project root)
- ✅ Environment variables configured (`.env` file in project root)

---

## 🔧 Starting the Backend Server

### Step 1: Open a New Terminal
Open a new terminal window or tab in your project directory.

### Step 2: Navigate to Backend Directory
```bash
cd artifacts/api-server
```

### Step 3: Start the Backend Server
```bash
pnpm run dev
```

### ✅ Expected Output
You should see output similar to:
```
> api-server@1.0.0 dev
> tsx watch src/index.ts

Server running on http://localhost:3000
Database connected successfully
```

### 🌐 Backend URL
- **API Server**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

---

## 🎨 Starting the Frontend Server

### Step 1: Open Another New Terminal
Open a **second** terminal window or tab (keep the backend terminal running).

### Step 2: Navigate to Frontend Directory
```bash
cd artifacts/madhur-asha
```

### Step 3: Start the Frontend Server
```bash
pnpm run dev
```

### ✅ Expected Output
You should see output similar to:
```
> madhur-asha@0.0.0 dev
> vite

  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 🌐 Frontend URL
- **Application**: http://localhost:5173

---

## ✅ Verifying Both Servers Are Running

### Backend Verification
1. Open your browser and go to: http://localhost:3000/health
2. You should see a JSON response: `{"status":"ok"}`

### Frontend Verification
1. Open your browser and go to: http://localhost:5173
2. You should see the Madhur-Asha Ledger application interface

### Full Application Test
1. Access the frontend at http://localhost:5173
2. The frontend will automatically connect to the backend at http://localhost:3000
3. Try logging in or navigating through the application to confirm everything works

---

## 🛑 Stopping the Servers

When you're done working, stop both servers:

### Method 1: Graceful Shutdown (Recommended)
In each terminal window:
1. Press `Ctrl + C` (Windows/Linux) or `Cmd + C` (Mac)
2. Wait for the process to terminate gracefully

### Method 2: Force Stop All Node Processes (If needed)
If servers don't stop gracefully, run this command in a new terminal:
```bash
taskkill /F /IM node.exe
```
**⚠️ Warning**: This will stop ALL Node.js processes on your system.

---

## 🔍 Troubleshooting

### Port Already in Use
If you see an error like "Port 3000 is already in use":
1. Stop any existing Node.js processes: `taskkill /F /IM node.exe`
2. Try starting the servers again

### Backend Connection Error
If the frontend can't connect to the backend:
1. Verify the backend is running on http://localhost:3000
2. Check the backend terminal for any error messages
3. Ensure your `.env` file has the correct `DATABASE_URL`

### Database Connection Error
If you see database connection errors:
1. Verify your `.env` file has the correct `DATABASE_URL`
2. Ensure your database (Neon/PostgreSQL) is accessible
3. Check if database migrations have been run

### Dependencies Not Found
If you see module not found errors:
1. Run `pnpm install` in the project root
2. Run `pnpm install` in `artifacts/api-server`
3. Run `pnpm install` in `artifacts/madhur-asha`

---

## 📝 Quick Reference

| Component | Directory | Command | URL |
|-----------|-----------|---------|-----|
| Backend | `artifacts/api-server` | `pnpm run dev` | http://localhost:3000 |
| Frontend | `artifacts/madhur-asha` | `pnpm run dev` | http://localhost:5173 |

---

## 💡 Tips

- **Keep both terminals open** while working on the application
- **Backend must start first** before the frontend for proper initialization
- **Watch for errors** in both terminal windows during development
- **Hot reload is enabled** - changes to code will automatically refresh
- **Use separate terminal tabs** to easily monitor both servers

---

## 🆘 Need Help?

If you encounter issues:
1. Check the terminal output for specific error messages
2. Verify all prerequisites are met
3. Ensure environment variables are correctly configured
4. Review the project's README.md for additional setup information

---

**Happy Coding! 🎉**