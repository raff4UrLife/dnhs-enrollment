//src/lib//email.ts
import "server-only";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: Number(process.env.SMTP_PORT ?? 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

// Sends an email. Never throws: returns true if sent, false if it failed,
// so a failed email never blocks enrollment or approval.

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email failed to send:", error);
    return false;
  }
}
