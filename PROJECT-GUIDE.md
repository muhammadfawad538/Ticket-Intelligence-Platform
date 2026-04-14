# Customer Support Ticket Automation System

## Overview
Automated system that receives support tickets via Google Form, analyzes them with AI, and logs everything to Google Sheets.

## System Architecture

**Flow:**
1. User submits Google Form
2. Google Apps Script triggers Trigger.dev task
3. Task analyzes ticket (category, sentiment, priority)
4. Task generates AI response
5. Task logs to Google Sheet

## Project Structure

```
E:\wat1\
├── src/trigger/support-tickets/
│   └── process-ticket.ts          # Main task logic
├── google-form-final-production.gs # Google Apps Script webhook
├── service-account.json            # Google Cloud credentials
├── .env                            # Environment variables (local)
├── trigger.config.ts               # Trigger.dev configuration
└── package.json                    # Dependencies
```

## Environment Variables

### Local (.env file)
```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_SHEET_ID=1-lKLQkPxIgorVpD51tBMfU4XEVb69ryaVMJYhFrFlno
SENDEREMAIL=mfawaduetpeshawar@gmail.com
TRIGGER_PROJECT_ID=proj_gnbfkqigjkhajdkocsxd
TRIGGER_SECRET_KEY=tr_dev_FqeRJ2NtpBpe0eXoo704
```

### Production (Trigger.dev Dashboard)
Must add these to: Settings → Environment Variables (both Production and Staging)
- `GOOGLE_SERVICE_ACCOUNT_JSON` - Full JSON from service-account.json
- `GOOGLE_SHEET_ID` - Google Sheet ID
- `SENDEREMAIL` - Sender email address

## Google Cloud Setup

### Service Account
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Create service account: `jahan-218@my-project-fawad123.iam.gserviceaccount.com`
3. Download JSON key → save as `service-account.json`
4. Share Google Sheet with service account email (Editor permissions)

### Google Sheet
- Sheet ID: `1-lKLQkPxIgorVpD51tBMfU4XEVb69ryaVMJYhFrFlno`
- URL: https://docs.google.com/spreadsheets/d/1-lKLQkPxIgorVpD51tBMfU4XEVb69ryaVMJYhFrFlno/edit
- Columns: Timestamp, Name, Email, Message, Category, Sentiment, Priority, Status, Response

## Google Form Setup

### Form Fields (in order)
1. Name (Short answer)
2. Description/Message (Paragraph)
3. Email (Short answer)

### Apps Script Setup
1. Open form → Three dots → Script editor
2. Paste code from `google-form-final-production.gs`
3. Set trigger: Edit → Current project's triggers → Add Trigger
   - Function: `onFormSubmit`
   - Event source: From form
   - Event type: On form submit
4. Save and authorize

### Important: Production API Key
The script uses a **production** API key (starts with `tr_prod_`), NOT the dev key.
- Dev keys (`tr_dev_`) trigger Development environment (runs expire)
- Production keys trigger Production environment (runs execute)

## Trigger.dev Configuration

### Project Details
- Project ID: `proj_gnbfkqigjkhajdkocsxd`
- Organization: fawadhi
- Dashboard: https://cloud.trigger.dev/orgs/fawadhi-6e2b/projects/ticet-Vy7V

### Task Configuration
```typescript
export const processTicket = task({
  id: "process-support-ticket",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10_000,
  },
  run: async (payload: TicketPayload) => {
    // Task logic
  }
});
```

### Deployment
```bash
# Deploy to production
npx trigger.dev@latest deploy --skip-update-check

# Check deployment status
npx trigger.dev@latest whoami
```

Current version: 20260414.5

## Common Issues & Solutions

### Issue 1: "JavaScript heap out of memory"
**Problem:** googleapis npm package too large for Trigger.dev environment

**Solution:** Use native `fetch()` with Google REST APIs instead of googleapis SDK
- Google Sheets API: `https://sheets.googleapis.com/v4/spreadsheets/{sheetId}`
- Custom JWT signing for service account authentication

### Issue 2: Google Form triggers not firing
**Problem:** Trigger created but `e.response` is undefined

**Solution:** 
1. Delete existing trigger
2. Create new trigger from form's script editor (not standalone script)
3. Set event source to "From form" (not "From spreadsheet")

### Issue 3: API endpoint returns 404
**Problem:** Wrong endpoint format for external webhooks

