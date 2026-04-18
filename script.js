/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

const utils = {
  random(min, max) {
    return Math.random() * (max - min) + min;
  },

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  },

  throttle(fn, ms) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn(...args);
      }
    };
  }
};

/* ========================================
   PARTICLE SYSTEM
   ======================================== */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.MAX = 40;
    this.rafId = null;
    this.resize();
    window.addEventListener('resize', utils.throttle(() => this.resize(), 200), { passive: true });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawnParticle() {
    const colors = ['#c77dff', '#9d4edd', '#ff69b4', '#ffb3d1', '#7b2cbf'];
    return {
      x: utils.random(0, this.canvas.width),
      y: utils.random(0, this.canvas.height),
      vx: utils.random(-0.3, 0.3),
      vy: utils.random(-0.5, -0.1),
      radius: utils.random(2, 5),
      color: colors[utils.randomInt(0, colors.length - 1)],
      opacity: utils.random(0.3, 0.8),
      opacityDir: utils.random(-0.005, 0.005)
    };
  }

  update() {
    while (this.particles.length < this.MAX) {
      this.particles.push(this.spawnParticle());
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.opacity += p.opacityDir;
      if (p.opacity <= 0.1 || p.opacity >= 0.9) p.opacityDir *= -1;

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
      this.ctx.restore();

      return p.y > -10;
    });

    this.rafId = requestAnimationFrame(() => this.update());
  }

  start() { this.update(); }
  stop() { cancelAnimationFrame(this.rafId); }
}

/* ========================================
   HEART SYSTEM
   ======================================== */

class HeartSystem {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.hearts = [];
    this.MAX = 25;
    this.rafId = null;
    this.spawnInterval = null;
    this.COLORS = ['#ff69b4', '#ffb3d1', '#c0392b', '#8b0000', '#c77dff', '#9d4edd'];
  }

  _createHeartElement(color) {
    const div = document.createElement('div');
    div.className = 'heart';
    div.style.setProperty('--heart-color', color);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M50,85 C25,65 5,50 5,35 C5,20 15,10 25,10 C35,10 45,18 50,28 C55,18 65,10 75,10 C85,10 95,20 95,35 C95,50 75,65 50,85 Z');
    path.setAttribute('fill', color);
    svg.appendChild(path);
    div.appendChild(svg);
    return div;
  }

  spawn() {
    if (this.hearts.length >= this.MAX) return;

    const sizes = ['small', 'normal', 'large'];
    const sizeMap = { small: 30, normal: 50, large: 70 };
    const size = sizes[utils.randomInt(0, 2)];
    const sizeVal = sizeMap[size];

    const color = this.COLORS[utils.randomInt(0, this.COLORS.length - 1)];
    const element = this._createHeartElement(color);
    element.style.width = sizeVal + 'px';
    element.style.height = sizeVal + 'px';

    const startX = utils.random(0, window.innerWidth);
    const heart = {
      element,
      startX,
      x: startX,
      y: window.innerHeight,
      vy: utils.random(1.5, 3),
      waveAmplitude: utils.random(30, 80),
      waveFrequency: utils.random(0.01, 0.03),
      wavePhase: 0,
      progress: 0,
      rotation: utils.random(0, 360),
      rotationSpeed: utils.random(-3, 3),
      opacity: utils.random(0.55, 0.85),
      size: sizeVal
    };

    this.container.appendChild(element);
    this.hearts.push(heart);
  }

  _updatePosition(h) {
    h.y -= h.vy;
    h.wavePhase += h.waveFrequency;
    h.x = h.startX + Math.sin(h.wavePhase) * h.waveAmplitude;
    h.rotation += h.rotationSpeed;
    h.progress = (window.innerHeight - h.y) / (window.innerHeight + h.size);
    h.element.style.left = h.x + 'px';
    h.element.style.top = h.y + 'px';
    h.element.style.transform = `rotate(${h.rotation}deg)`;
    h.element.style.opacity = h.opacity * (1 - h.progress * 0.3);
  }

  _animate() {
    this.hearts = this.hearts.filter(h => {
      this._updatePosition(h);
      if (h.y < -(h.size + 50)) {
        h.element.remove();
        return false;
      }
      return true;
    });
    this.rafId = requestAnimationFrame(() => this._animate());
  }

  start() {
    for (let i = 0; i < 12; i++) {
      setTimeout(() => this.spawn(), i * 400);
    }
    this.spawnInterval = setInterval(() => this.spawn(), 2500);
    this._animate();
  }

  stop() {
    cancelAnimationFrame(this.rafId);
    clearInterval(this.spawnInterval);
  }
}

