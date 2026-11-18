/**
 * FATAL STRIKE - 3D MORTAL KOMBAT 1 EXPERIENCE (AAA ARCHITECTURE)
 * Three.js r128 & GSAP 3.12.2
 * Procedural Articulated 3D Fighters (Art the Clown, Pennywise, Freddy Krueger)
 * Dynamic Dojo Stage, 3 Unique Specials per Fighter (9 Total),
 * 3D Fatal Blow & Individual 3D Fatalities, Interactive Pause Menu (ESC).
 */

// ============================================================================
// 1. CONFIGURACIÓN Y CONSTANTES GLOBALES
// ============================================================================
const ARENA_WIDTH = 28;
const FIGHT_PLANE_Z = 0;
const FLOOR_Y = 0;
const ROUND_TIME = 99;
const MAX_ROUNDS_TO_WIN = 2;
const FATALITY_TIME = 5.0;

// Definición de Personajes con Skins Icónicas de Terror
const CHARACTER_DATA = {
  mime: {
    id: 'mime',
    name: 'The Mime Slasher',
    skinName: 'Art the Clown',
    title: 'EL ASESINO SILENCIOSO',
    desc: 'Monocromático, rostro cadavérico y sádico. Cuchilladas letales, estocada oscura y martillazo sísmico.',
    colorPrimary: 0xf8fafc,
    colorSecondary: 0x09090b,
    colorAccent: 0xdc2626,
    beamColor: 0xdc2626,
    stats: { speed: 85, power: 90, defense: 70, health: 1000 },
    speed: 0.16,
    jumpPower: 0.38,
    attackPowerMult: 1.1,
    specialName: 'FATAL CLEAVER LASER',
    fatalityComboP1: ['KeyS', 'KeyS', 'KeyG'],
    fatalityComboP2: ['ArrowDown', 'ArrowDown', 'KeyL']
  },
  penny: {
    id: 'penny',
    name: 'The Dancing Terror',
    skinName: 'Pennywise',
    title: 'EL PAYASO ANCESTRAL',
    desc: 'Traje victoriano con pompones rojos, globos carmesí flotantes, teletransporte e ilusiones macabras.',
    colorPrimary: 0xf1f5f9,
    colorSecondary: 0x991b1b,
    colorAccent: 0xf59e0b,
    beamColor: 0xff0033,
    stats: { speed: 80, power: 85, defense: 75, health: 980 },
    speed: 0.15,
    jumpPower: 0.39,
    attackPowerMult: 1.05,
    specialName: 'DEADLIGHTS COSMIC BEAM',
    fatalityComboP1: ['KeyA', 'KeyD', 'KeyH'],
    fatalityComboP2: ['ArrowLeft', 'ArrowRight', 'KeyP']
  },
  freddy: {
    id: 'freddy',
    name: 'The Dream Stalker',
    skinName: 'Freddy Krueger',
    title: 'EL SEÑOR DE LAS PESADILLAS',
    desc: 'Sombrero fedora marrón, suéter a rayas verde/rojo y guantelete con 4 garras de acero al rojo vivo.',
    colorPrimary: 0x881337,
    colorSecondary: 0x14532d,
    colorAccent: 0xea580c,
    beamColor: 0xff6600,
    stats: { speed: 75, power: 95, defense: 80, health: 1050 },
    speed: 0.14,
    jumpPower: 0.36,
    attackPowerMult: 1.2,
    specialName: 'HELLFIRE FURNACE SLASH',
    fatalityComboP1: ['KeyS', 'KeyD', 'KeyF'],
    fatalityComboP2: ['ArrowDown', 'ArrowRight', 'KeyK']
  }
};

// ============================================================================
// 2. SISTEMA DE AUDIO SINTETIZADO Y ANUNCIADOR (Web Audio API + Speech Synth)
// ============================================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.synthVoice = null;
    this.initSpeech();
  }

  initSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        this.synthVoice = voices.find(v => (v.lang.includes('en') || v.lang.includes('es')) && (v.name.includes('David') || v.name.includes('Male'))) || voices[0];
      };
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  speak(text) {
    if (!this.enabled) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.82;
        utter.pitch = 0.38;
        utter.volume = 1.0;
        if (this.synthVoice) utter.voice = this.synthVoice;
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {}
    this.playAnnouncerBass();
  }

  playAnnouncerBass() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.65);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  playPunch() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    gain.gain.setValueAtTime(0.5, now);
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
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playBladeSlash() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3500, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.18);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.75, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playMetalClang() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [1200, 1850, 2400].forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.35, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  playFatalityGore() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 1.2);
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.2);
    this.playBladeSlash();
  }

  playHeartbeat() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.18);
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playTeleport() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(850, now + 0.22);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playLaserBeam() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.7);
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }
}

const sounds = new SoundEngine();

// ============================================================================
// 3. GENERADOR DE TEXTURAS Y MODELOS 3D PROCEDURALES ULTRA DETALLADOS
// ============================================================================
class Character3DBuilder {
  // Textura procedural de rostro para Art the Clown
  static createArtFaceTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');

