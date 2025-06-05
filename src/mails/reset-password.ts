import emailService from '../utils/send-pulse';

const CLIENT_BASE_URL = 'https://yourworkbuddy.com';

export const sendResetPasswordEmail = async (
  userEmail: string,
  resetToken: string,
) => {
  try {
    const resetLink = `${CLIENT_BASE_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(userEmail)}`;

    const emailData = {
      header: 'Reset Your Password',
      body: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 10px auto;
              background: #fff;
              padding: 20px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
              background: #FF9933;
              color: black;
              padding: 5px;
              text-align: center;
            }
            .content {
              padding: 10px;
              font-size: 16px;
              line-height: 1.6;
              color: #333;
            }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              background-color: #FF9933;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #777;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Request</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested to reset your password. Click the button below to proceed:</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="btn">Reset Password</a>
              </p>
              <p>This link will expire after a short period. If you didn’t request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Your Work Buddy
            </div>
          </div>
        </body>
      </html>
      `,
    };

    await emailService.sendEmail(userEmail, emailData);
  } catch (error) {
    console.error('Error sending reset password email:', error);
  }
};
