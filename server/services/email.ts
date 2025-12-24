import nodemailer from "nodemailer";

const brevoPassword = process.env.BREVO_SMTP_PASSWORD;
const brevoSender = "kycmarketplace.noreply@gmail.com";

console.log("🔍 [STARTUP] Email Service Diagnostics:");
console.log(`   BREVO_SMTP_PASSWORD set: ${brevoPassword ? "YES" : "NO"}`);
console.log(`   Password length: ${brevoPassword ? brevoPassword.length : 0}`);
console.log(`   Sender email: ${brevoSender}`);

if (!brevoPassword) {
  console.warn("⚠️  BREVO_SMTP_PASSWORD not set - email sending will be disabled");
} else {
  console.log("✅ Brevo configured - email sending enabled");
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

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!transporter) {
    console.warn("⚠️ Email service not configured. Code:", code);
    return false;
  }

  try {
    console.log(`📧 Sending verification email to ${email}...`);
    console.log(`[DEBUG] Using Brevo SMTP: host=smtp-relay.brevo.com, port=587, user=9e9469001@smtp-brevo.com`);
    
    const promise = transporter.sendMail({
      from: brevoSender,
      to: email,
      subject: "Verify Your Email Address - KYC Marketplace",
      html: `
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
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email send timeout after 20s")), 20000)
    );

    await Promise.race([promise, timeoutPromise]);
    console.log(`✅ Verification email sent successfully to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Email sending failed for ${email}`);
    console.error(`   Error message: ${error.message || error}`);
    console.error(`   Error code: ${error.code || 'N/A'}`);
    console.error(`   Error response: ${error.response || 'N/A'}`);
    console.error(`   Full error:`, error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!transporter) {
    console.warn("Email service not configured. Reset code:", code);
    return false;
  }

  try {
    await transporter.sendMail({
      from: brevoSender,
      to: email,
      subject: "Reset Your Password - KYC Marketplace",
      html: `
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
    });
    return true;
  } catch (error: any) {
    console.error("Email sending failed:", error.message || error);
    return false;
  }
}

export async function send2FAResetEmail(
  email: string,
  code: string
): Promise<boolean> {
  if (!transporter) {
    console.warn("Email service not configured. 2FA reset code:", code);
    return false;
  }

  try {
    await transporter.sendMail({
      from: brevoSender,
      to: email,
      subject: "2FA Reset - KYC Marketplace",
      html: `
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
    });
    return true;
  } catch (error: any) {
    console.error("2FA email sending failed:", error.message || error);
    return false;
  }
}
