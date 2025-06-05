import emailService from '../utils/send-pulse';

export const sendLoginActivityEmail = async (
  userEmail: string,
  deviceInfo: {
    ip: string | null;
    city: string | null;
    country: string | null;
    device: string;
    browser: string;
    os: string;
  },
) => {
  try {
    const { ip, city, country, device, browser, os } = deviceInfo;

    const emailData = {
      header: 'Login Activity Detected',
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
              padding: 10px;
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
            .info {
              background: #f1f1f1;
              padding: 10px;
              border-radius: 6px;
              margin: 10px 0;
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
              <h2>New Login Detected</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We detected a new login to your account. If this was you, no action is needed. If not, please secure your account.</p>
              <div class="info">
                <strong>IP Address:</strong> ${ip || 'Unknown'}<br/>
                <strong>City:</strong> ${city || 'Unknown'}<br/>
                <strong>Country:</strong> ${country || 'Unknown'}<br/>
                <strong>Device:</strong> ${device || 'Unknown'}<br/>
                <strong>Browser:</strong> ${browser || 'Unknown'}<br/>
                <strong>Operating System:</strong> ${os || 'Unknown'}
              </div>
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
    console.error('Error sending login activity email:', error);
  }
};
