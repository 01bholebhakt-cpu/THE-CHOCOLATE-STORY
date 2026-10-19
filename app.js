
/* =========================================================
   THE CHOCOLATE STORY
   Shared store functionality
   File: app.js
   ========================================================= */

"use strict";

/*
  IMPORTANT:
  Replace this with the brand's confirmed WhatsApp number.
  Use country code, digits only. Example format: 91XXXXXXXXXX.
*/
const STORE_WHATSAPP = "918847050895";

const CART_STORAGE_KEY = "theChocolateStoryCart";

/* Product catalogue — prices taken from the supplied menu image.
   Confirm current prices with the owner before launch. */
const PRODUCTS = [
  {
    id: "dark-heaven",
    name: "Dark Heaven",
    category: "bowls",
    price: 150,
    description: "A rich chocolate bowl for dark chocolate lovers.",
    symbol: "●"
  },
  {
    id: "kunafa",
    name: "Kunafa",
    category: "bowls",
    price: 300,
    description: "Explore the Kunafa Choco Bowl from our menu.",
    symbol: "✳"
  },
  {
    id: "ferrero",
    name: "Ferrero",
    category: "bowls",
    price: 200,
    description: "A chocolate bowl inspired by a much-loved flavour.",
    symbol: "✦"
  },
  {
    id: "kitkat",
    name: "Kitkat",
    category: "bowls",
    price: 150,
    description: "A familiar crunchy chocolate favourite.",
    symbol: "◇"
  },
  {
    id: "biscoff",
    name: "Biscoff",
    category: "bowls",
    price: 250,
    description: "A delicious bowl for Biscoff flavour fans.",
    symbol: "♡"
  },
  {
    id: "hazelnut",
    name: "Hazelnut",
    category: "bowls",
    price: 200,
    description: "A nutty chocolate flavour from the bowl menu.",
    symbol: "◉"
  },
  {
    id: "oreo",
    name: "Oreo",
    category: "bowls",
    price: 150,
    description: "An Oreo-inspired chocolate bowl.",
    symbol: "◌"
  },
  {
    id: "nutella",
    name: "Nutella",
    category: "bowls",
    price: 150,
    description: "A Nutella-inspired bowl for chocolate lovers.",
    symbol: "♡"
  },
  {
    id: "banana",
    name: "Banana",
    category: "bowls",
    price: 150,
    description: "Discover the Banana Choco Bowl.",
    symbol: "⌁"
  },
  {
    id: "paan",
    name: "Paan",
    category: "bowls",
    price: 200,
    description: "A distinctive paan-inspired chocolate flavour.",
    symbol: "❋"
  },
  {
    id: "rasmalai",
    name: "Rasmalai",
    category: "bowls",
    price: 250,
    description: "A traditional dessert-inspired chocolate flavour.",
    symbol: "✿"
  }
];

/* ---------- Helpers ---------- */

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function getProduct(id) {
  return PRODUCTS.find(function (product) {
    return product.id === id;
  });
}

function getCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");

    if (!Array.isArray(saved)) return [];

    return saved
      .filter(function (item) {
        return getProduct(item.id) && Number.isInteger(item.quantity);
      })
      .map(function (item) {
        return {
          id: item.id,
          quantity: Math.max(1, Math.min(99, item.quantity))
        };
      });
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartUI();
  document.dispatchEvent(new CustomEvent("cart:updated", {
    detail: { cart: cart }
  }));
}

function getCartDetails() {
  return getCart()
    .map(function (item) {
      const product = getProduct(item.id);

      if (!product) return null;

      return {
        ...product,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity
      };
    })
    .filter(Boolean);
}

function getCartCount() {
  return getCart().reduce(function (total, item) {
    return total + item.quantity;
  }, 0);
}

function getCartTotal() {
  return getCartDetails().reduce(function (total, item) {
    return total + item.lineTotal;
  }, 0);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return replacements[character];
  });
}

function getCategoryLabel(category) {
  const labels = {
    bowls: "CHOCO BOWL",
    chocolates: "CHOCOLATES",
    gifts: "GIFTS & HAMPERS"
  };

  return labels[category] || "THE CHOCOLATE STORY";
}

/* ---------- Cart operations ---------- */

function addToCart(productId, quantity) {
  const product = getProduct(productId);

  if (!product) {
    alert("This product is not available yet.");
    return;
  }

  const amount = Math.max(1, Math.min(99, Number(quantity) || 1));
  const cart = getCart();
  const existing = cart.find(function (item) {
    return item.id === productId;
  });

  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + amount);
  } else {
    cart.push({
      id: productId,
      quantity: amount
    });
  }

  saveCart(cart);
  showToast(product.name + " added to your bag.");
}

function setCartQuantity(productId, quantity) {
  const cart = getCart();
  const existing = cart.find(function (item) {
    return item.id === productId;
  });

  if (!existing) return;

  if (quantity <= 0) {
    saveCart(cart.filter(function (item) {
      return item.id !== productId;
    }));
  } else {
    existing.quantity = Math.min(99, Math.floor(quantity));
    saveCart(cart);
  }

  renderCartPage();
}

