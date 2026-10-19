
"use strict";

/* THE CHOCOLATE STORY
   Shared store functionality
   Prices for Choco Bowls are based on the supplied menu.
   Confirm prices, availability and WhatsApp number before launch.
*/

const STORE_WHATSAPP = "918847050895";
const CART_STORAGE_KEY = "theChocolateStoryCart";

/* ---------------------------------
   PRODUCT CATALOGUE
---------------------------------- */

const PRODUCTS = [
  // CHOCO BOWLS — prices from supplied menu
  { id: "dark-heaven", name: "Dark Heaven", category: "bowls", price: 150, description: "A rich chocolate bowl for dark chocolate lovers.", symbol: "●" },
  { id: "kunafa", name: "Kunafa", category: "bowls", price: 300, description: "A delicious Kunafa-inspired chocolate bowl.", symbol: "✳" },
  { id: "ferrero", name: "Ferrero", category: "bowls", price: 200, description: "A chocolate bowl inspired by a much-loved flavour.", symbol: "✦" },
  { id: "kitkat", name: "Kitkat", category: "bowls", price: 150, description: "A crunchy chocolate favourite.", symbol: "◇" },
  { id: "biscoff", name: "Biscoff", category: "bowls", price: 250, description: "A delicious bowl for Biscoff flavour fans.", symbol: "♡" },
  { id: "hazelnut", name: "Hazelnut", category: "bowls", price: 200, description: "A nutty chocolate flavour.", symbol: "◉" },
  { id: "oreo", name: "Oreo", category: "bowls", price: 150, description: "An Oreo-inspired chocolate bowl.", symbol: "◌" },
  { id: "nutella", name: "Nutella", category: "bowls", price: 150, description: "A Nutella-inspired bowl for chocolate lovers.", symbol: "♡" },
  { id: "banana", name: "Banana", category: "bowls", price: 150, description: "Discover the Banana Choco Bowl.", symbol: "⌁" },
  { id: "paan", name: "Paan", category: "bowls", price: 200, description: "A distinctive paan-inspired flavour.", symbol: "❋" },
  { id: "rasmalai", name: "Rasmalai", category: "bowls", price: 250, description: "A traditional dessert-inspired chocolate flavour.", symbol: "✿" },

  // SIGNATURE FLAVOURS — enquiry only; prices not confirmed
  { id: "almond-crunch", name: "Almond Crunch", category: "chocolates", price: null, description: "Ask the store about availability and pricing for Almond Crunch.", symbol: "✦", enquiryOnly: true },
  { id: "strawberry", name: "Strawberry", category: "chocolates", price: null, description: "Ask the store about availability and pricing for Strawberry chocolate.", symbol: "♡", enquiryOnly: true },
  { id: "royal-paan", name: "Royal Paan", category: "chocolates", price: null, description: "Ask the store about availability and pricing for Royal Paan.", symbol: "❋", enquiryOnly: true },
  { id: "ferrero-rocher", name: "Ferrero Rocher", category: "chocolates", price: null, description: "Ask the store about availability and pricing for Ferrero Rocher chocolate.", symbol: "✦", enquiryOnly: true },
  { id: "kunafa-bar", name: "Kunafa Bar", category: "chocolates", price: null, description: "Ask the store about availability and pricing for the Kunafa Bar.", symbol: "✳", enquiryOnly: true },

  // GIFTING CONCEPTS — enquiry only, not confirmed inventory
  { id: "personalised-hamper", name: "Personalised Gift Hamper", category: "gifts", price: null, description: "Enquire about a personalised chocolate gift hamper for your occasion.", symbol: "♡", enquiryOnly: true },
  { id: "celebration-box", name: "Celebration Gift Box", category: "gifts", price: null, description: "Ask about chocolate gifting options for birthdays and celebrations.", symbol: "✦", enquiryOnly: true },
  { id: "chocolate-surprise", name: "Chocolate Surprise Box", category: "gifts", price: null, description: "Enquire about a chocolate surprise box for someone special.", symbol: "🎁", enquiryOnly: true }
];

