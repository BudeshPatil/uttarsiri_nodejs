import { createEmailTransporter } from '../config/email.js';
import settingsRepository from '../repositories/settings.repository.js';
import { SETTING_KEYS } from '../constants/settings.constants.js';
import appConfig from '../config/appConfig.js';
import logger from '../config/logger.js';

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const smtpSetting = await settingsRepository.getSetting(SETTING_KEYS.SMTP_CONFIG);
    const senderSetting = await settingsRepository.getSetting(SETTING_KEYS.SENDER_EMAIL);

    const smtpConfig = smtpSetting?.value || {};
    const fromEmail = senderSetting?.value || process.env.SMTP_FROM || 'noreply@gmail.com';

    const transporter = createEmailTransporter(smtpConfig);

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
      text,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { to, subject });
    return result;
  } catch (error) {
    logger.error('sendEmail failed', { error: error.message, to, subject });
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${appConfig.frontendUrl}/en/reset-password?token=${resetToken}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
    `;
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
      text: `Reset your password: ${resetUrl}`,
    });
  } catch (error) {
    logger.error('sendPasswordResetEmail failed', { error: error.message, email });
    throw error;
  }
};

export default { sendEmail, sendPasswordResetEmail };
