# Portfolio — Tech Stack & Viva Prep Notes

## 1. Tech Stack Overview

**There is no framework.** This is a single static `index.html` file — no React, no Next.js, no build step. That's a deliberate, defensible choice for a portfolio: it deploys as-is on Vercel with zero build config, loads fast, and every line of code is something you can point to and explain — there's no framework magic hiding behind it.

What it actually uses:

| Layer | Technology | Why |
|---|---|---|
| Structure | Hand-written semantic HTML5 | No templating engine |
| Styling | Plain CSS with CSS Custom Properties (variables) | **Not Tailwind** — no utility classes, no config file. Every class is custom-named and hand-written. |
| 3D / graphics | **Three.js r128**, loaded from a CDN (`three.min.js`) | The actual WebGL engine behind the hero scene |
| Scroll animation | **GSAP 3.12.5** + `ScrollTrigger` + `ScrollToPlugin` | Detects which section is in view, drives smooth-scroll nav clicks |
| Fonts | Google Fonts: **Plus Jakarta Sans** (body/headings) + **IBM Plex Mono** (technical labels, numbers, tags) | Two-font system: humanist sans for readability, monospace for anything that reads as "data" |
| Hosting | Vercel (static hosting) | No server-side code — everything runs in the browser |

If asked "what's the framework?" — the honest, correct answer is **"none — it's vanilla HTML/CSS/JavaScript, plus two small third-party libraries (Three.js and GSAP) loaded via CDN script tags."** Don't say React/Next.js — that would be wrong and easy to catch out on.

---

## 2. Is it Tailwind or custom CSS?

**Custom CSS.** You can prove this instantly: Tailwind class names look like `flex items-center gap-4 text-sm text-cyan-400`. This project's classes look like `.hero-title`, `.proj-card`, `.nav-link` — semantic, hand-named classes, each defined once in a stylesheet with real property values.

The CSS is organized as **5 separate files**, loaded in a specific cascade order (order matters — later files can override earlier ones):

```html
<link rel="stylesheet" href="assets/ui-overrides.css">
<link rel="stylesheet" href="assets/responsive-fixes.css">
<link rel="stylesheet" href="assets/hero-featured.css">
<link rel="stylesheet" href="assets/mobile-menu.css">
<link rel="stylesheet" href="assets/scroll-transitions.css">
```

Plus a large `<style>` block inline in `<head>` that holds the base design system.

**Key CSS techniques used (good viva talking points):**

- **CSS Custom Properties (variables)** — a `:root { --bg:#08090b; --accent:#7de3d6; ... }` block defines the entire color palette once. Every component references `var(--accent)` instead of hardcoding colors, so switching themes (dark/light) only means swapping the variable values, not rewriting every rule.
- **`clamp(min, preferred, max)`** for fluid typography — e.g. the hero heading uses `font-size: clamp(46px, 8.6vw, 108px)`, so it scales smoothly between a phone and a 4K monitor without needing a media query for every breakpoint.
- **`@media` queries** at multiple breakpoints (560px, 720px, 820px, 900px) for layout changes.
- **`@media (prefers-reduced-motion: reduce)`** — every animation in the site is disabled for users who've told their OS they get motion sickness or just don't want animation. This is an accessibility requirement, not a nice-to-have.
- **CSS `@keyframes`** for the marquee scroll effect (`translateX(0)` → `translateX(-50%)`, looped).
- **`backdrop-filter: blur()`** for the glass/frosted-glass nav bar effect.

---

## 3. HTML tags actually used, and what each is for

| Tag | Used for |
|---|---|
| `<main>` | Wraps all page content (one per page — landmark for screen readers) |
| `<nav>` | The top navigation bar and the mobile full-screen menu |
| `<section>` | Each major content block (Hero, Work, Toolchain, About, Lab, Education, Roadmap, Availability, Contact) — 9 total |
| `<footer>` | The closing brand/contact strip |
| `<h1>` | Exactly one — your name in the hero (there should only ever be one `<h1>` per page) |
| `<h2>` | Section headings ("Things I've built.", "The tools I build with.", etc.) |
| `<h3>` | Sub-headings one level below a section — project names, skill category names, Lab card titles |
| `<h5>` | Modal (project detail popup) block labels — "WHAT I BUILT", "TECHNOLOGY", etc. |
| `<canvas>` | Two of these — one for the Three.js WebGL hero scene, one for the 2D shader-playground preview in the Graphics Lab |
| `<button>` | Every clickable control that *doesn't* navigate anywhere (filter buttons, "View Project", theme toggle, the shader playground's controls' parent, mobile menu burger) |
| `<a>` | Every link that *does* navigate — nav links, GitHub/LinkedIn/email links, "View Source" |
| `<input type="range">` | The 4 shader-playground sliders (Roughness, Metallic, Light Intensity, Exposure) |
| `<label>` | Paired with each range input, for accessibility |
| `<img>` | Project screenshots |
| `<div>` / `<span>` | Generic containers — used heavily (150+ divs) for layout wrappers and small inline text pieces that don't carry semantic meaning of their own |
| `<p>` | Body paragraphs (descriptions, bios) |
| `<ul>` / `<li>` | The "IMPLEMENTED" feature list on the featured project |

