/**
 * FATAL STRIKE - 2D ARCADE FIGHTING GAME
 * Vanilla JavaScript Engine (HTML5 Canvas + Web Audio API)
 */

// ============================================================================
// 1. CONSTANTES GLOBALES Y CONFIGURACIÓN
// ============================================================================
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const GROUND_Y = 490;
const GRAVITY = 0.72;
const ROUND_TIME = 99;
const MAX_ROUNDS_TO_WIN = 2; // Mejor de 3

// Definición de arquetipos de luchadores
const CHARACTER_DATA = {
  ninja: {
    id: 'ninja',
    name: 'Shadow Ninja',
    title: 'EL ASESINO DE LAS SOMBRAS',
    desc: 'Extremadamente ágil y letal. Lanza estrellas oscuras y rápidos tajos.',
    colorPrimary: '#8b5cf6',
    colorSecondary: '#4c1d95',
    colorAccent: '#c084fc',
    skinColor: '#e0c7a8',
    stats: { speed: 90, power: 65, defense: 60, health: 950 },
    speed: 7.2,
    jumpPower: -16.5,
    attackPowerMult: 0.95,
    projectileType: 'shuriken',
    specialName: 'VOID SHURIKEN'
  },
  brawler: {
    id: 'brawler',
    name: 'Cyber Brawler',
    title: 'GUERRERO CIBERNÉTICO',
    desc: 'Equilibrio perfecto de fuerza, agilidad y cañones de energía iónica.',
    colorPrimary: '#06b6d4',
    colorSecondary: '#0e7490',
    colorAccent: '#67e8f9',
    skinColor: '#f1d6b8',
    stats: { speed: 75, power: 75, defense: 75, health: 1000 },
    speed: 6.0,
    jumpPower: -15.5,
    attackPowerMult: 1.0,
    projectileType: 'plasma',
    specialName: 'ION CANNON'
  },
  titan: {
    id: 'titan',
    name: 'Heavy Titan',
    title: 'COLOSO DE ACERO',
    desc: 'Lento pero demoledor. Golpes masivos y ondas de choque sísmicas.',
    colorPrimary: '#ea580c',
    colorSecondary: '#7c2d12',
    colorAccent: '#fb923c',
    skinColor: '#c8a27a',
    stats: { speed: 50, power: 95, defense: 90, health: 1200 },
    speed: 4.8,
    jumpPower: -14.2,
    attackPowerMult: 1.35,
    projectileType: 'seismic',
    specialName: 'GROUND TREMOR'
  }
};

// ============================================================================
// 2. SISTEMA DE AUDIO SINTETIZADO (Web Audio API - Sin archivos externos)
// ============================================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPunch() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playKick() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playHit(isHeavy = false) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Ruido blanco con caída rápida
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isHeavy ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(isHeavy ? 600 : 1200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isHeavy ? 0.7 : 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playBlock() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playSpecial() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.45);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  playKO() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  playBell() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 880, 1320].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.3 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  }
}

const sounds = new SoundEngine();

