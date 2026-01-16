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
 * Generate invoice HTML with modern design
 * @param {Object} order - Order details
 * @param {string} userEmail - Customer's email
 * @returns {string} HTML string
 */
const generateInvoiceHTML = (order, userEmail) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const productsHTML = order.products.map((product, index) => {
    let sizeInfo = '';
    if (product.customSize?.isCustom) {
      sizeInfo = `<br><span style="font-size: 11px; color: #666; font-style: italic;">Custom: ${product.customSize.width}×${product.customSize.height} ${product.customSize.unit || 'cm'}</span>`;
    } else if (product.selectedSizeVariant) {
      sizeInfo = `<br><span style="font-size: 11px; color: #666; font-style: italic;">${product.selectedSizeVariant.size}</span>`;
    }

    return `
      <tr>
        <td style="text-align: center; padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
          <strong>${product.productName || product.name}</strong>${sizeInfo}
        </td>
        <td style="text-align: center; padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${product.quantity}</td>
        <td style="text-align: right; padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">₹${product.priceAtPurchase.toLocaleString('en-IN')}</td>
        <td style="text-align: right; padding: 12px 8px; border-bottom: 1px solid #e5e7eb;"><strong>₹${(product.priceAtPurchase * product.quantity).toLocaleString('en-IN')}</strong></td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1f2937; line-height: 1.6; }
        .invoice-container { max-width: 800px; margin: 0 auto; padding: 30px; background: white; }
        .header { background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px; color: white; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; top: -50%; right: -10%; width: 300px; height: 300px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; }
        .header-content { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1; }
        .company-info h1 { font-size: 32px; font-weight: bold; margin-bottom: 5px; color: white; }
        .company-info .tagline { font-size: 14px; opacity: 0.9; margin-bottom: 15px; }
        .company-info .contact-item { font-size: 11px; margin: 4px 0; opacity: 0.95; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 36px; font-weight: bold; margin-bottom: 5px; letter-spacing: 2px; }
        .invoice-title .invoice-meta { font-size: 12px; margin: 3px 0; }
        .invoice-title .gst { font-size: 11px; font-weight: bold; margin-top: 8px; padding: 4px 8px; background: rgba(255, 255, 255, 0.2); border-radius: 4px; display: inline-block; }
        .business-hours { font-size: 10px; text-align: right; margin-top: 8px; opacity: 0.9; }
        .addresses { display: flex; gap: 20px; margin-bottom: 30px; }
        .address-box { flex: 1; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
        .address-box h3 { color: #0f766e; font-size: 14px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .address-box .name { font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #1f2937; }
        .address-box .detail { font-size: 13px; color: #4b5563; margin: 4px 0; }
        .order-id { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 25px; border-radius: 4px; }
        .order-id strong { color: #92400e; font-size: 14px; }
        .products-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .products-table thead { background: #0f766e; color: white; }
        .products-table th { padding: 14px 8px; text-align: left; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        .products-table th:first-child, .products-table th:nth-child(3) { text-align: center; }
        .products-table th:nth-child(4), .products-table th:nth-child(5) { text-align: right; }
        .products-table tbody tr:nth-child(even) { background: #f9fafb; }
        .products-table tbody tr:hover { background: #f0fdfa; }
        .products-table td { font-size: 13px; color: #374151; }
        .summary { display: flex; justify-content: space-between; gap: 30px; margin-bottom: 30px; }
        .payment-info { flex: 1; }
        .payment-badge { display: inline-block; padding: 8px 16px; background: #d1fae5; color: #065f46; border-radius: 6px; font-weight: bold; font-size: 14px; margin-bottom: 12px; border: 2px solid #10b981; }
        .payment-detail { font-size: 12px; color: #6b7280; margin: 6px 0; }
        .totals-box { flex: 1; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; background: white; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #4b5563; }
        .totals-row.grand-total { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); margin: 0 -20px; padding: 12px 20px; border-radius: 6px; margin-top: 8px; }
        .totals-row.grand-total .label { font-size: 16px; font-weight: bold; color: #0f766e; }
        .totals-row.grand-total .value { font-size: 18px; font-weight: bold; color: #0f766e; }
        .terms { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
        .terms h3 { color: #0f766e; font-size: 14px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; }
        .terms ul { list-style: none; padding: 0; }
        .terms li { font-size: 11px; color: #4b5563; margin: 8px 0; padding-left: 20px; position: relative; }
        .terms li::before { content: '•'; position: absolute; left: 0; color: #0f766e; font-weight: bold; font-size: 16px; }
        .footer { background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: white; text-align: center; padding: 20px; border-radius: 8px; }
        .footer h3 { font-size: 18px; margin-bottom: 8px; }
        .footer p { font-size: 11px; opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="header-content">
            <div class="company-info">
              <h1>Shree Siddhi Decor</h1>
              <div class="tagline">Premium Drapes & Home Decor</div>
              <div class="contact-item">📍 C-831/1, Opposite 2nd Railway Gate, Besides MedPlus</div>
              <div class="contact-item">Congress Road, Tilakwadi, Belgaum, Karnataka 590006</div>
              <div class="contact-item">✉ signaturedraps31@gmail.com</div>
              <div class="contact-item">📞 +91 9036587169 | +91 8310100837</div>
            </div>
            <div class="invoice-title">
              <h2>TAX<br>INVOICE</h2>
              <div class="invoice-meta">Date: ${formatDate(order.createdAt)}</div>
              <div class="invoice-meta">Payment: ${order.paymentMode}</div>
              <div class="gst">GST: 29ACKFS9402L1ZH</div>
              <div class="business-hours">Mon-Sat: 9AM-7PM | Sun: 10AM-6PM</div>
            </div>
          </div>
        </div>
        <div class="addresses">
          <div class="address-box">
            <h3>Bill To</h3>
            <div class="name">${order.shippingAddress.fullName}</div>
            <div class="detail">${userEmail}</div>
            <div class="detail">${order.shippingAddress.phoneNumber}</div>
          </div>
          <div class="address-box">
            <h3>Ship To</h3>
            <div class="name">${order.shippingAddress.fullName}</div>
            <div class="detail">${order.shippingAddress.addressLine1}</div>
            ${order.shippingAddress.addressLine2 ? `<div class="detail">${order.shippingAddress.addressLine2}</div>` : ''}
            <div class="detail">${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</div>
          </div>
        </div>
        <div class="order-id"><strong>Order ID: #${order.orderId}</strong></div>
        <table class="products-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 45%;">Product Description</th>
              <th style="width: 10%;">Qty</th>
              <th style="width: 20%;">Unit Price</th>
              <th style="width: 20%;">Amount</th>
            </tr>
          </thead>
          <tbody>${productsHTML}</tbody>
        </table>
        <div class="summary">
          <div class="payment-info">
            ${order.paymentStatus === 'PAID' ? '<div class="payment-badge">✓ PAID</div>' : ''}
            ${order.transactionId ? `<div class="payment-detail"><strong>Transaction ID:</strong> ${order.transactionId}</div>` : ''}
            <div class="payment-detail"><strong>Payment Mode:</strong> ${order.paymentMode}</div>
          </div>
          <div class="totals-box">
            <div class="totals-row"><span class="label">Subtotal:</span><span class="value">₹${order.totalAmount.toLocaleString('en-IN')}</span></div>
            <div class="totals-row"><span class="label">GST (Included):</span><span class="value">10.00</span></div>
            <div class="totals-row"><span class="label">Discount:</span><span class="value">0.00</span></div>
            <div class="totals-row grand-total"><span class="label">Grand Total:</span><span class="value">₹${order.totalAmount.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
        <div class="terms">
          <h3>Terms & Conditions</h3>
          <ul>
            <li>This is a computer-generated invoice and does not require a signature.</li>
            <li>Goods once sold will not be taken back or exchanged.</li>
            <li>All disputes are subject to Belgaum jurisdiction only.</li>
            <li>For queries, contact us during business hours (Mon-Sat: 9AM-7PM, Sun: 10AM-6PM).</li>
          </ul>
        </div>
        <div class="footer">
          <h3>Thank you for shopping with us!</h3>
          <p>Shree Siddhi Decor | signaturedraps31@gmail.com | +91 9036587169</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate and send invoice email with PDF attachment
 * @param {string} userEmail - Customer's email address
 * @param {string} username - Customer's username
 * @param {Object} order - Order details
 * @returns {Promise}
 */
export const sendInvoiceEmail = async (userEmail, username, order) => {
  try {
    const htmlPdf = (await import('html-pdf-node')).default;

    // Generate the modern HTML invoice
    const invoiceHTML = generateInvoiceHTML(order, userEmail);

    // Convert HTML to PDF
    const file = { content: invoiceHTML };
    const options = {
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    };

    console.log('Generating PDF for invoice:', order.orderId);
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    console.log('PDF generated successfully');

    // Send email with beautiful HTML invoice and PDF attachment
    const mailOptions = {
      from: `"Signature Drapes" <signaturedraps31@gmail.com>`,
      to: userEmail,
      subject: `Invoice for Order #${order.orderId} - Signature Drapes`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background-color: #f9f9f9; border-radius: 10px; padding: 30px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #0f766e; margin-bottom: 10px; }
            .content { background-color: white; padding: 25px; border-radius: 8px; }
            .order-details { background-color: #f0f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎨 Signature Drapes</div>
              <p>Premium Drapes & Home Decor</p>
            </div>
            <div class="content">
              <h2 style="color: #0f766e;">Invoice for Your Order</h2>
              <p>Dear ${username},</p>
              <p>Thank you for your payment! Please find attached your invoice for order <strong>#${order.orderId}</strong>.</p>
              <div class="order-details">
                <strong>Order Summary:</strong><br>
                Order ID: ${order.orderId}<br>
                Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
                Total Amount: ₹${order.totalAmount.toLocaleString('en-IN')}<br>
                Payment Status: ${order.paymentStatus}<br>
                ${order.transactionId ? `Transaction ID: ${order.transactionId}` : ''}
              </div>
              <p>📎 <strong>Your invoice PDF is attached to this email.</strong> You can download and save it for your records.</p>
              <p>If you have any questions about your order or invoice, please don't hesitate to contact us.</p>
              <p>Thank you for choosing Signature Drapes!</p>
            </div>
            <div class="footer">
              <p><strong>Signature Drapes</strong></p>
              <p>📧 signaturedraps31@gmail.com | 📞 +91 9036587169</p>
              <p>© ${new Date().getFullYear()} Signature Drapes. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Invoice_${order.orderId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Invoice email with PDF attachment sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw new Error('Failed to send invoice email: ' + error.message);
  }
};

