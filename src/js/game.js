import { CONFIG } from './config.js';
import { StorageManager } from './storage.js';
import { soundEngine } from './audio.js';
import { InputManager } from './input.js';
import { Particle, FloatingText, ScreenShake } from './particle.js';
import { Player, Enemy, XPGem } from './entities.js';
import { WaveManager } from './waves.js';
import { getRandomUpgrades } from './upgrades.js';

export const GAME_STATES = {
  LOADING: 'LOADING',
  MAIN_MENU: 'MAIN_MENU',
  HOW_TO_PLAY: 'HOW_TO_PLAY',
  SETTINGS: 'SETTINGS',
  GAMEPLAY: 'GAMEPLAY',
  LEVEL_UP: 'LEVEL_UP',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.state = GAME_STATES.LOADING;
    this.lastTime = 0;
    this.survivalTime = 0;

    // Arena dimensions
    this.worldWidth = CONFIG.WORLD_WIDTH;
    this.worldHeight = CONFIG.WORLD_HEIGHT;

    // Entities & collections
    this.player = new Player(this.worldWidth / 2, this.worldHeight / 2);
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.xpGems = [];
    this.particles = [];
    this.floatingTexts = [];

    // Ambient background starfield particles
    this.bgStars = [];
    this.initBgStars();

    // Controllers & Systems
    this.input = new InputManager(this.canvas);
    this.waveManager = new WaveManager();
    this.shake = new ScreenShake();

    // Active boss reference
    this.activeBoss = null;
    this.upgradeSelectionLocked = false;

    // DOM Element Cached References
    this.dom = {
      menuHighScore: document.getElementById('menu-high-score'),
      hudOverlay: document.getElementById('hud-overlay'),
      xpBarFill: document.getElementById('xp-bar-fill'),
      levelDisplay: document.getElementById('level-display'),
      healthBarFill: document.getElementById('health-bar-fill'),
      healthText: document.getElementById('health-text'),
      waveValue: document.getElementById('wave-value'),
      scoreValue: document.getElementById('score-value'),
      bossBarContainer: document.getElementById('boss-bar-container'),
      bossBarFill: document.getElementById('boss-bar-fill'),
      bossHpText: document.getElementById('boss-hp-text'),
      waveBanner: document.getElementById('wave-banner'),
      waveBannerTitle: document.getElementById('wave-banner-title'),
      waveBannerSubtitle: document.getElementById('wave-banner-subtitle'),
      
      // Screens
      mainMenu: document.getElementById('screen-main-menu'),
      howToPlay: document.getElementById('screen-how-to-play'),
      settings: document.getElementById('screen-settings'),
      pause: document.getElementById('screen-pause'),
      levelUp: document.getElementById('screen-level-up'),
      gameOver: document.getElementById('screen-game-over'),
      victory: document.getElementById('screen-victory'),
      
      upgradeCardsContainer: document.getElementById('upgrade-cards-container'),

      // Game Over Stats
      goScore: document.getElementById('go-score'),
      goWave: document.getElementById('go-wave'),
      goLevel: document.getElementById('go-level'),
      goKills: document.getElementById('go-kills'),
      goTime: document.getElementById('go-time'),
      goBestScore: document.getElementById('go-best-score'),

      // Victory Stats
      vicScore: document.getElementById('vic-score'),
      vicKills: document.getElementById('vic-kills'),
      vicLevel: document.getElementById('vic-level'),
      vicTime: document.getElementById('vic-time'),
      vicBestScore: document.getElementById('vic-best-score'),

      // Settings buttons
      btnToggleSfx: document.getElementById('btn-toggle-sfx'),
      btnToggleShake: document.getElementById('btn-toggle-shake')
    };

    // Load persisted settings
    this.settings = StorageManager.getSettings();
    soundEngine.setEnabled(this.settings.sfx);
    this.shake.setEnabled(this.settings.screenShake);
    this.updateSettingsUI();

    // Handle viewport resize
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Switch to main menu
    this.changeState(GAME_STATES.MAIN_MENU);
  }

  initBgStars() {
    this.bgStars = [];
    for (let i = 0; i < 60; i++) {
      this.bgStars.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.imageSmoothingEnabled = true;
  }

  updateSettingsUI() {
    if (this.dom.btnToggleSfx) {
      this.dom.btnToggleSfx.textContent = this.settings.sfx ? 'ON' : 'OFF';
      this.dom.btnToggleSfx.className = `toggle-btn ${this.settings.sfx ? 'toggle-on' : 'toggle-off'}`;
    }
    if (this.dom.btnToggleShake) {
      this.dom.btnToggleShake.textContent = this.settings.screenShake ? 'ON' : 'OFF';
      this.dom.btnToggleShake.className = `toggle-btn ${this.settings.screenShake ? 'toggle-on' : 'toggle-off'}`;
    }
  }

  toggleSFX() {
    this.settings.sfx = !this.settings.sfx;
    soundEngine.setEnabled(this.settings.sfx);
    StorageManager.saveSettings(this.settings);
    this.updateSettingsUI();
    soundEngine.playClick();
  }

  toggleShake() {
    this.settings.screenShake = !this.settings.screenShake;
    this.shake.setEnabled(this.settings.screenShake);
    StorageManager.saveSettings(this.settings);
    this.updateSettingsUI();
    soundEngine.playClick();
  }

  changeState(newState) {
    this.state = newState;

    // Screen Overlays visibility management
    const screens = [
      this.dom.mainMenu,
      this.dom.howToPlay,
      this.dom.settings,
      this.dom.pause,
      this.dom.levelUp,
      this.dom.gameOver,
      this.dom.victory
    ];

    screens.forEach(s => {
      if (s) s.classList.add('hidden');
    });

    // Control input state enabling
    if (newState === GAME_STATES.GAMEPLAY) {
      this.input.setEnabled(true);
      if (this.dom.hudOverlay) this.dom.hudOverlay.classList.remove('hidden');
    } else {
      this.input.setEnabled(false);
      if (newState !== GAME_STATES.LEVEL_UP && newState !== GAME_STATES.PAUSED) {
        if (this.dom.hudOverlay) this.dom.hudOverlay.classList.add('hidden');
      }
    }

    // Activate specific screen DOM
    switch (newState) {
      case GAME_STATES.MAIN_MENU:
        if (this.dom.mainMenu) this.dom.mainMenu.classList.remove('hidden');
        if (this.dom.menuHighScore) {
          this.dom.menuHighScore.textContent = StorageManager.getHighScore().toLocaleString();
        }
        break;
      case GAME_STATES.HOW_TO_PLAY:
        if (this.dom.howToPlay) this.dom.howToPlay.classList.remove('hidden');
        break;
      case GAME_STATES.SETTINGS:
        if (this.dom.settings) this.dom.settings.classList.remove('hidden');
        break;
      case GAME_STATES.PAUSED:
        if (this.dom.pause) this.dom.pause.classList.remove('hidden');
        break;
      case GAME_STATES.LEVEL_UP:
        if (this.dom.levelUp) this.dom.levelUp.classList.remove('hidden');
        this.renderUpgradeCards();
        break;
      case GAME_STATES.GAME_OVER:
        if (this.dom.gameOver) this.dom.gameOver.classList.remove('hidden');
        this.populateGameOverStats();
        break;
      case GAME_STATES.VICTORY:
        if (this.dom.victory) this.dom.victory.classList.remove('hidden');
        this.populateVictoryStats();
        break;
    }
  }

  startNewRun() {
    soundEngine.init();
    soundEngine.playClick();

    // Clean reset of all game state
    this.survivalTime = 0;
    this.player.x = this.worldWidth / 2;
    this.player.y = this.worldHeight / 2;
    this.player.resetStats();

    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.xpGems = [];
    this.particles = [];
    this.floatingTexts = [];
    this.activeBoss = null;
    this.upgradeSelectionLocked = false;

    if (this.dom.bossBarContainer) this.dom.bossBarContainer.classList.add('hidden');

    this.waveManager.startRun();
    this.triggerWaveBanner('WAVE 1', 'ENGAGE NEON SIGNAL');

    this.changeState(GAME_STATES.GAMEPLAY);
  }

  triggerWaveBanner(title, subtitle) {
    if (!this.dom.waveBanner) return;
    this.dom.waveBannerTitle.textContent = title;
    this.dom.waveBannerSubtitle.textContent = subtitle;

    // Reset banner animation class
    this.dom.waveBanner.classList.remove('hidden');
    this.dom.waveBanner.style.animation = 'none';
    this.dom.waveBanner.offsetHeight; // reflow trigger
    this.dom.waveBanner.style.animation = 'bannerPop 2.5s ease-in-out forwards';
  }

  // Generate 3 Upgrade Choice Cards for Level Up Overlay
  renderUpgradeCards() {
    if (!this.dom.upgradeCardsContainer) return;
    this.dom.upgradeCardsContainer.innerHTML = '';
    this.upgradeSelectionLocked = false;

    const choices = getRandomUpgrades(3);
    choices.forEach(upgrade => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-icon">${upgrade.icon}</div>
        <div class="upgrade-details">
          <h3>${upgrade.name}</h3>
          <p>${upgrade.desc}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        if (this.upgradeSelectionLocked) return;
        this.upgradeSelectionLocked = true;

        soundEngine.playClick();
        upgrade.apply(this.player);
        this.changeState(GAME_STATES.GAMEPLAY);
      });

      this.dom.upgradeCardsContainer.appendChild(card);
    });
  }

  pauseGame() {
    if (this.state === GAME_STATES.GAMEPLAY) {
      soundEngine.playClick();
      this.changeState(GAME_STATES.PAUSED);
    }
  }

  resumeGame() {
    if (this.state === GAME_STATES.PAUSED) {
      soundEngine.playClick();
      this.changeState(GAME_STATES.GAMEPLAY);
    }
  }

  populateGameOverStats() {
    StorageManager.saveHighScore(this.player.score);
    StorageManager.saveBestWave(this.waveManager.getCurrentWaveNumber());
    StorageManager.saveBestTime(this.survivalTime);

    const formattedTime = this.formatTime(this.survivalTime);

    if (this.dom.goScore) this.dom.goScore.textContent = this.player.score.toLocaleString();
    if (this.dom.goWave) this.dom.goWave.textContent = `${this.waveManager.getCurrentWaveNumber()} / ${this.waveManager.getTotalWaves()}`;
    if (this.dom.goLevel) this.dom.goLevel.textContent = this.player.level;
    if (this.dom.goKills) this.dom.goKills.textContent = this.player.kills;
    if (this.dom.goTime) this.dom.goTime.textContent = formattedTime;
    if (this.dom.goBestScore) this.dom.goBestScore.textContent = StorageManager.getHighScore().toLocaleString();
  }

  populateVictoryStats() {
    StorageManager.saveHighScore(this.player.score);
    StorageManager.saveBestWave(7);
    StorageManager.saveBestTime(this.survivalTime);

    soundEngine.playVictory();

    const formattedTime = this.formatTime(this.survivalTime);

    if (this.dom.vicScore) this.dom.vicScore.textContent = this.player.score.toLocaleString();
    if (this.dom.vicKills) this.dom.vicKills.textContent = this.player.kills;
    if (this.dom.vicLevel) this.dom.vicLevel.textContent = this.player.level;
    if (this.dom.vicTime) this.dom.vicTime.textContent = formattedTime;
    if (this.dom.vicBestScore) this.dom.vicBestScore.textContent = StorageManager.getHighScore().toLocaleString();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Main Loop logic (Runs every frame)
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000); // capped delta time
    this.lastTime = timestamp;

    if (this.state === GAME_STATES.GAMEPLAY) {
      this.update(dt);
    }

    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.survivalTime += dt;
    this.shake.update(dt);

    // Get input vector
    const moveVec = this.input.getVector();

    // 1. Update Player
    this.player.update(dt, moveVec, this.worldWidth, this.worldHeight, this.enemies, this.projectiles);

    // 2. Wave Manager update
    const waveResult = this.waveManager.update(
      dt,
      this.player,
      this.worldWidth,
      this.worldHeight,
      this.enemies,
      (title, sub) => this.triggerWaveBanner(title, sub)
    );

    if (waveResult && waveResult.event === 'boss_spawned') {
      this.activeBoss = waveResult.boss;
      if (this.dom.bossBarContainer) this.dom.bossBarContainer.classList.remove('hidden');
    }

    // 3. Update Player Projectiles & Collision with Enemies
    for (let p of this.projectiles) {
      if (!p.active) continue;
      p.update(dt);

      // Collision check against active enemies
      for (let enemy of this.enemies) {
        if (!enemy.active) continue;

        if (p.isCollidingWith(enemy)) {
          p.active = false;
          const defeated = enemy.takeDamage(
            p.damage,
            p.isCrit,
            p.isFreeze,
            this.particles,
            this.floatingTexts
          );

          if (defeated) {
            this.player.kills++;
            this.player.score += enemy.scoreValue;

            // Spawn XP Gem
            this.xpGems.push(new XPGem(enemy.x, enemy.y, enemy.xpValue));

            // If Final Boss defeated -> VICTORY!
            if (enemy.type === 'boss') {
              this.shake.addShake(20, 0.8);
              this.changeState(GAME_STATES.VICTORY);
              return;
            }
          }
          break;
        }
      }
    }

    // 4. Update Enemy Projectiles & Collision with Player
    for (let ep of this.enemyProjectiles) {
      if (!ep.active) continue;
      ep.update(dt, this.worldWidth, this.worldHeight);

      if (ep.isCollidingWith(this.player)) {
        ep.active = false;
        this.player.takeDamage(ep.damage, this.particles, this.floatingTexts);
        this.shake.addShake(8, 0.25);

        if (this.player.health <= 0) {
          this.changeState(GAME_STATES.GAME_OVER);
          return;
        }
      }
    }

    // 5. Update Enemies & Collision with Player
    const newMinionsToSpawn = [];
    for (let enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.update(dt, this.player, this.enemyProjectiles, newMinionsToSpawn);

      // Collision with player (Contact damage)
      if (enemy.isCollidingWith(this.player)) {
        this.player.takeDamage(enemy.damage, this.particles, this.floatingTexts);
        this.shake.addShake(10, 0.3);

        // Knockback player slightly
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.player.x += (dx / dist) * 20;
        this.player.y += (dy / dist) * 20;

        if (this.player.health <= 0) {
          this.changeState(GAME_STATES.GAME_OVER);
          return;
        }
      }
    }
    if (newMinionsToSpawn.length > 0) {
      this.enemies.push(...newMinionsToSpawn);
    }

    // 6. Update XP Gems & Magnet Collection
    for (let gem of this.xpGems) {
      if (!gem.active) continue;
      gem.update(dt, this.player);

      if (gem.isCollidingWith(this.player)) {
        gem.active = false;
        const levelUp = this.player.addXP(gem.value, this.floatingTexts);

        if (levelUp) {
          this.player.level++;
          this.player.xp -= this.player.xpToNextLevel;
          this.player.xpToNextLevel = Math.round(this.player.xpToNextLevel * CONFIG.XP_MULTIPLIER);

          soundEngine.playLevelUp();
          this.changeState(GAME_STATES.LEVEL_UP);
          return;
        }
      }
    }

    // 7. Update Particles & Floating Text
    for (let pt of this.particles) pt.update(dt);
    for (let ft of this.floatingTexts) ft.update(dt);

    // 8. Clean inactive objects
    this.projectiles = this.projectiles.filter(p => p.active);
    this.enemyProjectiles = this.enemyProjectiles.filter(ep => ep.active);
    this.enemies = this.enemies.filter(e => e.active);
    this.xpGems = this.xpGems.filter(g => g.active);
    this.particles = this.particles.filter(pt => pt.active);
    this.floatingTexts = this.floatingTexts.filter(ft => ft.active);

    // 9. Update HUD UI Elements
    this.updateHUD();
  }

  updateHUD() {
    if (!this.dom.hudOverlay) return;

    // XP Bar
    const xpPct = Math.min(100, (this.player.xp / this.player.xpToNextLevel) * 100);
    if (this.dom.xpBarFill) this.dom.xpBarFill.style.width = `${xpPct}%`;
    if (this.dom.levelDisplay) this.dom.levelDisplay.textContent = `LVL ${this.player.level}`;

    // Health Bar
    const hpPct = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
    if (this.dom.healthBarFill) this.dom.healthBarFill.style.width = `${hpPct}%`;
    if (this.dom.healthText) this.dom.healthText.textContent = `${Math.ceil(this.player.health)} / ${Math.ceil(this.player.maxHealth)}`;

    // Wave & Score
    if (this.dom.waveValue) this.dom.waveValue.textContent = `${this.waveManager.getCurrentWaveNumber()} / ${this.waveManager.getTotalWaves()}`;
    if (this.dom.scoreValue) this.dom.scoreValue.textContent = this.player.score.toLocaleString();

    // Boss Bar (if active)
    if (this.activeBoss && this.activeBoss.active) {
      const bossHpPct = Math.max(0, (this.activeBoss.hp / this.activeBoss.maxHp) * 100);
      if (this.dom.bossBarFill) this.dom.bossBarFill.style.width = `${bossHpPct}%`;
      if (this.dom.bossHpText) this.dom.bossHpText.textContent = `${Math.ceil(bossHpPct)}%`;
    }
  }

  render() {
    const ctx = this.ctx;
    const canvas = this.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Apply Screen Shake offset
    const shakeOffset = this.shake.getOffset();

    // Scale & center camera to fit world view while preserving aspect ratio
    const scale = Math.min(canvas.width / this.worldWidth, canvas.height / this.worldHeight);
    const offsetX = (canvas.width - this.worldWidth * scale) / 2 + shakeOffset.x;
    const offsetY = (canvas.height - this.worldHeight * scale) / 2 + shakeOffset.y;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 1. Draw World Background & Grid
    this.drawWorldBackground(ctx);

    // 2. Draw XP Gems
    for (let gem of this.xpGems) gem.draw(ctx);

    // 3. Draw Enemy Projectiles
    for (let ep of this.enemyProjectiles) ep.draw(ctx);

    // 4. Draw Player Projectiles
    for (let p of this.projectiles) p.draw(ctx);

    // 5. Draw Enemies
    for (let enemy of this.enemies) enemy.draw(ctx);

    // 6. Draw Player
    this.player.draw(ctx);

    // 7. Draw Visual Particles & Floating Text
    for (let pt of this.particles) pt.draw(ctx);
    for (let ft of this.floatingTexts) ft.draw(ctx);

    ctx.restore();
  }

  drawWorldBackground(ctx) {
    // Dark background fill
    ctx.fillStyle = '#070913';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Glowing Arena Outer Boundary
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);
    ctx.shadowBlur = 0;

    // Arena Subtle Grid Lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 80;

    ctx.beginPath();
    for (let x = 0; x <= this.worldWidth; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldHeight);
    }
    for (let y = 0; y <= this.worldHeight; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldWidth, y);
    }
    ctx.stroke();

    // Ambient stars/dust
    ctx.fillStyle = 'rgba(0, 243, 255, 0.3)';
    for (let s of this.bgStars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
