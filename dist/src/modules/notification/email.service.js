"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const mail_1 = require("../../config/mail");
const isDev = process.env.NODE_ENV !== 'production';
class EmailService {
    static async getTransporter() {
        if (this.transporter)
            return this.transporter;
        if (!isDev && mail_1.mailConfig.auth.user && mail_1.mailConfig.auth.pass) {
            this.transporter = nodemailer_1.default.createTransport({
                host: mail_1.mailConfig.host,
                port: mail_1.mailConfig.port,
                secure: mail_1.mailConfig.secure,
                auth: {
                    user: mail_1.mailConfig.auth.user,
                    pass: mail_1.mailConfig.auth.pass,
                },
            });
            return this.transporter;
        }
        console.log('📧 [EmailService] No MAIL credentials found. Using Ethereal fake SMTP for development...');
        this.previewAccount = await nodemailer_1.default.createTestAccount();
        this.transporter = nodemailer_1.default.createTransport({
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
    static async sendEmail(to, subject, html) {
        try {
            const transporter = await this.getTransporter();
            const info = await transporter.sendMail({
                from: mail_1.mailConfig.from,
                to,
                subject,
                html,
            });
            if (isDev || !mail_1.mailConfig.auth.user) {
                const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
                console.log('\n--- 📧 EMAIL SENT (Dev Mode) ---');
                console.log(`To:       ${to}`);
                console.log(`Subject:  ${subject}`);
                if (previewUrl) {
                    console.log(`Preview:  ${previewUrl}`);
                }
                console.log('--------------------------------\n');
                return previewUrl || undefined;
            }
        }
        catch (error) {
            console.error('Email sending failed:', error);
        }
        return undefined;
    }
    static async sendPasswordResetEmail(to, token, frontendUrl) {
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
exports.EmailService = EmailService;
EmailService.transporter = null;
EmailService.previewAccount = null;
//# sourceMappingURL=email.service.js.map