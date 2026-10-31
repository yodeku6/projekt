const FAVORITES_KEY = 'myFavorites';
const COOKIE_CHOICE_KEY = 'cookieElfogadas';

function readFavorites() {
  try {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    return new Set(Array.isArray(favorites) ? favorites.map(String) : []);
  } catch {
    return new Set();
  }
}

const favorites = readFavorites();

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
}

function openNav() {
  const overlay = document.getElementById('myNav');
  if (overlay) overlay.style.display = 'block';
}

function closeNav() {
  const overlay = document.getElementById('myNav');
  if (overlay) overlay.style.display = 'none';
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const star = target.closest('.star, .termek-star');
  if (star) {
    const itemId = star.dataset.id;
    if (itemId) {
      const isActive = !favorites.has(itemId);
      star.classList.toggle('active', isActive);

      if (isActive) favorites.add(itemId);
      else favorites.delete(itemId);

      saveFavorites();

      if (!isActive && star.closest('.fav-container')) {
        star.closest('.kartya')?.remove();
        const emptyMessage = document.querySelector('.no-fav');
        if (favorites.size === 0 && emptyMessage) emptyMessage.style.display = 'block' 
      }
    }
  }

  const overlay = document.getElementById('myNav');
  const openButton = target.closest('[onclick="openNav()"]');
  if (overlay && !overlay.contains(target) && !openButton) closeNav();
});

document.addEventListener('DOMContentLoaded', () => {
  closeNav();
  initializeRatingRange();
  initializeCookieNotice();
  initializeFavoriteStars();
  loadFavoriteProducts();
  loadRandomProducts(10); // mennyi termeket toltson be a kartya containerbe
});

function initializeRatingRange() {
  const min = document.getElementById('ertekeles-min');
  const max = document.getElementById('ertekeles-max');
  const output = document.getElementById('ertekeles-out');
  const fill = document.getElementById('ertekeles-fill');
  if (!min || !max || !output || !fill) return;

  const thumbWidth = 18;
  const update = (event) => {
    if (event?.target === min && Number(min.value) > Number(max.value)) min.value = max.value;
    if (event?.target === max && Number(max.value) < Number(min.value)) max.value = min.value;

    const range = Number(max.max) - Number(max.min);
    const start = (Number(min.value) - Number(min.min)) / range;
    const end = (Number(max.value) - Number(min.min)) / range;
    fill.style.left = `calc(${thumbWidth / 2}px + (100% - ${thumbWidth}px) * ${start})`;
    fill.style.width = `calc((100% - ${thumbWidth}px) * ${end - start})`;
    output.textContent = `${Number(min.value).toFixed(1)} – ${Number(max.value).toFixed(1)}`;
  };

  min.addEventListener('input', update);
  max.addEventListener('input', update);
  min.addEventListener('pointerdown', () => {
    min.style.zIndex = '2';
    max.style.zIndex = '1';
  });
  max.addEventListener('pointerdown', () => {
    max.style.zIndex = '2';
    min.style.zIndex = '1';
  });
  update();
}

function initializeCookieNotice() {
  const cookie = document.querySelector('.cookie');
  if (!cookie) return;

  const choice = localStorage.getItem(COOKIE_CHOICE_KEY);
  if (choice !== 'elfogadva' && choice !== 'elutasitva') cookie.style.display = 'grid';

  document.getElementById('elfogadas')?.addEventListener('click', () => {
    localStorage.setItem(COOKIE_CHOICE_KEY, 'elfogadva');
    console.log("Sütik elfogadva")
    cookie.style.display = 'none';
  });
  document.getElementById('elutasitas')?.addEventListener('click', () => {
    localStorage.setItem(COOKIE_CHOICE_KEY, 'elutasitva');
    console.log("Sütik elutasítva")
    cookie.style.display = 'none';
  });
}

function initializeFavoriteStars() {
  document.querySelectorAll('.star, .termek-star').forEach((star) => {
    star.classList.toggle('active', favorites.has(star.dataset.id));
  });
}

