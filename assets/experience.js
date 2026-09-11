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
  document.querySelectorAll('.proj-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (matchMedia('(pointer: coarse)').matches) return;
      const box = card.getBoundingClientRect();
      const rotateY = ((event.clientX - box.left) / box.width - .5) * 3;
      const rotateX = ((event.clientY - box.top) / box.height - .5) * -3;
      card.style.transform = `translateY(-7px) scale(1.008) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
})();
