import nodemailer from 'nodemailer';
import logger from './logger.js';

let transporter = null;

export const createEmailTransporter = (smtpConfig = {}) => {
  try {
    transporter = nodemailer.createTransport({
      host: smtpConfig.host || process.env.SMTP_HOST,
      port: smtpConfig.port || Number(process.env.SMTP_PORT) || 587,
      secure: smtpConfig.secure ?? process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpConfig.user || process.env.SMTP_USER,
        pass: smtpConfig.pass || process.env.SMTP_PASS,
      },
    });
    return transporter;
  } catch (error) {
    logger.error('Failed to create email transporter', { error: error.message });
    throw error;
  }
};

export const getEmailTransporter = () => transporter;

export default { createEmailTransporter, getEmailTransporter };
