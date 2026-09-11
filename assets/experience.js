/* Small independent interaction layer for the bright glass treatment. */
(() => {
  const root = document.documentElement;
  const updateGlow = ({ clientX:x, clientY:y }) => {
    root.style.setProperty('--glow-x', `${x}px`);
    root.style.setProperty('--glow-y', `${y}px`);
  };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('pointermove', updateGlow, { passive:true });
  }
  const setSunPhase = () => {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    document.documentElement.dataset.sunPhase = hour < 5.5 || hour >= 20 ? 'night' : hour < 8 ? 'dawn' : hour < 16.5 ? 'day' : hour < 19 ? 'golden' : 'dusk';
  };
  setSunPhase();
  setInterval(setSunPhase, 60000);
  document.querySelectorAll('.proj-card').forEach((card) => {
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0, raf = 0;
    const balance = () => {
      currentX += (targetX - currentX) * .12;
      currentY += (targetY - currentY) * .12;
      card.style.transform = `translateY(-8px) perspective(900px) rotateX(${currentY}deg) rotateY(${currentX}deg)`;
      if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > .02) raf = requestAnimationFrame(balance);
      else { card.style.transform = 'translateY(-8px) perspective(900px) rotateX(0deg) rotateY(0deg)'; raf = 0; }
    };
    card.addEventListener('pointermove', (event) => {
      if (matchMedia('(pointer: coarse)').matches) return;
      const box = card.getBoundingClientRect();
      targetX = ((event.clientX - box.left) / box.width - .5) * 5;
      targetY = ((event.clientY - box.top) / box.height - .5) * -5;
      if (!raf) raf = requestAnimationFrame(balance);
    });
    card.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; if (!raf) raf = requestAnimationFrame(balance); });
  });
})();