/* ---------------------------------
   GENERAL HELPERS
---------------------------------- */

function formatPrice(amount) {
  if (amount === null || amount === undefined) return "Price on enquiry";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function getProduct(id) {
  return PRODUCTS.find(product => product.id === id);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function getCategoryLabel(category) {
  return {
    bowls: "CHOCO BOWL",
    chocolates: "SIGNATURE CHOCOLATE",
    gifts: "GIFTS & HAMPERS"
  }[category] || "THE CHOCOLATE STORY";
}

function getCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];

    return saved
      .filter(item => {
        const product = getProduct(item.id);
        return product &&
          !product.enquiryOnly &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0;
      })
      .map(item => ({
        id: item.id,
        quantity: Math.min(99, item.quantity)
      }));
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartUI();

  document.dispatchEvent(new CustomEvent("cart:updated", {
    detail: { cart }
  }));
}

function getCartDetails() {
  return getCart().map(item => {
    const product = getProduct(item.id);
    return {
      ...product,
      quantity: item.quantity,
      lineTotal: product.price * item.quantity
    };
  });
}

function getCartCount() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
  return getCartDetails().reduce((total, item) => total + item.lineTotal, 0);
}

/* ---------------------------------
   WHATSAPP ENQUIRIES
---------------------------------- */

function openProductEnquiry(product) {
  if (!product) return;

  const message = [
    "Hello The Chocolate Story!",
    "",
    "I'm interested in: " + product.name,
    "Collection: " + getCategoryLabel(product.category),
    "",
    "Please share the current price, availability and ordering details."
  ].join("\n");

  openWhatsAppMessage(message);
}

function openWhatsAppMessage(message) {
  if (!/^\d{10,15}$/.test(STORE_WHATSAPP)) {
    alert("Please configure the store's WhatsApp number first.");
    return;
  }

  const url = "https://wa.me/" + STORE_WHATSAPP +
    "?text=" + encodeURIComponent(message);

  window.open(url, "_blank", "noopener,noreferrer");
}

/* ---------------------------------
   CART ACTIONS
---------------------------------- */

function addToCart(productId, quantity = 1) {
  const product = getProduct(productId);

  if (!product) {
    showToast("This product could not be found.");
    return;
  }

  if (product.enquiryOnly || product.price === null) {
    openProductEnquiry(product);
    return;
  }

  const amount = Math.max(1, Math.min(99, Number(quantity) || 1));
  const cart = getCart();
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + amount);
  } else {
    cart.push({ id: productId, quantity: amount });
  }

  saveCart(cart);
  showToast(product.name + " added to your bag.");
}

function setCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(entry => entry.id === productId);

  if (!item) return;

  if (quantity <= 0) {
    saveCart(cart.filter(entry => entry.id !== productId));
  } else {
    item.quantity = Math.min(99, Math.floor(quantity));
    saveCart(cart);
  }

  renderCartPage();
}

function removeFromCart(productId) {
  saveCart(getCart().filter(item => item.id !== productId));
  renderCartPage();
}

function clearCart() {
  saveCart([]);
  renderCartPage();
}

/* ---------------------------------
   HEADER / NAVIGATION
---------------------------------- */

function updateCartUI() {
  const count = getCartCount();
  const total = getCartTotal();

  const countElement = document.getElementById("cartCount");
  const mobileCount = document.getElementById("mobileCartCount");
  const mobileTotal = document.getElementById("mobileCartTotal");

  if (countElement) countElement.textContent = count;
  if (mobileCount) mobileCount.textContent = count;
  if (mobileTotal) mobileTotal.textContent = count ? formatPrice(total) : "";
}

function initNavigation() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    toggle.textContent = isOpen ? "×" : "☰";
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      toggle.textContent = "☰";
    });
  });
}

/* ---------------------------------
   TOAST MESSAGE
---------------------------------- */

function showToast(message) {
  let toast = document.getElementById("storeToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "storeToast";
    toast.className = "store-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("visible");

  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2400);
}

/* ---------------------------------
   PRODUCT CARDS
---------------------------------- */

