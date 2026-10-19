/* ===== 20/10 Website — script.js ===== */
(function () {
  'use strict';

  const STAGES = { ENVELOPE: 1, LETTER: 2, GIFT: 3, HEART: 4 };
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let state = STAGES.ENVELOPE;
  let heartRenderer = null;
  let heartAlive = false;
  let heartAbort = null;
  let revealTimers = [];
  let teaserObserver = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const envelopeStage = $('#envelope-stage');
  const letterStage = $('#letter-stage');
  const giftStage = $('#gift-stage');
  const envelopeWrap = $('.envelope-wrap');
  const giftScene = $('.gift-scene');
  const giftBox = $('.gift-box');
  const burstLight = $('.burst-light');
  const heartWrap = $('.heart-canvas-wrap');
  const giftTeaser = $('.gift-teaser');
  const btnOpenLetter = $('#btn-open-letter');
  const btnOpenGift = $('#btn-open-gift');

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const isGone = (expected) => state !== expected;

  /* ---------- Stars ---------- */
  function spawnStars() {
    const container = $('#stars');
    const count = window.innerWidth < 600 ? 36 : 80;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      const size = Math.random() * 2 + 0.5;
      Object.assign(star.style, {
        position: 'absolute',
        width: size + 'px',
        height: size + 'px',
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        borderRadius: '50%',
        background: Math.random() > 0.7 ? '#ffd1dc' : '#fff',
        opacity: String(Math.random() * 0.6 + 0.2),
        animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 3}s`,
        willChange: 'opacity, transform'
      });
      container.appendChild(star);
    }
    if (!document.getElementById('twinkle-style')) {
      const style = document.createElement('style');
      style.id = 'twinkle-style';
      style.textContent = '@keyframes twinkle{0%,100%{opacity:.18;transform:scale(.8)}50%{opacity:.9;transform:scale(1.15)}}';
      document.head.appendChild(style);
    }
  }

  /* ---------- Letter reveal ---------- */
  function clearRevealTimers() {
    revealTimers.forEach(clearTimeout);
    revealTimers = [];
  }

  function revealLetter(immediate) {
    const paras = $$('#letter-stage .para');
    clearRevealTimers();
    paras.forEach((para, i) => {
      if (immediate) {
        para.classList.add('visible');
        return;
      }
      revealTimers.push(setTimeout(() => para.classList.add('visible'), 160 + i * 95));
    });
    armGiftTeaser();
  }

  function armGiftTeaser() {
    giftTeaser.classList.remove('visible');
    if (teaserObserver) {
      teaserObserver.disconnect();
      teaserObserver = null;
    }
    if (!('IntersectionObserver' in window)) {
      giftTeaser.classList.add('visible');
      return;
    }
    teaserObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        giftTeaser.classList.add('visible');
        teaserObserver.disconnect();
        teaserObserver = null;
      }
    }, { threshold: 0.2 });
    teaserObserver.observe(giftTeaser);
  }

  /* ---------- Floating hearts on open ---------- */
  function spawnFloatingHearts() {
    for (let i = 0; i < 10; i++) {
      const heart = document.createElement('span');
      heart.className = 'float-heart';
      heart.textContent = Math.random() > 0.5 ? '♥' : '♡';
      heart.style.left = (44 + Math.random() * 12) + '%';
      heart.style.top = (44 + Math.random() * 8) + '%';
      heart.style.fontSize = (12 + Math.random() * 13) + 'px';
      envelopeWrap.appendChild(heart);
      const drift = (Math.random() - 0.5) * 150;
      const anim = heart.animate([
        { transform: 'translate(-50%, 0) scale(0.6)', opacity: 0 },
        { transform: `translate(calc(-50% + ${drift * 0.35}px), -60px) scale(1)`, opacity: 0.9, offset: 0.35 },
        { transform: `translate(calc(-50% + ${drift}px), -175px) scale(0.7)`, opacity: 0 }
      ], { duration: 1500 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.3,1)' });
      anim.onfinish = () => heart.remove();
    }
  }

  /* ---------- Envelope -> Letter ---------- */
  async function openEnvelope() {
    if (state !== STAGES.ENVELOPE) return;
    state = STAGES.LETTER;
    btnOpenLetter.disabled = true;

    if (REDUCED_MOTION) {
      envelopeStage.classList.add('stage-leaving');
      letterStage.classList.add('active', 'stage-entering');
      revealLetter(true);
      await wait(480);
      envelopeStage.classList.remove('active', 'stage-leaving');
      letterStage.classList.remove('stage-entering');
      btnOpenLetter.disabled = false;
      return;
    }

    envelopeWrap.classList.add('shaking');
    await wait(460);
    if (isGone(STAGES.LETTER)) return;

    envelopeWrap.classList.remove('shaking');
    envelopeWrap.classList.add('opening');
    spawnFloatingHearts();
    await wait(860);
    if (isGone(STAGES.LETTER)) return;

    window.scrollTo(0, 0);
    envelopeStage.classList.add('stage-leaving');
    letterStage.classList.add('active', 'stage-entering');
    revealLetter(false);

    await wait(780);
    if (isGone(STAGES.LETTER)) return;

    envelopeStage.classList.remove('active', 'stage-leaving');
    letterStage.classList.remove('stage-entering');
  }

  /* ---------- Letter -> Gift -> Heart ---------- */
  async function openGift() {
    if (state !== STAGES.LETTER) return;
    state = STAGES.GIFT;
    btnOpenGift.disabled = true;

    letterStage.classList.add('fading');
    await wait(REDUCED_MOTION ? 340 : 400);
    if (isGone(STAGES.GIFT)) return;

    letterStage.classList.remove('active', 'fading');
    window.scrollTo(0, 0);
    giftStage.classList.add('active', 'stage-entering');
    await wait(520);
    if (isGone(STAGES.GIFT)) return;
    giftStage.classList.remove('stage-entering');

    if (!REDUCED_MOTION) {
      giftScene.classList.add('shake');
      await wait(620);
      if (isGone(STAGES.GIFT)) return;
      giftScene.classList.remove('shake');

      giftScene.classList.add('opening');
      await wait(880);
      if (isGone(STAGES.GIFT)) return;
    } else {
      giftScene.classList.add('opening');
    }

    giftBox.classList.add('hidden');
    burstLight.style.opacity = '0';
    burstLight.style.transform = 'scale(2)';

    initHeart();
    heartWrap.classList.add('visible');
    state = STAGES.HEART;
  }

  /* ---------- Heart ---------- */
  function webglAvailable() {
    try {
      const probe = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (probe.getContext('webgl') || probe.getContext('experimental-webgl')));
    } catch (err) {
      return false;
    }
  }

  function heartParametric(t) {
    return {
      x: 16 * Math.pow(Math.sin(t), 3),
      y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    };
  }

  function resampleLoop(points, count) {
    const n = points.length;
    const cumulative = [0];
    for (let i = 0; i < n; i++) {
      const a = points[i];
      const b = points[(i + 1) % n];
      cumulative.push(cumulative[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    const total = cumulative[n];
    const result = [];
    let seg = 0;
    for (let i = 0; i < count; i++) {
      const distance = (i / count) * total;
      while (seg < n - 1 && cumulative[seg + 1] <= distance) seg++;
      const span = cumulative[seg + 1] - cumulative[seg];
      const f = span ? (distance - cumulative[seg]) / span : 0;
      const a = points[seg];
      const b = points[(seg + 1) % n];
      result.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    }
    return result;
  }

  // Replace the two sharp cusps of the parametric heart (top notch and
  // bottom tip) with small quadratic caps, keeping the natural silhouette.
  function roundedHeartAnchors() {
    const topY = heartParametric(0).y;
    const bottomY = heartParametric(Math.PI).y;
    const topCap = 0.45;
    const bottomCap = 0.55;
    const points = [];

    const addCurve = (from, to, steps) => {
      for (let i = 0; i < steps; i++) {
        const p = heartParametric(from + (to - from) * (i / steps));
        points.push([p.x, p.y]);
      }
    };
    const addCap = (from, to, controlY) => {
      const steps = 28;
      for (let i = 1; i <= steps; i++) {
        const f = i / steps;
        const u = 1 - f;
        points.push([
          u * u * from[0] + f * f * to[0],
          u * u * from[1] + 2 * u * f * controlY + f * f * to[1]
        ]);
      }
    };

    const a = heartParametric(topCap);
    const b = heartParametric(Math.PI - bottomCap);
    const c = heartParametric(Math.PI + bottomCap);
    const d = heartParametric(Math.PI * 2 - topCap);

    addCurve(topCap, Math.PI - bottomCap, 300);
    addCap([b.x, b.y], [c.x, c.y], bottomY);
    addCurve(Math.PI + bottomCap, Math.PI * 2 - topCap, 300);
    addCap([d.x, d.y], [a.x, a.y], topY);
    return points;
  }

  function makeSpriteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.28, 'rgba(255,214,228,0.9)');
    gradient.addColorStop(0.62, 'rgba(255,110,180,0.35)');
    gradient.addColorStop(1, 'rgba(255,90,160,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  function buildHeartGeometries() {
    const outlineCount = 4200;
    const fillCount = 1200;
    const haloCount = 800;
    const total = outlineCount + fillCount;
    const scale = 0.082;
    const centerY = 0.16;
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const palette = [
      [1.0, 0.20, 0.44],
      [1.0, 0.31, 0.55],
      [0.96, 0.16, 0.38],
      [1.0, 0.45, 0.64],
      [1.0, 0.62, 0.76],
      [1.0, 0.82, 0.89],
      [1.0, 0.95, 0.97]
    ];

    const pickColor = (dim) => {
      const c = palette[(Math.random() * palette.length) | 0];
      return [c[0] * dim, c[1] * dim, c[2] * dim];
    };

    // Dense glittering outline, with real z-thickness
    const anchors = roundedHeartAnchors();
    const outline = resampleLoop(anchors, outlineCount);
    for (let i = 0; i < outlineCount; i++) {
      const base = outline[i];
      const edge = Math.random() < 0.3 ? 1.025 : 0.985 + Math.random() * 0.035;
      const idx = i * 3;
      positions[idx] = base[0] * scale * edge + (Math.random() - 0.5) * 0.026;
      positions[idx + 1] = base[1] * scale * edge + centerY + (Math.random() - 0.5) * 0.026;
      positions[idx + 2] = Math.random() < 0.36
        ? (Math.random() < 0.5 ? -1 : 1) * (0.18 + Math.random() * 0.12)
        : (Math.random() - 0.5) * 0.38;

      const c = pickColor(0.9 + Math.random() * 0.1);
      colors[idx] = c[0];
      colors[idx + 1] = c[1];
      colors[idx + 2] = c[2];
    }

    // Interior fill via rejection sampling — uniform, no center seam
    const polygon = resampleLoop(anchors, 220).map(([x, y]) => [x * scale, y * scale + centerY]);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    polygon.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
    const isInside = (x, y) => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      return inside;
    };

    let filled = 0;
    let attempts = 0;
    while (filled < fillCount && attempts < fillCount * 40) {
      attempts++;
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      if (!isInside(x, y)) continue;
      const idx = (outlineCount + filled) * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = (Math.random() - 0.5) * 0.3;
      const c = pickColor(0.4 + Math.random() * 0.3);
      colors[idx] = c[0];
      colors[idx + 1] = c[1];
      colors[idx + 2] = c[2];
      filled++;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Loose glitter dust floating just off the surface
    const haloPositions = new Float32Array(haloCount * 3);
    const haloColors = new Float32Array(haloCount * 3);
    const haloOutline = resampleLoop(anchors, 720);
    for (let i = 0; i < haloCount; i++) {
      const base = haloOutline[(Math.random() * haloOutline.length) | 0];
      const ring = 1.02 + Math.pow(Math.random(), 1.8) * 0.3;
      const idx = i * 3;
      haloPositions[idx] = base[0] * scale * ring + (Math.random() - 0.5) * 0.045;
      haloPositions[idx + 1] = base[1] * scale * ring + centerY + (Math.random() - 0.5) * 0.045;
      haloPositions[idx + 2] = (Math.random() - 0.5) * 0.6;
      const c = pickColor(0.55 + Math.random() * 0.45);
      haloColors[idx] = c[0];
      haloColors[idx + 1] = c[1];
      haloColors[idx + 2] = c[2];
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3));
    haloGeometry.setAttribute('color', new THREE.BufferAttribute(haloColors, 3));

    return { geometry, haloGeometry };
  }

  function initHeart() {
    const canvas = $('#heart-canvas');
    const wrap = heartWrap;
    const width = wrap.clientWidth || 520;
    const height = wrap.clientHeight || 520;

    if (!webglAvailable() || typeof THREE === 'undefined') {
      buildCSSFallbackHeart(wrap);
      return;
    }

    try {
      heartAlive = true;
      heartAbort = new AbortController();
      const signal = heartAbort.signal;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0.1, 4.05);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      heartRenderer = renderer;

      const texture = makeSpriteTexture();
      const { geometry, haloGeometry } = buildHeartGeometries();

      const heartMaterial = new THREE.PointsMaterial({
        size: 0.062,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });
      const glowMaterial = new THREE.PointsMaterial({
        size: 0.15,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });
      const haloMaterial = new THREE.PointsMaterial({
        size: 0.05,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      const heartPoints = new THREE.Points(geometry, heartMaterial);
      const glowPoints = new THREE.Points(geometry, glowMaterial);
      const haloPoints = new THREE.Points(haloGeometry, haloMaterial);
      const heartGroup = new THREE.Group();
      heartGroup.add(glowPoints, haloPoints, heartPoints);
      scene.add(heartGroup);

      let baseRotY = 0;
      const clock = new THREE.Clock();
      const BASE_SPEED = 0.32;

      renderer.setAnimationLoop(() => {
        if (!heartAlive) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.getElapsedTime();

        baseRotY += BASE_SPEED * dt;
        heartGroup.rotation.y = baseRotY;
        heartGroup.rotation.x = Math.sin(t * 0.45) * 0.05;

        const beat = 1 + 0.028 * Math.sin(t * 2.7);
        heartGroup.scale.setScalar(beat);

        heartMaterial.opacity = 0.88 + 0.08 * Math.sin(t * 1.7);
        glowMaterial.opacity = 0.24 + 0.08 * Math.sin(t * 1.15 + 0.8);
        haloMaterial.opacity = 0.4 + 0.18 * Math.sin(t * 2.1 + 2.2);

        renderer.render(scene, camera);
      });

      const onResize = () => {
        if (!heartAlive) return;
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize, { signal });

      let dragging = false;
      let lastX = 0;
      canvas.addEventListener('mousedown', (event) => {
        dragging = true;
        lastX = event.clientX;
      }, { signal });
      window.addEventListener('mousemove', (event) => {
        if (!dragging || !heartAlive) return;
        baseRotY += (event.clientX - lastX) * 0.009;
        lastX = event.clientX;
      }, { signal });
      window.addEventListener('mouseup', () => { dragging = false; }, { signal });

      canvas.addEventListener('touchstart', (event) => {
        dragging = true;
        lastX = event.touches[0].clientX;
      }, { passive: true, signal });
      canvas.addEventListener('touchmove', (event) => {
        if (!dragging || !heartAlive) return;
        baseRotY += (event.touches[0].clientX - lastX) * 0.009;
        lastX = event.touches[0].clientX;
      }, { passive: true, signal });
      canvas.addEventListener('touchend', () => { dragging = false; }, { passive: true, signal });
    } catch (err) {
      console.warn('3D heart could not start, using CSS fallback.', err);
      heartAlive = false;
      if (heartAbort) {
        heartAbort.abort();
        heartAbort = null;
      }
      if (heartRenderer) {
        heartRenderer.setAnimationLoop(null);
        heartRenderer.dispose();
        heartRenderer = null;
      }
      buildCSSFallbackHeart(wrap);
    }
  }

  /* ---------- CSS fallback heart ---------- */
  function buildCSSFallbackHeart(container) {
    container.innerHTML = '';
    const fallback = document.createElement('div');
    fallback.className = 'css-heart-fallback';
    fallback.setAttribute('aria-label', 'Trái tim (CSS 3D fallback)');
    for (let i = 0; i < 6; i++) {
      const layer = document.createElement('div');
      layer.className = 'css-heart-layer';
      fallback.appendChild(layer);
    }
    container.appendChild(fallback);
  }

  /* ---------- Bind ---------- */
  btnOpenLetter.addEventListener('click', openEnvelope);
  btnOpenGift.addEventListener('click', openGift);

  /* ---------- Init ---------- */
  spawnStars();
})();