// ============================================================================
// 3. SISTEMA DE PARTÍCULAS Y TEXTOS FLOTANTES
// ============================================================================
class Particle {
  constructor(x, y, vx, vy, color, size, life, gravity = 0.2) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.gravity = gravity;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life--;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(1, this.size * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class FloatingText {
  constructor(x, y, text, color, size = 20) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = 45;
    this.maxLife = 45;
    this.vy = -1.8;
  }

  update() {
    this.y += this.vy;
    this.vy *= 0.95;
    this.life--;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${this.size}px 'Black Ops One', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(this.text, this.x + 2, this.y + 2);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// ============================================================================
// 4. PROYECTILES Y HABILIDADES ESPECIALES
// ============================================================================
class Projectile {
  constructor(owner, type, x, y, direction) {
    this.owner = owner;
    this.type = type;
    this.x = x;
    this.y = y;
    this.direction = direction; // 1 = der, -1 = izq
    this.active = true;
    this.radius = 24;

    if (type === 'shuriken') {
      this.speed = 13 * direction;
      this.damage = 110;
      this.color = '#c084fc';
      this.rotation = 0;
    } else if (type === 'plasma') {
      this.speed = 11 * direction;
      this.damage = 125;
      this.color = '#22d3ee';
      this.radius = 28;
    } else {
      // titan seismic wave
      this.speed = 8.5 * direction;
      this.damage = 145;
      this.color = '#fb923c';
      this.y = GROUND_Y - 25;
      this.radius = 32;
    }
  }

  update(particles) {
    this.x += this.speed;
    if (this.type === 'shuriken') {
      this.rotation += 0.35 * this.direction;
    }

    // Efecto de rastro de partículas
    if (Math.random() < 0.6) {
      particles.push(new Particle(
        this.x + (Math.random() * 10 - 5),
        this.y + (Math.random() * 10 - 5),
        -this.direction * Math.random() * 2,
        (Math.random() - 0.5) * 2,
        this.color,
        Math.random() * 5 + 3,
        20,
        0
      ));
    }

    // Comprobación de límites de pantalla
    if (this.x < -100 || this.x > CANVAS_WIDTH + 100) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'shuriken') {
      ctx.rotate(this.rotation);
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(Math.cos(i * Math.PI / 2) * 26, Math.sin(i * Math.PI / 2) * 26);
        ctx.lineTo(Math.cos(i * Math.PI / 2 + Math.PI / 4) * 8, Math.sin(i * Math.PI / 2 + Math.PI / 4) * 8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'plasma') {
      // Esfera de energía plasma pulsante
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = grad;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Anillo orbital
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius + 6, (this.radius + 6) / 3, Math.sin(Date.now() * 0.01), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Onda sísmica de roca/fuego (Titan)
      ctx.fillStyle = '#ea580c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.moveTo(-15 * this.direction, 25);
      ctx.lineTo(0, -25);
      ctx.lineTo(20 * this.direction, 25);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-5 * this.direction, 25);
      ctx.lineTo(0, -10);
      ctx.lineTo(8 * this.direction, 25);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================================================
// 5. CLASE PRINCIPAL: FIGHTER (Luchadores y Renderizado Canvas)
// ============================================================================
class Fighter {
  constructor({ id, playerId, characterKey, x, facing = 1 }) {
    this.id = id;
    this.playerId = playerId; // 1 o 2
    this.characterKey = characterKey;
    this.data = CHARACTER_DATA[characterKey];

    // Dimensiones y físicas
    this.width = 72;
    this.height = 140;
    this.x = x;
    this.y = GROUND_Y - this.height;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing; // 1 = Mira a la derecha, -1 = Mira a la izquierda
    this.isGrounded = true;

    // Estado del combate
    this.maxHealth = this.data.stats.health;
    this.health = this.maxHealth;
    this.energy = 0; // 0 a 100
    this.maxEnergy = 100;
    this.roundsWon = 0;

    // Máquina de estados: 'idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'special', 'hurt', 'ko', 'win'
    this.state = 'idle';
    this.stateTimer = 0;
    this.isCrouching = false;
    this.isBlocking = false;
    this.hitStun = 0;

    // Hitboxes (Ataque y Cuerpo)
    this.hurtBox = { x: 0, y: 0, width: this.width, height: this.height };
    this.attackBox = { x: 0, y: 0, width: 0, height: 0, active: false, damage: 0, knockback: 0 };
    this.hasHitCurrentAttack = false;

    // Animación procedural
    this.animTime = 0;
    this.comboCount = 0;
    this.comboResetTimer = 0;
  }

  resetForNewRound(spawnX, facing) {
    this.health = this.maxHealth;
    this.x = spawnX;
    this.y = GROUND_Y - this.height;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.isGrounded = true;
    this.state = 'idle';
    this.stateTimer = 0;
    this.isCrouching = false;
    this.isBlocking = false;
    this.hitStun = 0;
    this.attackBox.active = false;
    this.hasHitCurrentAttack = false;
    this.comboCount = 0;
  }

  // Manejo de entradas (inputs) de controles
  handleInput(input, opponent) {
    if (this.state === 'ko' || this.state === 'win') return;

    // Si está en hit stun, no puede actuar
    if (this.hitStun > 0) return;

    // Si está en medio de un ataque (animación de puño, patada, especial), esperar a que termine
    const isAttacking = ['punch', 'kick', 'special'].includes(this.state);
    if (isAttacking) return;

    // Agacharse / Bloquear
    if (input.down && this.isGrounded) {
      this.isCrouching = true;
      this.isBlocking = true;
      this.state = 'crouch';
      this.vx = 0;
    } else {
      this.isCrouching = false;
      this.isBlocking = false;
      if (this.state === 'crouch') this.state = 'idle';
    }

    // Salto
    if (input.up && this.isGrounded && !this.isCrouching) {
      this.vy = this.data.jumpPower;
      this.isGrounded = false;
      this.state = 'jump';
      sounds.playKick();
    }

    // Movimiento horizontal (sólo si no está agachado)
    if (!this.isCrouching) {
      const moveSpeed = this.isGrounded ? this.data.speed : this.data.speed * 0.85;

      if (input.left && !input.right) {
        this.vx = -moveSpeed;
        if (this.isGrounded) this.state = 'walk';
        // Si retrocede respecto al oponente, activa bloqueo activo
        if (this.facing === 1) this.isBlocking = true;
      } else if (input.right && !input.left) {
        this.vx = moveSpeed;
        if (this.isGrounded) this.state = 'walk';
        // Si retrocede respecto al oponente, activa bloqueo activo
        if (this.facing === -1) this.isBlocking = true;
      } else {
        this.vx *= 0.65;
        if (this.isGrounded && Math.abs(this.vx) < 0.2) {
          this.vx = 0;
          if (this.state !== 'crouch') this.state = 'idle';
        }
      }
    }

    // Ataque Puño (Light)
    if (input.punch) {
      this.startPunch();
      return;
    }

    // Ataque Patada (Heavy)
    if (input.kick) {
      this.startKick();
      return;
    }

    // Ataque Especial
    if (input.special && this.energy >= this.maxEnergy) {
      this.startSpecial();
      return;
    }
  }

  startPunch() {
    this.state = 'punch';
    this.stateTimer = 18;
    this.hasHitCurrentAttack = false;
    this.vx *= 0.25;
    sounds.playPunch();

    // Hitbox frontal
    this.attackBox = {
      x: this.facing === 1 ? this.x + this.width * 0.5 : this.x - 45,
      y: this.y + (this.isCrouching ? 60 : 35),
      width: 55,
      height: 35,
      active: true,
      damage: Math.round(55 * this.data.attackPowerMult),
      knockback: 6 * this.facing,
      type: 'punch'
    };
  }

  startKick() {
    this.state = 'kick';
    this.stateTimer = 24;
    this.hasHitCurrentAttack = false;
    this.vx *= 0.2;
    sounds.playKick();

    // Hitbox de patada más amplia y de mayor alcance
    this.attackBox = {
      x: this.facing === 1 ? this.x + this.width * 0.4 : this.x - 65,
      y: this.y + (this.isCrouching ? 75 : 50),
      width: 75,
      height: 40,
      active: true,
      damage: Math.round(90 * this.data.attackPowerMult),
      knockback: 11 * this.facing,
      type: 'kick'
    };
  }

  startSpecial() {
    this.state = 'special';
    this.stateTimer = 32;
    this.energy = 0; // Consume barra especial
    this.hasHitCurrentAttack = true; // El daño lo hará el proyectil
    this.vx = 0;
    sounds.playSpecial();

    if (window.game) {
      window.game.spawnProjectile(this);
    }
  }

  takeDamage(amount, knockback, isBlockable = true, particles = null, floatingTexts = null) {
    if (this.state === 'ko') return;

    let finalDamage = amount;
    let blocked = false;

    // Si está bloqueando
    if (this.isBlocking && isBlockable) {
      finalDamage = Math.round(amount * 0.2); // 80% de reducción de daño
      knockback *= 0.35;
      blocked = true;
      sounds.playBlock();

      if (floatingTexts) {
        floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y + 10, '¡BLOQUEO!', '#38bdf8', 18));
      }
      if (particles) {
        for (let i = 0; i < 8; i++) {
          particles.push(new Particle(
            this.x + (this.facing === 1 ? 10 : this.width - 10),
            this.y + 50 + (Math.random() * 40),
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            '#38bdf8',
            4,
            18,
            0.1
          ));
        }
      }
    } else {
      // Golpe directo
      sounds.playHit(amount > 70);
      this.hitStun = 16;
      this.state = 'hurt';
      this.stateTimer = 16;

      if (floatingTexts) {
        floatingTexts.push(new FloatingText(
          this.x + this.width / 2,
          this.y + 20,
          `-${finalDamage}`,
          amount > 70 ? '#ff2222' : '#ffea00',
          amount > 70 ? 24 : 19
        ));
      }

      if (particles) {
        const sparkColor = amount > 70 ? '#ff4444' : '#ffcc00';
        for (let i = 0; i < 14; i++) {
          particles.push(new Particle(
            this.x + this.width / 2,
            this.y + 40 + (Math.random() * 50),
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.7) * 8,
            sparkColor,
            Math.random() * 5 + 2,
            24,
            0.3
          ));
        }
      }
    }

    // Aplicar daño
    this.health = Math.max(0, this.health - finalDamage);

    // Empuje de knockback físico
    this.vx += knockback;
    if (amount > 80 && !blocked) {
      this.vy = -4.5;
      this.isGrounded = false;
    }

    // Ganancia de energía por recibir daño
    this.addEnergy(8);

    // Comprobación de KO
    if (this.health <= 0) {
      this.state = 'ko';
      this.stateTimer = 120;
      this.vx = -this.facing * 8;
      this.vy = -7;
      this.isGrounded = false;
      sounds.playKO();
    }
  }

  addEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  // Actualización por cuadro (60 FPS)
  update(opponent, particles, floatingTexts) {
    this.animTime += 0.08;

    // Reducir temporizador de hit-stun
    if (this.hitStun > 0) {
      this.hitStun--;
      if (this.hitStun <= 0 && this.state === 'hurt') {
        this.state = 'idle';
      }
    }

    // Reducir temporizadores de estados de ataque
    if (this.stateTimer > 0) {
      this.stateTimer--;
      // Desactivar hitbox cuando pasa el punto álgido del ataque
      if (['punch', 'kick'].includes(this.state) && this.stateTimer < 6) {
        this.attackBox.active = false;
      }
      if (this.stateTimer <= 0) {
        if (['punch', 'kick', 'special', 'hurt'].includes(this.state)) {
          this.state = 'idle';
          this.attackBox.active = false;
        }
      }
    }

    // Actualizar orientación dinámica (los rivales siempre se miran de frente)
    if (!['punch', 'kick', 'special', 'ko', 'win'].includes(this.state)) {
      if (opponent) {
        this.facing = this.x < opponent.x ? 1 : -1;
      }
    }

    // Físicas y Gravedad
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    // Fricción horizontal
    this.vx *= this.isGrounded ? 0.78 : 0.95;

    // Colisión con el piso
    const currentHeight = this.isCrouching ? this.height * 0.7 : this.height;
    if (this.y + currentHeight >= GROUND_Y) {
      this.y = GROUND_Y - currentHeight;
      this.vy = 0;
      this.isGrounded = true;
      if (this.state === 'jump') {
        this.state = 'idle';
      }
    } else {
      this.isGrounded = false;
    }

    // Límites de pantalla de la arena
    if (this.x < 20) {
      this.x = 20;
      this.vx = 0;
    } else if (this.x + this.width > CANVAS_WIDTH - 20) {
      this.x = CANVAS_WIDTH - 20 - this.width;
      this.vx = 0;
    }

    // Actualizar hurtBox
    this.hurtBox = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: currentHeight
    };

    // Actualizar posición de la attackBox sincronizada con el personaje
    if (this.attackBox.active) {
      if (this.attackBox.type === 'punch') {
        this.attackBox.x = this.facing === 1 ? this.x + this.width * 0.5 : this.x - 45;
        this.attackBox.y = this.y + (this.isCrouching ? 55 : 35);
      } else if (this.attackBox.type === 'kick') {
        this.attackBox.x = this.facing === 1 ? this.x + this.width * 0.4 : this.x - 65;
        this.attackBox.y = this.y + (this.isCrouching ? 70 : 50);
      }
    }

    // Temporizador de combo reset
    if (this.comboResetTimer > 0) {
      this.comboResetTimer--;
      if (this.comboResetTimer <= 0) {
        this.comboCount = 0;
      }
    }
  }

  // ==========================================================================
  // RENDERIZADO DETALLADO PROCEDURAL EN CANVAS
  // ==========================================================================
  draw(ctx) {
    ctx.save();

    // Sombra proyectada en el suelo
    const groundLevel = this.id === 'preview' ? (this.y + this.height + 2) : (GROUND_Y - 2);
    const shadowScale = Math.max(0.3, 1 - (groundLevel - (this.y + this.height)) / 300);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, groundLevel, (this.width / 1.6) * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trasladar al origen del personaje con orientación
    ctx.translate(this.x + this.width / 2, this.y);
    ctx.scale(this.facing, 1);

    const time = this.animTime;
    const isCrouch = this.isCrouching;
    const char = this.data;

    // Animación de respiración / pose
    let breatheOffset = (this.state === 'idle') ? Math.sin(time * 3) * 2 : 0;
    let bodyY = isCrouch ? 30 : 0 + breatheOffset;

    // Dibujar personaje según su arquetipo
    if (char.id === 'ninja') {
      this.drawShadowNinja(ctx, bodyY);
    } else if (char.id === 'brawler') {
      this.drawCyberBrawler(ctx, bodyY);
    } else {
      this.drawHeavyTitan(ctx, bodyY);
    }

    // Efecto de aura brillante si la barra especial está al 100%
    if (this.energy >= this.maxEnergy) {
      ctx.save();
      ctx.strokeStyle = char.colorAccent;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = char.colorPrimary;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(0, bodyY + 70, this.width / 1.5, 65, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Depuración visual opcional de cajas (Hitboxes / Hurtboxes)
    if (window.game && window.game.debugHitboxes) {
      ctx.save();
      // Hurtbox (Verde)
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.hurtBox.x, this.hurtBox.y, this.hurtBox.width, this.hurtBox.height);

      // Attackbox (Roja)
      if (this.attackBox.active) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.fillRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
        ctx.strokeRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
      }
      ctx.restore();
    }
  }

  // Dibujo detallado de Shadow Ninja
  drawShadowNinja(ctx, bodyY) {
    const isAttacking = this.state === 'punch' || this.state === 'kick';
    const isPunch = this.state === 'punch';
    const isKick = this.state === 'kick';
    const isHurt = this.state === 'hurt';
    const isKO = this.state === 'ko';

    // Bufanda oscura ondeando al viento
    ctx.save();
    ctx.strokeStyle = '#a855f7';
    ctx.fillStyle = '#6b21a8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, bodyY + 36);
    const scarfWave = Math.sin(this.animTime * 6) * 12;
    ctx.quadraticCurveTo(-35, bodyY + 40 + scarfWave, -60, bodyY + 45 + scarfWave * 1.5);
    ctx.stroke();
    ctx.restore();

    // Piernas
    ctx.fillStyle = '#1e1b4b';
    if (isKick) {
      // Patada alta en extensión
      ctx.fillRect(-15, bodyY + 70, 18, 50); // Pierna base
      ctx.save();
      ctx.translate(10, bodyY + 70);
      ctx.rotate(-Math.PI / 3);
      ctx.fillRect(0, 0, 20, 65);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(15, 50, 12, 18); // Bota
      ctx.restore();
    } else {
      // Piernas normales o agachadas
      const legHeight = this.isCrouching ? 40 : 65;
      ctx.fillRect(-22, bodyY + 75, 18, legHeight);
      ctx.fillRect(4, bodyY + 75, 18, legHeight);

      // Protectores de piernas violeta
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(-22, bodyY + 95, 18, 14);
      ctx.fillRect(4, bodyY + 95, 18, 14);
    }

    // Torso / Armadura ninja
    ctx.fillStyle = isHurt ? '#ef4444' : '#18181b';
    ctx.fillRect(-24, bodyY + 34, 48, 48);

    // Cinturón y faja ninja
    ctx.fillStyle = '#9333ea';
    ctx.fillRect(-25, bodyY + 68, 50, 8);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(-5, bodyY + 66, 10, 12);

    // Cabeza y Máscara Shinobi
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(0, bodyY + 18, 20, 0, Math.PI * 2);
    ctx.fill();

    // Cinta ninja en la frente
    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(-18, bodyY + 8, 36, 7);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-6, bodyY + 7, 12, 8); // Placa metálica

    // Ojos brillantes (visera / mirada violeta)
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 8;
    ctx.fillRect(4, bodyY + 14, 10, 4);
    ctx.shadowBlur = 0;

    // Brazos y Puños
    ctx.fillStyle = '#312e81';
    if (isPunch) {
      // Puño en extensión hacia adelante
      ctx.fillRect(-12, bodyY + 40, 14, 25);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(10, bodyY + 36, 52, 16); // Brazo atacante
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(56, bodyY + 33, 14, 22); // Guantelete
    } else {
      // Brazos en guardia
      ctx.fillRect(-28, bodyY + 38, 14, 38);
      ctx.fillRect(14, bodyY + 38, 14, 38);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-28, bodyY + 54, 14, 18);
      ctx.fillRect(14, bodyY + 54, 14, 18);
    }
  }

  // Dibujo detallado de Cyber Brawler
  drawCyberBrawler(ctx, bodyY) {
    const isPunch = this.state === 'punch';
    const isKick = this.state === 'kick';
    const isHurt = this.state === 'hurt';

    // Piernas cibernéticas con pistones
    const legHeight = this.isCrouching ? 42 : 66;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-24, bodyY + 74, 20, legHeight);
    ctx.fillRect(6, bodyY + 74, 20, legHeight);

    // Luces neón en las piernas
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 6;
    ctx.fillRect(-20, bodyY + 86, 6, legHeight - 20);
    ctx.fillRect(10, bodyY + 86, 6, legHeight - 20);
    ctx.shadowBlur = 0;

    // Torso acorazado con reactor central
    ctx.fillStyle = isHurt ? '#ef4444' : '#0f172a';
    ctx.fillRect(-26, bodyY + 32, 52, 50);

    // Placas de armadura cibernética
    ctx.fillStyle = '#334155';
    ctx.fillRect(-22, bodyY + 36, 44, 24);

    // Núcleo / Reactor en el pecho (Pulsante)
    const reactorGlow = Math.abs(Math.sin(this.animTime * 4)) * 8 + 4;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = reactorGlow;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, bodyY + 48, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cabeza con Visor Cibernético
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, bodyY + 16, 21, 0, Math.PI * 2);
    ctx.fill();

    // Visor Neón Cyan
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.fillRect(0, bodyY + 12, 18, 7);
    ctx.shadowBlur = 0;

    // Brazos mecánicos / Puño Pistón
    if (isPunch) {
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(-14, bodyY + 38, 16, 26);
      // Cañón de brazo extendido
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(8, bodyY + 34, 56, 20);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(58, bodyY + 31, 16, 26);
      // Chispas de energía en el puño
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(72, bodyY + 39, 6, 10);
    } else if (isKick) {
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(-26, bodyY + 38, 16, 40);
      ctx.save();
      ctx.translate(12, bodyY + 70);
      ctx.rotate(-Math.PI / 3);
      ctx.fillRect(0, 0, 24, 70);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(16, 50, 14, 22);
      ctx.restore();
    } else {
      // Brazos en guardia cibernética
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(-30, bodyY + 36, 16, 42);
      ctx.fillRect(14, bodyY + 36, 16, 42);
      // Guanteletes de poder
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-32, bodyY + 56, 18, 22);
      ctx.fillRect(14, bodyY + 56, 18, 22);
    }
  }

  // Dibujo detallado de Heavy Titan
  drawHeavyTitan(ctx, bodyY) {
    const isPunch = this.state === 'punch';
    const isKick = this.state === 'kick';
    const isHurt = this.state === 'hurt';

    // Piernas gigantes y acorazadas
    const legHeight = this.isCrouching ? 44 : 68;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-28, bodyY + 72, 24, legHeight);
    ctx.fillRect(8, bodyY + 72, 24, legHeight);

    // Botas de acero pesadas
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(-32, bodyY + legHeight + 52, 30, 20);
    ctx.fillRect(6, bodyY + legHeight + 52, 30, 20);

    // Torso masivo y hombreras gigantes
    ctx.fillStyle = isHurt ? '#ef4444' : '#292524';
    ctx.fillRect(-32, bodyY + 28, 64, 54);

    // Armadura de placas de bronce y magma
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(-28, bodyY + 32, 56, 28);

    // Hombreras con pinchos
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-36, bodyY + 25);
    ctx.lineTo(-24, bodyY + 12);
    ctx.lineTo(-12, bodyY + 28);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, bodyY + 28);
    ctx.lineTo(24, bodyY + 12);
    ctx.lineTo(36, bodyY + 25);
    ctx.closePath();
    ctx.fill();

    // Cabeza y Casco Gladiador
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(0, bodyY + 14, 22, 0, Math.PI * 2);
    ctx.fill();

    // Cresta del casco
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-4, bodyY - 10, 8, 22);

    // Ojos incandescentes de lava
    ctx.fillStyle = '#fdba74';
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 10;
    ctx.fillRect(2, bodyY + 10, 12, 6);
    ctx.shadowBlur = 0;

    // Brazos demoledores
    if (isPunch) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-16, bodyY + 34, 18, 30);
      // Puñetazo demoledor
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(10, bodyY + 26, 62, 28);
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(66, bodyY + 22, 18, 36); // Puño gigante
    } else if (isKick) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-30, bodyY + 34, 20, 42);
      ctx.save();
      ctx.translate(14, bodyY + 68);
      ctx.rotate(-Math.PI / 3.4);
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(0, 0, 28, 75);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(18, 52, 18, 25);
      ctx.restore();
    } else {
      // Guardia imponente
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-36, bodyY + 34, 20, 44);
      ctx.fillRect(16, bodyY + 34, 20, 44);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-38, bodyY + 54, 22, 26);
      ctx.fillRect(16, bodyY + 54, 22, 26);
    }
  }
}

