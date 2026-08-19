// Visual Particle System, Floating Text, and Screen Shake

export class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.active = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.95; // drag
    this.vy *= 0.95;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.5, this.size * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class FloatingText {
  constructor(x, y, text, color = '#ffffff', fontSize = 16, life = 0.8) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.maxLife = life;
    this.life = life;
    this.vy = -40; // float upwards
    this.active = true;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.font = `800 ${this.fontSize}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class ScreenShake {
  constructor() {
    this.intensity = 0;
    this.duration = 0;
    this.timer = 0;
    this.enabled = true;
  }

  setEnabled(val) {
    this.enabled = val;
  }

  addShake(intensity, duration = 0.2) {
    if (!this.enabled) return;
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = duration;
    this.timer = duration;
  }

  update(dt) {
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.intensity = 0;
      }
    }
  }

  getOffset() {
    if (this.timer <= 0 || !this.enabled) return { x: 0, y: 0 };
    const currentIntensity = this.intensity * (this.timer / this.duration);
    return {
      x: (Math.random() * 2 - 1) * currentIntensity,
      y: (Math.random() * 2 - 1) * currentIntensity
    };
  }
}
