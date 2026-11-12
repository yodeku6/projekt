﻿const FAVORITES_KEY = 'myFavorites';
const COOKIE_CHOICE_KEY = 'cookieElfogadas';
const CART_STORAGE_KEY = 'cartItems';
// TEMP ADMIN SIGN-IN START: remove this block and its two marked hooks when ready.
// Demo-only credentials. This check runs in the browser, so it is not
// suitable for protecting real or sensitive account data.
const TEMP_ADMIN_USERNAME = 'admin';
const TEMP_ADMIN_PASSWORD = 'admin';
const TEMP_ADMIN_SESSION_KEY = 'temporaryAdminSignedIn';
const productCatalog = new Map();
let homeProducts = [];
let defaultHomeProducts = [];

function isNewProduct(uploadedDate) {
  if (!uploadedDate) return false;

  const uploadTime = new Date(uploadedDate).getTime();

  if (Number.isNaN(uploadTime)) return false;

  const tenDaysAgo = Date.now() - (10 * 24 * 60 * 60 * 1000);

  // Future dates intentionally count as new.
  return uploadTime >= tenDaysAgo;
}

function renderAvailabilityIndicator(stockClass) {
  const states = {
    stock: { label: 'Van raktáron', icon: '<path d="m5 12.5 4.2 4.2L19 7" />'},
    uncertain: { label: 'Bizonytalan', icon: '<path d="M5 12h14" />' },
    unavailable: { label: 'Nincs raktáron', icon: '<path d="m7 7 10 10M17 7 7 17" />' }
  };
  const state = states[stockClass] || states.uncertain;

  return `<div class="kor ${stockClass}" role="img" aria-label="${state.label}" title="${state.label}">
    <svg class="availability-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${state.icon}</svg>
  </div>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function getDaysSince(dateValue) {
  const timestamp = Date.parse(dateValue);
  if (!Number.isFinite(timestamp)) return null;
  return (Date.now() - timestamp) / 86400000;
}

function isWithinDays(dateValue, days) {
  const age = getDaysSince(dateValue);
  return age !== null && age <= days;
}

function getProductStockClass(product) {
  if (!isWithinDays(product.lastUpdated, 10)) return 'uncertain';
  if (product.status === 'van') return 'stock';
  if (product.status === 'nincs') return 'unavailable';
  return 'uncertain';
}

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
  // Signed-in users get the small menu; signed-out users get the existing login overlay.
  const accountDropdown = document.getElementById('accountDropdown');
  if (sessionStorage.getItem('temporaryAdminSignedIn') === 'true') {
    closeNav();
    if (accountDropdown) accountDropdown.hidden = !accountDropdown.hidden;
    return;
  }

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
      event.preventDefault();

      if (!isActive && star.closest('.fav-container')) {
        star.closest('.kartya')?.remove();
        const emptyMessage = document.querySelector('.no-fav');
        const remainingCards = document.querySelectorAll('.fav-kartya-container .kartya').length;
        if (remainingCards === 0 && emptyMessage) emptyMessage.style.display = 'block';
      }
    }
  }

  const overlay = document.getElementById('myNav');
  const accountDropdown = document.getElementById('accountDropdown');
  const openButton = target.closest('[onclick="openNav()"]');
  // Clicking anywhere outside the open menu or overlay closes it.
  if (overlay && !overlay.contains(target) && !openButton) closeNav();
  if (accountDropdown && !accountDropdown.contains(target) && !openButton) {
    accountDropdown.hidden = true;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  closeNav();
  initializeRatingRange();
  initializeCookieNotice();
  initializeFavoriteStars();
  initializeProductSearch();
  initializeFavoriteSearch();
  loadFavoriteProducts();
  loadRandomProducts(9); // alapértelmezésben ennyi ajánlott termék jelenik meg
  initializeCart();
  // TEMP ADMIN SIGN-IN: remove this call with the temporary auth block below.
  initializeTemporaryAdminSignIn();
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

  // COOKIE GUI SHOW -----------------------
  const choice = localStorage.getItem(COOKIE_CHOICE_KEY);
  if (choice !== 'elfogadva' && choice !== 'elutasitva') cookie.style.display = 'grid'; // ha ezzel akarunk foglalkozni akkor a && helyére || kell

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
    products.forEach((product) => productCatalog.set(String(product.id), product));
    const favoriteProducts = products.filter((product) => favorites.has(String(product.id)));

   if (favoriteProducts.length === 0) {
    emptyMessage.style.display = 'block';
    return;
   }
   emptyMessage.style.display = 'none';

   favoriteProducts.forEach((product) => {
        const stockClass = getProductStockClass(product);
        const isNew = isWithinDays(product.uploaded, 10);
        const productId = escapeHtml(product.id);
        const productName = escapeHtml(product.name);
        const productPrice = escapeHtml(product.price);
        const productImage = escapeHtml(product.img || './img/colpick.png');

        // KEDVENCEK --------------------
        container.insertAdjacentHTML('beforeend', `
          <div class="kartya">
          <a href="">
            <div class="kartya-img-container">
              <img src="${productImage}" alt="Termék kép" class="kartyakep">
              ${isNew ? '<span class="new">ÚJ!</span>' : ''}
              <svg data-id="${productId}" class="star active" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
            </div>
            <div class="kartya-info">
              <h2 class="kartya-nev">${productName}</h2>
              <p class="kartya-ar">${productPrice}</p>
              ${renderAvailabilityIndicator(stockClass)}
            </div>
            <button type="button" class="add-to-cart-btn" data-add-to-cart data-product-id="${productId}">Listába</button>
            </a>
          </div>
        `);
      });
            initializeFavoriteSearch();
  } catch (error) {
    console.error('Could not load favorite products.', error);
  }
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('hu-HU')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
function initializeFavoriteSearch() {
  const searchInput = document.getElementById('kereso');
  const container = document.querySelector('.fav-kartya-container');

  if (!searchInput || !container) return;

  const emptyMessage = document.querySelector('.no-fav');
  const noResultsMessage = document.querySelector('.fav-search-no-results');

  function filterFavorites() {
    const query = normalizeSearchText(searchInput.value);

    const cards = container.querySelectorAll('.kartya');
    let visibleCount = 0;

    cards.forEach((card) => {
      const name = card.querySelector('.kartya-nev')?.textContent || '';
      const price = card.querySelector('.kartya-ar')?.textContent || '';

      const searchableText = normalizeSearchText(name + ' ' + price);
      const matches = searchableText.includes(query);

      card.style.display = matches ? '' : 'none';

      if (matches) visibleCount++;
    });

    if (noResultsMessage) {
      noResultsMessage.style.display =
        cards.length > 0 && visibleCount === 0 ? 'block' : 'none';
    }

    if (emptyMessage) {
      emptyMessage.style.display = cards.length === 0 ? 'block' : 'none';
    }
  }

  searchInput.addEventListener('input', filterFavorites);

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      searchInput.value = '';
      filterFavorites();
      searchInput.blur();
    }
  });
}

function initializeProductSearch() {
  const searchInput = document.getElementById('kereso');
  const productContainer = document.querySelector('.kartya-container', '.fav-kartya-container');
  if (!searchInput || !productContainer) return;

  searchInput.setAttribute('aria-label', 'Termék keresése név vagy ár alapján');
  searchInput.addEventListener('input', renderHomeProducts);
  searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !searchInput.value) return;
    searchInput.value = '';
    renderHomeProducts();
    searchInput.blur();
  });
}

function chooseDefaultProducts(products, count) {
  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  if (products.length <= count) return shuffle(products);

  const newItems = products.filter((product) => isWithinDays(product.uploaded, 10));
  const regularItems = products.filter((product) => !isWithinDays(product.uploaded, 10));

  if (newItems.length === 0) return shuffle(products).slice(0, count);

  const [featuredNewItem] = shuffle(newItems);
  const remainingPool = shuffle([
    ...newItems.filter((product) => product !== featuredNewItem),
    ...regularItems
  ]);

  return [featuredNewItem, ...remainingPool.slice(0, count - 1)];
}

function renderHomeProducts() {
  const container = document.querySelector('.kartya-container', '.fav-kartya-container');
  if (!container) return;

  const searchInput = document.getElementById('kereso');
  const query = normalizeSearchText(searchInput?.value || '');
  let productsToShow = defaultHomeProducts;

  if (query) {
    const searchTerms = query.split(/\s+/).filter(Boolean);
    productsToShow = homeProducts.filter((product) => {
      const searchableText = normalizeSearchText([
        product.name,
        product.price,
        product.store,
        product.description
      ].filter(Boolean).join(' '));

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }

  container.replaceChildren();

  if (productsToShow.length === 0) {
    const message = document.createElement('p');
    message.className = 'search-no-results';
    message.setAttribute('role', 'status');
    message.textContent = 'Nincs a keresésnek megfelelő termék.';
    container.appendChild(message);
    return;
  }

  const cards = productsToShow.map((product) => {
    const daysSinceUpload = getDaysSince(product.uploaded);
    const isNew = isWithinDays(product.uploaded, 10);
    const stockClass = getProductStockClass(product);
    const isFavActive = favorites.has(String(product.id)) ? 'active' : '';
    const productId = escapeHtml(product.id);
    const productName = escapeHtml(product.name);
    const productPrice = escapeHtml(product.price);
    const productImage = escapeHtml(product.img || './img/colpick.png');
    const cardTitle = escapeHtml(`${isNew ? 'ÚJ! ' : ''}${product.name || 'Termék'}`);

    return `
      <div class="kartya" title="${cardTitle}">
        <div class="kartya-img-container">
          <img src="${productImage}" alt="${productName}" class="kartyakep" loading="lazy">
          ${isNew ? '<span class="new">ÚJ!</span>' : ''}
          <svg data-id="${productId}" class="star ${isFavActive}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="kartya-info">
          <h2 class="kartya-nev">${productName}</h2>
          <p class="kartya-ar">${productPrice}</p>
          ${renderAvailabilityIndicator(stockClass)}
        </div>
        <button type="button" class="add-to-cart-btn" data-add-to-cart data-product-id="${productId}">Listába</button>
      </div>
    `;
  }).join('');

  container.insertAdjacentHTML('beforeend', cards);
}

async function loadRandomProducts(count = 3) {
  const container = document.querySelector('.kartya-container');
  if (!container) return;

  try {
    const response = await fetch('./products.json');
    if (!response.ok) throw new Error(`Unable to load products: ${response.status}`);

    const products = await response.json();
    if (!Array.isArray(products)) throw new Error('The product catalogue must be an array.');

    homeProducts = products.filter((product) => product && product.id != null);
    homeProducts.forEach((product) => productCatalog.set(String(product.id), product));
    defaultHomeProducts = chooseDefaultProducts(homeProducts, count);
    renderHomeProducts();
  } catch (error) {
    console.error('Could not load products.', error);
    container.replaceChildren();
    const message = document.createElement('p');
    message.className = 'search-no-results';
    message.setAttribute('role', 'status');
    message.textContent = 'A termékeket most nem sikerült betölteni.';
    container.appendChild(message);
  }
}

// Cart -------------------------------------------------------------------------

function readCartFromStorage() {
  try {
    const savedItems = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(savedItems)) return [];

    return savedItems
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        id: item.id == null ? null : String(item.id),
        img: String(item.img || ''),
        name: String(item.name || 'Ismeretlen termék'),
        price: String(item.price || '0 Ft'),
        kg: item.kg === true,
        quantity: Math.max(item.kg === true ? 0.5 : 1, Number(item.quantity) || (item.kg === true ? 0.5 : 1))
      }));
  } catch (error) {
    console.warn('A mentett kosár nem olvasható, ezért üres kosárral indul.', error);
    return [];
  }
}

function getPriceInForints(price) {
  return Number.parseInt(String(price).replace(/[^0-9]/g, ''), 10) || 0;
}

function formatForints(amount) {
  return `${new Intl.NumberFormat('hu-HU').format(amount)} Ft`;
}

async function initializeCart() {
  // Load product metadata before rendering stored cart entries so legacy entries
  // can also pick up their kg setting from products.json.
  try {
    const response = await fetch('./products.json');
    if (response.ok) {
      const products = await response.json();
      products.forEach((product) => productCatalog.set(String(product.id), product));
    }
  } catch (error) {
    console.warn('A termékek kilogramm adatait nem sikerült betölteni.', error);
  }

  const cart = document.querySelector('.kosar');
  const cartContent = document.querySelector('.tartalom');
  if (!cart || !cartContent) return;

  const cartIcons = document.querySelectorAll('#lista-icon');
  const cartBadges = document.querySelectorAll('.cart-item-count');
  const closeCartButton = document.getElementById('kosar-bezaras');
  const cartBackdrop = document.querySelector('.kosar-backdrop');
  const purchaseButton = document.querySelector('.vevo-gomb');
  const totalElement = document.querySelector('.osszeg');
  let cartItems = readCartFromStorage();

  function saveCartToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('A kosarat nem sikerült elmenteni a böngésző tárhelyére.', error);
    }
  }

  function updateCartCountBadge() {
    const totalItems = Math.floor(cartItems.reduce((total, item) => total + item.quantity, 0));
    cartBadges.forEach((badge) => {
      badge.textContent = totalItems;
      badge.style.visibility = totalItems > 0 ? 'visible' : 'hidden';
    });
  }

  function createCartItem(item, index) {
    const isKg = item.kg || productCatalog.get(String(item.id))?.kg === 'igen';
    item.kg = isKg;
    const cartBox = document.createElement('article');
    cartBox.className = 'kosar-box';

    const image = document.createElement('img');
    image.className = 'kosar-img';
    image.src = item.img;
    image.alt = item.name;

    const description = document.createElement('div');
    description.className = 'kosar-desc';

    const name = document.createElement('p');
    name.className = 'kosar-prod-name';
    name.textContent = item.name;

    const linePrice = document.createElement('span');
    linePrice.className = 'kosar-ar';
    linePrice.textContent = formatForints(getPriceInForints(item.price) * item.quantity);

    const quantityControls = document.createElement('div');
    quantityControls.className = 'kosar-mennyiseg';

    const decreaseButton = document.createElement('button');
    decreaseButton.type = 'button';
    decreaseButton.className = 'kosar-mennyiseg-gomb';
    decreaseButton.dataset.cartAction = 'decrease';
    decreaseButton.dataset.index = index;
    decreaseButton.setAttribute('aria-label', `${item.name} mennyiségének csökkentése`);
    decreaseButton.textContent = '-';

    const quantity = document.createElement('span');
    quantity.className = 'kosar-szam';
    quantity.textContent = `${Number.isInteger(item.quantity) ? item.quantity : item.quantity.toLocaleString('hu-HU')} ${isKg ? 'kg' : ''}`.trim();

    const increaseButton = document.createElement('button');
    increaseButton.type = 'button';
    increaseButton.className = 'kosar-mennyiseg-gomb';
    increaseButton.dataset.cartAction = 'increase';
    increaseButton.dataset.index = index;
    increaseButton.setAttribute('aria-label', `${item.name} mennyiségének növelése`);
    increaseButton.textContent = '+';

    quantityControls.append(decreaseButton, quantity, increaseButton);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'kosar-torles';
    removeButton.dataset.cartAction = 'remove';
    removeButton.dataset.index = index;
    removeButton.setAttribute('aria-label', `${item.name} törlése a kosárból`);
    removeButton.textContent = 'Törlés';

    description.append(name, linePrice, quantityControls);
    cartBox.append(image, description, removeButton);
    return cartBox;
  }

  function updateCart() {
    cartContent.replaceChildren();

    if (cartItems.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'kosar-ures';
      emptyMessage.textContent = 'A bevásárlólista jelenleg üres.';
      cartContent.appendChild(emptyMessage);
    } else {
      cartItems.forEach((item, index) => {
        cartContent.appendChild(createCartItem(item, index));
      });
    }

    const total = cartItems.reduce(
      (sum, item) => sum + getPriceInForints(item.price) * item.quantity,
      0
    );
    if (totalElement) totalElement.textContent = formatForints(total);
    updateCartCountBadge();
  }

  function openCart() {
    cart.classList.add('active');
    cart.setAttribute('aria-hidden', 'false');
    cartBackdrop?.classList.add('active');
    cartIcons.forEach((icon) => icon.setAttribute('aria-expanded', 'true'));
    document.body.classList.add('cart-open');
    closeCartButton?.focus();
  }

  function closeCart() {
    cart.classList.remove('active');
    cart.setAttribute('aria-hidden', 'true');
    cartBackdrop?.classList.remove('active');
    cartIcons.forEach((icon) => icon.setAttribute('aria-expanded', 'false'));
    document.body.classList.remove('cart-open');
  }

  function addToCart(product) {
    const productId = String(product.id);
    const existingItem = cartItems.find((item) => item.id === productId || (item.id === null && item.name === product.name));
    const quantityStep = product.kg === 'igen' ? 0.5 : 1;

    if (existingItem) {
      existingItem.id = productId;
      existingItem.kg = product.kg === 'igen';
      existingItem.quantity += quantityStep;
    } else {
      cartItems.push({
        id: productId,
        img: product.img,
        name: product.name,
        price: product.price,
        kg: product.kg === 'igen',
        quantity: quantityStep
      });
    }

    saveCartToStorage();
    updateCart();
    openCart();
  }

  cartIcons.forEach((cartIcon) => {
    cartIcon.addEventListener('click', (event) => {
      event.preventDefault();
      openCart();
    });
  });

  closeCartButton?.addEventListener('click', closeCart);
  cartBackdrop?.addEventListener('click', closeCart);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cart.classList.contains('active')) closeCart();
  });

  // The product cards are loaded dynamically, so use delegated click handling.
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const addButton = event.target.closest('[data-add-to-cart]');
    if (!addButton) return;

    event.preventDefault();

    const product = productCatalog.get(String(addButton.dataset.productId));
    if (product) addToCart(product);
  });

  cartContent.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const actionButton = event.target.closest('[data-cart-action]');
    if (!actionButton) return;

    const index = Number.parseInt(actionButton.dataset.index, 10);
    if (!Number.isInteger(index) || !cartItems[index]) return;

    const action = actionButton.dataset.cartAction;
    const isKg = cartItems[index].kg || productCatalog.get(String(cartItems[index].id))?.kg === 'igen';
    const quantityStep = isKg ? 0.5 : 1;
    if (action === 'increase') {
      cartItems[index].quantity += quantityStep;
    } else if (action === 'decrease') {
      cartItems[index].quantity = Math.max(quantityStep, cartItems[index].quantity - quantityStep);
    } else if (action === 'remove') {
      cartItems.splice(index, 1);
    }

    saveCartToStorage();
    updateCart();
  });

  purchaseButton?.addEventListener('click', () => {
    if (cartItems.length === 0) {
      alert('A lista üres!');
      return;
    }

    // alert('Köszönjük a vásárlást! Jó étvágyat!');
    // cartItems = [];
    
    saveCartToStorage();
    updateCart();
    closeCart();
  });

  updateCart();
}

// DRAG AND DROP ----------------------------------------------------
// Maximum accepted image size. Change this value to adjust the limit.
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const dropZone = document.querySelector('.termek-kep');
const fileInput = document.getElementById('feltoltes');
const promptText = document.querySelector('.img-upload');

if (dropZone && fileInput) {
// 1. Open file picker when clicking the drop zone
dropZone.addEventListener('click', () => fileInput.click());

// 2. Drag and drop visual effects
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
  // Drag events bubble from the label and preview; keep the highlight while
  // the pointer is still somewhere inside the drop zone.
  if (dropZone.contains(e.relatedTarget)) return;
  dropZone.classList.remove('drag-over');
});

// 3. Handle dropped files
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleSingleImage(files[0]); // Only take the first file
  }
});

// 4. Handle clicked/selected files
fileInput.addEventListener('change', (e) => {
  const files = e.target.files;
  if (files.length > 0) {
    handleSingleImage(files[0]); // Only take the first file
  }
});
}

// 5. Read the image file and show the preview
function handleSingleImage(file) {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    alert(`A kép legfeljebb ${MAX_IMAGE_SIZE_MB} MB lehet.`);
    if (fileInput) fileInput.value = '';
    return;
  }

  // Security check: Make sure it's actually an image
  if (!file.type.startsWith('image/')) {
    alert('Kérlek képet tölts fel!');
    return;
  }

  const reader = new FileReader();

  // This fires once the browser finishes reading the file
  reader.onload = function(event) {
    // Remove any existing preview image first
    const existingImg = dropZone.querySelector('.preview-img');
    if (existingImg) existingImg.remove();

    // Create a new image element
    const img = document.createElement('img');
    img.src = event.target.result; // This is the image data
    img.classList.add('preview-img');

    // Hide the prompt text and show the image inside the dropzone
    if (promptText) promptText.style.display = 'none';
    dropZone.appendChild(img);
  };

  // Convert image file into a usable data string URL
  reader.readAsDataURL(file);
}

function initializeTemporaryAdminSignIn() {
  const signInOverlay = document.getElementById('myNav');
  const usernameInput = signInOverlay?.querySelector('#username');
  const passwordInput = signInOverlay?.querySelector('#password');
  const signInButton = signInOverlay?.querySelector('.sign-in-btn');
  const accountImage = document.querySelector('.overlay-container img[onclick="openNav()"]');
  if (!usernameInput || !passwordInput || !signInButton || !accountImage) return;

  const showAdminImage = () => {
    accountImage.src = './img/test.png';
    accountImage.alt = 'Admin';
    accountImage.title = 'Admin';
  };

  if (sessionStorage.getItem(TEMP_ADMIN_SESSION_KEY) === 'true') showAdminImage();

  const signIn = (event) => {
    event?.preventDefault();
    if (usernameInput.value.trim() !== TEMP_ADMIN_USERNAME || passwordInput.value !== TEMP_ADMIN_PASSWORD) {
      alert('Hibás felhasználónév vagy jelszó.');
      usernameInput.value="";
      passwordInput.value="";
      usernameInput.focus();
      return;
    }

    sessionStorage.setItem(TEMP_ADMIN_SESSION_KEY, 'true');
    closeNav();
    const accountDropdown = document.getElementById('accountDropdown');
    if (accountDropdown) accountDropdown.hidden = true;
    showAdminImage();
  };

  signInButton.addEventListener('click', signIn);
  [usernameInput, passwordInput].forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') signIn(event);
    });
  });
}

function signOut() {
  sessionStorage.removeItem(TEMP_ADMIN_SESSION_KEY);
  const accountDropdown = document.getElementById('accountDropdown');
  if (accountDropdown) accountDropdown.hidden = true;
  const accountImage = document.querySelector('.overlay-container img[onclick="openNav()"]');
  if (accountImage) {
    accountImage.src = './img/svg/fiok.svg';
    accountImage.alt = '';
    accountImage.title = 'Fiók';
  }
  closeNav();
}
// TEMP ADMIN SIGN-IN END