// ============================================================================
// 6. CONTROLADOR PRINCIPAL DEL JUEGO (FATAL STRIKE ENGINE)
// ============================================================================
class FatalStrikeGame {
  constructor() {
    window.game = this;
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Estado del ciclo de juego: 'MENU_SELECT', 'ROUND_INTRO', 'FIGHTING', 'ROUND_OVER', 'MATCH_OVER'
    this.gameState = 'MENU_SELECT';

    // Selección de luchadores
    this.p1Choice = 'ninja';
    this.p2Choice = 'brawler';
    this.p1Ready = false;
    this.p2Ready = false;

    // Luchadores
    this.p1 = null;
    this.p2 = null;

    // Temporizador de combate y rondas
    this.round = 1;
    this.timer = ROUND_TIME;
    this.timerInterval = null;
    this.introTimer = 0;
    this.hitStopFrames = 0; // Freeze frame para impacto visceral

    // Proyectiles y partículas
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];

    // Sistema de entrada (Teclado local 2 jugadores)
    this.keys = {};
    this.debugHitboxes = false;

    // Shake de pantalla
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;

    // Escenario de fondo
    this.stageTime = 0;

    // Inicializaciones
    this.initDOM();
    this.initKeyboard();
    this.initCharacterSelect();
    this.startRenderLoop();
  }

  // Enlazar elementos del DOM
  initDOM() {
    this.dom = {
      hudOverlay: document.getElementById('hud-overlay'),
      selectScreen: document.getElementById('select-screen'),
      matchOverScreen: document.getElementById('match-over-screen'),
      controlsModal: document.getElementById('controls-modal'),
      announcerOverlay: document.getElementById('announcer-overlay'),
      announcerTitle: document.getElementById('announcer-title'),
      announcerSubtitle: document.getElementById('announcer-subtitle'),

      // P1 HUD
      p1Name: document.getElementById('p1-name'),
      p1HealthFill: document.getElementById('p1-health-fill'),
      p1HealthGhost: document.getElementById('p1-health-ghost'),
      p1HealthText: document.getElementById('p1-health-text'),
      p1EnergyFill: document.getElementById('p1-energy-fill'),
      p1EnergyText: document.getElementById('p1-energy-text'),
      p1Rounds: document.getElementById('p1-rounds'),
      p1Combo: document.getElementById('p1-combo'),

      // P2 HUD
      p2Name: document.getElementById('p2-name'),
      p2HealthFill: document.getElementById('p2-health-fill'),
      p2HealthGhost: document.getElementById('p2-health-ghost'),
      p2HealthText: document.getElementById('p2-health-text'),
      p2EnergyFill: document.getElementById('p2-energy-fill'),
      p2EnergyText: document.getElementById('p2-energy-text'),
      p2Rounds: document.getElementById('p2-rounds'),
      p2Combo: document.getElementById('p2-combo'),

      // Centro
      roundTimer: document.getElementById('round-timer'),
      roundBadge: document.getElementById('round-badge'),

      // Botones
      btnFightStart: document.getElementById('btn-start-fight'),
      btnRematch: document.getElementById('btn-rematch'),
      btnChangeFighters: document.getElementById('btn-change-fighters'),
      btnToggleSound: document.getElementById('btn-toggle-sound'),
      btnToggleControls: document.getElementById('btn-toggle-controls'),
      btnCloseControls: document.getElementById('btn-close-controls')
    };

    // Eventos UI
    this.dom.btnFightStart.addEventListener('click', () => {
      sounds.init();
      this.startMatch();
    });

    this.dom.btnRematch.addEventListener('click', () => {
      sounds.init();
      this.startMatch();
    });

    this.dom.btnChangeFighters.addEventListener('click', () => {
      sounds.init();
      this.openCharacterSelect();
    });

    this.dom.btnToggleSound.addEventListener('click', () => {
      sounds.init();
      sounds.enabled = !sounds.enabled;
      this.dom.btnToggleSound.textContent = sounds.enabled ? '🔊 SONIDO' : '🔇 MUDO';
    });

    this.dom.btnToggleControls.addEventListener('click', () => {
      this.dom.controlsModal.classList.toggle('hidden');
    });

    this.dom.btnCloseControls.addEventListener('click', () => {
      this.dom.controlsModal.classList.add('hidden');
    });
  }

  // Manejo de eventos del teclado (P1 y P2)
  initKeyboard() {
    // Desbloquear audio en el primer clic de la página
    document.addEventListener('click', () => sounds.init(), { once: true });

    window.addEventListener('keydown', (e) => {
      sounds.init(); // Activa audio en primera interacción

      // Tecla F2 para alternar cajas de colisión (Hitboxes de depuración)
      if (e.code === 'F2') {
        this.debugHitboxes = !this.debugHitboxes;
        e.preventDefault();
        return;
      }

      this.keys[e.code] = true;
      this.keys[e.key] = true;

      // Navegación de selección de personajes por teclado
      if (this.gameState === 'MENU_SELECT') {
        const charKeys = Object.keys(CHARACTER_DATA);

        // P1 Ciclar con A y D
        if (e.code === 'KeyA' && !this.p1Ready) {
          const idx = (charKeys.indexOf(this.p1Choice) - 1 + charKeys.length) % charKeys.length;
          this.p1Choice = charKeys[idx];
          sounds.playPunch();
          this.updateCharSelectUI();
        } else if (e.code === 'KeyD' && !this.p1Ready) {
          const idx = (charKeys.indexOf(this.p1Choice) + 1) % charKeys.length;
          this.p1Choice = charKeys[idx];
          sounds.playPunch();
          this.updateCharSelectUI();
        }

        // P2 Ciclar con Flechas Izq y Der
        if (e.code === 'ArrowLeft' && !this.p2Ready) {
          const idx = (charKeys.indexOf(this.p2Choice) - 1 + charKeys.length) % charKeys.length;
          this.p2Choice = charKeys[idx];
          sounds.playKick();
          this.updateCharSelectUI();
        } else if (e.code === 'ArrowRight' && !this.p2Ready) {
          const idx = (charKeys.indexOf(this.p2Choice) + 1) % charKeys.length;
          this.p2Choice = charKeys[idx];
          sounds.playKick();
          this.updateCharSelectUI();
        }

        // Confirmar Ready
        if (e.code === 'KeyF' || e.code === 'KeyG') {
          this.toggleP1Ready();
        }
        if (e.code === 'KeyK' || e.code === 'KeyL') {
          this.toggleP2Ready();
        }
        if (e.code === 'Enter') {
          if (!this.p1Ready) this.toggleP1Ready();
          if (!this.p2Ready) this.toggleP2Ready();
          if (this.p1Ready && this.p2Ready) {
            this.startMatch();
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.keys[e.key] = false;
    });
  }

  // Interfaz de Selección de Personajes
  initCharacterSelect() {
    const p1Container = document.getElementById('p1-char-buttons');
    const p2Container = document.getElementById('p2-char-buttons');
    const p1ReadyBtn = document.getElementById('p1-ready-btn');
    const p2ReadyBtn = document.getElementById('p2-ready-btn');

    p1Container.innerHTML = '';
    p2Container.innerHTML = '';

    Object.keys(CHARACTER_DATA).forEach((key) => {
      const char = CHARACTER_DATA[key];

      // Botón P1
      const btn1 = document.createElement('button');
      btn1.className = `char-select-btn ${key === this.p1Choice ? 'active' : ''}`;
      btn1.textContent = char.name;
      btn1.addEventListener('click', () => {
        sounds.init();
        sounds.playPunch();
        this.p1Choice = key;
        this.p1Ready = false;
        this.updateCharSelectUI();
      });
      p1Container.appendChild(btn1);

      // Botón P2
      const btn2 = document.createElement('button');
      btn2.className = `char-select-btn ${key === this.p2Choice ? 'active' : ''}`;
      btn2.textContent = char.name;
      btn2.addEventListener('click', () => {
        sounds.init();
        sounds.playKick();
        this.p2Choice = key;
        this.p2Ready = false;
        this.updateCharSelectUI();
      });
      p2Container.appendChild(btn2);
    });

    p1ReadyBtn.addEventListener('click', () => {
      sounds.init();
      this.toggleP1Ready();
    });

    p2ReadyBtn.addEventListener('click', () => {
      sounds.init();
      this.toggleP2Ready();
    });

    this.updateCharSelectUI();
  }

  toggleP1Ready() {
    this.p1Ready = !this.p1Ready;
    sounds.playHit(false);
    this.updateCharSelectUI();
  }

  toggleP2Ready() {
    this.p2Ready = !this.p2Ready;
    sounds.playHit(false);
    this.updateCharSelectUI();
  }

  updateCharSelectUI() {
    // Datos P1
    const p1Data = CHARACTER_DATA[this.p1Choice];
    document.getElementById('p1-selected-name').textContent = p1Data.name;
    document.getElementById('p1-selected-desc').textContent = p1Data.desc;
    document.getElementById('p1-stat-speed').style.width = `${p1Data.stats.speed}%`;
    document.getElementById('p1-stat-power').style.width = `${p1Data.stats.power}%`;
    document.getElementById('p1-stat-defense').style.width = `${p1Data.stats.defense}%`;

    // Datos P2
    const p2Data = CHARACTER_DATA[this.p2Choice];
    document.getElementById('p2-selected-name').textContent = p2Data.name;
    document.getElementById('p2-selected-desc').textContent = p2Data.desc;
    document.getElementById('p2-stat-speed').style.width = `${p2Data.stats.speed}%`;
    document.getElementById('p2-stat-power').style.width = `${p2Data.stats.power}%`;
    document.getElementById('p2-stat-defense').style.width = `${p2Data.stats.defense}%`;

    // Botones activos
    document.querySelectorAll('#p1-char-buttons .char-select-btn').forEach((btn, idx) => {
      const key = Object.keys(CHARACTER_DATA)[idx];
      btn.classList.toggle('active', key === this.p1Choice);
    });
    document.querySelectorAll('#p2-char-buttons .char-select-btn').forEach((btn, idx) => {
      const key = Object.keys(CHARACTER_DATA)[idx];
      btn.classList.toggle('active', key === this.p2Choice);
    });

    // Estado Ready
    const p1ReadyBtn = document.getElementById('p1-ready-btn');
    p1ReadyBtn.classList.toggle('ready-active', this.p1Ready);
    p1ReadyBtn.textContent = this.p1Ready ? '✓ JUGADOR 1 LISTO' : '¡LISTO P1! (F / ENTER)';

    const p2ReadyBtn = document.getElementById('p2-ready-btn');
    p2ReadyBtn.classList.toggle('ready-active', this.p2Ready);
    p2ReadyBtn.textContent = this.p2Ready ? '✓ JUGADOR 2 LISTO' : '¡LISTO P2! (K / ENTER)';

    // Botón A Pelear
    const bothReady = this.p1Ready && this.p2Ready;
    this.dom.btnFightStart.disabled = !bothReady;

    // Renderizar vistas previas estáticas animadas en los minicanvas
    this.drawPreview('p1-preview-canvas', this.p1Choice, 1);
    this.drawPreview('p2-preview-canvas', this.p2Choice, -1);
  }

  drawPreview(canvasId, charKey, facing) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tempFighter = new Fighter({
      id: 'preview',
      playerId: 1,
      characterKey: charKey,
      x: (canvas.width - 72) / 2,
      facing: facing
    });
    tempFighter.y = canvas.height - 150;
    tempFighter.draw(ctx);
  }

  openCharacterSelect() {
    this.gameState = 'MENU_SELECT';
    this.p1Ready = false;
    this.p2Ready = false;
    clearInterval(this.timerInterval);

    this.dom.hudOverlay.classList.add('hidden');
    this.dom.announcerOverlay.classList.add('hidden');
    this.dom.matchOverScreen.classList.add('hidden');
    this.dom.selectScreen.classList.remove('hidden');

    this.updateCharSelectUI();
  }

  // Iniciar una partida completa
  startMatch() {
    this.dom.selectScreen.classList.add('hidden');
    this.dom.matchOverScreen.classList.add('hidden');
    this.dom.hudOverlay.classList.remove('hidden');

    // Instanciar los luchadores
    this.p1 = new Fighter({
      id: 'p1',
      playerId: 1,
      characterKey: this.p1Choice,
      x: 180,
      facing: 1
    });

    this.p2 = new Fighter({
      id: 'p2',
      playerId: 2,
      characterKey: this.p2Choice,
      x: CANVAS_WIDTH - 250,
      facing: -1
    });

    this.round = 1;
    this.startRound();
  }

  startRound() {
    clearInterval(this.timerInterval);
    this.timer = ROUND_TIME;
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];

    // Resetear posiciones y vida
    this.p1.resetForNewRound(180, 1);
    this.p2.resetForNewRound(CANVAS_WIDTH - 250, -1);

    this.updateHUD();

    // Anuncio de Ronda
    this.gameState = 'ROUND_INTRO';
    const roundTitle = this.round <= 2 ? `ROUND ${this.round}` : 'FINAL ROUND';
    this.showAnnouncer(roundTitle, 'READY...', 1600, () => {
      sounds.playBell();
      this.showAnnouncer('¡FIGHT!', '', 900, () => {
        this.gameState = 'FIGHTING';
        this.startTimer();
      });
    });
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.gameState === 'FIGHTING') {
        this.timer--;
        this.dom.roundTimer.textContent = this.timer < 10 ? `0${this.timer}` : this.timer;
        this.dom.roundTimer.classList.toggle('urgent', this.timer <= 15);

        if (this.timer <= 0) {
          this.handleTimeOver();
        }
      }
    }, 1000);
  }

  handleTimeOver() {
    clearInterval(this.timerInterval);
    this.gameState = 'ROUND_OVER';

    let winner = null;
    if (this.p1.health > this.p2.health) {
      winner = this.p1;
    } else if (this.p2.health > this.p1.health) {
      winner = this.p2;
    }

    sounds.playKO();
    this.showAnnouncer('TIME OVER', winner ? `${winner.data.name} WINS` : 'EMPATE', 2200, () => {
      this.concludeRound(winner);
    });
  }

  showAnnouncer(title, subtitle, durationMs, callback) {
    this.dom.announcerTitle.textContent = title;
    this.dom.announcerSubtitle.textContent = subtitle;
    this.dom.announcerOverlay.classList.remove('hidden');

    setTimeout(() => {
      this.dom.announcerOverlay.classList.add('hidden');
      if (callback) callback();
    }, durationMs);
  }

  spawnProjectile(owner) {
    const dir = owner.facing;
    const startX = owner.x + (dir === 1 ? owner.width + 10 : -10);
    const startY = owner.y + 55;

    const proj = new Projectile(owner, owner.data.projectileType, startX, startY, dir);
    this.projectiles.push(proj);

    // Sacudida de cámara en especial
    this.shakeScreen(15, 6);
  }

  shakeScreen(durationFrames, intensity) {
    this.screenShakeTime = durationFrames;
    this.screenShakeIntensity = intensity;
  }

  // ==========================================================================
  // BUCLES DE ACTUALIZACIÓN Y FÍSICAS (60 FPS)
  // ==========================================================================
  update() {
    this.stageTime += 0.03;

    // Reducir congelamiento de impacto (Hit-Stop)
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      return;
    }

    if (this.gameState === 'FIGHTING') {
      this.handleInputs();
      this.p1.update(this.p2, this.particles, this.floatingTexts);
      this.p2.update(this.p1, this.particles, this.floatingTexts);

      this.checkMeleeCollisions();
      this.updateProjectiles();
      this.checkRoundEnd();
    } else if (this.gameState === 'ROUND_OVER' || this.gameState === 'MATCH_OVER') {
      // Dejar que caiga el KO
      this.p1.update(this.p2, this.particles, this.floatingTexts);
      this.p2.update(this.p1, this.particles, this.floatingTexts);
      this.updateProjectiles();
    }

    // Actualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Actualizar textos flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update();
      if (this.floatingTexts[i].life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    this.updateHUD();
  }

  // Mapeo preciso de teclas para P1 y P2
  handleInputs() {
    // Controles Jugador 1: W, A, S, D, F (Puño), G (Patada), H (Especial)
    const p1Input = {
      up: this.keys['KeyW'],
      down: this.keys['KeyS'],
      left: this.keys['KeyA'],
      right: this.keys['KeyD'],
      punch: this.keys['KeyF'],
      kick: this.keys['KeyG'],
      special: this.keys['KeyH']
    };
    this.p1.handleInput(p1Input, this.p2);

    // Controles Jugador 2: Flechas, K (Puño), L (Patada), Ñ / ; / P (Especial)
    const p2Input = {
      up: this.keys['ArrowUp'],
      down: this.keys['ArrowDown'],
      left: this.keys['ArrowLeft'],
      right: this.keys['ArrowRight'],
      punch: this.keys['KeyK'],
      kick: this.keys['KeyL'],
      special: this.keys['KeyP'] || this.keys['Semicolon'] || this.keys['Quote'] || this.keys['KeyÑ'] || this.keys['ñ']
    };
    this.p2.handleInput(p2Input, this.p1);
  }

  // Detección de colisiones de golpes cuerpo a cuerpo (Hitbox vs Hurtbox)
  checkMeleeCollisions() {
    // Ataque de P1 a P2
    if (this.p1.attackBox.active && !this.p1.hasHitCurrentAttack) {
      if (this.isBoxColliding(this.p1.attackBox, this.p2.hurtBox)) {
        this.p1.hasHitCurrentAttack = true;
        this.p2.takeDamage(
          this.p1.attackBox.damage,
          this.p1.attackBox.knockback,
          true,
          this.particles,
          this.floatingTexts
        );
        this.p1.addEnergy(this.p1.attackBox.type === 'punch' ? 14 : 20);

        // Combo system
        this.p1.comboCount++;
        this.p1.comboResetTimer = 55;
        this.triggerHitStop(4);
        this.shakeScreen(8, 4);
      }
    }

    // Ataque de P2 a P1
    if (this.p2.attackBox.active && !this.p2.hasHitCurrentAttack) {
      if (this.isBoxColliding(this.p2.attackBox, this.p1.hurtBox)) {
        this.p2.hasHitCurrentAttack = true;
        this.p1.takeDamage(
          this.p2.attackBox.damage,
          this.p2.attackBox.knockback,
          true,
          this.particles,
          this.floatingTexts
        );
        this.p2.addEnergy(this.p2.attackBox.type === 'punch' ? 14 : 20);

        // Combo system
        this.p2.comboCount++;
        this.p2.comboResetTimer = 55;
        this.triggerHitStop(4);
        this.shakeScreen(8, 4);
      }
    }
  }

  // Comprobar colisión AABB rectangular
  isBoxColliding(box1, box2) {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  // Actualizar y colisionar proyectiles
  updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(this.particles);

      if (!proj.active) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Colisión de proyectil con el rival
      const target = proj.owner === this.p1 ? this.p2 : this.p1;
      const projBox = {
        x: proj.x - proj.radius,
        y: proj.y - proj.radius,
        width: proj.radius * 2,
        height: proj.radius * 2
      };

      if (this.isBoxColliding(projBox, target.hurtBox)) {
        proj.active = false;
        target.takeDamage(proj.damage, proj.direction * 14, true, this.particles, this.floatingTexts);
        this.triggerHitStop(6);
        this.shakeScreen(14, 8);

        // Explosión de chispas en impacto
        for (let p = 0; p < 20; p++) {
          this.particles.push(new Particle(
            proj.x,
            proj.y,
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            proj.color,
            Math.random() * 6 + 3,
            25,
            0.2
          ));
        }

        this.projectiles.splice(i, 1);
      }
    }
  }

  triggerHitStop(frames) {
    this.hitStopFrames = frames;
  }

  checkRoundEnd() {
    if (this.p1.health <= 0 || this.p2.health <= 0) {
      clearInterval(this.timerInterval);
      this.gameState = 'ROUND_OVER';

      const winner = this.p1.health > 0 ? this.p1 : this.p2;
      const loser = this.p1.health <= 0 ? this.p1 : this.p2;

      winner.state = 'win';
      loser.state = 'ko';

      this.triggerHitStop(14);
      this.shakeScreen(25, 12);
      sounds.playKO();

      this.showAnnouncer('K.O.', '', 2200, () => {
        this.concludeRound(winner);
      });
    }
  }

  concludeRound(roundWinner) {
    if (roundWinner) {
      roundWinner.roundsWon++;
    }

    this.updateHUD();

    // ¿Alguien ganó 2 rondas? (Mejor de 3)
    if (this.p1.roundsWon >= MAX_ROUNDS_TO_WIN || this.p2.roundsWon >= MAX_ROUNDS_TO_WIN) {
      const matchWinner = this.p1.roundsWon >= MAX_ROUNDS_TO_WIN ? this.p1 : this.p2;
      this.endMatch(matchWinner);
    } else {
      // Próxima ronda
      this.round++;
      this.startRound();
    }
  }

  endMatch(winner) {
    this.gameState = 'MATCH_OVER';

    const isP1 = winner === this.p1;
    const winnerTitle = isP1 ? '¡JUGADOR 1 GANA!' : '¡JUGADOR 2 GANA!';
    const winnerSub = `${winner.data.name.toUpperCase()} DOMINA EL TORNEO`;

    document.getElementById('match-winner-title').textContent = winnerTitle;
    document.getElementById('match-winner-subtitle').textContent = winnerSub;

    // Miniatura de victoria
    this.drawPreview('winner-canvas', winner.characterKey, 1);

    this.dom.matchOverScreen.classList.remove('hidden');
  }

  // ==========================================================================
  // ACTUALIZACIÓN DE INTERFAZ GRÁFICA (HUD)
  // ==========================================================================
  updateHUD() {
    if (!this.p1 || !this.p2) return;

    // Nombres
    this.dom.p1Name.textContent = this.p1.data.name;
    this.dom.p2Name.textContent = this.p2.data.name;

    // Barras de Vida P1
    const p1HealthPct = Math.max(0, (this.p1.health / this.p1.maxHealth) * 100);
    this.dom.p1HealthFill.style.width = `${p1HealthPct}%`;
    this.dom.p1HealthGhost.style.width = `${p1HealthPct}%`;
    this.dom.p1HealthText.textContent = `${Math.ceil(p1HealthPct)}%`;

    // Barras de Vida P2
    const p2HealthPct = Math.max(0, (this.p2.health / this.p2.maxHealth) * 100);
    this.dom.p2HealthFill.style.width = `${p2HealthPct}%`;
    this.dom.p2HealthGhost.style.width = `${p2HealthPct}%`;
    this.dom.p2HealthText.textContent = `${Math.ceil(p2HealthPct)}%`;

    // Barras de Energía P1
    const p1EnergyPct = Math.min(100, (this.p1.energy / this.p1.maxEnergy) * 100);
    this.dom.p1EnergyFill.style.width = `${p1EnergyPct}%`;
    this.dom.p1EnergyFill.classList.toggle('full', p1EnergyPct >= 100);
    this.dom.p1EnergyText.textContent = p1EnergyPct >= 100 ? '¡ESPECIAL LISTO! [H]' : `ESPECIAL: ${Math.floor(p1EnergyPct)}%`;

    // Barras de Energía P2
    const p2EnergyPct = Math.min(100, (this.p2.energy / this.p2.maxEnergy) * 100);
    this.dom.p2EnergyFill.style.width = `${p2EnergyPct}%`;
    this.dom.p2EnergyFill.classList.toggle('full', p2EnergyPct >= 100);
    this.dom.p2EnergyText.textContent = p2EnergyPct >= 100 ? '¡ESPECIAL LISTO! [Ñ/;]' : `ESPECIAL: ${Math.floor(p2EnergyPct)}%`;

    // Indicadores de Rondas Ganadas (Círculos dorados)
    const p1Dots = this.dom.p1Rounds.querySelectorAll('.round-dot');
    p1Dots.forEach((dot, idx) => dot.classList.toggle('won', idx < this.p1.roundsWon));

    const p2Dots = this.dom.p2Rounds.querySelectorAll('.round-dot');
    p2Dots.forEach((dot, idx) => dot.classList.toggle('won', idx < this.p2.roundsWon));

    // Contador de Combos
    if (this.p1.comboCount > 1) {
      this.dom.p1Combo.textContent = `${this.p1.comboCount} HITS!`;
      this.dom.p1Combo.classList.add('active');
    } else {
      this.dom.p1Combo.classList.remove('active');
    }

    if (this.p2.comboCount > 1) {
      this.dom.p2Combo.textContent = `${this.p2.comboCount} HITS!`;
      this.dom.p2Combo.classList.add('active');
    } else {
      this.dom.p2Combo.classList.remove('active');
    }

    // Badge de ronda
    this.dom.roundBadge.textContent = this.round <= 2 ? `ROUND ${this.round}` : 'FINAL ROUND';
  }

  // ==========================================================================
  // RENDERIZADO DEL ESCENARIO Y BUCLE PRINCIPAL (CANVAS)
  // ==========================================================================
  drawStage() {
    const ctx = this.ctx;

    // Cielo Nocturno Gradiente
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, '#0a0a1a');
    skyGrad.addColorStop(0.5, '#1e1136');
    skyGrad.addColorStop(0.85, '#2e1040');
    skyGrad.addColorStop(1, '#080511');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Luna Gigante
    ctx.save();
    ctx.fillStyle = '#fffae0';
    ctx.shadowColor = 'rgba(255, 230, 150, 0.45)';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH * 0.78, 140, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Silueta de Rascacielos Lejanos (Paralaje sutil)
    ctx.fillStyle = '#120b22';
    const skyline = [
      { x: 30, w: 90, h: 260 },
      { x: 130, w: 70, h: 220 },
      { x: 210, w: 110, h: 300 },
      { x: 330, w: 85, h: 240 },
      { x: 425, w: 120, h: 320 },
      { x: 560, w: 90, h: 250 },
      { x: 660, w: 130, h: 340 },
      { x: 800, w: 95, h: 270 },
      { x: 910, w: 100, h: 290 }
    ];
    skyline.forEach(b => {
      ctx.fillRect(b.x, GROUND_Y - b.h, b.w, b.h);
      // Ventanas con luces aleatorias
      ctx.fillStyle = 'rgba(255, 204, 0, 0.15)';
      for (let wy = GROUND_Y - b.h + 20; wy < GROUND_Y - 40; wy += 25) {
        for (let wx = b.x + 10; wx < b.x + b.w - 15; wx += 20) {
          if ((wx + wy) % 7 === 0) {
            ctx.fillRect(wx, wy, 8, 12);
          }
        }
      }
      ctx.fillStyle = '#120b22';
    });

    // Torii Gate o Estructura Dojo Japonesa / Cyberpunk en el centro
    ctx.save();
    ctx.fillStyle = '#26122e';
    // Columnas
    ctx.fillRect(CANVAS_WIDTH * 0.42, GROUND_Y - 240, 24, 240);
    ctx.fillRect(CANVAS_WIDTH * 0.58, GROUND_Y - 240, 24, 240);
    // Viga superior curvada
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH * 0.35, GROUND_Y - 240);
    ctx.quadraticCurveTo(CANVAS_WIDTH * 0.5, GROUND_Y - 265, CANVAS_WIDTH * 0.65, GROUND_Y - 240);
    ctx.lineTo(CANVAS_WIDTH * 0.65, GROUND_Y - 220);
    ctx.quadraticCurveTo(CANVAS_WIDTH * 0.5, GROUND_Y - 245, CANVAS_WIDTH * 0.35, GROUND_Y - 220);
    ctx.closePath();
    ctx.fill();

    // Faroles de neón colgantes
    const lanternGlow = Math.sin(this.stageTime * 2) * 5 + 15;
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = lanternGlow;
    ctx.fillRect(CANVAS_WIDTH * 0.425, GROUND_Y - 200, 14, 24);
    ctx.fillRect(CANVAS_WIDTH * 0.585, GROUND_Y - 200, 14, 24);
    ctx.restore();

    // Suelo de la Arena (Rooftop cibernético con baldosas y bordes brillantes)
    const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
    floorGrad.addColorStop(0, '#1a1f2e');
    floorGrad.addColorStop(0.2, '#111520');
    floorGrad.addColorStop(1, '#07090f');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // Borde brillante de la arena
    ctx.save();
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Líneas de perspectiva en el suelo
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    for (let x = 0; x <= CANVAS_WIDTH; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x + (x - CANVAS_WIDTH / 2) * 0.5, CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bucle Principal de Renderizado a 60 FPS (requestAnimationFrame)
  startRenderLoop() {
    const loop = () => {
      this.update();

      this.ctx.save();

      // Efecto de sacudida de pantalla (Screen Shake)
      if (this.screenShakeTime > 0) {
        this.screenShakeTime--;
        const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
        const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
        this.ctx.translate(shakeX, shakeY);
      }

      this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Dibujar escenario
      this.drawStage();

      // 2. Dibujar luchadores
      if (this.p1 && this.p2) {
        this.p1.draw(this.ctx);
        this.p2.draw(this.ctx);
      }

      // 3. Dibujar proyectiles
      this.projectiles.forEach(p => p.draw(this.ctx));

      // 4. Dibujar partículas
      this.particles.forEach(pt => pt.draw(this.ctx));

      // 5. Dibujar textos flotantes
      this.floatingTexts.forEach(ft => ft.draw(this.ctx));

      this.ctx.restore();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Inicializar el juego al cargar la ventana
let game;
window.addEventListener('DOMContentLoaded', () => {
  game = new FatalStrikeGame();
});
