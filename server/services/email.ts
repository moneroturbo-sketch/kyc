import nodemailer from "nodemailer";

const brevoPassword = process.env.BREVO_SMTP_PASSWORD;
const brevoApiKey = process.env.BREVO_API_KEY;
const brevoSender = "kycmarketplace.noreply@gmail.com";

console.log("🔍 [STARTUP] Email Service Diagnostics:");
console.log(`   BREVO_SMTP_PASSWORD set: ${brevoPassword ? "YES" : "NO"}`);
console.log(`   BREVO_API_KEY set: ${brevoApiKey ? "YES" : "NO"}`);
console.log(`   Password length: ${brevoPassword ? brevoPassword.length : 0}`);
console.log(`   Sender email: ${brevoSender}`);

if (!brevoPassword && !brevoApiKey) {
  console.warn("⚠️  Neither BREVO_SMTP_PASSWORD nor BREVO_API_KEY is set - email sending will be disabled");
} else if (brevoApiKey) {
  console.log("✅ Brevo API configured - will use REST API for emails");
} else {
  console.log("✅ Brevo SMTP configured - email sending enabled");
}

const transporter = brevoPassword
  ? nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587, // STARTTLS port (correct for Brevo)
      secure: false, // Use STARTTLS, not implicit SSL
      auth: {
        user: "9e9469001@smtp-brevo.com",
        pass: brevoPassword,
      },
      connectionTimeout: 15000,
      socketTimeout: 15000,
      pool: {
        maxConnections: 1,
        maxMessages: Infinity,
      },
    })
  : null;

// Fallback: Send email via Brevo REST API (works better with Render)
async function sendViaBrevoAPI(
  email: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  if (!brevoApiKey) {
    console.log("⚠️ Brevo API key not available, cannot use API fallback");
    return false;
  }

  try {
    console.log(`📧 [API FALLBACK] Sending email via Brevo REST API to ${email}...`);
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
        to: [{ email, name: email }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Brevo API returned error:`, error);
      return false;
    }

    console.log(`✅ Email sent via API to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Brevo API call failed:`, error.message || error);
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!transporter && !brevoApiKey) {
    console.warn("⚠️ Email service not configured. Code:", code);
    return false;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification Required</h2>
      <p>Your verification code is:</p>
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
        ${code}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this code, please ignore this email.</p>
    </div>
  `;

  // Try SMTP first if available
  if (transporter) {
    try {
      console.log(`📧 Sending verification email to ${email}...`);
      console.log(`[DEBUG] Using Brevo SMTP: host=smtp-relay.brevo.com, port=587, user=9e9469001@smtp-brevo.com`);
      
      const promise = transporter.sendMail({
        from: brevoSender,
        to: email,
        subject: "Verify Your Email Address - KYC Marketplace",
        html: htmlContent,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email send timeout after 20s")), 20000)
      );

      await Promise.race([promise, timeoutPromise]);
      console.log(`✅ Verification email sent successfully to ${email}`);
      return true;
    } catch (error: any) {
      console.error(`⚠️ SMTP sending failed for ${email}:`, error.message || error);
      console.log(`   Attempting to use Brevo API as fallback...`);
      
      // Fall back to API if SMTP fails
      return await sendViaBrevoAPI(
        email,
        "Verify Your Email Address - KYC Marketplace",
        htmlContent
      );
    }
  }

  // If no SMTP, go straight to API
  if (brevoApiKey) {
    console.log(`📧 [API MODE] Sending verification email to ${email}...`);
    return await sendViaBrevoAPI(
      email,
      "Verify Your Email Address - KYC Marketplace",
      htmlContent
    );
  }

  return false;
}

export async function sendPasswordResetEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!transporter && !brevoApiKey) {
    console.warn("Email service not configured. Reset code:", code);
    return false;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Your password reset code is:</p>
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
        ${code}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: brevoSender,
        to: email,
        subject: "Reset Your Password - KYC Marketplace",
        html: htmlContent,
      });
      return true;
    } catch (error: any) {
      console.error("SMTP password reset failed:", error.message);
      return await sendViaBrevoAPI(email, "Reset Your Password - KYC Marketplace", htmlContent);
    }
  }

  if (brevoApiKey) {
    return await sendViaBrevoAPI(email, "Reset Your Password - KYC Marketplace", htmlContent);
  }

  return false;
}

export async function send2FAResetEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!transporter && !brevoApiKey) {
    console.warn("Email service not configured. 2FA reset code:", code);
    return false;
  }

  const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>2FA Reset Request</h2>
          <p>Your 2FA reset code is:</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request a 2FA reset, please ignore this email.</p>
        </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: brevoSender,
        to: email,
        subject: "2FA Reset - KYC Marketplace",
        html: htmlContent,
      });
      return true;
    } catch (error: any) {
      console.error("SMTP 2FA reset failed:", error.message);
      return await sendViaBrevoAPI(email, "2FA Reset - KYC Marketplace", htmlContent);
    }
  }

  if (brevoApiKey) {
    return await sendViaBrevoAPI(email, "2FA Reset - KYC Marketplace", htmlContent);
  }

  return false;
}
