// Centralized Configuration and Balance Values for Neon Survivor

export const CONFIG = {
  // Arena Dimensions (Virtual resolution for game world)
  WORLD_WIDTH: 1600,
  WORLD_HEIGHT: 1200,

  // Player Defaults
  PLAYER: {
    RADIUS: 18,
    SPEED: 260, // pixels per second
    MAX_HEALTH: 100,
    DAMAGE: 25,
    ATTACK_SPEED: 2.2, // shots per second
    ATTACK_RANGE: 380,
    PROJECTILE_SPEED: 650,
    MAGNET_RADIUS: 120,
    CRIT_CHANCE: 0.05, // 5% base
    FREEZE_CHANCE: 0.0,
    REGEN_RATE: 0.0, // HP per sec
    MULTI_SHOT: 1, // 1 projectile base
  },

  // Enemies Configuration
  ENEMIES: {
    CHASER: {
      NAME: 'Chaser',
      TYPE: 'chaser',
      RADIUS: 16,
      HP: 40,
      SPEED: 140,
      DAMAGE: 10,
      SCORE: 10,
      COLOR: '#00f3ff',
      SHAPE: 'circle',
      XP: 10
    },
    RUNNER: {
      NAME: 'Runner',
      TYPE: 'runner',
      RADIUS: 12,
      HP: 22,
      SPEED: 220,
      DAMAGE: 6,
      SCORE: 15,
      COLOR: '#ffe600',
      SHAPE: 'triangle',
      XP: 15
    },
    TANK: {
      NAME: 'Tank',
      TYPE: 'tank',
      RADIUS: 28,
      HP: 180,
      SPEED: 85,
      DAMAGE: 25,
      SCORE: 35,
      COLOR: '#ff0055',
      SHAPE: 'square',
      XP: 35
    },
    SHOOTER: {
      NAME: 'Shooter',
      TYPE: 'shooter',
      RADIUS: 18,
      HP: 65,
      SPEED: 110,
      DAMAGE: 12,
      SCORE: 30,
      COLOR: '#00ff88',
      SHAPE: 'hexagon',
      FIRE_RATE: 0.6, // shoots every 1.66s
      PREFERRED_DIST: 260,
      PROJECTILE_SPEED: 320,
      PROJECTILE_DAMAGE: 10,
      XP: 30
    },
    BOSS: {
      NAME: 'Core Annihilator',
      TYPE: 'boss',
      RADIUS: 46,
      HP: 2200,
      SPEED: 95,
      DAMAGE: 30,
      SCORE: 500,
      COLOR: '#ff0055',
      SHAPE: 'boss_star',
      XP: 500
    }
  },

  // XP & Leveling Formula
  XP_BASE: 50,
  XP_MULTIPLIER: 1.35,

  // Wave Structure (7 Waves Total)
  WAVES: [
    {
      wave: 1,
      duration: 30, // seconds
      title: 'WAVE 1',
      subtitle: 'INITIAL SIGNAL DETECTED',
      spawns: [{ type: 'CHASER', weight: 1.0 }],
      spawnInterval: 1.8
    },
    {
      wave: 2,
      duration: 35,
      title: 'WAVE 2',
      subtitle: 'FAST RUNNERS SPOTTED',
      spawns: [
        { type: 'CHASER', weight: 0.6 },
        { type: 'RUNNER', weight: 0.4 }
      ],
      spawnInterval: 1.4
    },
    {
      wave: 3,
      duration: 40,
      title: 'WAVE 3',
      subtitle: 'HEAVY TANKS APPROACHING',
      spawns: [
        { type: 'CHASER', weight: 0.5 },
        { type: 'RUNNER', weight: 0.3 },
        { type: 'TANK', weight: 0.2 }
      ],
      spawnInterval: 1.2
    },
    {
      wave: 4,
      duration: 45,
      title: 'WAVE 4',
      subtitle: 'HOSTILE SHOOTERS INBOUND',
      spawns: [
        { type: 'CHASER', weight: 0.4 },
        { type: 'RUNNER', weight: 0.25 },
        { type: 'TANK', weight: 0.15 },
        { type: 'SHOOTER', weight: 0.2 }
      ],
      spawnInterval: 1.0
    },
    {
      wave: 5,
      duration: 50,
      title: 'WAVE 5',
      subtitle: 'HIGH PRESSURE WAVE',
      spawns: [
        { type: 'CHASER', weight: 0.35 },
        { type: 'RUNNER', weight: 0.25 },
        { type: 'TANK', weight: 0.2 },
        { type: 'SHOOTER', weight: 0.2 }
      ],
      spawnInterval: 0.8
    },
    {
      wave: 6,
      duration: 55,
      title: 'WAVE 6',
      subtitle: 'CRITICAL OVERLOAD',
      spawns: [
        { type: 'CHASER', weight: 0.3 },
        { type: 'RUNNER', weight: 0.3 },
        { type: 'TANK', weight: 0.2 },
        { type: 'SHOOTER', weight: 0.2 }
      ],
      spawnInterval: 0.65
    },
    {
      wave: 7,
      duration: 0, // Endless until Boss is defeated
      title: 'FINAL WAVE',
      subtitle: 'WARNING: CORE ANNIHILATOR ENGAGED',
      isBossWave: true,
      spawns: [
        { type: 'CHASER', weight: 0.6 },
        { type: 'RUNNER', weight: 0.4 }
      ],
      spawnInterval: 4.0 // Light add support during boss
    }
  ]
};
