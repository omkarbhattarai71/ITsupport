
import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
    if (transporter) return transporter;

    // In production, we should use the real SMTP server from .env
    // Make sure to unblock SMTP AUTH in Microsoft 365 Admin Center for the used email account,
    // or use a generic SMTP provider like SendGrid, Mailgun, or Resend.
    try {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || "smtp.office365.com",
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === "true", // false for TLS (587)
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        
        return transporter;
    } catch (err) {
        console.error("❌ Failed to create SMTP transporter:", err);
        throw err;
    }
}

export async function sendPasswordEmail(
    to: string,
    generatedPassword: string
): Promise<boolean> {
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"FCN IT Support" <noreply@fcn.dk>',
        to,
        subject: "FCN IT Support - Your Temporary Login Password",
        text: `Your temporary password is: ${generatedPassword}`,
        html: `
        <div style="font-family: Arial; max-width: 600px; margin:auto; padding:20px;">
          <h2 style="color:#2563eb;">FCN IT Support</h2>
          <p>Your account has been created.</p>
          <div style="background:#f1f5f9;padding:15px;border-radius:8px;">
            <strong>Temporary Password:</strong>
            <h3 style="letter-spacing:2px;">${generatedPassword}</h3>
          </div>
          <p style="margin-top:20px;">
            Please log in using this password and change it immediately.
          </p>
        </div>
      `,
    };

    try {
        const mailer = await getTransporter();
        const info = await mailer.sendMail(mailOptions);

        console.log("✅ Email sent:", info.messageId);
        
        return true;
    } catch (error) {
        console.error("❌ Email error:", error);
        return false; 
    }
}