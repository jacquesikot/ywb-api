import emailService from '../utils/send-pulse';

const CLIENT_BASE_URL = process.env.CLIENT_URL;
const SUPPORT_EMAIL = 'support@yourworkbuddy.com';
const HELP_CENTER_LINK = `${CLIENT_BASE_URL}/help`;

export const sendWelcomeEmail = async (
  userEmail: string,
  firstName: string,
) => {
  try {
    const emailData = {
      subject: 'Welcome to Your Work Buddy 👋',
      header: 'Welcome to Your Work Buddy 👋',
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
            ul {
              padding-left: 20px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #777;
              margin-top: 30px;
            }
            a {
              color: #FF9933;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Welcome to Your Work Buddy</h2>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Welcome to <strong>Your Work Buddy</strong>, where skilled professionals and businesses connect to get things done, fast.</p>
              <p>Whether you're here to offer your expertise or find help with a task, you're in the right place. Your Work Buddy is built to make finding the right fit seamless, secure, and stress-free.</p>
              <p>Here’s what you can do next:</p>
              <ul>
                <li>🎯 <strong>Complete your profile</strong> — the more detailed, the better your chances of connecting with the right people.</li>
                <li>🛠️ <strong>Explore the marketplace</strong>, browse jobs or services based on your needs.</li>
                <li>🔒 <strong>Stay protected</strong> — we handle contracts and payments, so you can focus on results.</li>
              </ul>
              <p>Need help? Our team is always here to support you. Just hit reply or visit our <a href="${HELP_CENTER_LINK}">Help Center</a>.</p>
              <p>We’re glad to have you on board.</p>
              <p>—<br>Your Work Buddy Team</p>
              <p>
                <a href="${CLIENT_BASE_URL}">${CLIENT_BASE_URL}</a> | 
                <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
              </p>
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
    console.error('Error sending welcome email:', error);
  }
};
