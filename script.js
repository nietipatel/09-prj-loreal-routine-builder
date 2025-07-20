/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productGrid = document.getElementById("product-grid"); // Use correct grid container
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productGrid.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

// Store selected products in an array
let selectedProducts = [];

// Load selected products from localStorage if available
const saved = localStorage.getItem('selectedProducts');
if (saved) {
  selectedProducts = JSON.parse(saved);
}

// Function to save selected products to localStorage
function saveSelectedProducts() {
  localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
}

// Function to update the Selected Products section
function updateSelectedSection() {
  const selectedSection = document.getElementById('selected-products');
  selectedSection.innerHTML = '';
  selectedProducts.forEach((product, idx) => {
    // Create a div for each selected product
    const div = document.createElement('div');
    div.className = 'selected-product';
    div.innerHTML = `
      <span>${product.name} (${product.brand})</span>
      <button class="remove-btn" data-idx="${idx}">Remove</button>
    `;
    selectedSection.appendChild(div);
  });

  // Add event listeners for remove buttons
  const removeBtns = document.querySelectorAll('.remove-btn');
  removeBtns.forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(btn.getAttribute('data-idx'));
      selectedProducts.splice(idx, 1);
      saveSelectedProducts();
      updateSelectedSection();
      updateProductGridHighlight();
    };
  });
}

// Function to highlight selected products in the grid
function updateProductGridHighlight() {
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    const pid = card.getAttribute('data-id');
    const found = selectedProducts.find(p => p.id === pid);
    if (found) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

// Function to display products in the grid
function displayProducts(products) {
  productGrid.innerHTML = '';
  if (products.length === 0) {
    productGrid.innerHTML = `
      <div class="placeholder-message">
        No products found for this category.
      </div>
    `;
    return;
  }
  products.forEach(product => {
    // Create card for each product
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-id', product.id);

    // Card content
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="desc-btn">Show Description</button>
      </div>
      <div class="desc-overlay" style="display:none;">
        <p>${product.description}</p>
        <button class="close-desc">Close</button>
      </div>
    `;

    // Click to select/unselect product
    card.onclick = function(e) {
      // Prevent click if description button or overlay is clicked
      if (e.target.classList.contains('desc-btn') || e.target.classList.contains('close-desc')) return;
      const found = selectedProducts.find(p => p.id === product.id);
      if (found) {
        // Unselect
        selectedProducts = selectedProducts.filter(p => p.id !== product.id);
      } else {
        // Select
        selectedProducts.push(product);
      }
      saveSelectedProducts();
      updateSelectedSection();
      updateProductGridHighlight();
    };

    // Show description overlay
    card.querySelector('.desc-btn').onclick = function(ev) {
      ev.stopPropagation();
      card.querySelector('.desc-overlay').style.display = 'block';
    };
    // Close description overlay
    card.querySelector('.close-desc').onclick = function(ev) {
      ev.stopPropagation();
      card.querySelector('.desc-overlay').style.display = 'none';
    };

    productGrid.appendChild(card);
  });
  updateProductGridHighlight();
}

// Show all products if no category is selected
async function showAllProducts() {
  const products = await loadProducts();
  displayProducts(products);
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );
  displayProducts(filteredProducts);
});

// On page load, show all products
showAllProducts();

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

// Call updateSelectedSection on page load
updateSelectedSection();
