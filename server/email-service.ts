import nodemailer from "nodemailer";
import { ENV } from "./env";
import { getTranslation } from "./translations";

/**
 * Email Service
 * Handles sending system emails via SMTP (Mailpit in development)
 */

// Initialize SMTP Transporter
const transporter = nodemailer.createTransport({
  host: ENV.smtpHost,
  port: ENV.smtpPort,
  secure: ENV.smtpPort === 465, // true for 465, false for other ports
  auth: ENV.smtpUser ? {
    user: ENV.smtpUser,
    pass: ENV.smtpPass,
  } : undefined,
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Core function to send an email
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `"${ENV.smtpFrom.split('@')[0]}" <${ENV.smtpFrom}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || "Please view the HTML version of this email.",
      html: options.html,
    });

    console.log(`[Email Service] Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[Email Service] Failed to send email:", error);
    return false;
  }
}

/**
 * Send Welcome Email to new users
 */
export async function sendWelcomeEmail(to: string, name: string, lang: string = "en") {
  const subject = getTranslation(lang, "welcomeTitle");
  const h1 = getTranslation(lang, "welcomeTitle");
  const p1 = getTranslation(lang, "welcomeP1", { name });
  const p2 = getTranslation(lang, "welcomeP2");
  const p3 = getTranslation(lang, "welcomeP3");
  const footer = getTranslation(lang, "emailFooter");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h1 style="color: #0ea5e9;">${h1}</h1>
      <p>${p1}</p>
      <p>${p2}</p>
      <p>${p3}</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        <p>${footer}</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
}

/**
 * Send System Notification Email
 * Generic email wrapper for system notifications
 */
export async function sendSystemNotificationEmail(
  to: string,
  name: string,
  subject: string,
  message: string,
  actionLink?: string,
  actionText: string = "View Details",
  lang: string = "en"
) {
  const footer = getTranslation(lang, "emailFooter");
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0ea5e9;">${subject}</h2>
      <p>${getTranslation(lang, "welcomeP1", { name })}</p>
      <p>${message}</p>
      ${
        actionLink
          ? `
        <div style="margin-top: 25px; margin-bottom: 25px;">
          <a href="${ENV.isProduction ? "https://clearlet.com" : "http://localhost:5000"}${actionLink}" 
             style="background-color: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            ${actionText}
          </a>
        </div>
      `
          : ""
      }
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        <p>${footer}</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
}