function productCardHTML(product) {
  const priceText = formatPrice(product.price);

  const action = product.enquiryOnly
    ? `<button class="button button-outline enquiry-button"
         type="button" data-enquire="${escapeHTML(product.id)}">
         Enquire on WhatsApp
       </button>`
    : `<button class="quick-add" type="button"
         data-add="${escapeHTML(product.id)}"
         aria-label="Add ${escapeHTML(product.name)} to bag">+</button>`;

  const productLink = product.enquiryOnly
    ? `shop.html?category=${encodeURIComponent(product.category)}`
    : `product.html?id=${encodeURIComponent(product.id)}`;

  return `
    <article class="product-card">
      <a class="product-image-link" href="${productLink}"
         aria-label="Explore ${escapeHTML(product.name)}">
        <div class="product-placeholder product-${escapeHTML(product.id)}">
          <span class="product-art">${escapeHTML(product.symbol)}</span>
          <span class="product-art-label">${escapeHTML(product.name.toUpperCase())}</span>
        </div>
      </a>

      <div class="product-details">
        <div>
          <p class="product-category">${escapeHTML(getCategoryLabel(product.category))}</p>
          <h3><a href="${productLink}">${escapeHTML(product.name)}</a></h3>
          <p class="product-price">${priceText}</p>
        </div>
        ${action}
      </div>
    </article>
  `;
}

function renderFeaturedProducts() {
  const container = document.getElementById("featuredProducts");
  if (!container) return;

  container.innerHTML = PRODUCTS
    .filter(product => product.category === "bowls")
    .slice(0, 4)
    .map(productCardHTML)
    .join("");
}

/* ---------------------------------
   SHOP PAGE: SEARCH / FILTER / SORT
---------------------------------- */

function renderShopPage() {
  const container = document.getElementById("shopProducts");
  if (!container) return;

  const searchInput = document.getElementById("shopSearch");
  const sortSelect = document.getElementById("shopSort");
  const resultCount = document.getElementById("shopResultCount");
  const validCategories = ["all", "bowls", "chocolates", "gifts"];

  const params = new URLSearchParams(window.location.search);
  let selectedCategory = params.get("category") || "all";

  if (!validCategories.includes(selectedCategory)) {
    selectedCategory = "all";
  }

  function drawProducts() {
    const searchTerm = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    let products = PRODUCTS.filter(product => {
      const matchesCategory =
        selectedCategory === "all" ||
        product.category === selectedCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm);

      return matchesCategory && matchesSearch;
    });

    const sort = sortSelect ? sortSelect.value : "featured";

    if (sort === "price-low") {
      products.sort((a, b) => {
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price;
      });
    } else if (sort === "price-high") {
      products.sort((a, b) => {
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return b.price - a.price;
      });
    } else if (sort === "name") {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }

    container.innerHTML = products.length
      ? products.map(productCardHTML).join("")
      : `<p class="empty-state">No matching items found. Try another search.</p>`;

    if (resultCount) {
      resultCount.textContent = products.length + " items";
    }

    document.querySelectorAll("[data-category-filter]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.categoryFilter === selectedCategory
      );
    });
  }

  document.querySelectorAll("[data-category-filter]").forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.categoryFilter;

      const url = new URL(window.location.href);
      if (selectedCategory === "all") {
        url.searchParams.delete("category");
      } else {
        url.searchParams.set("category", selectedCategory);
      }

      window.history.replaceState({}, "", url);
      drawProducts();
    });
  });

  if (searchInput) searchInput.addEventListener("input", drawProducts);
  if (sortSelect) sortSelect.addEventListener("change", drawProducts);

  drawProducts();
}

/* ---------------------------------
   PRODUCT DETAIL PAGE
---------------------------------- */