**Solution:** Use correct v4 endpoint format:
```
POST https://api.trigger.dev/api/v1/tasks/{taskId}/trigger
Headers: Authorization: Bearer {API_KEY}
Body: { "payload": { ...data } }
```

### Issue 4: Runs queuing but not executing
**Problem:** Environment variables not set in Trigger.dev dashboard

**Solution:**
1. Add ALL env vars to dashboard: Settings → Environment Variables
2. Select both Production and Staging environments
3. Redeploy after adding variables

### Issue 5: "Invalid character" error in JWT creation
**Problem:** Private key has literal `\n` strings instead of actual newlines

**Solution:** Parse private key correctly:
```typescript
const normalizedKey = privateKey.replace(/\\n/g, '\n');
const pemContents = normalizedKey
  .split('\n')
  .filter(line => line && !line.includes('BEGIN') && !line.includes('END'))
  .join('')
  .trim();
```

### Issue 6: Runs going to Development instead of Production
**Problem:** Using dev API key (`tr_dev_`) in production webhook

**Solution:**
1. Get production API key from dashboard
2. Update Google Apps Script with production key
3. Dev keys → Development environment (expires)
4. Production keys → Production environment (executes)

### Issue 7: Gmail OAuth "invalid_grant" errors
**Problem:** OAuth refresh token expired or invalid

**Status:** Gmail sending currently disabled
**Workaround:** System logs to Google Sheet successfully; email can be added later

## Ticket Analysis Logic

### Category Detection
- **billing**: payment, charge, refund, invoice, subscription
- **technical**: error, bug, crash, not working, broken
- **account**: login, password, access, locked
- **general**: everything else

### Sentiment Analysis
- **angry**: urgent, immediately, unacceptable, terrible, worst, frustrated
- **positive**: thank, great, excellent, appreciate, love
- **neutral**: default

### Priority Assignment
- **critical**: angry + (billing OR technical)
- **high**: angry OR (billing + urgent keywords)
- **medium**: technical OR billing
- **low**: everything else

### Status Rules
- **escalated**: angry sentiment OR critical priority OR confidence < 0.5
- **resolved**: positive sentiment + low priority
- **pending**: everything else

## Testing

### Local Testing
```bash
# Start dev server
npx trigger.dev@latest dev

# Trigger test run
node test-trigger.mjs
```

### Production Testing
1. Submit Google Form
2. Check Apps Script execution logs (should show Response code: 200)
3. Check Trigger.dev dashboard for run status
4. Verify data in Google Sheet

## Deployment Checklist

Before deploying:
- [ ] All env vars added to Trigger.dev dashboard (Production + Staging)
- [ ] Service account has access to Google Sheet
- [ ] Google Form trigger is set up correctly
- [ ] Using production API key in Apps Script
- [ ] Tested locally with dev server
- [ ] `.env` is in `.gitignore`

Deploy:
```bash
git add -A
git commit -m "Your message"
npx trigger.dev@latest deploy --skip-update-check
```

After deploying:
- [ ] Check deployment status in dashboard
- [ ] Submit test form
- [ ] Verify run completes successfully
- [ ] Confirm data appears in Google Sheet

## Future Enhancements

### Gmail Integration (Currently Disabled)
To enable email responses:
1. Fix Gmail OAuth credentials
2. Get valid refresh token
3. Update environment variables
4. Uncomment email sending code in `process-ticket.ts`

### Potential Features
- Slack notifications for critical tickets
- Auto-reply emails with AI responses
- Ticket assignment to team members
- Analytics dashboard
- Multi-language support

## Key Learnings

1. **Always use REST APIs over SDKs in serverless**: googleapis package caused memory issues
2. **Environment variables must be in dashboard**: Local .env doesn't work in production
3. **Dev vs Production keys matter**: Dev keys trigger dev environment which expires runs
4. **Private key parsing is tricky**: JSON escapes newlines as `\n` strings
5. **Google Form triggers need correct setup**: Must be created from form's script editor
6. **Trigger.dev v4 uses different patterns**: No `client.defineJob`, use `task()` from SDK

## Support & Resources

- Trigger.dev Docs: https://trigger.dev/docs
- Google Sheets API: https://developers.google.com/sheets/api
- Google Apps Script: https://developers.google.com/apps-script
- Project Dashboard: https://cloud.trigger.dev/orgs/fawadhi-6e2b/projects/ticet-Vy7V

## Contact

- Project Owner: Muhammad Fawad
- Email: mfawaduetpeshawar@gmail.com
- Created: April 14, 2026
