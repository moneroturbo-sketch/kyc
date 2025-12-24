/**
 * Brevo Email Service - Using REST API instead of SMTP
 * This is an alternative to SMTP that might work better on Render
 */

const brevoApiKey = process.env.BREVO_API_KEY;
const brevoSender = "kycmarketplace.noreply@gmail.com";

console.log("🔍 [STARTUP] Brevo API Email Service:");
console.log(`   BREVO_API_KEY set: ${brevoApiKey ? "YES" : "NO"}`);
console.log(`   Sender: ${brevoSender}`);

if (!brevoApiKey) {
  console.warn("⚠️  BREVO_API_KEY not set - Brevo API email will be disabled");
} else {
  console.log("✅ Brevo API configured");
}

export async function sendVerificationEmailViaAPI(
  email: string,
  code: string
): Promise<boolean> {
  if (!brevoApiKey) {
    console.warn("⚠️ Brevo API key not configured. Code:", code);
    return false;
  }

  try {
    console.log(`📧 Sending verification email via Brevo API to ${email}...`);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: "KYC Marketplace",
          email: brevoSender,
        },
        to: [
          {
            email: email,
            name: email,
          },
        ],
        subject: "Verify Your Email Address - KYC Marketplace",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification Required</h2>
            <p>Your verification code is:</p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Brevo API error:`, error);
      return false;
    }

    console.log(`✅ Verification email sent via API to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Email API call failed for ${email}:`);
    console.error(`   Error message: ${error.message || error}`);
    console.error(`   Full error:`, error);
    return false;
  }
}

export async function sendPasswordResetEmailViaAPI(
  email: string,
  code: string
): Promise<boolean> {
  if (!brevoApiKey) {
    console.warn("Email service not configured. Reset code:", code);
    return false;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: "KYC Marketplace",
          email: brevoSender,
        },
        to: [{ email: email, name: email }],
        subject: "Reset Your Password - KYC Marketplace",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Your password reset code is:</p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
          </div>
        `,
      }),
    });

    return response.ok;
  } catch (error: any) {
    console.error("Password reset email API call failed:", error.message || error);
    return false;
  }
}

export async function send2FAResetEmailViaAPI(
  email: string,
  code: string
): Promise<boolean> {
  if (!brevoApiKey) {
    console.warn("Email service not configured. 2FA reset code:", code);
    return false;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: "KYC Marketplace",
          email: brevoSender,
        },
        to: [{ email: email, name: email }],
        subject: "2FA Reset - KYC Marketplace",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>2FA Reset Request</h2>
            <p>Your 2FA reset code is:</p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request a 2FA reset, please ignore this email.</p>
          </div>
        `,
      }),
    });

    return response.ok;
  } catch (error: any) {
    console.error("2FA reset email API call failed:", error.message || error);
    return false;
  }
}
