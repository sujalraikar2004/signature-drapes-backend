import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD // Your app password (not regular password)
  }
});

/**
 * Send email verification link to user
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 * @returns {Promise}
 */
export const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    const mailOptions = {
      from: `"Signature Draps" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - Signature Draps',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .content {
              background-color: white;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 20px;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin-top: 20px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎨 Signature Draps</div>
              <p>Welcome to Signature Draps - Your Premium Interior Design Partner</p>
            </div>
            
            <div class="content">
              <h2 style="color: #2563eb; margin-top: 0;">Verify Your Email Address</h2>
              <p>Thank you for registering with Signature Draps!</p>
              <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${verificationUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with Signature Draps, please ignore this email.
              </div>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Signature Draps. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send welcome email after successful verification
 * @param {string} email - User's email address
 * @param {string} username - User's username
 * @returns {Promise}
 */
export const sendWelcomeEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: `"Signature Draps" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Signature Draps! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .content {
              background-color: white;
              padding: 25px;
              border-radius: 8px;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎨 Signature Draps</div>
            </div>
            
            <div class="content">
              <h2 style="color: #2563eb;">Welcome, ${username}! 🎉</h2>
              <p>Your email has been successfully verified and your account is now active!</p>
              <p>You can now explore our premium collection of curtains, blinds, wallpapers, and more.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}" class="button">Start Shopping</a>
              </div>
              
              <p>Thank you for choosing Signature Draps for your interior design needs!</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Signature Draps. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

/**
 * Send password reset email with reset link
 * @param {string} email - User's email address
 * @param {string} token - Password reset token
 * @returns {Promise}
 */
export const sendPasswordResetEmail = async (email, token) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const mailOptions = {
      from: `"Signature Draps" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - Signature Draps',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .content {
              background-color: white;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 20px;
            }
            .warning {
              background-color: #fee;
              border-left: 4px solid #ef4444;
              padding: 12px;
              margin-top: 20px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎨 Signature Draps</div>
            </div>
            
            <div class="content">
              <h2 style="color: #2563eb; margin-top: 0;">Password Reset Request</h2>
              <p>You recently requested to reset your password for your Signature Draps account.</p>
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </div>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Signature Draps. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};