function renderProductPage() {
  const container =
    document.getElementById("productDetail") ||
    document.getElementById("product-detail");

  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const product = getProduct(params.get("id"));

  if (!product) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Product not found</h2>
        <p>Explore our collections to find something sweet.</p>
        <a class="button button-dark" href="shop.html">Browse collections</a>
      </div>`;
    return;
  }

  if (product.enquiryOnly) {
    container.innerHTML = `
      <div class="product-detail-layout">
        <div class="product-detail-visual">
          <div class="product-placeholder">
            <span class="product-art">${escapeHTML(product.symbol)}</span>
            <span class="product-art-label">${escapeHTML(product.name.toUpperCase())}</span>
          </div>
        </div>
        <div class="product-detail-copy">
          <p class="eyebrow">${escapeHTML(getCategoryLabel(product.category))}</p>
          <h1>${escapeHTML(product.name)}</h1>
          <p class="detail-price">Price on enquiry</p>
          <p class="detail-description">${escapeHTML(product.description)}</p>
          <button class="button button-dark" type="button" id="productEnquiryButton">
            Ask on WhatsApp
          </button>
          <p class="checkout-note">Availability and pricing will be confirmed by the store.</p>
        </div>
      </div>`;

    document.getElementById("productEnquiryButton")
      .addEventListener("click", () => openProductEnquiry(product));
    return;
  }

  container.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-visual">
        <div class="product-placeholder product-${escapeHTML(product.id)}">
          <span class="product-art">${escapeHTML(product.symbol)}</span>
          <span class="product-art-label">${escapeHTML(product.name.toUpperCase())}</span>
        </div>
      </div>
      <div class="product-detail-copy">
        <p class="eyebrow">${escapeHTML(getCategoryLabel(product.category))}</p>
        <h1>${escapeHTML(product.name)}</h1>
        <p class="detail-price">${formatPrice(product.price)}</p>
        <p class="detail-description">${escapeHTML(product.description)}</p>
        <p class="product-category">QUANTITY</p>
        <div class="quantity-control">
          <button type="button" id="quantityMinus" aria-label="Decrease quantity">−</button>
          <span id="productQuantity" aria-live="polite">1</span>
          <button type="button" id="quantityPlus" aria-label="Increase quantity">+</button>
        </div>
        <button class="button button-dark detail-add-button" id="detailAddButton" type="button">
          Add to bag · ${formatPrice(product.price)}
        </button>
        <p class="checkout-note">Confirm current availability and delivery charges before ordering.</p>
      </div>
    </div>`;

  let quantity = 1;
  const quantityDisplay = document.getElementById("productQuantity");
  const addButton = document.getElementById("detailAddButton");

  function updateQuantity() {
    quantityDisplay.textContent = quantity;
    addButton.textContent =
      "Add to bag · " + formatPrice(product.price * quantity);
  }

  document.getElementById("quantityMinus").addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    updateQuantity();
  });

  document.getElementById("quantityPlus").addEventListener("click", () => {
    quantity = Math.min(99, quantity + 1);
    updateQuantity();
  });

  addButton.addEventListener("click", () => addToCart(product.id, quantity));
}

/* ---------------------------------
   CART PAGE
---------------------------------- */

function renderCartPage() {
  const itemsContainer = document.getElementById("cartItems");
  if (!itemsContainer) return;

  const details = getCartDetails();
  const subtotal = getCartTotal();

  if (!details.length) {
    itemsContainer.innerHTML = `
      <div class="empty-state">
        <h2>Your bag is waiting for something sweet.</h2>
        <p>Discover your favourite Choco Bowl flavours.</p>
        <a class="button button-dark" href="shop.html">Explore the shop</a>
      </div>`;
  } else {
    itemsContainer.innerHTML = details.map(item => `
      <article class="cart-item">
        <div class="cart-item-art" aria-hidden="true">${escapeHTML(item.symbol)}</div>
        <div>
          <h3>${escapeHTML(item.name)}</h3>
          <p>${formatPrice(item.price)} each</p>
          <div class="cart-item-actions">
            <button type="button" data-cart-minus="${escapeHTML(item.id)}" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-plus="${escapeHTML(item.id)}" aria-label="Increase quantity">+</button>
            <button type="button" data-cart-remove="${escapeHTML(item.id)}">Remove</button>
          </div>
        </div>
        <strong>${formatPrice(item.lineTotal)}</strong>
      </article>
    `).join("");
  }

  const subtotalElement = document.getElementById("cartSubtotal");
  const totalElement = document.getElementById("cartTotal");
  const checkoutButton = document.getElementById("checkoutButton");

  if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
  if (totalElement) totalElement.textContent = formatPrice(subtotal);

  if (checkoutButton) {
    checkoutButton.disabled = details.length === 0;
    checkoutButton.style.opacity = details.length === 0 ? "0.55" : "1";
  }

  itemsContainer.querySelectorAll("[data-cart-minus]").forEach(button => {
    button.addEventListener("click", () => {
      const item = getCart().find(entry => entry.id === button.dataset.cartMinus);
      if (item) setCartQuantity(item.id, item.quantity - 1);
    });
  });

  itemsContainer.querySelectorAll("[data-cart-plus]").forEach(button => {
    button.addEventListener("click", () => {
      const item = getCart().find(entry => entry.id === button.dataset.cartPlus);
      if (item) setCartQuantity(item.id, item.quantity + 1);
    });
  });

  itemsContainer.querySelectorAll("[data-cart-remove]").forEach(button => {
    button.addEventListener("click", () => removeFromCart(button.dataset.cartRemove));
  });
}

