import { CONFIG } from './config.js';
import { Particle, FloatingText } from './particle.js';
import { soundEngine } from './audio.js';

// Base Entity Class
export class Entity {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.active = true;
  }

  getDistanceTo(other) {
    return Math.hypot(other.x - this.x, other.y - this.y);
  }

  isCollidingWith(other) {
    return this.getDistanceTo(other) < (this.radius + other.radius);
  }
}

// Player Entity
export class Player extends Entity {
  constructor(x, y) {
    super(x, y, CONFIG.PLAYER.RADIUS, '#00f3ff');
    this.resetStats();
  }

  resetStats() {
    this.health = CONFIG.PLAYER.MAX_HEALTH;
    this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
    this.speed = CONFIG.PLAYER.SPEED;
    this.damage = CONFIG.PLAYER.DAMAGE;
    this.attackSpeed = CONFIG.PLAYER.ATTACK_SPEED;
    this.attackRange = CONFIG.PLAYER.ATTACK_RANGE;
    this.projectileSpeed = CONFIG.PLAYER.PROJECTILE_SPEED;
    this.magnetRadius = CONFIG.PLAYER.MAGNET_RADIUS;
    this.critChance = CONFIG.PLAYER.CRIT_CHANCE;
    this.freezeChance = CONFIG.PLAYER.FREEZE_CHANCE;
    this.regenRate = CONFIG.PLAYER.REGEN_RATE;
    this.multiShot = CONFIG.PLAYER.MULTI_SHOT;

    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = CONFIG.XP_BASE;
    this.kills = 0;
    this.score = 0;

    this.attackCooldown = 0;
    this.aimAngle = 0;
    this.hitFlashTimer = 0;
    this.targetEnemy = null;
  }

  update(dt, moveVector, worldWidth, worldHeight, enemies, projectiles) {
    // Movement update
    this.x += moveVector.x * this.speed * dt;
    this.y += moveVector.y * this.speed * dt;

    // Clamp inside world bounds
    this.x = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y));

    // Health Regeneration
    if (this.regenRate > 0 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.regenRate * dt);
    }

    // Hit Flash Timer
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // Auto-Targeting: find closest active enemy in range
    let closestDist = this.attackRange;
    this.targetEnemy = null;

    for (let enemy of enemies) {
      if (!enemy.active) continue;
      const dist = this.getDistanceTo(enemy);
      if (dist < closestDist) {
        closestDist = dist;
        this.targetEnemy = enemy;
      }
    }

    if (this.targetEnemy) {
      this.aimAngle = Math.atan2(this.targetEnemy.y - this.y, this.targetEnemy.x - this.x);
    } else if (moveVector.x !== 0 || moveVector.y !== 0) {
      this.aimAngle = Math.atan2(moveVector.y, moveVector.x);
    }

    // Auto-Attack Cooldown & Firing
    this.attackCooldown -= dt;
    if (this.attackCooldown <= 0 && this.targetEnemy) {
      this.fireWeapon(projectiles);
      this.attackCooldown = 1 / this.attackSpeed;
    }
  }

  fireWeapon(projectiles) {
    soundEngine.playLaser();

    const count = this.multiShot;
    const baseAngle = this.aimAngle;
    const spreadAngle = Math.PI / 12; // 15 degree arc spread

    for (let i = 0; i < count; i++) {
      let angle = baseAngle;
      if (count > 1) {
        angle = baseAngle - (spreadAngle * (count - 1) / 2) + i * spreadAngle;
      }

      // Check for Crit Strike
      const isCrit = Math.random() < this.critChance;
      const finalDamage = isCrit ? this.damage * 2.0 : this.damage;
      const isFreeze = Math.random() < this.freezeChance;

      projectiles.push(new Projectile(
        this.x,
        this.y,
        angle,
        this.projectileSpeed,
        finalDamage,
        isCrit,
        isFreeze,
        this.attackRange
      ));
    }
  }

  takeDamage(amount, particles, floatingTexts) {
    this.health = Math.max(0, this.health - amount);
    this.hitFlashTimer = 0.15;
    soundEngine.playPlayerHurt();

    floatingTexts.push(new FloatingText(this.x, this.y - 25, `-${Math.round(amount)}`, '#ff0055', 18));

    // Damage sparks
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      particles.push(new Particle(
        this.x, this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        '#ff0055',
        3,
        0.3
      ));
    }
  }

  addXP(amount, floatingTexts) {
    this.xp += amount;
    soundEngine.playXP();
    if (this.xp >= this.xpToNextLevel) {
      return true; // Indicates level up event
    }
    return false;
  }

  draw(ctx) {
    ctx.save();

    // Hit Flash or Glow
    if (this.hitFlashTimer > 0) {
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 20;
    } else {
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 15;
    }

    // Outer Neon Ring
    ctx.strokeStyle = this.hitFlashTimer > 0 ? '#ff0055' : '#00f3ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Glowing Core
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : 'rgba(0, 243, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Directional Weapon Turret
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, -3, this.radius + 10, 6);

    ctx.restore();
  }
}

