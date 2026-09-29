document.addEventListener('DOMContentLoaded', () => {
    const min = document.getElementById('ertekeles-min');
    const max = document.getElementById('ertekeles-max');
    const out = document.getElementById('ertekeles-out');
    const fill = document.getElementById('ertekeles-fill');
    const thumb = 18;

    if (!min || !max || !out || !fill) return;

    function update(e) {
        if (e && e.target === min && +min.value > +max.value) min.value = max.value;
        if (e && e.target === max && +max.value < +min.value) max.value = min.value;
      
        const range = max.max - max.min;
        const a = (min.value - min.min) / range;
        const b = (max.value - min.min) / range;
      
        fill.style.left  = `calc(${thumb / 2}px + (100% - ${thumb}px) * ${a})`;
        fill.style.width = `calc((100% - ${thumb}px) * ${b - a})`;
      
        out.textContent = `${(+min.value).toFixed(1)} – ${(+max.value).toFixed(1)}`;
      }
      
    min.oninput = max.oninput = update;
    min.oninput = max.oninput = update;

    // bring whichever handle was last touched to the front
    min.addEventListener('pointerdown', () => { min.style.zIndex = 2; max.style.zIndex = 1; });
    max.addEventListener('pointerdown', () => { max.style.zIndex = 2; min.style.zIndex = 1; });

    update(); // initial call, no event, so no clamping
});