async function loadFavoriteProducts() {
  const container = document.querySelector('.fav-kartya-container');
  if (!container) return;

  const emptyMessage = document.querySelector('.no-fav');
  if (!document.querySelector('.fav-container') || !emptyMessage) return;

  try {
    const response = await fetch('./products.json');
    if (!response.ok) throw new Error(`Unable to load products: ${response.status}`);
    const products = await response.json();
    const favoriteProducts = products.filter((product) => favorites.has(String(product.id)));

   if (favoriteProducts.length === 0) {
    emptyMessage.style.display = 'block';
    return;
   }
   emptyMessage.style.display = 'none';

   favoriteProducts.forEach((product) => {
        const daysSinceUpdate = (Date.now() - new Date(product.lastUpdated).getTime()) / 86400000;
        let stockClass = 'uncertain';
        if (daysSinceUpdate <= 5 && product.status === 'van') stockClass = 'stock';
        else if (daysSinceUpdate <= 5 && product.status === 'nincs') stockClass = 'unavailable';

        const daysSinceUpload = (Date.now() - new Date(product.uploaded).getTime()) / 86400000;

        container.insertAdjacentHTML('beforeend', `
          <div class="kartya">
            <div class="kartya-img-container">
              <img src="${product.img}" alt="Termék kép" class="kartyakep">
              ${daysSinceUpload < 10 ? '<span class="new">ÚJ!</span>' : ''}
              <svg data-id="${product.id}" class="star active" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
            </div>
            <div class="kartya-info">
              <h2 class="kartya-nev">${product.name}</h2>
              <p class="kartya-ar">${product.price}</p>
              <div title="${stockClass === 'stock' ? 'Van raktáron' : stockClass === 'unavailable' ? 'Nincs raktáron' : 'Bizonytalan'}" class="kor ${stockClass}"></div>
            </div>
          </div>
        `);
      });
  } catch (error) {
    console.error('Could not load favorite products.', error);
  }
}

async function loadRandomProducts(count = 3) {
  const container = document.querySelector('.kartya-container');
  if (!container) return; 

  try {
    const response = await fetch('./products.json');
    if (!response.ok) throw new Error(`Unable to load products: ${response.status}`);
    const products = await response.json();
    
    if (products.length === 0) return;

    // Helper to shuffle any array randomly (Fisher-Yates)
    const shuffleArray = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // Separate items into "New" (uploaded < 10 days ago) and "Regular" pools
    const newItems = [];
    const regularItems = [];

    products.forEach(product => {
      const daysSinceUpload = (Date.now() - new Date(product.uploaded).getTime()) / 86400000;
      if (daysSinceUpload < 10) {
        newItems.push(product);
      } else {
        regularItems.push(product);
      }
    });

    let finalSelection = [];

    // Prioritize: Guarantee at least 1 new item if any exist
    if (newItems.length > 0) {
      const shuffledNew = shuffleArray(newItems);
      // Grab 1 guaranteed new item
      finalSelection.push(shuffledNew[0]);
      
      // Put the rest of the new items together with regular items to fill remaining slots randomly
      const remainingPool = shuffleArray([...shuffledNew.slice(1), ...regularItems]);
      finalSelection = finalSelection.concat(remainingPool.slice(0, count - 1));
    } else {
      // Fallback if there are completely no new items in the JSON file
      finalSelection = shuffleArray(products).slice(0, count);
    }

    // Final shuffle so the guaranteed new item isn't always stuck sitting in the first position
    finalSelection = shuffleArray(finalSelection);

    // Render loop
    finalSelection.forEach((product) => {
      const daysSinceUpdate = (Date.now() - new Date(product.lastUpdated).getTime()) / 86400000;
      let stockClass = 'uncertain';
      if (daysSinceUpdate <= 5 && product.status === 'van') stockClass = 'stock';
      else if (daysSinceUpdate <= 5 && product.status === 'nincs') stockClass = 'unavailable';

      const daysSinceUpload = (Date.now() - new Date(product.uploaded).getTime()) / 86400000;
      const isFavActive = favorites.has(String(product.id)) ? 'active' : '';

      container.insertAdjacentHTML('beforeend', `
        <div class="kartya" title="${daysSinceUpload < 10 ? 'ÚJ! ' + product.name : product.name}">
          <div class="kartya-img-container">
            <img src="${product.img}" alt="Termék kép" class="kartyakep">
            ${daysSinceUpload < 10 ? '<span class="new">ÚJ!</span>' : ''}
            <svg data-id="${product.id}" class="star ${isFavActive}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
            </div>
          <div class="kartya-info">
            <h2 class="kartya-nev">${product.name}</h2>
            <p class="kartya-ar">${product.price}</p>
            <div title="${stockClass === 'stock' ? 'Van raktáron' : stockClass === 'unavailable' ? 'Nincs raktáron' : 'Bizonytalan'}" class="kor ${stockClass}"><span>${stockClass === 'stock' ? '✓' : stockClass === 'unavailable' ? 'X' : '—'}</span></div>
          </div>
        </div>
      `);
    });
  } catch (error) {
    console.error('Could not load prioritized random products.', error);
  }
}
