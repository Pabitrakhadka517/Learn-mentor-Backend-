import nodemailer from 'nodemailer';
import { mailConfig } from '../../config/mail';

const isDev = process.env.NODE_ENV !== 'production';

export class EmailService {
    private static transporter: nodemailer.Transporter | null = null;
    private static previewAccount: any = null;

    /**
     * Get or lazily create a transporter.
     * - Production: uses MAIL_USER/PASS from .env (e.g., Gmail, Mailtrap)
     * - Development: uses Nodemailer's free Ethereal fake SMTP (auto-creates a test inbox,
     *   prints a preview URL to the console for every email sent)
     */
    private static async getTransporter(): Promise<nodemailer.Transporter> {
        if (this.transporter) return this.transporter;

        if (!isDev && mailConfig.auth.user && mailConfig.auth.pass) {
            // Production: real SMTP credentials
            this.transporter = nodemailer.createTransport({
                host: mailConfig.host,
                port: mailConfig.port,
                secure: mailConfig.secure,
                auth: {
                    user: mailConfig.auth.user,
                    pass: mailConfig.auth.pass,
                },
            });
            return this.transporter;
        }

        // Development fallback: Ethereal auto-account (no signup needed)
        console.log('📧 [EmailService] No MAIL credentials found. Using Ethereal fake SMTP for development...');
        this.previewAccount = await nodemailer.createTestAccount();

        this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: this.previewAccount.user,
                pass: this.previewAccount.pass,
            },
        });

        console.log(`📧 [EmailService] Ethereal inbox ready. Check sent emails at: https://ethereal.email/messages`);
        console.log(`   Login: ${this.previewAccount.user} / ${this.previewAccount.pass}`);

        return this.transporter;
    }

    /**
     * Send a generic email
     * @returns The Ethereal preview URL (only in dev), or undefined in production
     */
    static async sendEmail(to: string, subject: string, html: string): Promise<string | undefined> {
        try {
            const transporter = await this.getTransporter();

            const info = await transporter.sendMail({
                from: mailConfig.from,
                to,
                subject,
                html,
            });

            // In dev/Ethereal mode, log and return the preview URL
            if (isDev || !mailConfig.auth.user) {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                console.log('\n--- 📧 EMAIL SENT (Dev Mode) ---');
                console.log(`To:       ${to}`);
                console.log(`Subject:  ${subject}`);
                if (previewUrl) {
                    console.log(`Preview:  ${previewUrl}`);
                }
                console.log('--------------------------------\n');
                return previewUrl || undefined;
            }
        } catch (error) {
            console.error('Email sending failed:', error);
            // Don't throw — email failure shouldn't break the auth flow
        }
        return undefined;
    }

    /**
     * Send password reset email
     * @returns The Ethereal preview URL in development (undefined in production)
     */
    static async sendPasswordResetEmail(to: string, token: string, frontendUrl?: string): Promise<string | undefined> {
        const baseUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;

        const subject = 'Password Reset Request - LearnMentor';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: #0f172a; color: #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0;">LearnMentor</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Tutoring Platform</p>
        </div>
        <h2 style="color: #f1f5f9; font-size: 20px;">Reset Your Password</h2>
        <p style="color: #94a3b8;">You requested a password reset for your LearnMentor account. Click the button below to set a new password. This link will expire in <strong style="color: #f1f5f9;">15 minutes</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Reset My Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">Or copy and paste this link into your browser:</p>
        <p style="color: #6366f1; font-size: 12px; word-break: break-all;">${resetLink}</p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <p style="color: #475569; font-size: 12px; text-align: center;">
          If you didn't request this password reset, you can safely ignore this email.<br/>
          &copy; ${new Date().getFullYear()} LearnMentor. All rights reserved.
        </p>
      </div>
    `;

        return await this.sendEmail(to, subject, html);
    }
}
