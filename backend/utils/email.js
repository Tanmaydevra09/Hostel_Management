const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports (587 uses STARTTLS)
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

/**
 * Send an OTP email to the specified address.
 */
const sendOtpEmail = async (toEmail, otpCode, userName) => {
  const mailOptions = {
    from: `"Hostel Hub Admin" <${process.env.MAIL_USERNAME}>`,
    to: toEmail,
    subject: 'Your Hostel Hub Login Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #3ECF8E; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Hostel Hub</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 16px; color: #333;">You recently requested to log in to your Hostel Hub account. Please use the following One-Time Password (OTP) to complete your verification.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; background-color: #f3f4f6; padding: 15px; border-radius: 8px; display: inline-block;">
              ${otpCode}
            </div>
          </div>
          
          <p style="font-size: 14px; color: #666;">This code is valid for exactly <strong>5 minutes</strong>. For security reasons, please do not share this code with anyone.</p>
          <p style="font-size: 14px; color: #666;">If you did not attempt to log in, you can safely ignore this email.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Hostel Hub Inc. All rights reserved. <br> Generated on: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })} IST</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] OTP sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send OTP to ${toEmail}:`, error);
    throw new Error('Could not send OTP email. Please check SMTP configuration.');
  }
};

/**
 * Send a welcome email to a new student with login credentials.
 */
const sendWelcomeEmail = async (toEmail, userName, tempPassword) => {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login';
  
  const mailOptions = {
    from: `"Hostel Hub Admin" <${process.env.MAIL_USERNAME}>`,
    to: toEmail,
    subject: 'Welcome to Hostel Hub - Your Login Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #3ECF8E; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Hostel Hub</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 16px; color: #333;">Welcome to the Hostel Hub! Your student account has been successfully created.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #111827;">Your Login Details:</h3>
            <p style="margin: 5px 0; font-size: 15px;"><strong>Email / Username:</strong> ${toEmail}</p>
            <p style="margin: 5px 0; font-size: 15px;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</span></p>
          </div>
          
          <p style="font-size: 15px; color: #333;">Please log in using the link below. For security reasons, you will be required to change this temporary password upon your first login.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px; display: inline-block;">Login to Your Account</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Hostel Hub Inc. All rights reserved. <br> Generated on: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })} IST</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Welcome email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send welcome email to ${toEmail}:`, error);
    throw new Error('Could not send welcome email.');
  }
};

module.exports = { sendOtpEmail, sendWelcomeEmail };
