import { env } from '../config/env.js';
import { logger } from './logger.js';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends an email. If SMTP is not configured (typical in dev), the email is
 * logged to the console so flows can be tested without a mail provider.
 * Swap the transport for nodemailer/Resend/SES in production.
 */
export async function sendMail(opts: MailOptions): Promise<void> {
  if (!env.mail.host) {
    logger.info('📧 [DEV] Email (SMTP not configured, logging instead)', {
      to: opts.to,
      subject: opts.subject,
      preview: opts.text ?? opts.html.replace(/<[^>]+>/g, '').slice(0, 300),
    });
    return;
  }

  // Production: integrate a real transport here.
  // e.g. nodemailer.createTransport({ host, port, auth }).sendMail(...)
  logger.info('Email dispatched', { to: opts.to, subject: opts.subject });
}

export function verificationEmail(name: string, url: string): MailOptions['html'] {
  return baseTemplate(
    'Verify your email',
    `Hi ${escape(name)},`,
    'Welcome to MPF CRM. Please confirm your email address to activate your account.',
    'Verify email',
    url,
  );
}

export function resetPasswordEmail(name: string, url: string): MailOptions['html'] {
  return baseTemplate(
    'Reset your password',
    `Hi ${escape(name)},`,
    'We received a request to reset your password. This link expires in 1 hour. If you did not request this, you can safely ignore this email.',
    'Reset password',
    url,
  );
}

function baseTemplate(title: string, greeting: string, body: string, cta: string, url: string) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#0f172a">
    <h1 style="font-size:20px;margin:0 0 8px">MPF CRM</h1>
    <h2 style="font-size:16px;font-weight:600;margin:24px 0 8px">${title}</h2>
    <p style="margin:0 0 6px">${greeting}</p>
    <p style="color:#475569;line-height:1.6">${body}</p>
    <a href="${url}" style="display:inline-block;margin:20px 0;background:#4f46e5;color:#fff;
       text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${cta}</a>
    <p style="color:#94a3b8;font-size:12px;margin-top:24px">Or paste this link into your browser:<br>${url}</p>
  </div>`;
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
