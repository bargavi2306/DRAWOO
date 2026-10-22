/**
 * ScoreManager — Authoritative scoring calculations
 */

export class ScoreManager {
  /**
   * Calculate score for a correct guesser
   */
  static calculateGuesserScore(remainingTime = 60, totalTurnTime = 90) {
    const basePoints = 800;
    const timeBonus = Math.max(0, Math.floor(remainingTime * 5));
    const totalTurnPoints = basePoints + timeBonus;

    return {
      basePoints,
      timeBonus,
      drawerBonus: 0,
      totalTurnPoints
    };
  }

  /**
   * Calculate drawer bonus score at the end of turn
   */
  static calculateDrawerScore(guesserPointsList = []) {
    if (!guesserPointsList || guesserPointsList.length === 0) {
      return {
        basePoints: 0,
        timeBonus: 0,
        drawerBonus: 0,
        totalTurnPoints: 0
      };
    }

    const totalGuesserPts = guesserPointsList.reduce((acc, val) => acc + val, 0);
    const drawerBonus = Math.floor(totalGuesserPts * 0.25);

    return {
      basePoints: 0,
      timeBonus: 0,
      drawerBonus,
      totalTurnPoints: drawerBonus
    };
  }
}
