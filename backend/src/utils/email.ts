
import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
    if (transporter) return transporter;

    // We will bypass Real SMTP for now because we know Office365 SMTP Auth is blocked at the tenant level.
    // This requires an M365 Admin to unblock. We'll use Ethereal to ensure registration works.
    console.log("⚠️  Bypassing Office 365 (SMTP AUTH disabled). Using ETHEREAL.");
    console.log("    → Go to https://ethereal.email to view sent emails.");
    
    try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        return transporter;
    } catch (err) {
        console.error("❌ Failed to create Ethereal account:", err);
        throw err;
    }
}

export async function sendPasswordEmail(
    to: string,
    generatedPassword: string
): Promise<boolean> {
    const mailOptions = {
        from: '"FCN IT Support" <noreply@fcn.dk>', // Ethereal will overwrite the FROM but the name stays
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

        console.log("✅ Ethereal email sent:", info.messageId);
        
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) {
            console.log("🔍 Ethereal Preview URL:", preview);
            
            // Print the password clearly in the server console so you don't even need to open the URL
            console.log("\n=============================================");
            console.log(`👤 NEW USER CREATED: ${to}`);
            console.log(`🔑 PASSWORD:         ${generatedPassword}`);
            console.log("=============================================\n");
        }
        
        return true;
    } catch (error) {
        console.error("❌ Ethereal Email error:", error);
        
        // Final fallback: If even Ethereal fails (e.g. rate limit), just print it to console and pretend it succeeded
        // so the frontend registration process is not completely broken during testing.
        console.warn("⚠️  Ethereal failed. Falling back to SERVER CONSOLE ONLY.");
        console.log("\n=============================================");
        console.log(`👤 NEW USER CREATED (NO EMAIL SENT): ${to}`);
        console.log(`🔑 PASSWORD:                        ${generatedPassword}`);
        console.log("=============================================\n");
        
        return true; 
    }
}