**Viva tip:** if asked "why `<button>` here and `<a>` there?" — the rule is: **if it changes the URL/navigates somewhere, it's an `<a>`; if it only *does something* on the current page (opens a modal, filters a list, toggles a theme), it's a `<button>`.** This is a real, correct accessibility/semantics rule — screen readers announce them differently, and keyboard users expect `<button>` to activate on both Enter *and* Space, while `<a>` only responds to Enter.

---

## 4. How WebGL actually works in this project

### The core idea
**WebGL** is a browser API that lets JavaScript draw hardware-accelerated 3D graphics directly onto a `<canvas>`, using your GPU. Writing raw WebGL is extremely low-level (you'd be hand-writing shader code and managing GPU buffers yourself). **Three.js is a JavaScript library that wraps WebGL** in much friendlier concepts — `Scene`, `Camera`, `Mesh`, `Light` — so you build the 3D world in normal-feeling JS instead of raw GPU calls. Three.js still compiles everything down to WebGL/GLSL under the hood; it just writes the boilerplate for you.

### The four things every Three.js scene needs
```js
const scene = new THREE.Scene();                 // 1. the "world" — a container for everything
const camera = new THREE.PerspectiveCamera(50, w/h, 0.1, 100);  // 2. your viewpoint into that world
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });  // 3. draws the scene to a <canvas>
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);       // the renderer creates and owns the actual <canvas>
```

The `PerspectiveCamera(50, aspect, 0.1, 100)` arguments are: **field of view in degrees (50°)**, **aspect ratio** (width/height of the viewport, so nothing looks stretched), and the **near/far clipping planes** (0.1 to 100 — anything closer than 0.1 units or farther than 100 units from the camera simply isn't drawn, which saves GPU work).

### What's actually in the hero scene
Every 3D object in Three.js is a **Mesh = Geometry (the shape) + Material (the surface/how light hits it)**. This scene has several:

1. **The metallic sphere** — `THREE.SphereGeometry` + `THREE.MeshStandardMaterial` with high `metalness` and low `roughness`. `MeshStandardMaterial` is "physically-based" — it reacts to actual light sources in the scene the way a real metal or plastic surface would, instead of just being a flat color.
2. **The glass icosahedron** — `THREE.IcosahedronGeometry` + `THREE.MeshPhysicalMaterial` with `transmission: 1`. `transmission` is what makes light actually pass *through* the object instead of bouncing off it — that's the difference between "shiny plastic" and "glass."
3. **The wireframe terrain** — `THREE.PlaneGeometry(16, 12, 48, 48)` (a flat grid subdivided into 48×48 segments), then a loop manually pushes each vertex's Z position up and down using layered sine/cosine math (`Math.sin(x*0.65) * Math.cos(y*0.65)`) to fake mountain-like terrain — this is a classic **procedural geometry** technique: no 3D modeling software was used, the shape is generated entirely by code. It's rendered with `wireframe: true` on a `MeshBasicMaterial`, which draws only the edges of each triangle, not filled faces.
4. **Lights** — a `PointLight` (like a light bulb, radiates in all directions from a point) as the "key light," a second dimmer `PointLight` as a "rim light" from behind for edge highlights, and an `AmbientLight` (uniform light with no direction or position, just brightens everything evenly so nothing is pitch black in shadow).

### The animation loop
Three.js doesn't animate on its own — **you** are responsible for redrawing every frame:
```js
function animate(){
  requestAnimationFrame(animate);   // ask the browser to call this again next frame (~60/sec)
  if (document.hidden) return;      // don't waste GPU cycles on a background tab
  sphere.rotation.y += 0.002;       // nudge rotation slightly
  camera.position.x = targetX * 1.4;   // mouse-parallax: camera drifts toward the cursor
  renderer.render(scene, camera);   // actually draw this frame
}
animate();
```
`requestAnimationFrame` is the browser's native "call me right before the next repaint" API — it's what makes the loop run in sync with the display's refresh rate instead of firing too fast or too slow.

### Real engineering details worth mentioning in a viva
- **`prefers-reduced-motion` handling**: if the user's OS says "reduce motion," the scene renders **one static frame** instead of running the animation loop at all — `if (reduceMotion) { renderer.render(scene, camera); } else { animate(); }`.
- **`IntersectionObserver` pausing the render loop**: once you scroll past the hero, an `IntersectionObserver` detects the canvas left the viewport and stops calling `requestAnimationFrame` entirely — no point burning GPU/battery animating something nobody can see.
- **Device pixel ratio capping**: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))` — on very high-DPI phones/laptops, rendering at full native pixel density (sometimes 3x) is expensive for very little visible quality gain, so it's capped at 1.75x.
- **Graceful WebGL fallback**: the code checks `typeof THREE === 'undefined'` (CDN failed to load) and also wraps scene creation in a way that falls back to a static CSS background if WebGL genuinely isn't supported by the browser/GPU — so the hero never just shows a broken black box.

### GSAP's separate job
GSAP isn't involved in the 3D scene at all — it's a **2D DOM animation library** used here purely for:
- `ScrollTrigger` — watching scroll position to know which section is currently in view (drives the active-nav-link highlighting and a small orbital scroll-progress indicator)
- `ScrollToPlugin` — smooth-scrolling the page to a section when you click a nav link, instead of an instant jump

---

## 5. Likely viva questions and short answers

**Q: What framework did you use?**
A: None — vanilla HTML/CSS/JS. I used Three.js for the WebGL 3D scene and GSAP for scroll-based animation, both loaded as plain `<script>` tags from a CDN, no build tooling.

**Q: Why not React/Next.js?**
A: A portfolio site is static content — there's no app state, routing, or data-fetching that would justify a framework's overhead. Vanilla JS keeps the bundle small, the deploy simple, and every line auditable.

**Q: Is this Tailwind?**
A: No, it's hand-written CSS using custom properties (CSS variables) for the design tokens (colors, spacing, radii), split across multiple files loaded in a specific cascade order.

**Q: How does the 3D sphere actually get drawn on screen?**
A: Three.js builds a scene graph (geometry + material + lights + camera), and on every animation frame calls `renderer.render(scene, camera)`, which Three.js translates into WebGL draw calls and GLSL shader execution on the GPU, painting the result onto the `<canvas>` element.

**Q: What happens if someone's browser doesn't support WebGL?**
A: The code detects that and falls back to a static gradient background instead of crashing or showing a blank canvas.

**Q: Why does the terrain look like a mesh instead of a solid surface?**
A: Its material has `wireframe: true`, which tells Three.js to draw only the triangle edges of the geometry, not the filled faces — that's a deliberate stylistic choice for the "graphics lab" aesthetic.

---

## 6. Complete rendering theory — how a frame actually gets to the screen

### The universal WebGL pipeline (applies to any 3D scene, not just this one)
1. **Vertex data** (positions, normals, UVs) is uploaded to the GPU as buffers.
2. **Vertex Shader** runs once per vertex, multiplying its position through the **Model matrix** (object's own transform) → **View matrix** (camera's inverse transform) → **Projection matrix** (implements FOV/perspective, maps to clip space).
3. **Rasterization** — fixed-function GPU hardware figures out which screen pixels each triangle covers.
4. **Fragment Shader** runs once per covered pixel — computes the final color using lights, material properties (color/roughness/metalness), and any textures.
5. **Depth testing** — discards pixels that are behind something already drawn closer to the camera.
6. **Framebuffer** — surviving pixel colors get written to the buffer the browser paints as the visible `<canvas>`.

Nothing persists between frames — the entire pipeline re-runs from scratch every frame, which is why an animation loop exists.

### What Three.js abstracts away
Raw WebGL = you hand-write GLSL shaders and manually compute those 3 matrices yourself every frame. Three.js does this for you: geometries auto-generate vertex buffers, materials map to pre-written GLSL shader programs (`MeshStandardMaterial` = a full PBR lighting shader), and every object auto-tracks its own model matrix from `.position/.rotation/.scale`. `renderer.render(scene, camera)` is the one call that triggers the whole pipeline above for every object in the scene graph.

### My scene's actual contents
Beyond the sphere, the hero's `THREE.Scene()` also contains: a wireframe copy of the sphere, a glass icosahedron (`MeshPhysicalMaterial` + `transmission`), a `ringGroup` with three 3D "tech slab" panels (C++/OpenGL/GLSL), a metallic pedestal (cylinder + glowing torus ring), the procedural wireframe terrain, a reflective ground plane, a `GridHelper`, ~18 floating wireframe primitives, a 320-point particle field, 2 point lights + 1 ambient light, and a sun/moon that shift with real time of day.

### What `animate()` does every single frame (~60/sec)
1. Schedules itself again via `requestAnimationFrame`, bails early if the tab is hidden.
2. Rotates the sphere/wireframe/ring group based on elapsed time *and* scroll progress.
3. **Raycasts from the camera through the mouse position** into the scene to detect hover over the 3D tech slabs — real 3D mouse-picking, not CSS.
4. Updates rotation of all floating primitives and the particle field.
5. Eases the camera position toward the mouse (lerp: `x += (target - x) * 0.03`) for the parallax effect, and shifts it further based on scroll.
6. Calls `renderer.render(scene, camera)` — this is the line that triggers the full 6-step pipeline above for every object in the scene, all composited into one frame.

Paused entirely via `IntersectionObserver` when the hero scrolls out of view, and replaced with a single static `render()` call (no loop) when `prefers-reduced-motion` is on.
