# Quick Setup Guide

## Step 1: Set up Trigger.dev (5 minutes)

1. Go to: https://cloud.trigger.dev
2. Sign up or log in
3. Click "Create Project"
4. Copy your **Project ID** (starts with `proj_`)
5. Copy your **API Key** (starts with `tr_dev_`)
6. Open `.env` file and update:
   ```
   TRIGGER_PROJECT_ID=proj_xxxxx
   TRIGGER_API_KEY=tr_dev_xxxxx
   ```
7. Open `trigger.config.ts` and replace `proj_YOUR_PROJECT_ID` with your actual project ID

## Step 2: Enable APIs and Share Google Sheet

### A. Enable Gmail API
1. Go to: https://console.cloud.google.com/apis/library/gmail.googleapis.com
2. Make sure project `my-project-fawad123` is selected
3. Click "Enable" if not already enabled

### B. Share the Google Sheet with Service Account
1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1-lKLQkPxIgorVpD51tBMfU4XEVb69ryaVMJYhFrFlno
2. Click "Share" button (top right)
3. Add this email: `jahan-218@my-project-fawad123.iam.gserviceaccount.com`
4. Give it "Editor" permissions
5. Click "Send"

### C. Update Sender Email
In `.env`, update to your personal Gmail:
```
SENDER_EMAIL=your-email@gmail.com
```
(This is the email that will send responses to customers)

## Step 3: Test Locally

Run in terminal:
```bash
npm run dev
```

This will start the Trigger.dev dev server.

## Step 4: I'll Help You Test

Once the dev server is running, type "ready" and I'll trigger a test ticket to verify everything works.

---

**Current Status:**
- ✅ Code created
- ✅ Service account configured
- ⏳ Waiting for Trigger.dev credentials
- ⏳ Waiting for Gmail permissions