    // Base piel blanca de payaso cadavérico
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 256);

    // Ojeras y cuencas negras hundidas y sádicas
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(82, 110, 24, 30, 0, 0, Math.PI * 2);
    ctx.ellipse(174, 110, 24, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ojos negros penetrantes con brillo especular
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(85, 108, 5, 0, Math.PI * 2);
    ctx.arc(177, 108, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cejas negras arqueadas maquiavélicas
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(82, 74, 28, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(174, 74, 28, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Nariz puntiaguda negra
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(128, 134, 9, 0, Math.PI * 2);
    ctx.fill();

    // Sonrisa sangrienta desmesurada hasta las orejas
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(42, 162);
    ctx.quadraticCurveTo(128, 242, 214, 162);
    ctx.quadraticCurveTo(128, 196, 42, 162);
    ctx.fill();

    // Cavidad bucal negra con dientes afilados
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(60, 168);
    ctx.quadraticCurveTo(128, 224, 196, 168);
    ctx.quadraticCurveTo(128, 186, 60, 168);
    ctx.fill();

    // Dientes afilados e irregulares
    ctx.fillStyle = '#fef08a';
    for (let x = 74; x <= 182; x += 11) {
      ctx.beginPath();
      ctx.moveTo(x - 4, 172);
      ctx.lineTo(x, 185);
      ctx.lineTo(x + 4, 172);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  // Traje blanco y negro con manchas de sangre para Art the Clown
  static createArtSuitTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');

    // Bicolor simétrico: mitad blanca, mitad negra
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 128, 256);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(128, 0, 128, 256);

    // Salpicaduras de sangre realistas en el lado blanco
    ctx.fillStyle = '#7f1d1d';
    for (let i = 0; i < 30; i++) {
      const bx = 12 + Math.random() * 105;
      const by = 15 + Math.random() * 225;
      const r = 2 + Math.random() * 7;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // Textura de rostro para Pennywise (grietas, líneas rojas a través de ojos y deadlights)
  static createPennyFaceTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');

    // Piel de porcelana marfil agrietada
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 256, 256);

    // Grietas sutiles en la frente
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(125, 25); ctx.lineTo(135, 60); ctx.lineTo(110, 80);
    ctx.moveTo(60, 130); ctx.lineTo(75, 160);
    ctx.stroke();

    // Ojos demoníacos 'Deadlights' amarillos incandescentes
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(82, 114, 18, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(174, 114, 18, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupilas rasgadas
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(82, 114, 4, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(174, 114, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nariz roja de payaso
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(128, 136, 13, 0, Math.PI * 2);
    ctx.fill();

    // Líneas rojas icónicas que atraviesan los ojos hacia la frente
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(68, 178);
    ctx.quadraticCurveTo(78, 140, 82, 114);
    ctx.quadraticCurveTo(88, 75, 96, 42);
    ctx.moveTo(188, 178);
    ctx.quadraticCurveTo(178, 140, 174, 114);
    ctx.quadraticCurveTo(168, 75, 160, 42);
    ctx.stroke();

    // Sonrisa victoriana siniestra
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(52, 172);
    ctx.quadraticCurveTo(128, 234, 204, 172);
    ctx.quadraticCurveTo(128, 198, 52, 172);
    ctx.fill();

    // Cavidad con colmillos
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(68, 178);
    ctx.quadraticCurveTo(128, 218, 188, 178);
    ctx.quadraticCurveTo(128, 188, 68, 178);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    for (let x = 80; x <= 176; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x - 4, 180);
      ctx.lineTo(x, 192);
      ctx.lineTo(x + 4, 180);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  // Textura de rostro calcinado para Freddy Krueger
  static createFreddyFaceTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');

    // Piel base chamuscada
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 256, 256);

    // Cicatrices, quemaduras y piel viva
    const burnColors = ['#991b1b', '#451a03', '#b45309', '#1c1917', '#dc2626'];
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = burnColors[Math.floor(Math.random() * burnColors.length)];
      ctx.beginPath();
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      const rad = 4 + Math.random() * 24;
      ctx.ellipse(rx, ry, rad, rad * 0.55, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ojos amenazantes amarillos de pesadilla
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(82, 114, 16, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(174, 114, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(82, 114, 5, 0, Math.PI * 2);
    ctx.arc(174, 114, 5, 0, Math.PI * 2);
    ctx.fill();

    // Mueca retorcida con dientes quemados
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(68, 184);
    ctx.quadraticCurveTo(128, 222, 188, 184);
    ctx.quadraticCurveTo(128, 174, 68, 184);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    for (let x = 82; x <= 174; x += 11) {
      ctx.fillRect(x - 3, 178, 6, 8);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  // Suéter a rayas horizontales alternadas en verde bosque y rojo sangre oscuro
  static createFreddySweaterTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    const stripeH = 32;
    for (let y = 0; y < 128; y += stripeH) {
      ctx.fillStyle = (y / stripeH) % 2 === 0 ? '#881337' : '#14532d';
      ctx.fillRect(0, y, 128, stripeH);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    return tex;
  }

  static build(charKey) {
    const data = CHARACTER_DATA[charKey];
    const root = new THREE.Group();
    root.name = `char_${charKey}`;

    // Materiales con MeshStandardMaterial para iluminación realista y sombras
    const matBlood = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.3, metalness: 0.3 });
    const matSteel = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });
    const matWood = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });

    const facingGroup = new THREE.Group();
    root.add(facingGroup);

    // Pelvis / Caderas
    const pelvis = new THREE.Group();
    pelvis.position.y = 1.6;
    facingGroup.add(pelvis);

    const pelvisMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.3, 0.4, 12),
      charKey === 'mime'
        ? new THREE.MeshStandardMaterial({ map: Character3DBuilder.createArtSuitTexture(), roughness: 0.4 })
        : charKey === 'freddy'
        ? new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6 })
        : new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
    );
    pelvisMesh.castShadow = true;
    pelvis.add(pelvisMesh);

    // Espina y Torso
    const spine = new THREE.Group();
    spine.position.y = 0.2;
    pelvis.add(spine);

    let torsoMesh;
    if (charKey === 'freddy') {
      const freddySweaterTex = Character3DBuilder.createFreddySweaterTexture();
      const matSweater = new THREE.MeshStandardMaterial({ map: freddySweaterTex, roughness: 0.65 });
      torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.38, 0.84, 14), matSweater);
      torsoMesh.position.y = 0.42;
      torsoMesh.castShadow = true;
    } else if (charKey === 'mime') {
      const artSuitTex = Character3DBuilder.createArtSuitTexture();
      const matArtSuit = new THREE.MeshStandardMaterial({ map: artSuitTex, roughness: 0.4 });
      torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.84, 0.44), matArtSuit);
      torsoMesh.position.y = 0.42;
      torsoMesh.castShadow = true;

      // 3 Pompones/botones negros en el pecho
      for (let p = 0; p < 3; p++) {
        const button = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), new THREE.MeshStandardMaterial({ color: 0x09090b }));
        button.position.set(0, 0.2 + p * 0.22, 0.23);
        torsoMesh.add(button);
      }
    } else {
      // Pennywise: Traje victoriano con 3 pompones rojos brillantes
      const matPennySuit = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45 });
      torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.84, 0.44), matPennySuit);
      torsoMesh.position.y = 0.42;
      torsoMesh.castShadow = true;

      for (let p = 0; p < 3; p++) {
        const pom = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25 }));
        pom.position.set(0, 0.18 + p * 0.24, 0.24);
        torsoMesh.add(pom);
      }

      // Falda peplum con volantes sobre las caderas
      const peplum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.54, 0.22, 16), matPennySuit);
      peplum.position.y = -0.05;
      peplum.castShadow = true;
      spine.add(peplum);
    }
    spine.add(torsoMesh);

    // Cuello de arlequín / Volantes victorianos (Ruffle de 3 capas)
    if (charKey === 'mime' || charKey === 'penny') {
      const ruffleColor = charKey === 'mime' ? 0xf8fafc : 0xf1f5f9;
      const matRuffle = new THREE.MeshStandardMaterial({ color: ruffleColor, roughness: 0.5 });
      for (let r = 0; r < 3; r++) {
        const ringRuffle = new THREE.Mesh(new THREE.TorusGeometry(0.32 + r * 0.08, 0.07, 8, 20), matRuffle);
        ringRuffle.rotation.x = Math.PI / 2;
        ringRuffle.position.y = 0.82 + r * 0.07;
        ringRuffle.castShadow = true;
        spine.add(ringRuffle);
      }
    }

    // Cabeza y Rostro Icónico
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.05;
    spine.add(headGroup);

    let headTex;
    if (charKey === 'mime') headTex = Character3DBuilder.createArtFaceTexture();
    else if (charKey === 'penny') headTex = Character3DBuilder.createPennyFaceTexture();
    else headTex = Character3DBuilder.createFreddyFaceTexture();

    const headMat = new THREE.MeshStandardMaterial({ map: headTex, roughness: 0.5 });
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), headMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Accesorios y cabezas específicos
    if (charKey === 'mime') {
      // Chistera negra mini ladeada con cinta blanca
      const hatGroup = new THREE.Group();
      hatGroup.position.set(0.14, 0.34, 0);
      hatGroup.rotation.z = -0.28;

      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 16), new THREE.MeshStandardMaterial({ color: 0x09090b }));
      const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.26, 14), new THREE.MeshStandardMaterial({ color: 0x09090b }));
      hatCrown.position.y = 0.13;
      const hatRibbon = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.16, 0.05, 14), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      hatRibbon.position.y = 0.04;

      hatGroup.add(hatBrim, hatCrown, hatRibbon);
      headGroup.add(hatGroup);
    } else if (charKey === 'penny') {
      // Grandes mechones laterales de pelo naranja llameante
      const hairMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
      const hairL = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), hairMat);
      hairL.position.set(-0.32, 0.16, -0.06);
      hairL.scale.set(1.1, 1.4, 1.0);
      const hairR = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), hairMat);
      hairR.position.set(0.32, 0.16, -0.06);
      hairR.scale.set(1.1, 1.4, 1.0);
      headGroup.add(hairL, hairR);

      // Cúpula frontal abombada característica
      const forehead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), headMat);
      forehead.position.set(0, 0.2, 0.08);
      headGroup.add(forehead);
    } else if (charKey === 'freddy') {
      // Sombrero Fedora marrón con ala ancha y copa hendida
      const fedoraMat = new THREE.MeshStandardMaterial({ color: 0x3d1a04, roughness: 0.75 });
      const fedoraCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.24, 14), fedoraMat);
      fedoraCrown.position.y = 0.34;
      const fedoraBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 18), fedoraMat);
      fedoraBrim.position.y = 0.22;
      const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.31, 0.06, 14), new THREE.MeshStandardMaterial({ color: 0x1c1917 }));
      ribbon.position.y = 0.26;
      headGroup.add(fedoraCrown, fedoraBrim, ribbon);
    }

    // Brazo Izquierdo
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.48, 0.74, 0);
    spine.add(leftArm);

    const lArmMat = charKey === 'freddy'
      ? new THREE.MeshStandardMaterial({ map: Character3DBuilder.createFreddySweaterTexture() })
      : charKey === 'mime'
      ? new THREE.MeshStandardMaterial({ color: 0xf8fafc })
      : new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.42, 8), lArmMat);
    lUpperArm.position.y = -0.21;
    lUpperArm.castShadow = true;
    leftArm.add(lUpperArm);

    const lForeArm = new THREE.Group();
    lForeArm.position.y = -0.42;
    leftArm.add(lForeArm);
    const lForeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.4, 8), lArmMat);
    lForeMesh.position.y = -0.2;
    lForeMesh.castShadow = true;
    const lHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      charKey === 'freddy' ? new THREE.MeshStandardMaterial({ color: 0x78350f }) : new THREE.MeshStandardMaterial({ color: 0xf8fafc })
    );
    lHand.position.y = -0.42;
    lForeArm.add(lForeMesh, lHand);

    // Brazo Derecho
    const rightArm = new THREE.Group();
    rightArm.position.set(0.48, 0.74, 0);
    spine.add(rightArm);

    const rArmMat = charKey === 'freddy'
      ? new THREE.MeshStandardMaterial({ map: Character3DBuilder.createFreddySweaterTexture() })
      : charKey === 'mime'
      ? new THREE.MeshStandardMaterial({ color: 0x09090b })
      : new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.42, 8), rArmMat);
    rUpperArm.position.y = -0.21;
    rUpperArm.castShadow = true;
    rightArm.add(rUpperArm);

    const rForeArm = new THREE.Group();
    rForeArm.position.y = -0.42;
    rightArm.add(rForeArm);
    const rForeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.4, 8), rArmMat);
    rForeMesh.position.y = -0.2;
    rForeMesh.castShadow = true;
    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: charKey === 'freddy' ? 0x451a03 : 0xf8fafc }));
    rHand.position.y = -0.42;
    rForeArm.add(rForeMesh, rHand);

    // Armas y Objetos Icónicos
    if (charKey === 'mime') {
      // Cuchilla de carnicero metálica con salpicaduras de sangre
      const cleaver = new THREE.Group();
      cleaver.position.set(0, -0.44, 0.18);

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.46, 0.24), matSteel);
      blade.castShadow = true;
      const bloodEdge = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.16, 0.24), matBlood);
      bloodEdge.position.y = -0.15;
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 6), matWood);
      handle.position.y = 0.28;
      cleaver.add(blade, bloodEdge, handle);
      rForeArm.add(cleaver);
    } else if (charKey === 'freddy') {
      // Guantelete legendario con 4 garras de cuchilla afiladas y remaches
      const glove = new THREE.Group();
      glove.position.set(0, -0.44, 0.12);

      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.05), new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.2 }));
      glove.add(plate);

      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.45, 6), matSteel);
        blade.position.set((b - 1.5) * 0.06, -0.22, 0.08);
        blade.rotation.x = Math.PI * 0.85;
        blade.castShadow = true;
        glove.add(blade);
      }
      rForeArm.add(glove);
    } else if (charKey === 'penny') {
      // Globo rojo carmesí 3D flotante atado a la muñeca izquierda
      const balloonGroup = new THREE.Group();
      balloonGroup.position.set(-0.25, 1.25, 0.3);

      const balloon = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.15, metalness: 0.1 })
      );
      balloon.castShadow = true;
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      string.position.y = -0.65;
      balloonGroup.add(balloon, string);
      leftArm.add(balloonGroup);
    }

    // Pierna Izquierda
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.2, -0.2, 0);
    pelvis.add(leftLeg);

    const legMatL = charKey === 'mime'
      ? new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
      : charKey === 'freddy'
      ? new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6 })
      : new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });

    const lUpperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.52, 8), legMatL);
    lUpperLeg.position.y = -0.26;
    lUpperLeg.castShadow = true;
    leftLeg.add(lUpperLeg);

    const lLowerLeg = new THREE.Group();
    lLowerLeg.position.y = -0.52;
    leftLeg.add(lLowerLeg);
    const lLowerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.52, 8), legMatL);
    lLowerMesh.position.y = -0.26;
    lLowerMesh.castShadow = true;
    const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.38), new THREE.MeshStandardMaterial({ color: 0x18181b }));
    lFoot.position.set(0, -0.52, 0.1);
    lFoot.castShadow = true;
    lLowerLeg.add(lLowerMesh, lFoot);

    // Pierna Derecha
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.2, -0.2, 0);
    pelvis.add(rightLeg);

    const legMatR = charKey === 'mime'
      ? new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.5 })
      : charKey === 'freddy'
      ? new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6 })
      : new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });

    const rUpperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.52, 8), legMatR);
    rUpperLeg.position.y = -0.26;
    rUpperLeg.castShadow = true;
    rightLeg.add(rUpperLeg);

    const rLowerLeg = new THREE.Group();
    rLowerLeg.position.y = -0.52;
    rightLeg.add(rLowerLeg);
    const rLowerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.52, 8), legMatR);
    rLowerMesh.position.y = -0.26;
    rLowerMesh.castShadow = true;
    const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.38), new THREE.MeshStandardMaterial({ color: 0x18181b }));
    rFoot.position.set(0, -0.52, 0.1);
    rFoot.castShadow = true;
    rLowerLeg.add(rLowerMesh, rFoot);

    return {
      root,
      facingGroup,
      pelvis,
      spine,
      headGroup,
      leftArm,
      rightArm,
      lForeArm,
      rForeArm,
      leftLeg,
      rightLeg,
      lLowerLeg,
      rLowerLeg
    };
  }
}

