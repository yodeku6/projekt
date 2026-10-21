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

function openNav() {
  const overlay = document.getElementById("myNav");
  if (overlay) overlay.style.display = "block";
}

function closeNav() {
  const overlay = document.getElementById("myNav");
  if (overlay) overlay.style.display = "none";
}

closeNav();

document.addEventListener('click', (event) => {
  const dropdownElement = document.getElementById('myNav');
  const openButton = event.target.closest('[onclick="openNav()"]');

  if (!dropdownElement || dropdownElement.contains(event.target) || openButton) return;

  closeNav();
});


const cookie = document.querySelector(".cookie");
const elfogadas = document.querySelector("#elfogadas")
const elutasitas = document.querySelector("#elutasitas")

document.addEventListener("DOMContentLoaded", () => {
  const cookieChoice = localStorage.getItem("cookieElfogadas");
  
  // ne jelenjen meg megint 
  if (cookieChoice !== "elfogadva" && cookieChoice !== "elutasitva") {
    cookie.style.display = "grid"; 
  }
});


elfogadas.addEventListener("click", () => {
  console.log("Sütik elfogadva");
  localStorage.setItem("cookieElfogadas", "elfogadva");
  cookie.style.display = "none";
});

elutasitas.addEventListener("click", () => {
  console.log("Sütik elutasítva");
  localStorage.setItem("cookieElfogadas", "elutasitva");
  cookie.style.display = "none";
});

const list = [];
const fav = [];

document.querySelectorAll('.star').forEach((star) => {
  star.addEventListener('click', () => {
    const isNowActive = star.classList.toggle('active');
    const itemId = star.dataset.id;

    if (isNowActive) {
      console.log(`Favorited item ID: ${itemId}`);
    }
    else {
      console.log(`Unfavorited item ID: ${itemId}`)
    }
  });
});





// function elfogadva() {
//   console.log("Sütik elfogadva");
//   cookie.style.display = "none";
// }

// function elutasitva() {
//   console.log("Sütik elutasítva");
//   cookie.style.display = "none";
// }
// const cookieButton = document.querySelector(".cookie-btn");
// function remove(){
//   cookie.style.display = "none";
// }
// function decision() {
//   if (elfogadas.addEventListener("click") ) {}
//     console.log("Elfogadva");
//   }
//   if(elutasitas.addEventListener("click") ) {
//     console.log("Elutasítva");
//   }
//   cookie.style.display = "none";
// }
// cookieButton.addEventListener("click", remove);
