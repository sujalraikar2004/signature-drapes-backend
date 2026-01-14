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
      to: process.env.OWNER_EMAIL || process.env.EMAIL_USER,
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