// Player Projectile
export class Projectile extends Entity {
  constructor(x, y, angle, speed, damage, isCrit, isFreeze, maxRange) {
    super(x, y, isCrit ? 6 : 4, isCrit ? '#ffe600' : '#00f3ff');
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.isCrit = isCrit;
    this.isFreeze = isFreeze;
    this.startX = x;
    this.startY = y;
    this.maxRange = maxRange;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const traveled = Math.hypot(this.x - this.startX, this.y - this.startY);
    if (traveled >= this.maxRange) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Enemy Entity supporting 5 Enemy Types
export class Enemy extends Entity {
  constructor(x, y, configKey) {
    const config = CONFIG.ENEMIES[configKey];
    super(x, y, config.RADIUS, config.COLOR);
    this.configKey = configKey;
    this.name = config.NAME;
    this.type = config.TYPE;
    this.maxHp = config.HP;
    this.hp = config.HP;
    this.speed = config.SPEED;
    this.damage = config.DAMAGE;
    this.scoreValue = config.SCORE;
    this.xpValue = config.XP;
    this.shape = config.SHAPE;

    // Shooter & Boss specifics
    this.fireTimer = 0;
    this.slowTimer = 0;
    this.originalSpeed = config.SPEED;
    this.bossPhase = 1;
    this.bossTimer = 0;
    this.hitFlashTimer = 0;
  }

  update(dt, player, enemyProjectiles, enemiesToSpawn) {
    if (!this.active) return;

    // Handle freeze/slow effect
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      this.speed = this.originalSpeed * 0.5;
    } else {
      this.speed = this.originalSpeed;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.hypot(dx, dy);
    const angleToPlayer = Math.atan2(dy, dx);

    // Type-based AI Movement & Attack Behaviors
    if (this.type === 'chaser' || this.type === 'runner' || this.type === 'tank') {
      // Direct pursuit
      if (distToPlayer > 0) {
        this.x += (dx / distToPlayer) * this.speed * dt;
        this.y += (dy / distToPlayer) * this.speed * dt;
      }
    } else if (this.type === 'shooter') {
      // Maintain preferred distance (~260px)
      const preferred = CONFIG.ENEMIES.SHOOTER.PREFERRED_DIST;
      if (distToPlayer < preferred - 30) {
        // Move away
        this.x -= (dx / distToPlayer) * this.speed * dt;
        this.y -= (dy / distToPlayer) * this.speed * dt;
      } else if (distToPlayer > preferred + 30) {
        // Move closer
        this.x += (dx / distToPlayer) * this.speed * dt;
        this.y += (dy / distToPlayer) * this.speed * dt;
      }

      // Fire projectile periodically
      this.fireTimer += dt;
      if (this.fireTimer >= 1 / CONFIG.ENEMIES.SHOOTER.FIRE_RATE) {
        this.fireTimer = 0;
        enemyProjectiles.push(new EnemyProjectile(
          this.x,
          this.y,
          angleToPlayer,
          CONFIG.ENEMIES.SHOOTER.PROJECTILE_SPEED,
          CONFIG.ENEMIES.SHOOTER.PROJECTILE_DAMAGE,
          '#00ff88'
        ));
      }
    } else if (this.type === 'boss') {
      // Boss AI with multi-attack patterns
      this.bossTimer += dt;

      // Phase 1: Heavy pursuit
      if (distToPlayer > 0) {
        this.x += (dx / distToPlayer) * this.speed * dt;
        this.y += (dy / distToPlayer) * this.speed * dt;
      }

      // Ring projectile attack every 3.5 seconds
      this.fireTimer += dt;
      if (this.fireTimer >= 3.5) {
        this.fireTimer = 0;
        soundEngine.playBossAlarm();

        // Fire 8-directional projectile ring
        const count = 8;
        for (let i = 0; i < count; i++) {
          const pAngle = angleToPlayer + (i * Math.PI * 2 / count);
          enemyProjectiles.push(new EnemyProjectile(
            this.x,
            this.y,
            pAngle,
            240,
            15,
            '#ff0055',
            8
          ));
        }

        // Periodically summon 2 support Chasers
        if (enemiesToSpawn && Math.random() < 0.5) {
          enemiesToSpawn.push(new Enemy(this.x + 40, this.y, 'CHASER'));
          enemiesToSpawn.push(new Enemy(this.x - 40, this.y, 'CHASER'));
        }
      }
    }
  }

  takeDamage(amount, isCrit, isFreeze, particles, floatingTexts) {
    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    if (isFreeze) {
      this.slowTimer = 2.0; // 2 seconds slow
      floatingTexts.push(new FloatingText(this.x, this.y - 15, 'SLOW!', '#00f3ff', 12));
    }

    if (isCrit) {
      soundEngine.playHit();
      floatingTexts.push(new FloatingText(this.x, this.y - 20, `CRIT! ${Math.round(amount)}`, '#ffe600', 18));
    } else {
      soundEngine.playHit();
      floatingTexts.push(new FloatingText(this.x, this.y - 15, `${Math.round(amount)}`, '#ffffff', 14));
    }

    // Spark particles
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      particles.push(new Particle(
        this.x, this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.color,
        2.5,
        0.25
      ));
    }

    if (this.hp <= 0) {
      this.active = false;
      soundEngine.playExplosion();

      // Death explosion burst
      const pCount = this.type === 'boss' ? 35 : 12;
      for (let i = 0; i < pCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 120;
        particles.push(new Particle(
          this.x, this.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          this.color,
          this.type === 'boss' ? 5 : 3.5,
          0.5
        ));
      }
      return true; // Defeated
    }
    return false;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.shadowColor = this.slowTimer > 0 ? '#00f3ff' : this.color;
    ctx.shadowBlur = 12;

    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : (this.slowTimer > 0 ? '#00f3ff' : this.color);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.radius * 1.2);
      ctx.lineTo(this.x - this.radius, this.y + this.radius);
      ctx.lineTo(this.x + this.radius, this.y + this.radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.shape === 'square') {
      ctx.beginPath();
      ctx.rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.shape === 'hexagon') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const hx = this.x + this.radius * Math.cos(angle);
        const hy = this.y + this.radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.shape === 'boss_star') {
      // Final Boss visual: spiked neon core
      ctx.beginPath();
      const spikes = 8;
      const outerR = this.radius;
      const innerR = this.radius * 0.55;
      for (let i = 0; i < spikes * 2; i++) {
        const r = (i % 2 === 0) ? outerR : innerR;
        const angle = (i * Math.PI) / spikes;
        const bx = this.x + r * Math.cos(angle);
        const by = this.y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Enemy Projectile (Shooter & Boss projectiles)
export class EnemyProjectile extends Entity {
  constructor(x, y, angle, speed, damage, color = '#ff0055', radius = 5) {
    super(x, y, radius, color);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.startX = x;
    this.startY = y;
  }

  update(dt, worldWidth, worldHeight) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 0 || this.x > worldWidth || this.y < 0 || this.y > worldHeight) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// XP Gem Dropped by Enemies
export class XPGem extends Entity {
  constructor(x, y, value) {
    super(x, y, 6, '#9d00ff');
    this.value = value;
    this.speed = 0;
  }

  update(dt, player) {
    if (!this.active) return;

    const dist = this.getDistanceTo(player);

    // Magnet acceleration towards player when inside magnet radius
    if (dist < player.magnetRadius) {
      this.speed = Math.min(600, this.speed + 1200 * dt);
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.x += Math.cos(angle) * this.speed * dt;
      this.y += Math.sin(angle) * this.speed * dt;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#9d00ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
