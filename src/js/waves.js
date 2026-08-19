import { CONFIG } from './config.js';
import { Enemy } from './entities.js';

export class WaveManager {
  constructor() {
    this.currentWaveIndex = 0;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.waveActive = false;
    this.currentWaveConfig = null;
    this.totalEnemiesSpawnedInWave = 0;
  }

  startRun() {
    this.currentWaveIndex = 0;
    this.bossSpawned = false;
    this.startWave(0);
  }

  startWave(index) {
    this.currentWaveIndex = index;
    this.currentWaveConfig = CONFIG.WAVES[this.currentWaveIndex];
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.waveActive = true;
    this.totalEnemiesSpawnedInWave = 0;
  }

  getCurrentWaveNumber() {
    return this.currentWaveIndex + 1;
  }

  getTotalWaves() {
    return CONFIG.WAVES.length;
  }

  isFinalBossWave() {
    return !!(this.currentWaveConfig && this.currentWaveConfig.isBossWave);
  }

  update(dt, player, worldWidth, worldHeight, enemies, onWaveBanner) {
    if (!this.waveActive || !this.currentWaveConfig) return null;

    this.waveTimer += dt;
    this.spawnTimer += dt;

    // Check for Boss Spawn on Wave 7
    if (this.isFinalBossWave() && !this.bossSpawned) {
      this.bossSpawned = true;
      const boss = this.spawnBoss(worldWidth, worldHeight, player);
      enemies.push(boss);
      return { event: 'boss_spawned', boss };
    }

    // Normal Wave Timer progression (Waves 1 to 6)
    if (!this.isFinalBossWave() && this.waveTimer >= this.currentWaveConfig.duration) {
      if (this.currentWaveIndex < CONFIG.WAVES.length - 1) {
        this.startWave(this.currentWaveIndex + 1);
        if (onWaveBanner) {
          onWaveBanner(this.currentWaveConfig.title, this.currentWaveConfig.subtitle);
        }
        return { event: 'next_wave', wave: this.getCurrentWaveNumber() };
      }
    }

    // Spawn regular enemies based on wave configuration spawn interval
    if (this.spawnTimer >= this.currentWaveConfig.spawnInterval) {
      this.spawnTimer = 0;

      // Select enemy type based on weights
      const type = this.selectEnemyType(this.currentWaveConfig.spawns);
      const enemy = this.spawnEnemyAtEdge(type, worldWidth, worldHeight, player);
      enemies.push(enemy);
      this.totalEnemiesSpawnedInWave++;
    }

    return null;
  }

  selectEnemyType(spawnWeights) {
    const roll = Math.random();
    let cumulative = 0;
    for (let s of spawnWeights) {
      cumulative += s.weight;
      if (roll <= cumulative) {
        return s.type;
      }
    }
    return spawnWeights[0].type;
  }

  spawnEnemyAtEdge(typeKey, worldWidth, worldHeight, player) {
    // Spawn around arena edges with offset (at least 200px from player)
    let x, y;
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 10) {
      attempts++;
      const side = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
      const margin = 40;

      if (side === 0) {
        x = Math.random() * worldWidth;
        y = -margin;
      } else if (side === 1) {
        x = worldWidth + margin;
        y = Math.random() * worldHeight;
      } else if (side === 2) {
        x = Math.random() * worldWidth;
        y = worldHeight + margin;
      } else {
        x = -margin;
        y = Math.random() * worldHeight;
      }

      const dist = Math.hypot(x - player.x, y - player.y);
      if (dist >= 180) {
        valid = true;
      }
    }

    return new Enemy(x, y, typeKey);
  }

  spawnBoss(worldWidth, worldHeight, player) {
    // Spawn Boss opposite side of player or top center
    const x = worldWidth / 2;
    const y = 100;
    return new Enemy(x, y, 'BOSS');
  }
}
