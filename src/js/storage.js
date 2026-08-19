// Safe LocalStorage Manager for high scores and user settings

const STORAGE_KEYS = {
  HIGH_SCORE: 'neon_survivor_high_score',
  BEST_WAVE: 'neon_survivor_best_wave',
  BEST_TIME: 'neon_survivor_best_time',
  SETTINGS: 'neon_survivor_settings'
};

const DEFAULT_SETTINGS = {
  sfx: true,
  screenShake: true
};

export class StorageManager {
  static getHighScore() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  static saveHighScore(score) {
    try {
      const current = this.getHighScore();
      if (score > current) {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
        return true;
      }
    } catch (e) {}
    return false;
  }

  static getBestWave() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.BEST_WAVE);
      return val ? parseInt(val, 10) || 1 : 1;
    } catch (e) {
      return 1;
    }
  }

  static saveBestWave(wave) {
    try {
      const current = this.getBestWave();
      if (wave > current) {
        localStorage.setItem(STORAGE_KEYS.BEST_WAVE, wave.toString());
      }
    } catch (e) {}
  }

  static getBestTime() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.BEST_TIME);
      return val ? parseFloat(val) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  static saveBestTime(timeSeconds) {
    try {
      const current = this.getBestTime();
      if (timeSeconds > current) {
        localStorage.setItem(STORAGE_KEYS.BEST_TIME, timeSeconds.toString());
      }
    } catch (e) {}
  }

  static getSettings() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (val) {
        const parsed = JSON.parse(val);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {}
    return { ...DEFAULT_SETTINGS };
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }
}
