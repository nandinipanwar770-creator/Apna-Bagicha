// Ripple effect on card click
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(58,112,50,0.15);
      width: 10px; height: 10px;
      top: ${e.offsetY}px; left: ${e.offsetX}px;
      transform: translate(-50%,-50%) scale(0);
      animation: ripple .5s ease-out forwards;
      pointer-events: none;
    `;
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });
});

// Inject ripple keyframe
const style = document.createElement('style');
style.textContent = `@keyframes ripple { to { transform: translate(-50%,-50%) scale(30); opacity: 0; } }`;
document.head.appendChild(style);

// Drag-to-scroll on trust bar (mobile friendly)
const trustInner = document.querySelector('.trust-inner');
if (trustInner) {
  let isDown = false, startX, scrollLeft;

  trustInner.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.pageX - trustInner.offsetLeft;
    scrollLeft = trustInner.scrollLeft;
  });
  trustInner.addEventListener('mouseleave', () => isDown = false);
  trustInner.addEventListener('mouseup',    () => isDown = false);
  trustInner.addEventListener('mousemove',  e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - trustInner.offsetLeft;
    trustInner.scrollLeft = scrollLeft - (x - startX) * 1.5;
  });
}