// ============================================================================
// 4. CLASE FIGHTER3D (FÍSICA, COMBOS, ESPECIALES Y ANIMACIONES)
// ============================================================================
class Fighter3D {
  constructor(playerId, characterKey, startX, facingDirection) {
    this.playerId = playerId;
    this.characterKey = characterKey;
    this.data = CHARACTER_DATA[characterKey];

    this.x = startX;
    this.y = FLOOR_Y;
    this.z = FIGHT_PLANE_Z;
    this.vx = 0;
    this.vy = 0;
    this.facing = facingDirection; // 1 = derecha, -1 = izquierda
    this.isGrounded = true;

    this.maxHealth = this.data.stats.health;
    this.health = this.maxHealth;
    this.roundsWon = 0;

    this.maxEnergy = 100;
    this.energy = 0;

    this.state = 'idle'; // idle, walk, jump, crouch, punch, kick, special, kombo, hurt, ko, fatality_victim, fatality_killer, win, dazed
    this.stateTimer = 0;
    this.hitStun = 0;
    this.isBlocking = false;
    this.isCrouching = false;
    this.comboCount = 0;
    this.comboResetTimer = 0;

    this.inputBuffer = [];

    // Hitbox y Hurtbox en el espacio 3D
    this.width = 1.3;
    this.height = 2.4;
    this.attackBox = {
      x: 0,
      y: 0,
      width: 1.4,
      height: 1.0,
      active: false,
      damage: 0,
      knockback: 0,
      type: 'punch'
    };
    this.hasHitCurrentAttack = false;

    // Crear modelo procedural
    this.mesh = new THREE.Group();
    this.model = Character3DBuilder.build(characterKey);
    this.mesh.add(this.model.root);
    this.mesh.position.set(this.x, this.y, this.z);

    this.animTime = playerId === 1 ? 0 : Math.PI;
  }

  reset(x, facing) {
    this.x = x;
    this.y = FLOOR_Y;
    this.z = FIGHT_PLANE_Z;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.isGrounded = true;
    this.health = this.maxHealth;
    this.state = 'idle';
    this.stateTimer = 0;
    this.isCrouching = false;
    this.isBlocking = false;
    this.hitStun = 0;
    this.attackBox.active = false;
    this.hasHitCurrentAttack = false;
    this.comboCount = 0;
    this.inputBuffer = [];

    // Restaurar transformaciones del modelo
    this.mesh.visible = true;
    this.mesh.rotation.set(0, 0, 0);
    this.model.pelvis.position.set(0, 1.6, 0);
    this.model.spine.rotation.set(0, 0, 0);
    if (this.model.headGroup) {
      this.model.headGroup.position.set(0, 1.05, 0);
      this.model.headGroup.rotation.set(0, 0, 0);
    }
    this.mesh.position.set(this.x, this.y, this.z);
  }

  registerInput(code) {
    const now = Date.now();
    this.inputBuffer.push({ code, time: now });
    this.inputBuffer = this.inputBuffer.filter(i => now - i.time <= 650);
  }

  // Comprobación de secuencia comprimiendo repeticiones inmediatas
  checkSequence(seq) {
    if (this.inputBuffer.length < seq.length) return false;
    const compressed = [];
    for (const item of this.inputBuffer) {
      if (compressed.length === 0 || compressed[compressed.length - 1] !== item.code) {
        compressed.push(item.code);
      }
    }
    if (compressed.length < seq.length) return false;
    const recent = compressed.slice(-seq.length);
    return seq.every((val, idx) => val === recent[idx]);
  }

  handleInput(input, opponent) {
    if (['ko', 'fatality_victim', 'fatality_killer', 'win', 'dazed'].includes(this.state)) return;
    if (this.hitStun > 0) return;
    if (['punch', 'kick', 'special', 'kombo'].includes(this.state)) return;

    const isP1 = this.playerId === 1;
    const punchKey = isP1 ? 'KeyF' : 'KeyK';
    const kickKey = isP1 ? 'KeyG' : 'KeyL';
    const downKey = isP1 ? 'KeyS' : 'ArrowDown';
    const forwardKey = (this.facing === 1) ? (isP1 ? 'KeyD' : 'ArrowRight') : (isP1 ? 'KeyA' : 'ArrowLeft');
    const backKey = (this.facing === 1) ? (isP1 ? 'KeyA' : 'ArrowLeft') : (isP1 ? 'KeyD' : 'ArrowRight');

    // ========================================================================
    // DETECCIÓN DE LOS 3 MOVIMIENTOS ESPECIALES ÚNICOS POR LUCHADOR (9 EN TOTAL)
    // ========================================================================
    if (this.characterKey === 'mime') {
      // 1. Cuchillada Letal (↓ + → + Puño)
      if (this.checkSequence([downKey, forwardKey, punchKey])) {
        this.inputBuffer = [];
        this.executeSpecialMove(1, '¡CUCHILLADA LETAL!', 110, 0.35, opponent);
        return;
      }
      // 2. Estocada Oscura (← + → + Puño)
      if (this.checkSequence([backKey, forwardKey, punchKey])) {
        this.inputBuffer = [];
        this.executeSpecialMove(2, '¡ESTOCADA OSCURA!', 120, 0.4, opponent);
        return;
      }
      // 3. Martillazo Sísmico (↓ + ↓ + Patada)
      if (this.checkSequence([downKey, downKey, kickKey])) {
        this.inputBuffer = [];
        this.executeSpecialMove(3, '¡MARTILLAZO SÍSMICO!', 135, 0.5, opponent);
        return;
      }
    } else if (this.characterKey === 'penny') {
      // 1. Trampa de Globo Carmesí (↓ + → + Puño)
      if (this.checkSequence([downKey, forwardKey, punchKey])) {
        this.inputBuffer = [];
        this.executeSpecialMove(1, '¡TRAMPA DE GLOBO!', 115, 0.3, opponent);
        return;
      }
      // 2. Ilusión de Terror (← + → + Patada)
      if (this.checkSequence([backKey, forwardKey, kickKey])) {
        this.inputBuffer = [];
        this.executeSpecialMove(2, '¡ILUSIÓN DE TERROR!', 90, 0.2, opponent);
        return;
      }
      // 3. Risa Asfixiante (↓ + ↓ + Puño)
      if (this.checkSequence([downKey, downKey, punchKey])) {
        this.inputBuffer = [];
        this.executeSpecialMove(3, '¡RISA ASFIXIANTE!', 125, 0.4, opponent);
        return;
      }
    } else if (this.characterKey === 'freddy') {
      // 1. Garra de Pesadilla (↓ + → + Puño)
      if (this.checkSequence([downKey, forwardKey, punchKey])) {
        this.inputBuffer = [];
        this.executeSpecialMove(1, '¡GARRA DE PESADILLA!', 120, 0.35, opponent);
        return;
      }
      // 2. Teletransportación Subterránea (↓ + ↓ + Patada)
      if (this.checkSequence([downKey, downKey, kickKey])) {
        this.inputBuffer = [];
        this.executeSpecialMove(2, '¡TELETRANSPORTE ÍGNEO!', 95, 0.25, opponent);
        return;
      }
      // 3. Estocada Onírica (← + → + Puño)
      if (this.checkSequence([backKey, forwardKey, punchKey])) {
        this.inputBuffer = [];
        this.executeSpecialMove(3, '¡ESTOCADA ONÍRICA!', 130, 0.45, opponent);
        return;
      }
    }

    // Kombos normales: Puño + Puño + Patada
    if (this.checkSequence([punchKey, punchKey, kickKey])) {
      this.inputBuffer = [];
      this.executeKomboSequence('BRUTAL 3D KOMBO', 3, 145);
      return;
    }

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
      return;
    }

    // Movimiento lateral
    if (!this.isCrouching) {
      const spd = this.isGrounded ? this.data.speed : this.data.speed * 0.85;
      if (input.left && !input.right) {
        this.vx = -spd;
        if (this.isGrounded) this.state = 'walk';
        if (this.facing === 1) this.isBlocking = true;
      } else if (input.right && !input.left) {
        this.vx = spd;
        if (this.isGrounded) this.state = 'walk';
        if (this.facing === -1) this.isBlocking = true;
      } else {
        this.vx *= 0.65;
        if (this.isGrounded && Math.abs(this.vx) < 0.01) {
          this.vx = 0;
          if (this.state !== 'crouch') this.state = 'idle';
        }
      }
    }

    if (input.punch) {
      this.startPunch();
      return;
    }

    if (input.kick) {
      this.startKick();
      return;
    }