function removeFromCart(productId) {
  saveCart(getCart().filter(function (item) {
    return item.id !== productId;
  }));

  renderCartPage();
}

function clearCart() {
  saveCart([]);
  renderCartPage();
}

/* ---------- Header and mobile navigation ---------- */

function updateCartUI() {
  const count = getCartCount();
  const total = getCartTotal();

  const countElement = document.getElementById("cartCount");
  const mobileCountElement = document.getElementById("mobileCartCount");
  const mobileTotalElement = document.getElementById("mobileCartTotal");

  if (countElement) countElement.textContent = count;
  if (mobileCountElement) mobileCountElement.textContent = count;
  if (mobileTotalElement) {
    mobileTotalElement.textContent = count ? formatPrice(total) : "";
  }
}

function initNavigation() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    const isOpen = nav.classList.toggle("open");

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    toggle.textContent = isOpen ? "×" : "☰";
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      toggle.textContent = "☰";
    });
  });
}

/* ---------- Toast notification ---------- */

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

  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(function () {
    toast.classList.remove("visible");
  }, 2400);
}

/* ---------- Product card rendering ---------- */

function productCardHTML(product) {
  return `
    <article class="product-card">
      <a
        class="product-image-link"
        href="product.html?id=${encodeURIComponent(product.id)}"
        aria-label="View ${escapeHTML(product.name)}"
      >
        <div class="product-placeholder product-${escapeHTML(product.id)}">
          <span class="product-art">${escapeHTML(product.symbol)}</span>
          <span class="product-art-label">${escapeHTML(product.name.toUpperCase())}</span>
        </div>
      </a>

      <div class="product-details">
        <div>
          <p class="product-category">${escapeHTML(getCategoryLabel(product.category))}</p>
          <h3>
            <a href="product.html?id=${encodeURIComponent(product.id)}">
              ${escapeHTML(product.name)}
            </a>
          </h3>
          <p class="product-price">${formatPrice(product.price)}</p>
        </div>

        <button
          class="quick-add"
          type="button"
          data-add="${escapeHTML(product.id)}"
          aria-label="Add ${escapeHTML(product.name)} to bag"
        >+</button>
      </div>
    </article>
  `;
}

function renderFeaturedProducts() {
  const container = document.getElementById("featuredProducts");

  if (!container) return;

  container.innerHTML = PRODUCTS
    .filter(function (product) {
      return product.category === "bowls";
    })
    .slice(0, 4)
    .map(productCardHTML)
    .join("");
}

/* ---------- Shop page ---------- */

function renderShopPage() {
  const container = document.getElementById("shopProducts");

  if (!container) return;

  const searchInput = document.getElementById("shopSearch");
  const sortSelect = document.getElementById("shopSort");
  const resultCount = document.getElementById("shopResultCount");

  const params = new URLSearchParams(window.location.search);
  let selectedCategory = params.get("category") || "all";

  const validCategories = ["all", "bowls", "chocolates", "gifts"];

  if (!validCategories.includes(selectedCategory)) {
    selectedCategory = "all";
  }

  function drawProducts() {
    const searchTerm = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    let products = PRODUCTS.filter(function (product) {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm);

      return matchesCategory && matchesSearch;
    });

    const sort = sortSelect ? sortSelect.value : "featured";

    if (sort === "price-low") {
      products.sort(function (a, b) {
        return a.price - b.price;
      });
    } else if (sort === "price-high") {
      products.sort(function (a, b) {
        return b.price - a.price;
      });
    } else if (sort === "name") {
      products.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });
    }

    container.innerHTML = products.length
      ? products.map(productCardHTML).join("")
      : '<p class="empty-state">No matching products found. Try another search.</p>';

    if (resultCount) {
      resultCount.textContent = products.length + " products";
    }

    document.querySelectorAll("[data-category-filter]").forEach(function (button) {
      button.classList.toggle(
        "active",
        button.dataset.categoryFilter === selectedCategory
      );
    });
  }

  document.querySelectorAll("[data-category-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
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

  if (searchInput) {
    searchInput.addEventListener("input", drawProducts);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", drawProducts);
  }

  drawProducts();
}

/* ---------- Product detail page ---------- */

function renderProductPage() {
  const container = document.getElementById("productDetail");

  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const product = getProduct(params.get("id"));

  if (!product) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Product not found</h2>
        <p>Explore our available Choco Bowl flavours instead.</p>
        <a class="button button-dark" href="shop.html">Browse products</a>
      </div>
    `;
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

        <p class="checkout-note">
          Prices and availability should be confirmed with the store before ordering.
        </p>
      </div>
    </div>
  `;

  let quantity = 1;

  const quantityDisplay = document.getElementById("productQuantity");
  const addButton = document.getElementById("detailAddButton");

  function updateQuantity() {
    quantityDisplay.textContent = quantity;
    addButton.textContent = "Add to bag · " + formatPrice(product.price * quantity);
  }

  document.getElementById("quantityMinus").addEventListener("click", function () {
    quantity = Math.max(1, quantity - 1);
    updateQuantity();
  });

  document.getElementById("quantityPlus").addEventListener("click", function () {
    quantity = Math.min(99, quantity + 1);
    updateQuantity();
  });

  addButton.addEventListener("click", function () {
    addToCart(product.id, quantity);
  });
}