/* ========================================
   PETAL SYSTEM
   ======================================== */

const PetalSystem = {
  container: null,
  MAX: 20,
  count: 0,
  spawnInterval: null,

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  _spawn() {
    if (this.count >= this.MAX) return;
    const el = document.createElement('div');
    el.className = 'petal';
    el.style.setProperty('--petal-left', utils.random(0, 100) + 'vw');
    el.style.setProperty('--petal-size', utils.randomInt(8, 18) + 'px');
    el.style.setProperty('--petal-dur', utils.random(6, 12) + 's');
    el.style.setProperty('--petal-delay', utils.random(0, 4) + 's');
    el.style.setProperty('--petal-spin', utils.random(-360, 360) + 'deg');
    el.style.setProperty('--petal-drift', utils.random(-80, 80) + 'px');
    this.container.appendChild(el);
    this.count++;

    const dur = parseFloat(el.style.getPropertyValue('--petal-dur')) * 1000
      + parseFloat(el.style.getPropertyValue('--petal-delay')) * 1000;
    setTimeout(() => {
      el.remove();
      this.count--;
    }, dur + 500);
  },

  start() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => this._spawn(), i * 600);
    }
    this.spawnInterval = setInterval(() => this._spawn(), 1500);
  },

  stop() {
    clearInterval(this.spawnInterval);
  }
};

/* ========================================
   CAROUSEL
   ======================================== */

class Carousel {
  constructor(trackId, dotsId) {
    this.track = document.getElementById(trackId);
    this.cards = Array.from(this.track.querySelectorAll('.polaroid-card'));
    this.dotsContainer = document.getElementById(dotsId);
    this.currentIndex = 0;
    this.total = this.cards.length;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isDragging = false;
    this.autoSlideInterval = null;
  }

  _buildDots() {
    this.dotsContainer.innerHTML = '';
    for (let i = 0; i < this.total; i++) {
      const btn = document.createElement('button');
      btn.className = 'carousel-dot';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(btn);
    }
  }

  _updatePosition() {
    const cardWidth = this.cards[0].offsetWidth;
    const gap = parseInt(getComputedStyle(this.track).gap);
    const offset = this.currentIndex * (cardWidth + gap);
    this.track.style.transform = `translateX(-${offset}px)`;
  }

  _updateDots() {
    const dots = Array.from(this.dotsContainer.querySelectorAll('.carousel-dot'));
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === this.currentIndex);
      dot.setAttribute('aria-selected', i === this.currentIndex ? 'true' : 'false');
    });
  }

  goTo(index) {
    this.currentIndex = ((index % this.total) + this.total) % this.total;
    this._updatePosition();
    this._updateDots();
  }

  _startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.goTo(this.currentIndex + 1);
    }, 3000);
  }

  _bindEvents() {
    this.track.addEventListener('touchstart', e => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.isDragging = true;
    }, { passive: true });

    this.track.addEventListener('touchend', e => {
      if (!this.isDragging) return;
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        dx < 0 ? this.goTo(this.currentIndex + 1) : this.goTo(this.currentIndex - 1);
      }
      this.isDragging = false;
    }, { passive: true });

    this.track.closest('.carousel').addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') this.goTo(this.currentIndex - 1);
      if (e.key === 'ArrowRight') this.goTo(this.currentIndex + 1);
    });

    const ro = new ResizeObserver(utils.throttle(() => this._updatePosition(), 100));
    ro.observe(this.track);
  }

  init() {
    this._buildDots();
    this._bindEvents();
    this.goTo(0);
    this._startAutoSlide();
  }
}

