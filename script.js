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
  // Only update the product list, not the whole section
  const selectedList = document.getElementById('selectedProductsList');
  selectedList.innerHTML = '';
  selectedProducts.forEach((product, idx) => {
    // Create a div for each selected product
    const div = document.createElement('div');
    div.className = 'selected-product';
    div.innerHTML = `
      <span>${product.name} (${product.brand})</span>
      <button class="remove-btn" data-idx="${idx}">Remove</button>
    `;
    selectedList.appendChild(div);
  });

  // Add event listeners for remove buttons
  const removeBtns = selectedList.querySelectorAll('.remove-btn');
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

// Get reference to the Generate Routine button
const generateRoutineBtn = document.getElementById('generateRoutine');

// Store chat history for follow-up questions
let chatHistory = [];

// Function to send selected products to OpenAI and get a routine
async function generateRoutineWithAI(selectedProducts) {
  // Build a message for the AI
  const productInfo = selectedProducts.map(p => 
    `Name: ${p.name}\nBrand: ${p.brand}\nCategory: ${p.category}\nDescription: ${p.description}`
  ).join('\n\n');

  // System message for the AI
  const systemMsg = {
    role: "system",
    content: "You are a L'Oréal skincare and beauty advisor. Build a personalized routine using only the provided products. Explain the order and purpose of each step. Be friendly and clear."
  };

  // User message with selected products
  const userMsg = {
    role: "user",
    content: `Here are my selected products:\n\n${productInfo}\n\nPlease create a routine for me.`
  };

  // Add messages to chat history
  chatHistory = [systemMsg, userMsg];

  // Show loading message in chat
  chatWindow.innerHTML = `<div class="placeholder-message">Generating your routine...</div>`;

  try {
    // Beginner-friendly: Replace this URL with your Cloudflare Worker endpoint!
    // Do NOT put your OpenAI API key here. The Worker should keep it secret.
    const response = await fetch('YOUR_CLOUDFLARE_WORKER_URL_HERE', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // We use messages, not prompt, and specify the model
      body: JSON.stringify({ messages: chatHistory, model: 'gpt-4o' })
    });
    const data = await response.json();

    // Check for AI response in the correct place
    const aiMessage = data.choices[0].message.content;

    // Display routine in chat window
    chatWindow.innerHTML = `<div><strong>AI Routine:</strong><br>${aiMessage.replace(/\n/g, '<br>')}</div>`;

    // Add AI response to chat history for follow-ups
    chatHistory.push({ role: "assistant", content: aiMessage });
  } catch (err) {
    chatWindow.innerHTML = `<div class="placeholder-message">Sorry, there was an error generating your routine.</div>`;
  }
}

// When Generate Routine button is clicked
generateRoutineBtn.addEventListener('click', () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `<div class="placeholder-message">Please select at least one product.</div>`;
    return;
  }
  generateRoutineWithAI(selectedProducts);
});

// Chat form submission handler for follow-up questions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById('userInput').value;

  // Add user's question to chat history
  chatHistory.push({ role: "user", content: userInput });

  // Show user's question in chat window
  chatWindow.innerHTML += `<div><strong>You:</strong> ${userInput}</div>`;
  document.getElementById('userInput').value = '';

  // Show loading message
  chatWindow.innerHTML += `<div class="placeholder-message">Thinking...</div>`;

  try {
    // Beginner-friendly: Replace this URL with your Cloudflare Worker endpoint!
    // Do NOT put your OpenAI API key here. The Worker should keep it secret.
    const response = await fetch('YOUR_CLOUDFLARE_WORKER_URL_HERE', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory, model: 'gpt-4o' })
    });
    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Display AI response
    chatWindow.innerHTML += `<div><strong>AI:</strong> ${aiMessage.replace(/\n/g, '<br>')}</div>`;

    // Add AI response to chat history
    chatHistory.push({ role: "assistant", content: aiMessage });
  } catch (err) {
    chatWindow.innerHTML += `<div class="placeholder-message">Sorry, there was an error answering your question.</div>`;
  }
});

// Call updateSelectedSection on page load
updateSelectedSection();
