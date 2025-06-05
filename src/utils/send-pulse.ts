/* eslint-disable @typescript-eslint/no-explicit-any */
import sendpulse from 'sendpulse-api';
import dotenv from 'dotenv';

dotenv.config();

const API_USER_ID = process.env.SENDPULSE_USER_ID!;
const API_SECRET = process.env.SENDPULSE_SECRET!;
const TOKEN_STORAGE = '/tmp/';

// Provide a callback function for the initialization
sendpulse.init(API_USER_ID, API_SECRET, TOKEN_STORAGE, (token: any) => {
  if (token && token.is_error) {
    console.log('Error initializing SendPulse:', token);
  } else {
    console.log('SendPulse initialized successfully:', token);
  }
});

const sendEmail = (userEmail: string, emailData: any) => {
  const mailOptions = {
    html: emailData.body, // HTML email content
    text: emailData.body, // Text fallback
    subject: emailData.header,
    from: {
      name: process.env.SENDER_NAME!,
      email: process.env.SENDER_EMAIL!,
    },
    to: [
      {
        email: userEmail,
      },
    ],
  };

  sendpulse.smtpSendMail((error: any, result: any) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', result);
    }
  }, mailOptions);
};

const emailExports = {
  sendEmail,
};

export default emailExports;
