import emailService from '../utils/send-pulse';

const CLIENT_BASE_URL = 'https://yourworkbuddy.com';

export const sendPasswordChangedEmail = async (userEmail: string) => {
  try {
    const emailData = {
      header: 'Password Changed Successfully',
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
              <h2>Password Updated</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your password was changed successfully.</p>
              <p>If you made this change, no further action is needed.</p>
              <p>However, if you did not authorize this change, please <a href="${CLIENT_BASE_URL}/forgot-password">reset your password</a> immediately or contact support.</p>
              <p>Thank you for using Your Work Buddy.</p>
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
    console.error('Error sending password change confirmation email:', error);
  }
};
