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
 * Send email verification OTP to user
 * @param {string} email - User's email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise}
 */
export const sendVerificationEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Signature Draps" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification OTP - Signature Draps',
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
            .otp-box {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              text-align: center;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
              font-family: 'Courier New', monospace;
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
              <p>To complete your registration and activate your account, please enter the following OTP code:</p>
              
              <div class="otp-box">
                ${otp}
              </div>
              
              <p style="text-align: center; color: #666;">This code will expire in 10 minutes</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This OTP is valid for 10 minutes. If you didn't create an account with Signature Draps, please ignore this email.
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
    console.log('Email OTP sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email OTP:', error);
    throw new Error('Failed to send email OTP');
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

/**
 * Send custom order notification to owner
 * @param {Object} orderDetails - Complete order details with custom sizes
 * @returns {Promise}
 */
export const sendCustomOrderNotification = async (orderDetails) => {
  try {
    const { orderId, customer, products, shippingAddress, totalAmount, paymentMode, customItems } = orderDetails;

    // Format custom items for email
    const customItemsHTML = customItems && customItems.length > 0 ? `
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #856404; margin-top: 0;">🎯 Custom Size Requests</h3>
        ${customItems.map(item => `
          <div style="margin-bottom: 15px; padding: 10px; background-color: white; border-radius: 4px;">
            <p style="margin: 5px 0;"><strong>Product:</strong> ${item.productName}</p>
            <p style="margin: 5px 0;"><strong>Quantity:</strong> ${item.quantity}</p>
            ${item.selectedSizeVariant ? `
              <p style="margin: 5px 0;"><strong>Selected Size:</strong> ${item.selectedSizeVariant.name}</p>
              <p style="margin: 5px 0;"><strong>Dimensions:</strong> ${item.selectedSizeVariant.dimensions.length || '-'} x ${item.selectedSizeVariant.dimensions.width || '-'} x ${item.selectedSizeVariant.dimensions.height || '-'} ${item.selectedSizeVariant.dimensions.unit}</p>
            ` : ''}
            ${item.customSize && item.customSize.isCustom ? `
              <p style="margin: 5px 0; color: #d97706;"><strong>⚠️ CUSTOM SIZE REQUESTED:</strong></p>
              <p style="margin: 5px 0; padding-left: 15px;">
                ${item.customSize.measurements.length ? `Length: ${item.customSize.measurements.length} ${item.customSize.measurements.unit}<br>` : ''}
                ${item.customSize.measurements.width ? `Width: ${item.customSize.measurements.width} ${item.customSize.measurements.unit}<br>` : ''}
                ${item.customSize.measurements.height ? `Height: ${item.customSize.measurements.height} ${item.customSize.measurements.unit}<br>` : ''}
                ${item.customSize.measurements.area ? `Area: ${item.customSize.measurements.area} ${item.customSize.measurements.unit}<br>` : ''}
                ${item.customSize.measurements.diameter ? `Diameter: ${item.customSize.measurements.diameter} ${item.customSize.measurements.unit}<br>` : ''}
              </p>
              ${item.customSize.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${item.customSize.notes}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Calculated Price:</strong> ₹${item.customSize.calculatedPrice?.toLocaleString()}</p>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    const productsHTML = products.map(p => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${p.priceAtPurchase?.toLocaleString()}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Signature Draps Orders" <${process.env.EMAIL_USER}>`,
      to: [process.env.OWNER_EMAIL || process.env.EMAIL_USER, 'indrajeet.godhwani@gmail.com'],
      subject: `🎨 New ${customItems && customItems.length > 0 ? 'CUSTOM' : ''} Order Received - ${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content {
              background-color: white;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              color: #2563eb;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #f3f4f6;
              padding: 10px;
              text-align: left;
              font-weight: bold;
            }
            .total {
              background-color: #f0fdf4;
              padding: 15px;
              border-radius: 6px;
              margin-top: 20px;
              text-align: right;
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
              <h2 style="margin: 0;">New Order Notification</h2>
            </div>
            
            <div class="content">
              <div class="section">
                <div class="section-title">📋 Order Information</div>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Customer Name:</strong> ${customer.name}</p>
                <p><strong>Customer Email:</strong> ${customer.email || 'N/A'}</p>
                <p><strong>Customer Phone:</strong> ${customer.phone}</p>
                <p><strong>Payment Mode:</strong> <span style="color: ${paymentMode === 'ONLINE' ? '#10b981' : '#f59e0b'};">${paymentMode}</span></p>
                <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
              </div>

              ${customItemsHTML}

              <div class="section">
                <div class="section-title">📦 Order Items</div>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productsHTML}
                  </tbody>
                </table>
                <div class="total">
                  <strong style="font-size: 20px;">Total Amount: ₹${totalAmount?.toLocaleString()}</strong>
                </div>
              </div>

              <div class="section">
                <div class="section-title">🚚 Shipping Address</div>
                <p>${shippingAddress.fullName}<br>
                ${shippingAddress.street}<br>
                ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postalCode}<br>
                ${shippingAddress.country}<br>
                Phone: ${shippingAddress.phone}</p>
              </div>

              ${customItems && customItems.length > 0 ? `
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px;">
                  <p style="margin: 0; color: #92400e;"><strong>⚠️ Action Required:</strong> This order contains custom size requests. Please review the measurements carefully and contact the customer if clarification is needed.</p>
                </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Signature Draps. All rights reserved.</p>
              <p>This is an automated notification from your e-commerce system.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Custom order notification sent to owner:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending custom order notification:', error);
    throw new Error('Failed to send custom order notification');
  }
};

/**
 * Send customer query notification to admin
 * @param {Object} queryData - Query details
 * @returns {Promise}
 */
export const sendCustomerQueryNotification = async (queryData) => {
  try {
    const { name, email, phoneNo, subject, message, mediaFiles, queryId, createdAt } = queryData;

    // Format media files HTML
    let mediaHTML = '';
    if (mediaFiles && mediaFiles.length > 0) {
      mediaHTML = `
        <div style="margin-top: 20px;">
          <h3 style="color: #2563eb; margin-bottom: 15px;">📎 Attached Media Files:</h3>
          <div style="display: grid; gap: 10px;">
      `;

      mediaFiles.forEach((file, index) => {
        if (file.type === 'image') {
          mediaHTML += `
            <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #f9f9f9;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Image ${index + 1}:</p>
              <img src="${file.url}" alt="Customer uploaded image" style="max-width: 100%; height: auto; border-radius: 5px;">
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
                <a href="${file.url}" target="_blank" style="color: #2563eb;">View Full Size</a>
              </p>
            </div>
          `;
        } else if (file.type === 'video') {
          mediaHTML += `
            <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #f9f9f9;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Video ${index + 1}:</p>
              <video controls style="max-width: 100%; height: auto; border-radius: 5px;">
                <source src="${file.url}" type="video/mp4">
                Your email client doesn't support video playback.
              </video>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
                <a href="${file.url}" target="_blank" style="color: #2563eb;">Download Video</a>
              </p>
            </div>
          `;
        }
      });

      mediaHTML += `
          </div>
        </div>
      `;
    }

    const formattedDate = new Date(createdAt).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const mailOptions = {
      from: `"Signature Draps Customer Query" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to admin email
      subject: `🔔 New Customer Query: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 30px;
              text-align: center;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .alert-badge {
              background-color: #ff4444;
              color: white;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: bold;
              display: inline-block;
              margin-top: 10px;
            }
            .info-section {
              background-color: #f9f9f9;
              border-left: 4px solid #2563eb;
              padding: 20px;
              margin-bottom: 20px;
              border-radius: 5px;
            }
            .info-row {
              display: flex;
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 1px solid #eee;
            }
            .info-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .info-label {
              font-weight: bold;
              color: #2563eb;
              min-width: 150px;
              margin-right: 20px;
            }
            .info-value {
              flex: 1;
              color: #333;
            }
            .message-box {
              background-color: #fff;
              border: 2px solid #e0e0e0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              margin-top: 30px;
              border-top: 2px solid #eee;
              color: #666;
              font-size: 12px;
            }
            .action-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .query-id {
              background-color: #f0f0f0;
              padding: 8px 15px;
              border-radius: 5px;
              font-family: monospace;
              font-size: 14px;
              display: inline-block;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎨 Signature Draps</div>
              <h2 style="margin: 10px 0;">New Customer Query Received</h2>
              <div class="alert-badge">⚠️ REQUIRES ATTENTION</div>
              <div class="query-id">Query ID: ${queryId}</div>
            </div>
            
            <h3 style="color: #2563eb; margin-bottom: 20px;">📋 Customer Details</h3>
            <div class="info-section">
              <div class="info-row">
                <div class="info-label">👤 Name:</div>
                <div class="info-value">${name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">📧 Email:</div>
                <div class="info-value"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></div>
              </div>
              <div class="info-row">
                <div class="info-label">📱 Phone:</div>
                <div class="info-value"><a href="tel:${phoneNo}" style="color: #2563eb;">${phoneNo}</a></div>
              </div>
              <div class="info-row">
                <div class="info-label">🕐 Received:</div>
                <div class="info-value">${formattedDate}</div>
              </div>
            </div>

            <h3 style="color: #2563eb; margin-bottom: 15px;">📝 Query Subject</h3>
            <div class="info-section">
              <strong style="font-size: 16px;">${subject}</strong>
            </div>

            <h3 style="color: #2563eb; margin-bottom: 15px;">💬 Message</h3>
            <div class="message-box">
${message}
            </div>

            ${mediaHTML}

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://signature-drapes-admin.vercel.app/customer-queries" class="action-button">
                View in Admin Panel →
              </a>
            </div>

            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <strong>⚡ Action Required:</strong>
              <p style="margin: 10px 0 0 0;">Please review this query and respond to the customer as soon as possible. Customer satisfaction is our priority!</p>
            </div>

            <div class="footer">
              <p><strong>Signature Draps - Admin Notification System</strong></p>
              <p>This is an automated notification. Please do not reply to this email.</p>
              <p>To manage this query, please login to your admin panel.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Customer query notification sent to admin:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending customer query notification:', error);
    throw new Error('Failed to send customer query notification');
  }
};

/**
 * Send order confirmation notification to admin
 * @param {Object} orderDetails - Complete order details
 * @returns {Promise}
 */
export const sendOrderConfirmationNotification = async (orderDetails) => {
  try {
    const {
      orderId,
      customer,
      products,
      shippingAddress,
      totalAmount,
      paymentMode,
      paymentStatus,
      transactionId,
      hasCustomItems
    } = orderDetails;

    const formattedDate = new Date().toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    // Format products HTML
    const productsHTML = products.map(p => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${p.productImage ? `<img src="${p.productImage}" alt="${p.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : ''}
            <div>
              <strong>${p.productName}</strong>
              <br><span style="color: #6b7280; font-size: 12px;">Code: ${p.productCode}</span>
            </div>
          </div>
          ${p.selectedSizeVariant ? `
            <div style="margin-top: 8px; padding: 8px; background-color: #f0fdf4; border-radius: 4px;">
              <strong style="color: #16a34a;">Size: ${p.selectedSizeVariant.name}</strong>
              <div style="font-size: 12px; color: #6b7280;">
                ${p.selectedSizeVariant.dimensions.length ? `L: ${p.selectedSizeVariant.dimensions.length}${p.selectedSizeVariant.dimensions.unit}` : ''}
                ${p.selectedSizeVariant.dimensions.width ? ` × W: ${p.selectedSizeVariant.dimensions.width}${p.selectedSizeVariant.dimensions.unit}` : ''}
                ${p.selectedSizeVariant.dimensions.height ? ` × H: ${p.selectedSizeVariant.dimensions.height}${p.selectedSizeVariant.dimensions.unit}` : ''}
              </div>
            </div>
          ` : ''}
          ${p.customSize && p.customSize.isCustom ? `
            <div style="margin-top: 8px; padding: 10px; background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px;">
              <strong style="color: #d97706;">⚠️ CUSTOM SIZE REQUESTED</strong>
              <div style="font-size: 12px; color: #92400e; margin-top: 5px;">
                ${p.customSize.measurements.length ? `Length: ${p.customSize.measurements.length} ${p.customSize.measurements.unit}<br>` : ''}
                ${p.customSize.measurements.width ? `Width: ${p.customSize.measurements.width} ${p.customSize.measurements.unit}<br>` : ''}
                ${p.customSize.measurements.height ? `Height: ${p.customSize.measurements.height} ${p.customSize.measurements.unit}<br>` : ''}
                ${p.customSize.measurements.area ? `Area: ${p.customSize.measurements.area} sq${p.customSize.measurements.unit}<br>` : ''}
                ${p.customSize.measurements.diameter ? `Diameter: ${p.customSize.measurements.diameter} ${p.customSize.measurements.unit}<br>` : ''}
                ${p.customSize.notes ? `<strong>Notes:</strong> ${p.customSize.notes}` : ''}
              </div>
            </div>
          ` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <strong style="color: #2563eb;">${p.quantity}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <strong>₹${p.priceAtPurchase?.toLocaleString()}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <strong style="color: #16a34a;">₹${(p.priceAtPurchase * p.quantity)?.toLocaleString()}</strong>
        </td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Signature Draps Orders" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // signaturedrapes31@gmail.com
      subject: `🎉 New Order Confirmed - ${orderId}${hasCustomItems ? ' (CUSTOM SIZES)' : ''}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 12px;
              padding: 30px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 25px;
              border-radius: 10px;
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .alert-badge {
              background-color: #10b981;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              display: inline-block;
              font-size: 14px;
              font-weight: bold;
              margin-top: 10px;
            }
            .custom-badge {
              background-color: #f59e0b;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              display: inline-block;
              font-size: 14px;
              font-weight: bold;
              margin-top: 10px;
              margin-left: 10px;
            }
            .order-id {
              background-color: #f0f0f0;
              padding: 10px 20px;
              border-radius: 5px;
              font-family: monospace;
              font-size: 18px;
              font-weight: bold;
              display: inline-block;
              margin-top: 15px;
              color: #333;
            }
            .info-section {
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #6b7280;
              width: 40%;
            }
            .info-value {
              color: #111827;
              width: 60%;
              text-align: right;
            }
            .products-table {
              width: 100%;
              background-color: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              margin: 20px 0;
            }
            .products-table th {
              background-color: #2563eb;
              color: white;
              padding: 12px;
              text-align: left;
            }
            .total-row {
              background-color: #f0fdf4;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: right;
            }
            .total-amount {
              font-size: 24px;
              font-weight: bold;
              color: #16a34a;
            }
            .action-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .warning-box {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎨 Signature Draps</div>
              <h2 style="margin: 10px 0;">New Order Confirmed!</h2>
              <div class="alert-badge">✅ PAYMENT SUCCESSFUL</div>
              ${hasCustomItems ? '<div class="custom-badge">⚠️ HAS CUSTOM ITEMS</div>' : ''}
              <div class="order-id">Order ID: ${orderId}</div>
            </div>

            ${hasCustomItems ? `
              <div class="warning-box">
                <strong>⚠️ CUSTOM SIZE ALERT:</strong>
                <p style="margin: 10px 0 0 0;">This order contains items with custom size specifications. Please review the measurements carefully before processing.</p>
              </div>
            ` : ''}

            <h3 style="color: #2563eb; margin-bottom: 20px;">👤 Customer Details</h3>
            <div class="info-section">
              <div class="info-row">
                <div class="info-label">👤 Name:</div>
                <div class="info-value"><strong>${customer.name}</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">📧 Email:</div>
                <div class="info-value"><a href="mailto:${customer.email}" style="color: #2563eb;">${customer.email}</a></div>
              </div>
              <div class="info-row">
                <div class="info-label">📱 Phone:</div>
                <div class="info-value"><a href="tel:${customer.phone}" style="color: #2563eb;">${customer.phone}</a></div>
              </div>
              <div class="info-row">
                <div class="info-label">🕐 Order Date:</div>
                <div class="info-value">${formattedDate}</div>
              </div>
            </div>

            <h3 style="color: #2563eb; margin-bottom: 20px;">📦 Shipping Address</h3>
            <div class="info-section">
              <p style="margin: 0; line-height: 1.8;">
                <strong>${shippingAddress.fullName}</strong><br>
                ${shippingAddress.street}<br>
                ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postalCode}<br>
                ${shippingAddress.country}<br>
                📱 ${shippingAddress.phone}
              </p>
            </div>

            <h3 style="color: #2563eb; margin-bottom: 20px;">🛍️ Order Items</h3>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${productsHTML}
              </tbody>
            </table>

            <div class="total-row">
              <div style="color: #6b7280; margin-bottom: 5px;">Total Amount</div>
              <div class="total-amount">₹${totalAmount?.toLocaleString()}</div>
            </div>

            <h3 style="color: #2563eb; margin-bottom: 20px;">💳 Payment Details</h3>
            <div class="info-section">
              <div class="info-row">
                <div class="info-label">Payment Mode:</div>
                <div class="info-value"><strong>${paymentMode}</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">Payment Status:</div>
                <div class="info-value">
                  <span style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-weight: bold;">
                    ${paymentStatus}
                  </span>
                </div>
              </div>
              ${transactionId ? `
              <div class="info-row">
                <div class="info-label">Transaction ID:</div>
                <div class="info-value"><code>${transactionId}</code></div>
              </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://signature-drapes-admin.vercel.app/orders" class="action-button">
                View Order in Admin Panel →
              </a>
            </div>

            <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <strong>📋 Next Steps:</strong>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Verify product availability</li>
                ${hasCustomItems ? '<li><strong>Confirm custom size measurements with customer</strong></li>' : ''}
                <li>Prepare items for shipment</li>
                <li>Update order status in admin panel</li>
                <li>Contact customer if needed</li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>Signature Draps - Admin Notification System</strong></p>
              <p>This is an automated notification. Please do not reply to this email.</p>
              <p>To manage this order, please login to your admin panel.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation notification sent to admin:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation notification:', error);
    throw new Error('Failed to send order confirmation notification');
  }
};



/**
 * Generate and send invoice email with PDF attachment
 * Uses PDFKit (pure Node.js) — Stable on Vercel Hobby.
 * @param {string} userEmail - Customer's email address
 * @param {string} username - Customer's username
 * @param {Object} order - Order details
 * @returns {Promise}
 */
export const sendInvoiceEmail = async (userEmail, username, order) => {
  try {
    const PDFDocument = (await import('pdfkit')).default;

    console.log('Generating stable PDF for invoice:', order.orderId);

    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ──────────────────────────────────────────────────────────────
      // Branded Box
      doc.rect(0, 0, 612, 120).fill('#0f766e');

      doc
        .fillColor('#ffffff')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('Signature Drapes', 50, 45);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Premium Drapes & Home Decor', 50, 80);

      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 45, { align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`#${order.orderId}`, 400, 75, { align: 'right' })
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 400, 90, { align: 'right' });

      // ── Addresses ─────────────────────────────────────────────────────────────
      doc.moveDown(5);

      // Labels
      doc.fillColor('#0f766e').font('Helvetica-Bold').fontSize(11);
      doc.text('BILL TO', 50, 150);
      doc.text('SHIP TO', 330, 150);

      // Data
      const addr = order.shippingAddress || {};
      doc.fillColor('#333').font('Helvetica').fontSize(10);

      // Bill To Column
      doc.text(username || addr.fullName || 'Customer', 50, 170);
      doc.text(userEmail, 50, 185);
      doc.text(addr.phone || addr.phoneNumber || '', 50, 200);

      // Ship To Column
      doc.text(addr.fullName || '', 330, 170);
      doc.text(`${addr.street || addr.addressLine1 || ''}`, 330, 185);
      doc.text(`${addr.city || ''}, ${addr.state || ''} - ${addr.postalCode || addr.pincode || ''}`, 330, 200);

      // ── Products Table ────────────────────────────────────────────────────────
      const tableTop = 260;

      // Header Row
      doc.rect(50, tableTop, 512, 25).fill('#0f766e');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
      doc.text('#', 60, tableTop + 8);
      doc.text('Product Name', 90, tableTop + 8);
      doc.text('Qty', 350, tableTop + 8, { width: 40, align: 'center' });
      doc.text('Price', 400, tableTop + 8, { width: 70, align: 'right' });
      doc.text('Total', 480, tableTop + 8, { width: 70, align: 'right' });

      // Rows
      let y = tableTop + 25;
      doc.fillColor('#333').font('Helvetica').fontSize(9);

      order.products.forEach((product, i) => {
        // Alternating background
        if (i % 2 === 1) {
          doc.rect(50, y, 512, 30).fill('#f9fafb');
        }

        doc.fillColor('#333');
        const productName = product.productName || product.name || 'Unknown Product';
        let sizeNote = '';
        if (product.customSize?.isCustom) sizeNote = ' (Custom)';
        else if (product.selectedSizeVariant?.name) sizeNote = ` (${product.selectedSizeVariant.name})`;

        doc.text(i + 1, 60, y + 10);
        doc.text(`${productName}${sizeNote}`, 90, y + 10, { width: 250 });
        doc.text(product.quantity, 350, y + 10, { width: 40, align: 'center' });
        doc.text(`Rs.${(product.priceAtPurchase || 0).toLocaleString('en-IN')}`, 400, y + 10, { width: 70, align: 'right' });
        doc.text(`Rs.${((product.priceAtPurchase || 0) * product.quantity).toLocaleString('en-IN')}`, 480, y + 10, { width: 70, align: 'right' });

        y += 30;
      });

      // ── Totals ─────────────────────────────────────────────────────────────
      y += 20;
      doc.rect(330, y, 232, 40).fill('#0f766e');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14);
      doc.text('GRAND TOTAL', 345, y + 14);
      doc.text(`Rs.${order.totalAmount.toLocaleString('en-IN')}`, 400, y + 14, { align: 'right', width: 150 });

      // ── Footer ─────────────────────────────────────────────────────────────
      doc.fillColor('#999').fontSize(9).font('Helvetica');
      doc.text('Thank you for shopping with Signature Drapes!', 50, 750, { align: 'center', width: 512 });
      doc.text(`${process.env.EMAIL_USER} | signaturedrapes.in`, 50, 765, { align: 'center', width: 512 });

      doc.end();
    });

    console.log('PDF generated successfully');

    // Send emails
    const customerMailOptions = {
      from: `"Signature Drapes" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Invoice for Order #${order.orderId} - Signature Drapes`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
          <h2 style="color: #0f766e;">Thank you for your purchase!</h2>
          <p>Dear ${username},</p>
          <p>We are excited to process your order. Please find your invoice attached for order <strong>#${order.orderId}</strong>.</p>
          <div style="background-color: #f0f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Order Summary:</strong><br>
            Total Amount: ₹${order.totalAmount.toLocaleString('en-IN')}<br>
            Payment Status: PAID
          </div>
          <p>If you have any questions, feel free to reply to this email.</p>
          <br>
          <p>Best regards,<br><strong>Signature Drapes Team</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice-${order.orderId}.pdf`,
          content: pdfBuffer,
        }
      ]
    };

    const adminMailOptions = {
      from: `"Signature Drapes" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `[ADMIN] New Invoice Generated - Order #${order.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h3>New Order Invoice</h3>
          <p>Order ID: #${order.orderId}</p>
          <p>Customer: ${username} (${userEmail})</p>
          <p>The invoice PDF is attached for your records.</p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice-${order.orderId}.pdf`,
          content: pdfBuffer,
        }
      ]
    };

    await Promise.all([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error in sendInvoiceEmail:', error);
    throw error;
  }
};

