import { User } from '../models/User';

export const updateActivityStreak = async (userId: string): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const todayStr = new Date().toLocaleDateString('en-CA'); 
    
    if (user.lastActivityDate) {
      if (user.lastActivityDate === todayStr) {
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');

      if (user.lastActivityDate === yesterdayStr) {
        user.currentStreak += 1;
      } else {
        user.currentStreak = 1;
      }
    } else {
      user.currentStreak = 1;
    }

    if (user.currentStreak > user.highestStreak) {
      user.highestStreak = user.currentStreak;
    }

    user.lastActivityDate = todayStr;
    await user.save();
    console.log(`🔥 Streak updated: Current = ${user.currentStreak}`);
  } catch (error) {
    console.error("Streak computation error:", error);
  }
};