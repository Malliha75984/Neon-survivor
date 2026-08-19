// Unified Touch Drag & Keyboard Input Controller

export class InputManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    
    // Joystick DOM elements
    this.joystickContainer = document.getElementById('joystick-container');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickStick = document.getElementById('joystick-stick');

    // Movement direction normalized vector (-1 to 1)
    this.moveVector = { x: 0, y: 0 };
    this.isDragging = false;
    this.activeTouchId = null;
    this.touchOrigin = { x: 0, y: 0 };
    this.touchCurrent = { x: 0, y: 0 };

    // Keyboard state
    this.keys = {
      w: false, a: false, s: false, d: false,
      ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
    };

    this.enabled = true;
    this.maxJoystickRadius = 50; // pixels

    this.bindEvents();
  }

  setEnabled(val) {
    this.enabled = val;
    if (!val) {
      this.resetInput();
    }
  }

  resetInput() {
    this.isDragging = false;
    this.activeTouchId = null;
    this.moveVector = { x: 0, y: 0 };
    this.hideJoystick();
    for (let key in this.keys) {
      this.keys[key] = false;
    }
  }

  bindEvents() {
    // Touch Events
    window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    window.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

    // Pointer / Mouse events as touch drag fallback on desktop if clicked on canvas
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());

    // Keyboard Events
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.key)) {
        this.keys[e.key] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.key)) {
        this.keys[e.key] = false;
      }
    });
  }

  // Check if touch target is a UI element
  isUIElement(target) {
    return target.closest('.screen-overlay:not(.hidden)') !== null ||
           target.closest('button') !== null ||
           target.closest('.btn-icon') !== null ||
           target.closest('.upgrade-card') !== null;
  }

  handleTouchStart(e) {
    if (!this.enabled) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (this.isUIElement(touch.target)) continue;

      if (!this.isDragging) {
        e.preventDefault();
        this.isDragging = true;
        this.activeTouchId = touch.identifier;
        this.touchOrigin = { x: touch.clientX, y: touch.clientY };
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
        this.showJoystick(touch.clientX, touch.clientY);
        this.updateMoveVector();
        break;
      }
    }
  }

  handleTouchMove(e) {
    if (!this.enabled || !this.isDragging) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.activeTouchId) {
        e.preventDefault();
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
        this.updateMoveVector();
        break;
      }
    }
  }

  handleTouchEnd(e) {
    if (!this.isDragging) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.activeTouchId) {
        this.isDragging = false;
        this.activeTouchId = null;
        this.moveVector = { x: 0, y: 0 };
        this.hideJoystick();
        break;
      }
    }
  }

  handleMouseDown(e) {
    if (!this.enabled) return;
    if (this.isUIElement(e.target)) return;

    this.isDragging = true;
    this.touchOrigin = { x: e.clientX, y: e.clientY };
    this.touchCurrent = { x: e.clientX, y: e.clientY };
    this.showJoystick(e.clientX, e.clientY);
    this.updateMoveVector();
  }

  handleMouseMove(e) {
    if (!this.enabled || !this.isDragging) return;
    this.touchCurrent = { x: e.clientX, y: e.clientY };
    this.updateMoveVector();
  }

  handleMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.moveVector = { x: 0, y: 0 };
    this.hideJoystick();
  }

  updateMoveVector() {
    const dx = this.touchCurrent.x - this.touchOrigin.x;
    const dy = this.touchCurrent.y - this.touchOrigin.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) {
      this.moveVector = { x: 0, y: 0 };
      if (this.joystickStick) {
        this.joystickStick.style.transform = `translate(0px, 0px)`;
      }
      return;
    }

    const clampedDist = Math.min(dist, this.maxJoystickRadius);
    const normX = dx / dist;
    const normY = dy / dist;

    // Magnitude scaling (0 to 1)
    const mag = clampedDist / this.maxJoystickRadius;
    this.moveVector = { x: normX * mag, y: normY * mag };

    // Update Joystick Stick Visual Position
    if (this.joystickStick) {
      const stickX = normX * clampedDist;
      const stickY = normY * clampedDist;
      this.joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;
    }
  }

  showJoystick(x, y) {
    if (this.joystickContainer) {
      this.joystickContainer.style.left = `${x}px`;
      this.joystickContainer.style.top = `${y}px`;
      this.joystickContainer.classList.remove('hidden');
    }
  }

  hideJoystick() {
    if (this.joystickContainer) {
      this.joystickContainer.classList.add('hidden');
    }
  }

  // Get final combined movement vector (Touch + Keyboard)
  getVector() {
    if (!this.enabled) return { x: 0, y: 0 };

    let kx = 0;
    let ky = 0;

    if (this.keys.w || this.keys.ArrowUp) ky -= 1;
    if (this.keys.s || this.keys.ArrowDown) ky += 1;
    if (this.keys.a || this.keys.ArrowLeft) kx -= 1;
    if (this.keys.d || this.keys.ArrowRight) kx += 1;

    if (kx !== 0 || ky !== 0) {
      const len = Math.hypot(kx, ky);
      return { x: kx / len, y: ky / len };
    }

    return this.moveVector;
  }
}
