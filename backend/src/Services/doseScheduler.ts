import cron from 'node-cron';
import { markOverdueDosesMissed } from './careDataService';
import { processAlertQueue } from './careAlertService';

const initDoseScheduler = (): void => {
  cron.schedule('* * * * *', async () => {
    try {
      const markedCount = await markOverdueDosesMissed();
      if (markedCount > 0) console.log(`Marked ${markedCount} overdue doses as missed`);
      const alertWork = await processAlertQueue();
      if (alertWork.delivered || alertWork.escalated || alertWork.missedAlerts) {
        console.log('Care alert queue processed:', alertWork);
      }
    } catch (error) {
      console.error('Dose scheduler failed:', error);
    }
  });
  console.log('Dose lifecycle scheduler initialized');
};

export default initDoseScheduler;