/* ---------- Cart page ---------- */

function renderCartPage() {
  const itemsContainer = document.getElementById("cartItems");

  if (!itemsContainer) return;

  const details = getCartDetails();
  const subtotal = getCartTotal();

  if (!details.length) {
    itemsContainer.innerHTML = `
      <div class="empty-state">
        <h2>Your bag is waiting for something sweet.</h2>
        <p>Discover Choco Bowls and find your favourite flavour.</p>
        <a class="button button-dark" href="shop.html">Explore the shop</a>
      </div>
    `;
  } else {
    itemsContainer.innerHTML = details.map(function (item) {
      return `
        <article class="cart-item">
          <div class="cart-item-art" aria-hidden="true">${escapeHTML(item.symbol)}</div>

          <div>
            <h3>${escapeHTML(item.name)}</h3>
            <p>${formatPrice(item.price)} each</p>

            <div class="cart-item-actions">
              <button type="button" data-cart-minus="${escapeHTML(item.id)}" aria-label="Decrease ${escapeHTML(item.name)} quantity">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-plus="${escapeHTML(item.id)}" aria-label="Increase ${escapeHTML(item.name)} quantity">+</button>
              <button type="button" data-cart-remove="${escapeHTML(item.id)}">Remove</button>
            </div>
          </div>

          <strong>${formatPrice(item.lineTotal)}</strong>
        </article>
      `;
    }).join("");
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

  itemsContainer.querySelectorAll("[data-cart-minus]").forEach(function (button) {
    button.addEventListener("click", function () {
      const item = getCart().find(function (entry) {
        return entry.id === button.dataset.cartMinus;
      });

      if (item) setCartQuantity(item.id, item.quantity - 1);
    });
  });

  itemsContainer.querySelectorAll("[data-cart-plus]").forEach(function (button) {
    button.addEventListener("click", function () {
      const item = getCart().find(function (entry) {
        return entry.id === button.dataset.cartPlus;
      });

      if (item) setCartQuantity(item.id, item.quantity + 1);
    });
  });

  itemsContainer.querySelectorAll("[data-cart-remove]").forEach(function (button) {
    button.addEventListener("click", function () {
      removeFromCart(button.dataset.cartRemove);
    });
  });
}

/* ---------- WhatsApp order ---------- */

function buildWhatsAppMessage(customer) {
  const items = getCartDetails();

  if (!items.length) return "";

  const lines = [
    "Hello The Chocolate Story! I'd like to enquire about placing an order.",
    "",
    "ORDER SUMMARY"
  ];

  items.forEach(function (item) {
    lines.push(
      item.name + " × " + item.quantity + " — " + formatPrice(item.lineTotal)
    );
  });

  lines.push("");
  lines.push("Estimated product subtotal: " + formatPrice(getCartTotal()));
  lines.push("Please confirm availability, delivery charges and final total.");

  if (customer && customer.name) {
    lines.push("");
    lines.push("Name: " + customer.name);
  }

  if (customer && customer.phone) {
    lines.push("Contact: " + customer.phone);
  }

  if (customer && customer.address) {
    lines.push("Delivery address: " + customer.address);
  }

  if (customer && customer.note) {
    lines.push("Additional note: " + customer.note);
  }

  return lines.join("\n");
}

function openWhatsAppOrder(customer) {
  if (!getCartCount()) {
    showToast("Add a product to your bag first.");
    return;
  }

  if (!/^\d{10,15}$/.test(STORE_WHATSAPP)) {
    alert("The store's WhatsApp number needs to be configured.");
    return;
  }

  const message = buildWhatsAppMessage(customer);
  const url = "https://wa.me/" + STORE_WHATSAPP + "?text=" + encodeURIComponent(message);

  window.open(url, "_blank", "noopener,noreferrer");
}

function initCheckout() {
  const checkoutButton = document.getElementById("checkoutButton");

  if (checkoutButton) {
    checkoutButton.addEventListener("click", function () {
      openWhatsAppOrder();
    });
  }

  const checkoutForm = document.getElementById("checkoutForm");

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", function (event) {
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

/* ---------- Global interactions ---------- */

function initAddToCartButtons() {
  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-add]");

    if (!button) return;

    addToCart(button.dataset.add, 1);
  });
}

function initCurrentYear() {
  const element = document.getElementById("currentYear");

  if (element) {
    element.textContent = new Date().getFullYear();
  }
}

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

/* Expose only the functions needed by other store scripts. */
window.ChocolateStoryStore = {
  products: PRODUCTS,
  formatPrice: formatPrice,
  getCart: getCart,
  getCartDetails: getCartDetails,
  getCartCount: getCartCount,
  getCartTotal: getCartTotal,
  addToCart: addToCart,
  setCartQuantity: setCartQuantity,
  removeFromCart: removeFromCart,
  clearCart: clearCart,
  renderCartPage: renderCartPage,
  openWhatsAppOrder: openWhatsAppOrder
};