/* ========================================
   SCROLL ANIMATIONS
   ======================================== */

const ScrollAnimations = {
  observer: null,
  scrollFadeElements: [],
  ticking: false,

  init() {
    const targets = document.querySelectorAll('.fade-in-target:not([data-scroll-fade])');
    const scrollFadeTargets = document.querySelectorAll('[data-scroll-fade]');

    // Set stagger delay for non-scroll-fade elements
    document.querySelectorAll('.section-inner, .love-letter-body').forEach(parent => {
      const children = parent.querySelectorAll('.fade-in-target:not([data-scroll-fade])');
      children.forEach((el, i) => {
        el.style.setProperty('--fade-delay', `${i * 0.12}s`);
      });
    });

    // IntersectionObserver for gallery/closing sections
    const options = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.15
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.observer.unobserve(entry.target);
        }
      });
    }, options);

    targets.forEach(el => this.observer.observe(el));

    // Scroll-fade for love-letter section (fade in from 30% below, fade out at 30% above)
    this.scrollFadeElements = Array.from(scrollFadeTargets);
    if (this.scrollFadeElements.length > 0) {
      const updateFade = () => {
        if (!this.ticking) {
          requestAnimationFrame(() => {
            this.updateScrollFade();
            this.ticking = false;
          });
          this.ticking = true;
        }
      };

      window.addEventListener('scroll', updateFade, { passive: true });
      window.addEventListener('resize', updateFade, { passive: true });
      updateFade(); // Call once on init
    }
  },

  updateScrollFade() {
    const vh = window.innerHeight;
    const fadeInStart = vh * 1.3;   // 30% below viewport
    const fadeInEnd = vh;            // At bottom edge
    const fadeOutStart = 0;           // At top edge
    const fadeOutEnd = -vh * 0.3;     // 30% above viewport

    this.scrollFadeElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      let opacity;

      if (rect.top > fadeInStart) {
        opacity = 0;
      } else if (rect.top > fadeInEnd) {
        opacity = 1 - (rect.top - fadeInEnd) / (fadeInStart - fadeInEnd);
      } else if (rect.top >= fadeOutEnd) {
        if (rect.top >= fadeOutStart) {
          opacity = 1;
        } else {
          opacity = 1 + rect.top / (vh * 0.3);
        }
      } else {
        opacity = 0;
      }

      el.style.opacity = Math.max(0, Math.min(1, opacity));
    });
  }
};

/* ========================================
   LETTER SCROLL EFFECT
   ======================================== */

const LetterScrollEffect = {
  section: null,
  header: null,
  track: null,
  vh: 0,
  trackHeight: 0,
  phaseAScrollDist: 0,
  phaseBScrollDist: 0,
  totalScrollDist: 0,
  ticking: false,

  init() {
    this.section = document.getElementById('love-letter');
    if (!this.section) return;
    this.header = this.section.querySelector('.letter-header');
    this.track = this.section.querySelector('.letter-content-track');
    if (!this.header || !this.track) return;

    this.recalcLayout();
    this.update();

    const onScroll = () => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.update();
          this.ticking = false;
        });
        this.ticking = true;
      }
    };

    const onResize = utils.throttle(() => {
      this.recalcLayout();
      this.update();
    }, 150);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize, { passive: true });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        this.recalcLayout();
        this.update();
      });
    }
  },

  recalcLayout() {
    this.vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-vh', `${this.vh}px`);
    this.trackHeight = this.track.offsetHeight;
    this.phaseAScrollDist = this.vh * 0.65;
    this.phaseBScrollDist = this.vh + this.trackHeight;
    const exitBuffer = this.vh * 0.3;
    this.totalScrollDist = this.phaseAScrollDist + this.phaseBScrollDist + exitBuffer;
    this.section.style.height = `${this.vh + this.totalScrollDist}px`;
  },

  update() {
    if (!this.section) return;
    const vh = this.vh;
    const sectionRect = this.section.getBoundingClientRect();
    const scrolled = -sectionRect.top;

    const headerHeight = this.header.offsetHeight;
    const headerProgress = Math.max(0, Math.min(1, scrolled / this.phaseAScrollDist));
    const centerY = (vh - headerHeight) / 2;
    const headerY = centerY + (0 - centerY) * headerProgress;
    this.header.style.setProperty('--letter-header-y', `${headerY}px`);
    this.header.style.setProperty('--letter-header-dock', headerProgress.toFixed(3));

    const contentScrolled = Math.max(0, scrolled - this.phaseAScrollDist);
    const contentProgress = Math.max(0, Math.min(1, contentScrolled / this.phaseBScrollDist));
    const startY = vh;
    const endY = -this.trackHeight;
    const contentY = startY + (endY - startY) * contentProgress;
    this.track.style.setProperty('--letter-content-y', `${contentY}px`);
  }
};

