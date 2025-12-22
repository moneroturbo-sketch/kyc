# Deployment Guide

## Database Migrations

All database schema changes are captured in migration files in the `migrations/` directory. When deploying this app outside of Replit, the database will be automatically created with all necessary tables and columns.

### Setting Up Database on New Deployment

1. **Create a PostgreSQL database**
   ```bash
   # Your PostgreSQL database must be running
   # Create a new database (example: kyc_marketplace_db)
   psql -U postgres -c "CREATE DATABASE kyc_marketplace_db;"
   ```

2. **Set environment variable**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/kyc_marketplace_db"
   ```

3. **Install dependencies and run migrations**
   ```bash
   npm install
   npx drizzle-kit migrate
   ```

### Migration Files Included

The app includes the following migration files that will be applied in order:

1. `0000_wide_layla_miller.sql` - Initial complete schema (all tables, enums, and relations)
2. `0001_add_min_deposit_amount.sql` - Added min_deposit_amount column
3. `0002_add_confirmed_at.sql` - Added confirmed_at timestamp
4. `0003_add_verify_badge.sql` - Added has_verify_badge column
5. `0004_add_auth_security_tables.sql` - Added password reset and 2FA security tables
6. `0005_add_platform_wallet_columns.sql` - Added platform wallet control columns
7. `0006_add_missing_auth_tables.sql` - **IMPORTANT**: Adds missing email verification tables and columns

### Critical Tables Added in Latest Migration (0006)

These tables are essential for the authentication system to work:

- **email_verification_codes** - Stores email verification codes for user registration
- **password_reset_codes** - Stores password reset codes for account recovery
- **two_factor_reset_codes** - Stores 2FA recovery codes

The migration also adds these columns to `platform_wallet_controls`:
- `total_deposited` - Tracks total user deposits
- `total_swept` - Tracks swept amounts to master wallet
- `last_sweep_at` - Timestamp of last sweep operation

### Manual Database Setup (If Migrations Fail)

If automated migrations fail, you can manually apply migrations:

```bash
psql -d your_database -f migrations/0000_wide_layla_miller.sql
psql -d your_database -f migrations/0001_add_min_deposit_amount.sql
psql -d your_database -f migrations/0002_add_confirmed_at.sql
psql -d your_database -f migrations/0003_add_verify_badge.sql
psql -d your_database -f migrations/0004_add_auth_security_tables.sql
psql -d your_database -f migrations/0005_add_platform_wallet_columns.sql
psql -d your_database -f migrations/0006_add_missing_auth_tables.sql
```

### Verification

After migrations complete, verify the tables exist:

```bash
psql -d your_database -c "\dt"  # List all tables
psql -d your_database -c "\d email_verification_codes"  # Show structure
```

You should see these critical tables:
- users
- email_verification_codes
- password_reset_codes
- two_factor_reset_codes
- orders
- offers
- wallets
- transactions
- vendor_profiles
- kyc
- And many more...

## Environment Variables Required

```
DATABASE_URL=postgresql://user:password@host:5432/database_name
GMAIL_APP_PASSWORD=your_gmail_app_password  # Optional, for email sending
```

## Running the App

```bash
npm install
npx drizzle-kit migrate
npm run dev
```

The app will start on `http://localhost:5000`

## Troubleshooting

**Error: relation "email_verification_codes" does not exist**
- Make sure migration `0006_add_missing_auth_tables.sql` has been applied
- Run: `npx drizzle-kit migrate`

**Error: column "total_deposited" does not exist**
- Make sure migration `0006_add_missing_auth_tables.sql` has been applied
- This migration adds the missing columns to platform_wallet_controls

**Database connection refused**
- Verify DATABASE_URL is correct
- Ensure PostgreSQL server is running
- Check database name, username, and password