/* ---------------------------------
   WHATSAPP CHECKOUT
---------------------------------- */

function buildWhatsAppMessage(customer = {}) {
  const items = getCartDetails();
  if (!items.length) return "";

  const lines = [
    "Hello The Chocolate Story! I'd like to enquire about placing an order.",
    "",
    "ORDER SUMMARY"
  ];

  items.forEach(item => {
    lines.push(
      item.name + " × " + item.quantity + " — " + formatPrice(item.lineTotal)
    );
  });

  lines.push("");
  lines.push("Estimated product subtotal: " + formatPrice(getCartTotal()));
  lines.push("Please confirm availability, delivery charges and final total.");

  if (customer.name) lines.push("Name: " + customer.name);
  if (customer.phone) lines.push("Contact: " + customer.phone);
  if (customer.address) lines.push("Delivery address: " + customer.address);
  if (customer.note) lines.push("Additional note: " + customer.note);

  return lines.join("\n");
}

function openWhatsAppOrder(customer = {}) {
  if (!getCartCount()) {
    showToast("Add a product to your bag first.");
    return;
  }

  openWhatsAppMessage(buildWhatsAppMessage(customer));
}

function initCheckout() {
  const checkoutButton = document.getElementById("checkoutButton");

  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => openWhatsAppOrder());
  }

  const checkoutForm = document.getElementById("checkoutForm");

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!checkoutForm.reportValidity()) return;

      const formData = new FormData(checkoutForm);

      openWhatsAppOrder({
        name: String(formData.get("name") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        address: String(formData.get("address") || "").trim(),
        note: String(formData.get("note") || "").trim()
      });
    });
  }
}

/* ---------------------------------
   GLOBAL BUTTONS
---------------------------------- */

function initAddToCartButtons() {
  document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add]");
    if (addButton) {
      addToCart(addButton.dataset.add, 1);
      return;
    }

    const enquiryButton = event.target.closest("[data-enquire]");
    if (enquiryButton) {
      openProductEnquiry(getProduct(enquiryButton.dataset.enquire));
    }
  });
}

function initCurrentYear() {
  const element = document.getElementById("currentYear");
  if (element) element.textContent = new Date().getFullYear();
}

/* ---------------------------------
   INITIALISE STORE
---------------------------------- */

function initStore() {
  initNavigation();
  initAddToCartButtons();
  initCurrentYear();
  renderFeaturedProducts();
  renderShopPage();
  renderProductPage();
  renderCartPage();
  initCheckout();
  updateCartUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStore);
} else {
  initStore();
}

/* Functions available to other pages/scripts */
window.ChocolateStoryStore = {
  products: PRODUCTS,
  formatPrice,
  getCart,
  getCartDetails,
  getCartCount,
  getCartTotal,
  addToCart,
  setCartQuantity,
  removeFromCart,
  clearCart,
  renderCartPage,
  openWhatsAppOrder,
  openProductEnquiry
};
