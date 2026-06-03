process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import cron from 'node-cron';
import { User } from '../models/User';
import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID as string;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN as string;

const client = (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

// UPGRADED: Gets the exact hour AND minute (e.g., "10:15")
const getCurrentTimeFormat = (): string => {
  const date = new Date();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const checkGoalsAndSendReminders = async (): Promise<void> => {
  try {
    const currentTimeStr = getCurrentTimeFormat();
    console.log(`[CRON] Checking for reminders at: ${currentTimeStr}`);

    const users = await User.find({ whatsappEnabled: true, reminderTime: currentTimeStr });
    
    for (const user of users as { name: string; phoneNumber: string; dailyWaterGoal?: number }[]) {
      const waterGoal = user.dailyWaterGoal || 2000;
      const waterLoggedToday = 1500; // Hardcoded for now until we link your water model

      if (waterLoggedToday < waterGoal && client) {
        const messageBody = `*DiaFit Alert*\nHi ${user.name},\n\nYou missed your water goal today (${waterLoggedToday}/${waterGoal}ml). Open DiaFit to log your progress!`;
        
        try {
          await client.messages.create({
            body: messageBody,
            from: 'whatsapp:+14155238886', // Hardcoded official Twilio Sandbox number
            to: `whatsapp:${user.phoneNumber}`
          });
          console.log(`[TWILIO] Reminder sent to ${user.name} at ${user.phoneNumber}`);
        } catch (err: unknown) {
          console.error(`[TWILIO Error] ${(err as Error).message}`);
        }
      }
    }
  } catch (err: unknown) {
    console.error('[CRON Error]:', (err as Error).message);
  }
};

const initWhatsappCron = (): void => {
  // UPGRADED: Runs every single minute
  cron.schedule('* * * * *', () => {
    checkGoalsAndSendReminders();
  });
  console.log('[CRON] WhatsApp reminder service initialized. Running every minute.');
};

export default initWhatsappCron;