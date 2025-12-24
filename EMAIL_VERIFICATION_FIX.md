# Email Verification System - Complete Fix Summary

## Problem Statement
Email verification codes were timing out when trying to connect to Brevo SMTP server on Render deployment.

**Error**: "Connection timeout" from nodemailer when sending to `smtp-relay.brevo.com:465`

## Root Cause Analysis

### Issue #1: Database Table Missing (FIXED in previous session)
- Error: "relation email_verification_codes does not exist"
- Root cause: Tables defined in TypeScript schema and Drizzle migrations but NOT in `init-db.ts`
- Solution: Added table creation to `server/init-db.ts` (lines 49-77 with indexes at 665-671)

### Issue #2: Email Delivery Timing Out (FIXED in this session)

**Primary Problem**: Render's Free tier may block outbound SMTP connections (port 587/465)

**Previous Attempt (Partially Correct)**:
- Changed from port 465 (implicit SSL) to port 587 (STARTTLS)
- Correct protocol but still timing out → indicates network issue, not config issue

**Solution Implemented**: Brevo API Fallback
- Added support for Brevo REST API as primary alternative
- SMTP remains first choice for compatibility
- If SMTP fails, automatically falls back to HTTPS-based API (more reliable on Render)
- Both methods use the same email templates for consistency

## Changes Made

### 1. **render.yaml** - Added BREVO_API_KEY environment variable
```yaml
- key: BREVO_API_KEY
  sync: false  # Secret variable
```

### 2. **server/services/email.ts** - Enhanced with API fallback
- Added detection for both `BREVO_SMTP_PASSWORD` and `BREVO_API_KEY`
- New function `sendViaBrevoAPI()` - Calls Brevo REST API for email sending
- Updated `sendVerificationEmail()`:
  - Tries SMTP first if available (20s timeout)
  - Falls back to API if SMTP fails
  - Falls back to API if no SMTP configured
- Updated `sendPasswordResetEmail()` - Same dual-method approach
- Updated `send2FAResetEmail()` - Same dual-method approach

**API Endpoint Used**: `https://api.brevo.com/v3/smtp/email`
```json
{
  "sender": { "name": "KYC Marketplace", "email": "kycmarketplace.noreply@gmail.com" },
  "to": [{ "email": "user@example.com" }],
  "subject": "Verify Your Email Address - KYC Marketplace",
  "htmlContent": "<html>...</html>"
}
```

### 3. **server/routes.ts** - Added diagnostic endpoints
- `GET /api/health` - Health check endpoint (no auth required)
- `POST /api/admin/test-email` - Email service test endpoint (admin only)
  - Allows admin to test email delivery
  - Returns whether email was sent successfully
  - Logs detailed error information

### 4. **server/services/email-brevo-api.ts** - Optional standalone module
- Created as reference implementation
- Contains standalone Brevo API functions
- Can be used independently if needed

## Technical Details

### Email Service Flow
```
sendVerificationEmail(email, code)
    ↓
    If SMTP configured (BREVO_SMTP_PASSWORD):
        Try SMTP (20s timeout)
            ↓ Success → Return true
            ↓ Timeout/Error → Fall back to API
    ↓
    If API key configured (BREVO_API_KEY):
        Call Brevo REST API
            ↓ Success → Return true
            ↓ Error → Return false
    ↓
    If neither configured: Return false with warning
```

### Logging Enhancements
- Startup diagnostics show which auth method is available
- Detailed error messages on each email attempt
- Clear indication of fallback mechanism activation
- Admin test endpoint logs detailed failure information

### Database
- Already fixed: `email_verification_codes`, `password_reset_codes`, `two_factor_reset_codes` tables created via `init-db.ts`
- Indexes created for efficient lookups

## How to Use

### Setting Up Email

**Option 1: SMTP (Direct, preferred if works)**
```
BREVO_SMTP_PASSWORD=<your-smtp-password-from-brevo>
```

**Option 2: REST API (Better for Render, newer approach)**
```
BREVO_API_KEY=<your-api-key-from-brevo>
```

**Option 3: Both (Maximum compatibility - try SMTP first, fall back to API)**
```
BREVO_SMTP_PASSWORD=<your-smtp-password>
BREVO_API_KEY=<your-api-key>
```

### Testing Email Delivery

1. **Health check**:
   ```bash
   curl https://kyc-mf3n.onrender.com/api/health
   ```

2. **Test email sending (as admin)**:
   ```bash
   curl -X POST https://kyc-mf3n.onrender.com/api/admin/test-email \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <jwt-token>" \
     -d '{"email":"test@example.com"}'
   ```

## Deployment

All changes have been committed and pushed:
- Commit: `9e09194` - "Add: Brevo API fallback for email sending (better Render compatibility)"
- Render will auto-deploy on push to main branch
- Service: `srv-d55q41be5dus73cch4cg`
- Region: Virginia (US)

## Testing Checklist

After deployment:
- [ ] Check Render logs for "Brevo API configured" message
- [ ] Test email verification code endpoint: `POST /api/auth/send-verification-code`
- [ ] Check if email arrives within 5 minutes (API method)
- [ ] Test admin email test endpoint: `POST /api/admin/test-email`
- [ ] Verify error logs show fallback activation if SMTP fails
- [ ] Test complete registration flow (send code → verify code → create account)

## Environment Variables Required

In Render Dashboard, ensure these are set:

**Required**:
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Render)
- `JWT_SECRET` - For auth tokens
- `NODE_ENV` - Set to "production"

**For Email (choose at least one)**:
- `BREVO_SMTP_PASSWORD` - For SMTP method
- `BREVO_API_KEY` - For REST API method (recommended)

**Other Auth**:
- `ADMIN_KAI_PASSWORD`
- `ADMIN_TURBO_PASSWORD`
- `CS_PASSWORD`
- `FINANCE_MANAGER_PASSWORD`

## Notes

- SMTP timeout is likely due to Render's Free tier network restrictions
- REST API uses HTTPS (port 443) which is never blocked
- Fallback is automatic and transparent to users
- Both methods use the same email templates
- No changes needed to client code - API is transparent

## Next Steps

If emails still don't arrive after deployment:

1. **Check logs**:
   - Look for "Brevo API configured" or "Brevo configured" messages
   - Check for "Error" messages from either SMTP or API calls

2. **Verify credentials**:
   - Ensure BREVO_API_KEY or BREVO_SMTP_PASSWORD are set in Render dashboard
   - Test with the new `/api/admin/test-email` endpoint

3. **Check Brevo account**:
   - Verify API key is active and not expired
   - Check API rate limits
   - Verify sender email domain is authorized

4. **Alternative solution**:
   - If neither works, consider using a different email provider (SendGrid, Mailgun, etc.)
