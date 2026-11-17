import { User } from '../models/User';

export const updateActivityStreak = async (userId: string): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const streakData = user.streakData ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastGoalMetDate: null,
    };

    if (streakData.lastGoalMetDate) {
      if (streakData.lastGoalMetDate === todayStr) {
        return;
      }

      if (streakData.lastGoalMetDate === yesterdayStr) {
        streakData.currentStreak += 1;
      } else {
        streakData.currentStreak = 1;
      }
    } else {
      streakData.currentStreak = 1;
    }

    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }

    streakData.lastGoalMetDate = todayStr;
    user.streakData = streakData;
    await user.save();
    console.log(`Streak updated: Current = ${streakData.currentStreak}`);
  } catch (error) {
    console.error("Streak computation error:", error);
  }
};