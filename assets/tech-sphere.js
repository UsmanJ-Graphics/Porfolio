/* ============================================================
   TECH SPHERE — rotating wireframe globe with skill badges
   Sits in #toolchain, below the text skill columns. Built with
   the same THREE r128 instance already loaded in the page (see
   the ABOUT VISUAL wire-sphere for the sibling pattern).
   Save as: assets/tech-sphere.js
   Load AFTER the three.js CDN script, e.g. right before </body>:
     <script defer src="assets/tech-sphere.js"></script>
   ============================================================ */
(function techSphere(){
  const wrap = document.getElementById('tech-sphere-wrap');
  const canvas = document.getElementById('tech-sphere-canvas');
  if(!wrap || !canvas || typeof THREE === 'undefined') return;

  let webglOK = true;
  try{ webglOK = !!(document.createElement('canvas').getContext('webgl')); }catch(e){ webglOK = false; }
  if(!webglOK){ wrap.style.display = 'none'; return; }

  // Skill badges pulled from the SKILLS data already on the page —
  // short labels only, since sprites are small on the globe.
  const BADGES = [
    'C++', 'C', 'ASM', 'GLSL', 'GL 3.3', 'SHADER', 'IMGUI', 'VAO',
    'GPU', 'TEXTURE', 'GIT', 'CMAKE', 'VS', 'LINUX', 'DSA', 'LIN ALG', 'ARCH', 'CALC'
  ];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const currentTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 30);
  camera.position.z = 4.6;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const group = new THREE.Group();
  scene.add(group);

  const RADIUS = 1.7;

  // wireframe globe (lat/long grid, like the ABOUT icosa-wire but a true
  // sphere so the grid lines read as a globe rather than a gem)
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x7de3d6, wireframe: true, transparent: true, opacity: 0.35
  });
  const wire = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 24, 16), wireMat);
  group.add(wire);

  // faint dark core behind the grid so it doesn't look like bare crossing
  // lines floating in space, and so badges on the far side dim naturally
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x04070d, transparent: true, opacity: 0.55 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 0.985, 24, 16), coreMat);
  group.add(core);

  // ---- even coverage: fibonacci sphere distribution ----
  // (a random scatter clumps badges and leaves bald patches; this spaces
  // every badge roughly the same distance from its neighbours)
  function fibonacciPoints(n, r){
    const pts = [];
    const offset = 2 / n;
    const increment = Math.PI * (3 - Math.sqrt(5));
    for(let i = 0; i < n; i++){
      const y = (i * offset - 1) + offset / 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * increment;
      pts.push(new THREE.Vector3(Math.cos(phi) * rad * r, y * r, Math.sin(phi) * rad * r));
    }
    return pts;
  }

  function badgeTexture(label, theme){
    const dark = theme !== 'light';
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const cx = size / 2, cy = size / 2, r = size * 0.42;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = dark ? 'rgba(6,12,20,0.92)' : 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = dark ? '#7de3d6' : '#0e8f83';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = dark ? '#eafffb' : '#0d131f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const twoLine = label.length > 6 && label.includes(' ');
    const fontSize = twoLine ? 18 : (label.length > 4 ? 20 : 26);
    ctx.font = `700 ${fontSize}px 'IBM Plex Mono', monospace`;
    if(twoLine){
      const parts = label.split(' ');
      ctx.fillText(parts[0], cx, cy - fontSize * 0.55);
      ctx.fillText(parts.slice(1).join(' '), cx, cy + fontSize * 0.55);
    } else {
      ctx.fillText(label, cx, cy + 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  const points = fibonacciPoints(BADGES.length, RADIUS * 1.03);
  const sprites = BADGES.map((label, i) => {
    const mat = new THREE.SpriteMaterial({
      map: badgeTexture(label, currentTheme()), depthTest: false, transparent: true
    });
    const spr = new THREE.Sprite(mat);
    spr.position.copy(points[i]);
    spr.scale.set(0.42, 0.42, 1);
    spr.userData.label = label;
    group.add(spr);
    return spr;
  });

  // keep colors in sync with the site's light/dark toggle, same pattern
  // as the ABOUT wire-sphere's applyAboutTheme()
  function applyTheme(){
    const theme = currentTheme();
    wireMat.color.setHex(theme === 'light' ? 0x0e8f83 : 0x7de3d6);
    coreMat.color.setHex(theme === 'light' ? 0xf4f4f0 : 0x04070d);
    sprites.forEach(spr => {
      spr.material.map.dispose();
      spr.material.map = badgeTexture(spr.userData.label, theme);
      spr.material.needsUpdate = true;
    });
  }
  window.addEventListener('theme-changed', applyTheme);

  const l1 = new THREE.PointLight(0x9ff5ea, 1.6, 14); l1.position.set(3, 2, 4); scene.add(l1);
  scene.add(new THREE.AmbientLight(0x22303a, 1.3));

  function resize(){
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if(!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // ---- drag to rotate, with release inertia that eases out ----
  let dragging = false, lastX = 0, lastY = 0;
  let velX = 0, velY = 0;
  let tiltX = -0.15;
  let idleTimer = 0;

  function pointerPos(e){ return e.touches ? e.touches[0] : e; }

  function onDown(e){
    dragging = true;
    wrap.classList.add('dragged');
    const p = pointerPos(e);
    lastX = p.clientX; lastY = p.clientY;
    velX = 0; velY = 0;
  }
  function onMove(e){
    if(!dragging) return;
    const p = pointerPos(e);
    const dx = p.clientX - lastX, dy = p.clientY - lastY;
    lastX = p.clientX; lastY = p.clientY;
    velX = dx * 0.0045;
    velY = dy * 0.0045;
    group.rotation.y += velX;
    tiltX = Math.max(-1.1, Math.min(1.1, tiltX + velY));
    if(e.cancelable) e.preventDefault();
  }
  function onUp(){ dragging = false; idleTimer = 0; }

  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);

  const clock = new THREE.Clock();
  function tick(){
    requestAnimationFrame(tick);
    if(document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);

    if(!dragging){
      if(Math.abs(velX) > 0.0002 || Math.abs(velY) > 0.0002){
        group.rotation.y += velX;
        tiltX = Math.max(-1.1, Math.min(1.1, tiltX + velY));
        velX *= 0.93; velY *= 0.93;
      } else if(!reduceMotion){
        group.rotation.y += dt * 0.12;
      }
    }
    group.rotation.x += (tiltX - group.rotation.x) * 0.08;

    renderer.render(scene, camera);
  }
  tick(); // loop always runs so drag stays interactive; auto-spin is what reduceMotion skips
})();
