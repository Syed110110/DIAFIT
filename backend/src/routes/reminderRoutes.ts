import express from 'express';
import twilio from 'twilio';

const router = express.Router();

// Initialize Twilio client using explicit environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const client = twilio(accountSid, authToken);

router.post('/trigger', async (req, res) => {
  try {
    console.log("Sending live WhatsApp message via Twilio Gateway...");

    const message = await client.messages.create({
      from: (process.env.TWILIO_WHATSAPP_NUMBER || '') as string,
      to: (process.env.MY_PHONE_NUMBER || '') as string,
      body: "Hello Syed! This is a live automated reminder from your DiaFit application. Time to log your tracking metrics!"
    });

    console.log(`Message dispatched completely! SID: ${message.sid}`);
    
    return res.status(200).json({ 
      success: true, 
      message: "Live WhatsApp reminder dispatched successfully!",
      sid: message.sid 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Twilio Dispatch Error:", errorMessage);
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

export default router;