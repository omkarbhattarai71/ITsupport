
import nodemailer from "nodemailer";

// Cached transporter — reset when we fall back to Ethereal
let transporter: nodemailer.Transporter | null = null;
let usingEthereal = false;

async function createRealTransporter(): Promise<nodemailer.Transporter> {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: { ciphers: "SSLv3" },
    });
}

async function createEtherealTransporter(): Promise<nodemailer.Transporter> {
    console.log("⚠️  Falling back to ETHEREAL (dev preview mode).");
    console.log("    → Go to https://ethereal.email to view sent emails.");
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
}

async function getTransporter(): Promise<nodemailer.Transporter> {
    if (transporter) return transporter;

    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
        console.log("📧 Attempting REAL SMTP (" + process.env.EMAIL_HOST + ")...");
        transporter = await createRealTransporter();
        usingEthereal = false;
    } else {
        transporter = await createEtherealTransporter();
        usingEthereal = true;
    }

    return transporter;
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

    // --- First attempt (real SMTP or Ethereal) ---
    try {
        const mailer = await getTransporter();
        const info = await mailer.sendMail(mailOptions);

        console.log("✅ Email sent:", info.messageId);
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) {
            console.log("🔍 Preview URL:", preview);
        }
        return true;
    } catch (firstError: any) {
        // If SMTP AUTH is disabled (535) or any auth error → fall back to Ethereal
        const isAuthError =
            firstError?.responseCode === 535 ||
            firstError?.code === "EAUTH" ||
            (firstError?.response || "").includes("535");

        if (isAuthError && !usingEthereal) {
            console.warn("⚠️  Real SMTP auth failed (SMTP AUTH disabled on tenant).");
            console.warn("    Falling back to Ethereal for this session.");
            console.warn("    FIX: Ask your M365 admin to run:");
            console.warn("    Set-CASMailbox -Identity omb@fcn.dk -SmtpClientAuthenticationEnabled $true");

            // Reset & rebuild with Ethereal
            transporter = null;
            usingEthereal = true;
            transporter = await createEtherealTransporter();

            try {
                const info = await transporter.sendMail(mailOptions);
                console.log("✅ Ethereal email sent:", info.messageId);
                const preview = nodemailer.getTestMessageUrl(info);
                if (preview) {
                    console.log("🔍 Ethereal Preview URL:", preview);
                    console.log(`📋 Password for ${to}: ${generatedPassword}`);
                }
                return true;
            } catch (etherealError) {
                console.error("❌ Ethereal fallback also failed:", etherealError);
                return false;
            }
        }

        console.error("❌ Email error:", firstError);
        return false;
    }
}


/* 
import nodemailer from 'nodemailer';

// Since we don't have real SMTP credentials available, we will use Ethereal for testing.
// In a real production scenario, you would use company's SMTP or SendGrid/AWS SES.

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
    if (transporter) return transporter;

    // Create a testing account on Ethereal
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });

    return transporter;
}

export async function sendPasswordEmail(to: string, generatedPassword: string) {
    try {
        const mailer = await getTransporter();

        const info = await mailer.sendMail({
            from: '"FCN IT Support" <noreply@fcn.dk>',
            to: to,
            subject: 'Welcome to FCN IT Support - Your Login Information',
            text: `Welcome to FCN IT Support!\n\nYour account has been created successfully.\n\nHere is your auto-generated password: ${generatedPassword}\n\nPlease use this password to log in. You can change your password later in the application.\n\nBest regards,\nFCN IT Support Team`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #3b82f6;">Welcome to FCN IT Support!</h2>
                    <p>Your account has been created successfully.</p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #475569;">Your auto-generated password is:</p>
                        <h3 style="margin: 10px 0 0 0; color: #0f172a; letter-spacing: 2px;">${generatedPassword}</h3>
                    </div>
                    <p>Please use this password to log in. You can change your password later in your profile settings.</p>
                    <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                        Best regards,<br>
                        FCN IT Support Team
                    </p>
                </div>
            `,
        });

        console.log('Message sent: %s', info.messageId);
        // This URL can be visited in the browser to view the email when using Ethereal
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
*/