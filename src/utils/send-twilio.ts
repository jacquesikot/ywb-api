import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

// Initialize Twilio client
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

interface SMSData {
  to: string;
  body: string;
}

const sendSMS = async (smsData: SMSData) => {
  try {
    const message = await client.messages.create({
      body: smsData.body,
      from: TWILIO_PHONE_NUMBER,
      to: smsData.to,
    });

    console.log('SMS sent successfully:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }
};

const twilioExports = {
  sendSMS,
};

export default twilioExports;