/* ========================================
   PARALLAX INITIALIZATION
   ======================================== */

function initParallax() {
  const isTouch = utils.isTouchDevice();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) return;

  if (typeof Rellax !== 'undefined') {
    new Rellax('.rellax', {
      speed: -2,
      center: false,
      wrapper: null,
      round: true,
      vertical: true,
      horizontal: false,
      breakpoints: [576, 768, 1201]
    });
  }

  if (!isTouch && typeof simpleParallax !== 'undefined') {
    const galleryImages = document.querySelectorAll('.polaroid-photo');
    if (galleryImages.length > 0) {
      new simpleParallax(galleryImages, {
        delay: 0.4,
        orientation: 'up',
        scale: 1.15,
        overflow: true
      });
    }
  }

  // Multi-layer parallax: elements at different speeds create depth.
  // useCSSVar=true for fade-in-target elements so transforms compose via --parallax-y.
  const parallaxLayers = [
    { el: document.querySelector('.hero-content'),        speed: 0.38, useCSSVar: false },
    { el: document.querySelector('.section-heading'),     speed: 0.06, useCSSVar: true },
    { el: document.querySelector('.section-subheading'),  speed: 0.09, useCSSVar: true },
    { el: document.querySelector('.closing-heart-anim'),  speed: 0.10, useCSSVar: true },
    { el: document.querySelector('.closing-title'),       speed: 0.07, useCSSVar: true },
  ].filter(l => l.el);

  let ticking = false;

  function applyParallax() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    parallaxLayers.forEach(({ el, speed, useCSSVar }) => {
      let offset;
      if (useCSSVar) {
        const rect = el.getBoundingClientRect();
        const clampedTop = Math.max(-vh, Math.min(vh, rect.top));
        offset = (vh - clampedTop) * speed;
        el.style.setProperty('--parallax-y', `${offset}px`);
      } else {
        offset = scrollY * speed;
        el.style.transform = `translateY(${offset}px)`;
      }
    });
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(applyParallax);
      ticking = true;
    }
  }, { passive: true });
}

/* ========================================
   BOOTSTRAP
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const particles = new ParticleSystem('particle-canvas');
  if (!prefersReduced) particles.start();

  const hearts = new HeartSystem('hearts-container');
  if (!prefersReduced) hearts.start();

  PetalSystem.init('petals-container');
  if (!prefersReduced) PetalSystem.start();

  ScrollAnimations.init();

  if (!prefersReduced) LetterScrollEffect.init();

  const carousel = new Carousel('carousel-track', 'carousel-dots');
  carousel.init();

  // Play background audio on first user interaction (browser autoplay policy)
  const bgAudio = document.getElementById('bg-audio');
  if (bgAudio) {
    const startAudio = () => {
      bgAudio.play().catch(() => {});
      document.removeEventListener('click', startAudio);
      document.removeEventListener('touchstart', startAudio);
    };
    document.addEventListener('click', startAudio, { once: true, passive: true });
    document.addEventListener('touchstart', startAudio, { once: true, passive: true });
    bgAudio.play().catch(() => {});
  }

  setTimeout(initParallax, 100);

  window.addEventListener('resize', utils.throttle(() => {
    particles.resize();
  }, 200), { passive: true });
});