    // Fatal Blow con barra al 100%
    if (input.special && this.energy >= this.maxEnergy) {
      this.startFatalBlowCinematic(opponent);
      return;
    }
  }

  // Ejecución de Movimiento Especial con Efectos 3D y Proyectiles
  executeSpecialMove(moveId, moveName, damage, knockback, opponent = null) {
    this.state = 'special';
    this.stateTimer = 34;
    this.hasHitCurrentAttack = false;

    if (window.game) {
      window.game.spawnCombatText(this.x, this.y + 2.5, moveName, '#f59e0b');
    }

    // Disparar entidades visuales 3D específicas según el personaje
    if (this.characterKey === 'mime') {
      if (moveId === 1) {
        // Cuchillada Letal: Arco de energía sangriento
        sounds.playBladeSlash();
        if (window.game) window.game.spawnBladeProjectile(this);
      } else if (moveId === 2) {
        // Estocada Oscura: Dash veloz con tajo
        this.vx = this.facing * 0.42;
        sounds.playBladeSlash();
        sounds.playMetalClang();
      } else if (moveId === 3) {
        // Martillazo Sísmico: Salto e impacto al suelo con onda expansiva
        this.vy = 0.22;
        sounds.playAnnouncerBass();
        setTimeout(() => {
          if (window.game) window.game.spawnShockwaveRing(this.x, FLOOR_Y + 0.02, 0xdc2626);
        }, 180);
      }
    } else if (this.characterKey === 'penny') {
      if (moveId === 1) {
        // Trampa de Globo Carmesí: Lanza globo flotante
        sounds.playKick();
        if (window.game) window.game.spawnBalloonProjectile(this);
      } else if (moveId === 2 && opponent) {
        // Ilusión de Terror: Teletransporte con risa macabra
        sounds.playTeleport();
        if (window.game) window.game.spawn3DBloodExplosion(this.x, 1.5, 25);
        this.x = opponent.x - opponent.facing * 2.2;
        this.facing = opponent.facing;
        this.mesh.position.x = this.x;
        if (window.game) window.game.spawn3DBloodExplosion(this.x, 1.5, 25);
      } else if (moveId === 3) {
        // Risa Asfixiante: Ondas sónicas concéntricas
        sounds.playLaserBeam();
        if (window.game) window.game.spawnSonicWaves(this);
      }
    } else if (this.characterKey === 'freddy') {
      if (moveId === 1) {
        // Garra de Pesadilla: 4 tajos de fuego a distancia
        sounds.playBladeSlash();
        if (window.game) window.game.spawnFireClawProjectile(this);
      } else if (moveId === 2 && opponent) {
        // Teletransportación Subterránea
        sounds.playTeleport();
        if (window.game) window.game.spawn3DFireExplosion(this.x, 0.4, 30);
        this.x = opponent.x - opponent.facing * 2.2;
        this.facing = opponent.facing;
        this.mesh.position.x = this.x;
        if (window.game) window.game.spawn3DFireExplosion(this.x, 0.4, 30);
      } else if (moveId === 3) {
        // Estocada Onírica: Embestida con chispas de acero
        this.vx = this.facing * 0.4;
        sounds.playBladeSlash();
        sounds.playMetalClang();
      }
    }

    this.attackBox = {
      x: this.facing === 1 ? this.x + 0.5 : this.x - 1.9,
      y: this.y + 1.2,
      width: 1.8,
      height: 1.3,
      active: true,
      damage: Math.round(damage * this.data.attackPowerMult),
      knockback: knockback * this.facing,
      type: 'special'
    };
  }

  executeKomboSequence(name, hits, totalDamage) {
    this.state = 'kombo';
    this.stateTimer = 32;
    this.hasHitCurrentAttack = false;
    sounds.playBladeSlash();
    sounds.playMetalClang();

    this.attackBox = {
      x: this.facing === 1 ? this.x + 0.5 : this.x - 1.8,
      y: this.y + 1.2,
      width: 1.6,
      height: 1.2,
      active: true,
      damage: Math.round(totalDamage * this.data.attackPowerMult),
      knockback: 0.35 * this.facing,
      type: 'kombo'
    };
  }

  startPunch() {
    this.state = 'punch';
    this.stateTimer = 18;
    this.hasHitCurrentAttack = false;
    this.vx *= 0.2;

    if (this.characterKey === 'mime' || this.characterKey === 'freddy') sounds.playBladeSlash();
    else sounds.playPunch();

    this.attackBox = {
      x: this.facing === 1 ? this.x + 0.4 : this.x - 1.5,
      y: this.y + (this.isCrouching ? 0.8 : 1.4),
      width: 1.3,
      height: 0.8,
      active: true,
      damage: Math.round(60 * this.data.attackPowerMult),
      knockback: 0.18 * this.facing,
      type: 'punch'
    };
  }

  startKick() {
    this.state = 'kick';
    this.stateTimer = 24;
    this.hasHitCurrentAttack = false;
    this.vx *= 0.2;

    if (this.characterKey === 'mime') sounds.playMetalClang();
    else if (this.characterKey === 'freddy') sounds.playBladeSlash();
    else sounds.playKick();

    this.attackBox = {
      x: this.facing === 1 ? this.x + 0.5 : this.x - 1.7,
      y: this.y + (this.isCrouching ? 0.6 : 1.2),
      width: 1.5,
      height: 0.9,
      active: true,
      damage: Math.round(98 * this.data.attackPowerMult),
      knockback: 0.28 * this.facing,
      type: 'kick'
    };
  }

  startFatalBlowCinematic(opponent) {
    this.state = 'special';
    this.stateTimer = 75;
    this.energy = 0;
    this.hasHitCurrentAttack = true;
    this.vx = 0;
    sounds.playLaserBeam();
    if (window.game) {
      window.game.executeFatalBlowCinematic(this, opponent);
    }
  }

  takeDamage(amount, knockback, isBlockable = true) {
    if (this.state === 'ko' || this.state === 'fatality_victim') return;

    let finalDamage = amount;
    let blocked = false;

    if (this.isBlocking && isBlockable) {
      finalDamage = Math.round(amount * 0.2);
      knockback *= 0.3;
      blocked = true;
      sounds.playMetalClang();
      if (window.game) {
        window.game.spawnCombatText(this.x, this.y + 2.2, '¡BLOQUEO!', '#38bdf8');
      }
    } else {
      this.hitStun = 16;
      this.state = 'hurt';
      this.stateTimer = 16;

      if (amount > 80) sounds.playBladeSlash();
      else sounds.playPunch();

      if (window.game) {
        window.game.spawnCombatText(this.x, this.y + 2.4, `-${finalDamage}`, amount > 80 ? '#dc2626' : '#f59e0b');
        window.game.spawn3DBloodExplosion(this.x, this.y + 1.5, amount > 80 ? 30 : 15);
      }
    }

    this.health = Math.max(0, this.health - finalDamage);
    this.vx += knockback;
    if (amount > 80 && !blocked) {
      this.vy = 0.15;
      this.isGrounded = false;
    }

    this.addEnergy(14);
  }

  addEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  // Knockdown limpio y colapso físico realista sobre el suelo de madera
  triggerKnockdown() {
    this.state = 'ko';
    this.vx = 0;
    this.vy = 0;
    this.attackBox.active = false;

    // Caída hacia atrás realista rotando sobre el eje Z lejos del atacante
    const fallDir = -this.facing;
    gsap.to(this.mesh.rotation, {
      z: fallDir * (Math.PI / 2),
      duration: 0.65,
      ease: 'power2.in'
    });
    gsap.to(this.mesh.position, {
      y: FLOOR_Y + 0.25, // Descanso limpio exacto sobre las tablas de madera sin penetrar el suelo
      duration: 0.65,
      ease: 'bounce.out'
    });
  }

  update(opponent) {
    this.animTime += 0.08;

    if (this.hitStun > 0) {
      this.hitStun--;
      if (this.hitStun <= 0 && this.state === 'hurt') this.state = 'idle';
    }

    if (this.stateTimer > 0) {
      this.stateTimer--;
      if (['punch', 'kick', 'kombo', 'special'].includes(this.state) && this.stateTimer < 6) {
        this.attackBox.active = false;
      }
      if (this.stateTimer <= 0) {
        if (['punch', 'kick', 'special', 'kombo', 'hurt'].includes(this.state)) {
          this.state = 'idle';
          this.attackBox.active = false;
        }
      }
    }

    // Orientación fija hacia el oponente en el eje X
    if (!['punch', 'kick', 'special', 'kombo', 'ko', 'fatality_victim', 'fatality_killer', 'win', 'dazed'].includes(this.state)) {
      if (opponent) {
        this.facing = this.x < opponent.x ? 1 : -1;
      }
    }

    // Físicas normales (congeladas si está colapsado en KO)
    if (this.state !== 'ko' && this.state !== 'fatality_victim') {
      this.vy -= 0.016;
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= this.isGrounded ? 0.78 : 0.96;

      if (this.y <= FLOOR_Y) {
        this.y = FLOOR_Y;
        this.vy = 0;
        this.isGrounded = true;
        if (this.state === 'jump') this.state = 'idle';
      } else {
        this.isGrounded = false;
      }

      const maxBound = ARENA_WIDTH / 2 - 1.5;
      if (this.x < -maxBound) { this.x = -maxBound; this.vx = 0; }
      else if (this.x > maxBound) { this.x = maxBound; this.vx = 0; }

      this.mesh.position.set(this.x, this.y, this.z);
      this.model.facingGroup.rotation.y = this.facing === 1 ? Math.PI / 2 : -Math.PI / 2;
    }

    this.updateProceduralAnimations();

    if (this.comboResetTimer > 0) {
      this.comboResetTimer--;
      if (this.comboResetTimer <= 0) this.comboCount = 0;
    }
  }

  updateProceduralAnimations() {
    const m = this.model;
    const t = this.animTime;

    if (this.state === 'idle') {
      m.pelvis.position.y = 1.6 + Math.sin(t * 3) * 0.03;
      m.spine.rotation.x = Math.sin(t * 3) * 0.03;
      m.leftArm.rotation.x = 0.4 + Math.sin(t * 3) * 0.05;
      m.rightArm.rotation.x = 0.5 + Math.sin(t * 3) * 0.05;
      m.lForeArm.rotation.x = -0.8;
      m.rForeArm.rotation.x = -0.9;
      m.leftLeg.rotation.x = 0;
      m.rightLeg.rotation.x = 0;
    } else if (this.state === 'walk') {
      const stride = Math.sin(t * 8) * 0.6;
      m.leftLeg.rotation.x = stride;
      m.rightLeg.rotation.x = -stride;
      m.leftArm.rotation.x = -stride * 0.7;
      m.rightArm.rotation.x = stride * 0.7;
    } else if (this.state === 'crouch') {
      m.pelvis.position.y = 1.1;
      m.leftLeg.rotation.x = 0.8;
      m.rightLeg.rotation.x = 0.8;
      m.leftArm.rotation.x = 1.2;
      m.rightArm.rotation.x = 1.2;
      m.lForeArm.rotation.x = -1.2;
      m.rForeArm.rotation.x = -1.2;
    } else if (this.state === 'punch') {
      m.rightArm.rotation.x = 1.5;
      m.rForeArm.rotation.x = -0.1;
    } else if (this.state === 'kick') {
      m.rightLeg.rotation.x = -1.6;
      m.spine.rotation.x = -0.3;
    } else if (this.state === 'special' || this.state === 'kombo') {
      m.rightArm.rotation.x = 2.0;
      m.leftArm.rotation.x = 1.4;
    } else if (this.state === 'hurt') {
      m.spine.rotation.x = -0.5;
      m.leftArm.rotation.x = -0.4;
      m.rightArm.rotation.x = -0.4;
    } else if (this.state === 'dazed') {
      m.pelvis.position.y = 1.55 + Math.sin(t * 2) * 0.04;
      m.spine.rotation.z = Math.sin(t * 2.5) * 0.15;
      m.headGroup.rotation.y = Math.sin(t * 3) * 0.3;
      m.leftArm.rotation.x = 0.2;
      m.rightArm.rotation.x = 0.2;
    }
  }
}

// ============================================================================
// 5. MOTOR PRINCIPAL 3D Y ADMINISTRADOR DEL JUEGO
// ============================================================================
class FatalStrike3DGame {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.p1Choice = 'mime';
    this.p2Choice = 'freddy';
    this.p1Ready = false;
    this.p2Ready = false;

    this.p1 = null;
    this.p2 = null;

    this.gameState = 'MENU_SELECT'; // MENU_SELECT, INTRO_ROUND, FIGHTING, FINISH_HIM, FATALITY_EXECUTION, ROUND_OVER, MATCH_OVER
    this.round = 1;
    this.timer = ROUND_TIME;
    this.timerInterval = null;
    this.isPaused = false;

    this.fatalityWinner = null;
    this.fatalityLoser = null;
    this.fatalityTimer = FATALITY_TIME;
    this.fatalityInterval = null;

    this.keys = {};
    this.particles3D = [];
    this.projectiles = [];
    this.bloodDecals = [];
    this.floatingTexts = [];

