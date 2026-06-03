import { Twilio } from 'twilio';
import * as dotenv from 'dotenv';

dotenv.config(); // This loads your .env file

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!, 
  process.env.TWILIO_AUTH_TOKEN!
);

async function sendTest() {
  try {
    const message = await client.messages.create({
      body: "DiaFit System Check: Connection Successful! 🚀",
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: 'whatsapp:+918604725119' // <--- PUT YOUR PHONE NUMBER HERE
    });
    console.log("Success! Message SID:", message.sid);
  } catch (err) {
    console.error("Test Failed:", err);
  }
}

sendTest();