    this.initThreeJS();
    this.buildDojoStage();
    this.initDOM();
    this.initKeyboard();
    this.initCharacterSelect();
    this.initPreviewMiniRenderers();
    this.updateCharSelectUI();
    this.startLoop();
  }

  initThreeJS() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06060c);
    this.scene.fog = new THREE.FogExp2(0x1a080d, 0.025);

    const aspect = this.container.clientWidth / this.container.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.defaultCameraPos = new THREE.Vector3(0, 3.4, 11.5);
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(0, 2.0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x2d121c, 0.9);
    this.scene.add(ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffecd0, 1.5);
    this.dirLight.position.set(8, 16, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.scene.add(this.dirLight);

    this.rimLightL = new THREE.PointLight(0x0284c7, 2.0, 20);
    this.rimLightL.position.set(-10, 4, 3);
    this.scene.add(this.rimLightL);

    this.rimLightR = new THREE.PointLight(0xdc2626, 2.5, 20);
    this.rimLightR.position.set(10, 4, 3);
    this.scene.add(this.rimLightR);

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  buildDojoStage() {
    this.stageGroup = new THREE.Group();
    this.scene.add(this.stageGroup);

    // Suelo de madera noble lustrada
    const floorGeo = new THREE.PlaneGeometry(36, 18);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x22130e, roughness: 0.25, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.receiveShadow = true;
    this.stageGroup.add(floor);

    // Líneas de tablones de madera
    for (let p = -18; p <= 18; p += 1.5) {
      const plankLine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 18), new THREE.MeshBasicMaterial({ color: 0x120805 }));
      plankLine.position.set(p, FLOOR_Y + 0.005, 0);
      this.stageGroup.add(plankLine);
    }

    // Columnas y faroles del templo asiático
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });

    [-12, -6, 0, 6, 12].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 9, 12), pillarMat);
      pillar.position.set(px, 4.5, -6.5);
      pillar.castShadow = true;
      pillar.receiveShadow = true;

      const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.2), goldMat);
      base.position.set(px, 0.25, -6.5);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.4), goldMat);
      cap.position.set(px, 8.8, -6.5);

      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff4422 }));
      lantern.position.set(px, 5.5, -5.8);
      const torchLight = new THREE.PointLight(0xff5500, 1.2, 8);
      torchLight.position.set(px, 5.5, -5.8);

      this.stageGroup.add(pillar, base, cap, lantern, torchLight);
    });

    const railing = new THREE.Mesh(new THREE.BoxGeometry(32, 1.1, 0.3), new THREE.MeshStandardMaterial({ color: 0x3d170d }));
    railing.position.set(0, 0.55, -6.2);
    railing.castShadow = true;
    this.stageGroup.add(railing);

    // Luna carmesí de fondo
    const moon = new THREE.Mesh(new THREE.CircleGeometry(4.5, 32), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    moon.position.set(10, 14, -28);
    this.stageGroup.add(moon);
  }

  // ==========================================================================
  // MINI-RENDERERS THREE.JS PARA LAS TARJETAS DE SELECCIÓN (ENCUADRE PERFECTO)
  // ==========================================================================
  initPreviewMiniRenderers() {
    this.p1PreviewBox = document.getElementById('p1-preview-3d');
    this.p2PreviewBox = document.getElementById('p2-preview-3d');
    if (!this.p1PreviewBox || !this.p2PreviewBox) return;

    const w1 = this.p1PreviewBox.clientWidth || 210;
    const h1 = this.p1PreviewBox.clientHeight || 230;

    // Preview P1: Cámara perfectamente encuadrada de pies a cabeza sin cortes
    this.p1Scene = new THREE.Scene();
    this.p1Scene.background = new THREE.Color(0x0a0608);
    this.p1Cam = new THREE.PerspectiveCamera(36, w1 / h1, 0.1, 50);
    this.p1Cam.position.set(0, 1.45, 5.0);
    this.p1Cam.lookAt(0, 1.35, 0);

    const lightP1 = new THREE.DirectionalLight(0xfff5ea, 1.8);
    lightP1.position.set(3, 5, 4);
    const rimP1 = new THREE.DirectionalLight(0x00d2ff, 1.2);
    rimP1.position.set(-3, 3, -2);
    this.p1Scene.add(lightP1, rimP1, new THREE.AmbientLight(0xffffff, 0.7));

    this.p1Renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.p1Renderer.setSize(w1, h1);
    this.p1Renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.p1PreviewBox.innerHTML = '';
    this.p1PreviewBox.appendChild(this.p1Renderer.domElement);

    // Preview P2
    const w2 = this.p2PreviewBox.clientWidth || 210;
    const h2 = this.p2PreviewBox.clientHeight || 230;

    this.p2Scene = new THREE.Scene();
    this.p2Scene.background = new THREE.Color(0x0a0608);
    this.p2Cam = new THREE.PerspectiveCamera(36, w2 / h2, 0.1, 50);
    this.p2Cam.position.set(0, 1.45, 5.0);
    this.p2Cam.lookAt(0, 1.35, 0);

    const lightP2 = new THREE.DirectionalLight(0xfff5ea, 1.8);
    lightP2.position.set(-3, 5, 4);
    const rimP2 = new THREE.DirectionalLight(0xff0044, 1.2);
    rimP2.position.set(3, 3, -2);
    this.p2Scene.add(lightP2, rimP2, new THREE.AmbientLight(0xffffff, 0.7));

    this.p2Renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.p2Renderer.setSize(w2, h2);
    this.p2Renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.p2PreviewBox.innerHTML = '';
    this.p2PreviewBox.appendChild(this.p2Renderer.domElement);

    this.p1PreviewModel = null;
    this.p2PreviewModel = null;
    this.updatePreviewModels();
  }

  updatePreviewModels() {
    if (this.p1PreviewModel && this.p1Scene) this.p1Scene.remove(this.p1PreviewModel);
    if (this.p2PreviewModel && this.p2Scene) this.p2Scene.remove(this.p2PreviewModel);

    // Construir modelos síncronamente y escalarlos para encaje exacto
    const p1Built = Character3DBuilder.build(this.p1Choice);
    this.p1PreviewModel = p1Built.root;
    this.p1PreviewModel.position.set(0, -0.05, 0);
    this.p1PreviewModel.scale.set(0.82, 0.82, 0.82);
    if (this.p1Scene) {
      this.p1Scene.add(this.p1PreviewModel);
      if (this.p1Renderer && this.p1Cam) this.p1Renderer.render(this.p1Scene, this.p1Cam);
    }

    const p2Built = Character3DBuilder.build(this.p2Choice);
    this.p2PreviewModel = p2Built.root;
    this.p2PreviewModel.position.set(0, -0.05, 0);
    this.p2PreviewModel.scale.set(0.82, 0.82, 0.82);
    if (this.p2Scene) {
      this.p2Scene.add(this.p2PreviewModel);
      if (this.p2Renderer && this.p2Cam) this.p2Renderer.render(this.p2Scene, this.p2Cam);
    }
  }

  // ==========================================================================
  // MENÚ DE PAUSA INTERACTIVO (TECLA ESC)
  // ==========================================================================
  togglePause() {
    if (this.gameState === 'MENU_SELECT') return;

    this.isPaused = !this.isPaused;
    const pauseModal = document.getElementById('pause-modal');

    if (this.isPaused) {
      pauseModal.classList.remove('hidden');
    } else {
      pauseModal.classList.add('hidden');
    }
  }

  // Fatal Blow Cinemático
  executeFatalBlowCinematic(attacker, defender) {
    const isP1 = attacker === this.p1;
    const beamColor = attacker.data.beamColor;

    document.querySelectorAll('.cinematic-bar').forEach(b => b.classList.add('active'));

    const targetCamX = (attacker.x + defender.x) / 2;
    gsap.to(this.camera.position, {
      x: targetCamX + (isP1 ? 2.8 : -2.8),
      y: 1.8,
      z: 5.5,
      duration: 0.45,
      ease: 'power3.out'
    });

    const beamLength = Math.abs(attacker.x - defender.x) + 4.0;
    const beamGeo = new THREE.CylinderGeometry(0.14, 0.14, beamLength, 16);
    const beamMat = new THREE.MeshBasicMaterial({ color: beamColor, transparent: true, opacity: 0.95 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(attacker.x + (attacker.facing * beamLength) / 2, 1.7, 0);
    this.scene.add(beam);

    const ringGeo = new THREE.TorusGeometry(0.65, 0.08, 12, 24);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ring.rotation.y = Math.PI / 2;
    ring.position.set((attacker.x + defender.x) / 2, 1.7, 0);
    this.scene.add(ring);

    setTimeout(() => {
      defender.takeDamage(260, attacker.facing * 0.7, false);
      sounds.playFatalityGore();
      this.spawn3DBloodExplosion(defender.x, 1.7, 50);

      this.scene.remove(beam);
      this.scene.remove(ring);

      document.querySelectorAll('.cinematic-bar').forEach(b => b.classList.remove('active'));
      gsap.to(this.camera.position, {
        x: (this.p1.x + this.p2.x) / 2,
        y: this.defaultCameraPos.y,
        z: this.defaultCameraPos.z,
        duration: 0.6,
        ease: 'power2.out'
      });
    }, 950);
  }

  // ==========================================================================
  // FATALITIES INDIVIDUALES SCRIPTADAS EN 3D
  // ==========================================================================
  executeFatalityCinematic() {
    this.gameState = 'FATALITY_EXECUTION';
    const winner = this.fatalityWinner;
    const loser = this.fatalityLoser;

    winner.state = 'fatality_killer';
    loser.state = 'fatality_victim';

    document.querySelectorAll('.cinematic-bar').forEach(b => b.classList.add('active'));

    sounds.playFatalityGore();
    sounds.speak('FATALITY');
    this.showAnnouncer('FATALITY', `${winner.data.name.toUpperCase()} WINS`, 4000, null, true);

    const orbitTarget = { angle: 0, dist: 6.5, height: 2.2 };
    const centerPoint = new THREE.Vector3((winner.x + loser.x) / 2, 1.6, 0);

    gsap.to(orbitTarget, {
      angle: Math.PI * 1.5,
      dist: 5.0,
      height: 1.6,
      duration: 3.2,
      ease: 'power1.inOut',
      onUpdate: () => {
        this.camera.position.x = centerPoint.x + Math.sin(orbitTarget.angle) * orbitTarget.dist;
        this.camera.position.z = centerPoint.z + Math.cos(orbitTarget.angle) * orbitTarget.dist;
        this.camera.position.y = orbitTarget.height;
        this.camera.lookAt(centerPoint);
      }
    });

    // Fatality única según el personaje vencedor
    if (winner.characterKey === 'mime') {
      // Art the Clown: Decapitación lenta con cuchillo de carnicero y geiser de sangre
      gsap.to(winner.mesh.position, {
        x: loser.x - loser.facing * 0.9,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          sounds.playBladeSlash();
          sounds.playFatalityGore();
          if (loser.model && loser.model.headGroup) {
            gsap.to(loser.model.headGroup.position, {
              y: 4.8,
              x: loser.facing * -2.2,
              duration: 1.0,
              ease: 'power2.out'
            });
            gsap.to(loser.model.headGroup.rotation, { z: Math.PI * 4, duration: 1.0 });
          }
          this.spawn3DBloodExplosion(loser.x, 2.4, 110);
          loser.triggerKnockdown();
        }
      });
    } else if (winner.characterKey === 'penny') {
      // Pennywise: Globo gigante cósmico que absorbe al rival y detona en niebla carmesí
      const bigBalloon = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, transparent: true, opacity: 0.85, roughness: 0.2 })
      );
      bigBalloon.position.set(loser.x, 1.8, 0);
      this.scene.add(bigBalloon);

      gsap.to(bigBalloon.scale, {
        x: 1.9, y: 1.9, z: 1.9, duration: 1.3, ease: 'power2.in',
        onComplete: () => {
          this.scene.remove(bigBalloon);
          loser.mesh.visible = false;
          sounds.playFatalityGore();
          this.spawn3DBloodExplosion(loser.x, 1.8, 120);
        }
      });
    } else if (winner.characterKey === 'freddy') {
      // Freddy Krueger: Embestida con garras cruzadas atravesando el pecho y llamas infernales
      gsap.to(winner.mesh.position, {
        x: loser.x - loser.facing * 0.75,
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => {
          sounds.playBladeSlash();
          sounds.playMetalClang();
          sounds.playFatalityGore();
          this.spawn3DFireExplosion(loser.x, 1.6, 60);
          this.spawn3DBloodExplosion(loser.x, 1.6, 70);
          loser.triggerKnockdown();
        }
      });
    }

    setTimeout(() => {
      const isFlawless = winner.health >= winner.maxHealth;
      if (isFlawless) sounds.speak('FLAWLESS VICTORY');
      this.concludeRound(winner, true);
    }, 3800);
  }

  // Generación de Entidades Especiales 3D
  spawnBladeProjectile(fighter) {
    const geo = new THREE.TorusGeometry(0.5, 0.08, 8, 16, Math.PI * 0.8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(fighter.x + fighter.facing * 0.8, fighter.y + 1.4, 0);
    mesh.rotation.y = fighter.facing === 1 ? 0 : Math.PI;
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      vx: fighter.facing * 0.28,
      owner: fighter,
      life: 55,
      damage: 110,
      type: 'blade'
    });
  }

  spawnBalloonProjectile(fighter) {
    const geo = new THREE.SphereGeometry(0.35, 14, 14);
    const mat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(fighter.x + fighter.facing * 0.8, fighter.y + 1.5, 0);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      vx: fighter.facing * 0.18,
      owner: fighter,
      life: 70,
      damage: 115,
      type: 'balloon'
    });
  }

  spawnFireClawProjectile(fighter) {
    const group = new THREE.Group();
    group.position.set(fighter.x + fighter.facing * 0.8, fighter.y + 1.4, 0);
    for (let i = 0; i < 4; i++) {
      const slash = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.4, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xea580c })
      );
      slash.position.set(0, (i - 1.5) * 0.12, 0);
      slash.rotation.z = fighter.facing * -0.4;
      group.add(slash);
    }
    this.scene.add(group);

    this.projectiles.push({
      mesh: group,
      vx: fighter.facing * 0.25,
      owner: fighter,
      life: 50,
      damage: 120,
      type: 'fire_claw'
    });
  }

  spawnShockwaveRing(x, y, color) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.65, 24),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, y, 0);
    this.scene.add(ring);

    gsap.to(ring.scale, {
      x: 6.0, y: 6.0, z: 6.0, duration: 0.55, ease: 'power2.out',
      onComplete: () => this.scene.remove(ring)
    });
    gsap.to(ring.material, { opacity: 0, duration: 0.55 });
  }

  spawnSonicWaves(fighter) {
    for (let w = 0; w < 3; w++) {
      setTimeout(() => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.4 + w * 0.2, 0.05, 8, 20),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 })
        );
        ring.rotation.y = Math.PI / 2;
        ring.position.set(fighter.x + fighter.facing * 0.5, fighter.y + 1.8, 0);
        this.scene.add(ring);

        gsap.to(ring.position, { x: fighter.x + fighter.facing * 6.0, duration: 0.6, ease: 'power1.out' });
        gsap.to(ring.scale, { x: 3.5, y: 3.5, z: 3.5, duration: 0.6, onComplete: () => this.scene.remove(ring) });
        gsap.to(ring.material, { opacity: 0, duration: 0.6 });
      }, w * 120);
    }
  }

  spawn3DBloodExplosion(x, y, count) {
    const bloodMat = new THREE.MeshBasicMaterial({ color: 0x990000 });
    for (let i = 0; i < count; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.05, 6, 6), bloodMat);
      drop.position.set(x, y, (Math.random() - 0.5) * 0.8);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.35,
        Math.random() * 0.3 + 0.1,
        (Math.random() - 0.5) * 0.35
      );
      this.scene.add(drop);
      this.particles3D.push({ mesh: drop, vel, life: 60 });
    }

    if (this.bloodDecals.length < 80) {
      const decal = new THREE.Mesh(
        new THREE.CircleGeometry(0.35 + Math.random() * 0.3, 12),
        new THREE.MeshBasicMaterial({ color: 0x660000, transparent: true, opacity: 0.85 })
      );
      decal.rotation.x = -Math.PI / 2;
      decal.position.set(x + (Math.random() - 0.5) * 0.6, FLOOR_Y + 0.015, (Math.random() - 0.5) * 0.6);
      this.scene.add(decal);
      this.bloodDecals.push(decal);
    }
  }

  spawn3DFireExplosion(x, y, count) {
    const fireColors = [0xff4400, 0xffaa00, 0xdc2626];
    for (let i = 0; i < count; i++) {
      const pMat = new THREE.MeshBasicMaterial({ color: fireColors[Math.floor(Math.random() * fireColors.length)] });
      const spark = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), pMat);
      spark.position.set(x, y, (Math.random() - 0.5) * 0.6);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        Math.random() * 0.3 + 0.12,
        (Math.random() - 0.5) * 0.25
      );
      this.scene.add(spark);
      this.particles3D.push({ mesh: spark, vel, life: 45 });
    }
  }

  spawnCombatText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color, life: 45 });
  }

  initDOM() {
    this.dom = {
      hudOverlay: document.getElementById('hud-overlay'),
      selectScreen: document.getElementById('select-screen'),
      matchOverScreen: document.getElementById('match-over-screen'),
      pauseModal: document.getElementById('pause-modal'),
      movelistModal: document.getElementById('movelist-modal'),
      controlsModal: document.getElementById('controls-modal'),
      announcerOverlay: document.getElementById('announcer-overlay'),
      announcerTitle: document.getElementById('announcer-title'),
      announcerSub: document.getElementById('announcer-subtitle'),
      fatalityTimerBar: document.getElementById('fatality-timer-bar'),
      fatalityTimerFill: document.getElementById('fatality-timer-fill'),
      fatalityTimerText: document.getElementById('fatality-timer-text'),

      p1Name: document.getElementById('p1-name'),
      p1HealthFill: document.getElementById('p1-health-fill'),
      p1HealthGhost: document.getElementById('p1-health-ghost'),
      p1HealthText: document.getElementById('p1-health-text'),
      p1EnergyFill: document.getElementById('p1-energy-fill'),
      p1EnergyText: document.getElementById('p1-energy-text'),
      p1Rounds: document.getElementById('p1-rounds'),
      p1Combo: document.getElementById('p1-combo'),

      p2Name: document.getElementById('p2-name'),
      p2HealthFill: document.getElementById('p2-health-fill'),
      p2HealthGhost: document.getElementById('p2-health-ghost'),
      p2HealthText: document.getElementById('p2-health-text'),
      p2EnergyFill: document.getElementById('p2-energy-fill'),
      p2EnergyText: document.getElementById('p2-energy-text'),
      p2Rounds: document.getElementById('p2-rounds'),
      p2Combo: document.getElementById('p2-combo'),

      roundTimer: document.getElementById('round-timer'),
      roundBadge: document.getElementById('round-badge'),

      btnStartFight: document.getElementById('btn-start-fight'),
      btnRematch: document.getElementById('btn-rematch'),
      btnChangeFighters: document.getElementById('btn-change-fighters'),
      btnToggleSound: document.getElementById('btn-toggle-sound'),
      btnOpenMovelist: document.getElementById('btn-open-movelist'),
      btnQuickMovelist: document.getElementById('btn-quick-movelist'),
      btnCloseMovelist: document.getElementById('btn-close-movelist'),
      btnToggleControls: document.getElementById('btn-toggle-controls'),
      btnCloseControls: document.getElementById('btn-close-controls'),

      btnPauseMenu: document.getElementById('btn-pause-menu'),
      btnPauseResume: document.getElementById('btn-pause-resume'),
      btnPauseRestart: document.getElementById('btn-pause-restart'),
      btnPauseMovelist: document.getElementById('btn-pause-movelist'),
      btnPauseSelect: document.getElementById('btn-pause-select')
    };

    // Eventos UI
    this.dom.btnStartFight.addEventListener('click', () => {
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
      this.dom.btnToggleSound.textContent = sounds.enabled ? '🔊 AUDIO' : '🔇 MUDO';
    });

    this.dom.btnOpenMovelist.addEventListener('click', () => this.dom.movelistModal.classList.remove('hidden'));
    this.dom.btnQuickMovelist.addEventListener('click', () => this.dom.movelistModal.classList.remove('hidden'));
    this.dom.btnCloseMovelist.addEventListener('click', () => this.dom.movelistModal.classList.add('hidden'));

    this.dom.btnToggleControls.addEventListener('click', () => this.dom.controlsModal.classList.toggle('hidden'));
    this.dom.btnCloseControls.addEventListener('click', () => this.dom.controlsModal.classList.add('hidden'));

    this.dom.btnPauseMenu.addEventListener('click', () => this.togglePause());
    this.dom.btnPauseResume.addEventListener('click', () => this.togglePause());
    this.dom.btnPauseRestart.addEventListener('click', () => {
      this.togglePause();
      this.startMatch();
    });
    this.dom.btnPauseMovelist.addEventListener('click', () => {
      this.dom.movelistModal.classList.remove('hidden');
    });
    this.dom.btnPauseSelect.addEventListener('click', () => {
      this.togglePause();
      this.openCharacterSelect();
    });

    // Pestañas de movimientos
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = document.getElementById(btn.dataset.tab);
        if (targetTab) targetTab.classList.add('active');
      });
    });
  }

  initKeyboard() {
    document.addEventListener('click', () => sounds.init(), { once: true });

    window.addEventListener('keydown', e => {
      sounds.init();

      if (e.code === 'Escape') {
        this.togglePause();
        e.preventDefault();
        return;
      }

      if (this.isPaused) return;

      this.keys[e.code] = true;
      this.keys[e.key] = true;

      // Filtrar e.repeat para que las secuencias del buffer se registren limpiamente
      if (!e.repeat) {
        if (this.p1) this.p1.registerInput(e.code);
        if (this.p2) this.p2.registerInput(e.code);
      }

      if (this.gameState === 'FINISH_HIM') {
        this.checkFatalityTrigger();
      }

      if (this.gameState === 'MENU_SELECT') {
        const charKeys = Object.keys(CHARACTER_DATA);

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

        if (e.code === 'KeyF' || e.code === 'KeyG') this.toggleP1Ready();
        if (e.code === 'KeyK' || e.code === 'KeyL') this.toggleP2Ready();

        if (e.code === 'Enter') {
          if (!this.p1Ready) this.toggleP1Ready();
          if (!this.p2Ready) this.toggleP2Ready();
          if (this.p1Ready && this.p2Ready) this.startMatch();
        }
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      this.keys[e.key] = false;
    });
  }

  toggleP1Ready() {
    this.p1Ready = !this.p1Ready;
    sounds.playMetalClang();
    this.updateCharSelectUI();
    this.checkBothReady();
  }

  toggleP2Ready() {
    this.p2Ready = !this.p2Ready;
    sounds.playMetalClang();
    this.updateCharSelectUI();
    this.checkBothReady();
  }

  initCharacterSelect() {
    const p1Container = document.getElementById('p1-char-buttons');
    const p2Container = document.getElementById('p2-char-buttons');
    const p1ReadyBtn = document.getElementById('p1-ready-btn');
    const p2ReadyBtn = document.getElementById('p2-ready-btn');

    if (p1Container) p1Container.innerHTML = '';
    if (p2Container) p2Container.innerHTML = '';

    Object.keys(CHARACTER_DATA).forEach((key) => {
      const char = CHARACTER_DATA[key];

      // Botón P1
      if (p1Container) {
        const btn1 = document.createElement('button');
        btn1.className = `char-select-btn ${key === this.p1Choice ? 'active' : ''}`;
        btn1.textContent = char.name;
        btn1.addEventListener('click', () => {
          if (this.p1Ready) return;
          this.p1Choice = key;
          sounds.playPunch();
          this.updateCharSelectUI();
        });
        p1Container.appendChild(btn1);
      }

      // Botón P2
      if (p2Container) {
        const btn2 = document.createElement('button');
        btn2.className = `char-select-btn ${key === this.p2Choice ? 'active' : ''}`;
        btn2.textContent = char.name;
        btn2.addEventListener('click', () => {
          if (this.p2Ready) return;
          this.p2Choice = key;
          sounds.playKick();
          this.updateCharSelectUI();
        });
        p2Container.appendChild(btn2);
      }
    });

    if (p1ReadyBtn) {
      p1ReadyBtn.addEventListener('click', () => this.toggleP1Ready());
    }
    if (p2ReadyBtn) {
      p2ReadyBtn.addEventListener('click', () => this.toggleP2Ready());
    }
  }

  checkBothReady() {
    const btn = document.getElementById('btn-start-fight') || this.dom.btnStartFight;
    if (this.p1Ready && this.p2Ready) {
      if (btn) {
        btn.disabled = false;
        btn.classList.add('pulse-ready');
      }
    } else {
      if (btn) {
        btn.disabled = true;
        btn.classList.remove('pulse-ready');
      }
    }
  }

  updateCharSelectUI() {
    const p1Data = CHARACTER_DATA[this.p1Choice];
    const p2Data = CHARACTER_DATA[this.p2Choice];

    const p1Name = document.getElementById('p1-selected-name');
    if (p1Name) p1Name.textContent = p1Data.name;
    const p1Skin = document.getElementById('p1-selected-skin');
    if (p1Skin) p1Skin.textContent = `SKIN: ${p1Data.skinName}`;
    const p1Desc = document.getElementById('p1-selected-desc');
    if (p1Desc) p1Desc.textContent = p1Data.desc;
    const p1Spd = document.getElementById('p1-stat-speed');
    if (p1Spd) p1Spd.style.width = `${p1Data.stats.speed}%`;
    const p1Pow = document.getElementById('p1-stat-power');
    if (p1Pow) p1Pow.style.width = `${p1Data.stats.power}%`;
    const p1Def = document.getElementById('p1-stat-defense');
    if (p1Def) p1Def.style.width = `${p1Data.stats.defense}%`;

    const p2Name = document.getElementById('p2-selected-name');
    if (p2Name) p2Name.textContent = p2Data.name;
    const p2Skin = document.getElementById('p2-selected-skin');
    if (p2Skin) p2Skin.textContent = `SKIN: ${p2Data.skinName}`;
    const p2Desc = document.getElementById('p2-selected-desc');
    if (p2Desc) p2Desc.textContent = p2Data.desc;
    const p2Spd = document.getElementById('p2-stat-speed');
    if (p2Spd) p2Spd.style.width = `${p2Data.stats.speed}%`;
    const p2Pow = document.getElementById('p2-stat-power');
    if (p2Pow) p2Pow.style.width = `${p2Data.stats.power}%`;
    const p2Def = document.getElementById('p2-stat-defense');
    if (p2Def) p2Def.style.width = `${p2Data.stats.defense}%`;

    // Resaltar botones activos
    document.querySelectorAll('#p1-char-buttons .char-select-btn').forEach((btn, idx) => {
      const key = Object.keys(CHARACTER_DATA)[idx];
      btn.classList.toggle('active', key === this.p1Choice);
    });
    document.querySelectorAll('#p2-char-buttons .char-select-btn').forEach((btn, idx) => {
      const key = Object.keys(CHARACTER_DATA)[idx];
      btn.classList.toggle('active', key === this.p2Choice);
    });

    const btnReadyP1 = document.getElementById('p1-ready-btn');
    if (btnReadyP1) {
      btnReadyP1.classList.toggle('ready-active', this.p1Ready);
      btnReadyP1.textContent = this.p1Ready ? '✓ JUGADOR 1 LISTO (F)' : '¡LISTO P1! [F / ENTER]';
    }

    const btnReadyP2 = document.getElementById('p2-ready-btn');
    if (btnReadyP2) {
      btnReadyP2.classList.toggle('ready-active', this.p2Ready);
      btnReadyP2.textContent = this.p2Ready ? '✓ JUGADOR 2 LISTO (K)' : '¡LISTO P2! [K / ENTER]';
    }

    this.checkBothReady();
    this.updatePreviewModels();
  }

  openCharacterSelect() {
    this.gameState = 'MENU_SELECT';
    this.p1Ready = false;
    this.p2Ready = false;
    this.isPaused = false;
    clearInterval(this.timerInterval);
    clearInterval(this.fatalityInterval);

    if (this.p1) this.scene.remove(this.p1.mesh);
    if (this.p2) this.scene.remove(this.p2.mesh);
    this.p1 = null;
    this.p2 = null;

    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.projectiles = [];

    this.dom.hudOverlay.classList.add('hidden');
    this.dom.matchOverScreen.classList.add('hidden');
    this.dom.pauseModal.classList.add('hidden');
    this.dom.announcerOverlay.classList.add('hidden');
    this.dom.selectScreen.classList.remove('hidden');

    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(0, 2.0, 0);

    this.updateCharSelectUI();
  }

  startMatch() {
    this.gameState = 'INTRO_ROUND';
    this.round = 1;
    this.p1Ready = false;
    this.p2Ready = false;
    this.isPaused = false;
    this.fatalityWinner = null;
    this.fatalityLoser = null;

    this.dom.selectScreen.classList.add('hidden');
    this.dom.matchOverScreen.classList.add('hidden');
    this.dom.pauseModal.classList.add('hidden');
    this.dom.hudOverlay.classList.remove('hidden');

    if (this.p1) this.scene.remove(this.p1.mesh);
    if (this.p2) this.scene.remove(this.p2.mesh);

    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.projectiles = [];

    // Instanciar luchadores 3D
    this.p1 = new Fighter3D(1, this.p1Choice, -5.5, 1);
    this.p2 = new Fighter3D(2, this.p2Choice, 5.5, -1);
    this.scene.add(this.p1.mesh, this.p2.mesh);

    this.dom.p1Name.textContent = this.p1.data.name.toUpperCase();
    this.dom.p2Name.textContent = this.p2.data.name.toUpperCase();

    this.startRound();
  }

  startRound() {
    this.gameState = 'INTRO_ROUND';
    this.timer = ROUND_TIME;
    this.dom.roundTimer.textContent = this.timer;
    this.dom.roundBadge.textContent = this.round <= 2 ? `ROUND ${this.round}` : 'FINAL ROUND';

    this.p1.reset(-5.5, 1);
    this.p2.reset(5.5, -1);

    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.projectiles = [];

    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(0, 2.0, 0);

    const roundText = this.round <= 2 ? `ROUND ${this.round}` : 'FINAL ROUND';
    sounds.speak(roundText);
    this.showAnnouncer(roundText, 'FIGHT!', 1700, () => {
      this.gameState = 'FIGHTING';
      sounds.speak('FIGHT');
      this.startTimer();
    });
  }

  showAnnouncer(title, sub, duration = 1500, callback = null, isFatality = false) {
    this.dom.announcerTitle.textContent = title;
    this.dom.announcerSub.textContent = sub;
    this.dom.announcerOverlay.classList.remove('hidden');

    this.dom.announcerTitle.classList.toggle('fatality-text', isFatality);

    gsap.fromTo(this.dom.announcerTitle, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.7)' });

    setTimeout(() => {
      if (this.gameState !== 'FATALITY_EXECUTION' && this.gameState !== 'FINISH_HIM') {
        this.dom.announcerOverlay.classList.add('hidden');
      }
      if (callback) callback();
    }, duration);
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.gameState === 'FIGHTING' && !this.isPaused) {
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
    let winner = null;
    if (this.p1.health > this.p2.health) winner = this.p1;
    else if (this.p2.health > this.p1.health) winner = this.p2;

    sounds.speak('TIME OVER');
    this.showAnnouncer('TIME OVER', winner ? `${winner.data.name.toUpperCase()} WINS` : 'EMPATE', 2200, () => {
      if (winner) this.concludeRound(winner);
      else this.concludeRound(null, false, true);
    });
  }

  checkRoundEnd() {
    if (this.gameState !== 'FIGHTING') return;

    if (this.p1.health <= 0 || this.p2.health <= 0) {
      clearInterval(this.timerInterval);
      const p1Dead = this.p1.health <= 0;
      const p2Dead = this.p2.health <= 0;

      const winner = p1Dead ? this.p2 : this.p1;
      const loser = p1Dead ? this.p1 : this.p2;

      const isFinalRound = (winner.roundsWon === MAX_ROUNDS_TO_WIN - 1);

      if (isFinalRound) {
        // Fase Finish Him en la ronda definitiva
        this.triggerFinishHim(winner, loser);
      } else {
        this.gameState = 'ROUND_OVER';
        sounds.speak('K.O.');
        this.showAnnouncer('K.O.', `${winner.data.name.toUpperCase()} WINS`, 2000, () => {
          this.concludeRound(winner);
        });
        loser.triggerKnockdown();
      }
    }
  }

  triggerFinishHim(winner, loser) {
    this.gameState = 'FINISH_HIM';
    this.fatalityWinner = winner;
    this.fatalityLoser = loser;
    this.fatalityTimer = FATALITY_TIME;

    loser.state = 'dazed';
    loser.vx = 0;
    loser.vy = 0;

    sounds.playAnnouncerBass();
    sounds.speak('FINISH HIM');
    this.showAnnouncer('FINISH HIM!', '¡EJECUTA LA FATALITY!', 2500, null, true);

    this.dom.fatalityTimerBar.classList.remove('hidden');

    gsap.to(this.camera.position, {
      x: (winner.x + loser.x) / 2,
      y: 2.1,
      z: 7.2,
      duration: 0.9,
      ease: 'power2.out'
    });

    clearInterval(this.fatalityInterval);
    this.fatalityInterval = setInterval(() => {
      if (this.gameState !== 'FINISH_HIM' || this.isPaused) return;

      sounds.playHeartbeat();
      this.fatalityTimer -= 0.1;
      const pct = (this.fatalityTimer / FATALITY_TIME) * 100;
      this.dom.fatalityTimerFill.style.width = `${pct}%`;
      this.dom.fatalityTimerText.textContent = `TIEMPO FATALITY: ${Math.max(0, this.fatalityTimer).toFixed(1)}s`;

      if (this.fatalityTimer <= 0) {
        clearInterval(this.fatalityInterval);
        this.dom.fatalityTimerBar.classList.add('hidden');
        if (this.gameState === 'FINISH_HIM') {
          this.executeStandardKO();
        }
      }
    }, 100);
  }

  checkFatalityTrigger() {
    if (!this.fatalityWinner) return;
    const winner = this.fatalityWinner;
    const isP1 = winner === this.p1;
    const comboSeq = isP1 ? winner.data.fatalityComboP1 : winner.data.fatalityComboP2;

    if (winner.checkSequence(comboSeq)) {
      clearInterval(this.fatalityInterval);
      this.dom.fatalityTimerBar.classList.add('hidden');
      this.executeFatalityCinematic();
    }
  }

  // Knockdown y caída limpia de fin de ronda si no se ejecuta Fatality
  executeStandardKO() {
    const winner = this.fatalityWinner;
    const loser = this.fatalityLoser;
    this.gameState = 'ROUND_OVER';

    sounds.speak(`${winner.data.name} WINS`);
    this.showAnnouncer('K.O.', `${winner.data.name.toUpperCase()} WINS`, 2500, () => {
      this.concludeRound(winner);
    });
    loser.triggerKnockdown();
  }

  concludeRound(winner, isFatality = false, isDraw = false) {
    clearInterval(this.timerInterval);
    clearInterval(this.fatalityInterval);
    this.dom.fatalityTimerBar.classList.add('hidden');
    this.dom.announcerOverlay.classList.add('hidden');
    document.querySelectorAll('.cinematic-bar').forEach(b => b.classList.remove('active'));

    if (winner) {
      winner.roundsWon++;
      this.updateRoundIndicators();
    }

    const matchOver = this.p1.roundsWon >= MAX_ROUNDS_TO_WIN || this.p2.roundsWon >= MAX_ROUNDS_TO_WIN;

    if (matchOver) {
      this.gameState = 'MATCH_OVER';
      const grandWinner = this.p1.roundsWon >= MAX_ROUNDS_TO_WIN ? this.p1 : this.p2;
      grandWinner.state = 'win';

      const winTitle = document.getElementById('match-winner-title');
      if (winTitle) winTitle.textContent = isFatality ? '¡FATALITY SANGRIENTA!' : '¡VICTORIA TOTAL!';
      const winSub = document.getElementById('match-winner-subtitle');
      if (winSub) winSub.textContent = `${grandWinner.data.name.toUpperCase()} (${grandWinner.data.skinName.toUpperCase()}) GANA EL COMBATE`;

      setTimeout(() => {
        this.dom.matchOverScreen.classList.remove('hidden');
      }, 1200);
    } else {
      this.round++;
      setTimeout(() => this.startRound(), 1600);
    }
  }

  checkMeleeCollisions() {
    if (this.gameState !== 'FIGHTING') return;

    // Colisión P1 atacando a P2
    if (this.p1.attackBox.active && !this.p1.hasHitCurrentAttack) {
      if (this.testOverlap(this.p1.attackBox, this.p2)) {
        this.p1.hasHitCurrentAttack = true;
        this.p1.comboCount++;
        this.p1.comboResetTimer = 45;
        this.p2.takeDamage(this.p1.attackBox.damage, this.p1.attackBox.knockback);
        this.p1.addEnergy(10);
      }
    }

    // Colisión P2 atacando a P1
    if (this.p2.attackBox.active && !this.p2.hasHitCurrentAttack) {
      if (this.testOverlap(this.p2.attackBox, this.p1)) {
        this.p2.hasHitCurrentAttack = true;
        this.p2.comboCount++;
        this.p2.comboResetTimer = 45;
        this.p1.takeDamage(this.p2.attackBox.damage, this.p2.attackBox.knockback);
        this.p2.addEnergy(10);
      }
    }

    // Colisiones de proyectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.mesh.position.x += proj.vx;
      proj.life--;

      const target = proj.owner === this.p1 ? this.p2 : this.p1;
      const hitDist = Math.abs(proj.mesh.position.x - target.x);

      if (hitDist < 1.1 && Math.abs(proj.mesh.position.y - (target.y + 1.2)) < 1.3) {
        target.takeDamage(proj.damage, proj.owner.facing * 0.35, true);
        if (proj.type === 'balloon') {
          sounds.playFatalityGore();
          this.spawn3DBloodExplosion(proj.mesh.position.x, proj.mesh.position.y, 35);
        } else if (proj.type === 'fire_claw') {
          sounds.playMetalClang();
          this.spawn3DFireExplosion(proj.mesh.position.x, proj.mesh.position.y, 30);
        } else {
          sounds.playBladeSlash();
          this.spawn3DBloodExplosion(proj.mesh.position.x, proj.mesh.position.y, 25);
        }
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.life <= 0) {
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  testOverlap(atkBox, defender) {
    const defLeft = defender.x - defender.width / 2;
    const defRight = defender.x + defender.width / 2;
    const defTop = defender.y + (defender.isCrouching ? defender.height * 0.6 : defender.height);
    const defBottom = defender.y;

    const atkLeft = atkBox.x;
    const atkRight = atkBox.x + atkBox.width;
    const atkTop = atkBox.y + atkBox.height;
    const atkBottom = atkBox.y;

    return (
      atkRight >= defLeft &&
      atkLeft <= defRight &&
      atkTop >= defBottom &&
      atkBottom <= defTop
    );
  }

  updateHUD() {
    if (!this.p1 || !this.p2) return;

    // P1 Barras
    const p1HpPct = Math.max(0, (this.p1.health / this.p1.maxHealth) * 100);
    this.dom.p1HealthFill.style.width = `${p1HpPct}%`;
    this.dom.p1HealthText.textContent = `${Math.ceil(p1HpPct)}%`;

    const p1EnPct = Math.min(100, (this.p1.energy / this.p1.maxEnergy) * 100);
    this.dom.p1EnergyFill.style.width = `${p1EnPct}%`;
    this.dom.p1EnergyText.textContent = p1EnPct >= 100 ? '¡FATAL BLOW LISTO! [H]' : `FATAL BLOW: ${Math.floor(p1EnPct)}%`;
    this.dom.p1EnergyFill.classList.toggle('ready', p1EnPct >= 100);

    // P2 Barras
    const p2HpPct = Math.max(0, (this.p2.health / this.p2.maxHealth) * 100);
    this.dom.p2HealthFill.style.width = `${p2HpPct}%`;
    this.dom.p2HealthText.textContent = `${Math.ceil(p2HpPct)}%`;

    const p2EnPct = Math.min(100, (this.p2.energy / this.p2.maxEnergy) * 100);
    this.dom.p2EnergyFill.style.width = `${p2EnPct}%`;
    this.dom.p2EnergyText.textContent = p2EnPct >= 100 ? '¡FATAL BLOW LISTO! [Ñ/;/P]' : `FATAL BLOW: ${Math.floor(p2EnPct)}%`;
    this.dom.p2EnergyFill.classList.toggle('ready', p2EnPct >= 100);

    // Contadores de Kombo
    this.dom.p1Combo.textContent = this.p1.comboCount > 1 ? `${this.p1.comboCount} HITS KOMBO!` : '';
    this.dom.p2Combo.textContent = this.p2.comboCount > 1 ? `${this.p2.comboCount} HITS KOMBO!` : '';
  }

  updateRoundIndicators() {
    const p1Skulls = this.dom.p1Rounds.querySelectorAll('.skull-dot');
    p1Skulls.forEach((s, idx) => {
      s.classList.toggle('won', idx < this.p1.roundsWon);
    });

    const p2Skulls = this.dom.p2Rounds.querySelectorAll('.skull-dot');
    p2Skulls.forEach((s, idx) => {
      s.classList.toggle('won', idx < this.p2.roundsWon);
    });

    this.dom.roundBadge.textContent = this.round <= 2 ? `ROUND ${this.round}` : 'FINAL ROUND';
  }

  // Bucle Principal WebGL a 60 FPS
  startLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      // Si está en menú de selección, rotar modelos de preview continuamente
      if (this.gameState === 'MENU_SELECT') {
        if (this.p1PreviewModel) this.p1PreviewModel.rotation.y += 0.015;
        if (this.p2PreviewModel) this.p2PreviewModel.rotation.y += 0.015;

        if (this.p1Renderer && this.p1Scene && this.p1Cam) this.p1Renderer.render(this.p1Scene, this.p1Cam);
        if (this.p2Renderer && this.p2Scene && this.p2Cam) this.p2Renderer.render(this.p2Scene, this.p2Cam);
      }

      // Si está en combate y no está pausado
      if (!this.isPaused) {
        if (this.gameState === 'FIGHTING') {
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

          this.p1.update(this.p2);
          this.p2.update(this.p1);
          this.checkMeleeCollisions();
          this.checkRoundEnd();

          // Cámara 3D suave siguiendo el centro del combate
          const midX = (this.p1.x + this.p2.x) / 2;
          const dist = Math.abs(this.p1.x - this.p2.x);
          this.camera.position.x += (midX - this.camera.position.x) * 0.08;
          this.camera.position.z += (Math.max(9.5, dist * 0.95 + 4.5) - this.camera.position.z) * 0.08;
          this.camera.lookAt(midX, 2.0, 0);
        } else if (['FINISH_HIM', 'FATALITY_EXECUTION', 'ROUND_OVER', 'MATCH_OVER'].includes(this.gameState)) {
          if (this.p1) this.p1.update(this.p2);
          if (this.p2) this.p2.update(this.p1);
        }

        // Partículas 3D en física
        for (let i = this.particles3D.length - 1; i >= 0; i--) {
          const p = this.particles3D[i];
          p.mesh.position.add(p.vel);
          p.vel.y -= 0.015;
          p.life--;
          if (p.mesh.position.y <= FLOOR_Y) {
            p.mesh.position.y = FLOOR_Y + 0.01;
            p.vel.set(0, 0, 0);
          }
          if (p.life <= 0) {
            this.scene.remove(p.mesh);
            this.particles3D.splice(i, 1);
          }
        }
      }

      this.updateHUD();
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }
}

// Inicialización limpia al cargar el DOM
let game;
window.addEventListener('DOMContentLoaded', () => {
  game = new FatalStrike3DGame();
});
