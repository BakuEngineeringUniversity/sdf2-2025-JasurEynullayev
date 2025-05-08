const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const typeSelect = document.getElementById('type');
const transactionList = document.getElementById('transaction-list');
const balanceDisplay = document.getElementById('balance');
const exportJSONBtn = document.getElementById('export-json');
const exportCSVBtn = document.getElementById('export-csv');
const toggleBtn = document.getElementById('toggle-theme');

const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const applyFiltersBtn = document.getElementById('apply-filters');
const toggleFavoritesBtn = document.getElementById('toggle-favorites');
const noFavoritesMessage = document.getElementById('no-favorites-message');
const favoritesAlert = document.getElementById('favorites-alert');

let showingFavoritesOnly = false;
let currentPage = 1;
const transactionsPerPage = 5;
let allTransactions = [];

form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (showingFavoritesOnly) {
    showingFavoritesOnly = false;
    toggleFavoritesBtn.textContent = 'Show Favorites Only ⭐';
  }

  const data = {
    description: descriptionInput.value,
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    type: typeSelect.value,
    isFavorite: false
  };

  window.budgetAPI.addTransaction(data);

  descriptionInput.value = '';
  amountInput.value = '';
  categoryInput.value = '';
  dateInput.value = '';
  typeSelect.value = 'income';

  currentPage = 1;
  loadTransactions();
});

exportJSONBtn.addEventListener('click', () => {
  window.budgetAPI.exportData('json');
});

exportCSVBtn.addEventListener('click', () => {
  window.budgetAPI.exportData('csv');
});

transactionList.addEventListener('click', async (e) => {
  const index = parseInt(e.target.dataset.index);
  const globalIndex = (currentPage - 1) * transactionsPerPage + index;

  if (e.target.classList.contains('delete-btn')) {
    await window.budgetAPI.deleteTransaction(globalIndex);
    await loadTransactions();
  }

  if (e.target.classList.contains('favorite-btn')) {
    allTransactions[globalIndex].isFavorite = !allTransactions[globalIndex].isFavorite;
    window.budgetAPI.overwriteTransactions(allTransactions);
    renderTransactions();
  }
});

applyFiltersBtn.addEventListener('click', () => {
  currentPage = 1;
  loadTransactions();
});

toggleFavoritesBtn.addEventListener('click', () => {
  const hasFavorites = allTransactions.some(tx => tx.isFavorite);

  if (!showingFavoritesOnly && !hasFavorites) {
    favoritesAlert.textContent = "You don't have any favorite transactions yet.";
    favoritesAlert.style.display = 'block';
    setTimeout(() => {
      favoritesAlert.style.display = 'none';
    }, 4000);
    return;
  }

  showingFavoritesOnly = !showingFavoritesOnly;
  toggleFavoritesBtn.textContent = showingFavoritesOnly ? 'View All Transactions' : 'Show Favorites Only ⭐';
  currentPage = 1;
  favoritesAlert.style.display = 'none';
  renderTransactions();
});

document.getElementById('prev-page').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderTransactions();
  }
});

document.getElementById('next-page').addEventListener('click', () => {
  const totalPages = Math.ceil(getFilteredTransactions().length / transactionsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTransactions();
  }
});

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    toggleBtn.textContent = '☀️ Light Mode';
  } else {
    document.body.classList.remove('dark');
    toggleBtn.textContent = '🌙 Dark Mode';
  }
  localStorage.setItem('theme', theme);
}

toggleBtn.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
});

function getFilteredTransactions() {
  const search = searchInput.value.toLowerCase();
  const selectedCategory = filterCategory.value;

  return allTransactions.filter(tx => {
    const matchSearch = tx.description.toLowerCase().includes(search);
    const matchCategory = selectedCategory ? tx.category === selectedCategory : true;
    const matchFavorite = showingFavoritesOnly ? tx.isFavorite : true;
    return matchSearch && matchCategory && matchFavorite;
  });
}

function renderTransactions() {
  const filtered = getFilteredTransactions();
  const sorted = filtered;

  const start = (currentPage - 1) * transactionsPerPage;
  const paginated = sorted.slice(start, start + transactionsPerPage);

  transactionList.innerHTML = '';
  noFavoritesMessage.style.display = 'none';

  if (paginated.length === 0) {
    noFavoritesMessage.style.display = showingFavoritesOnly ? 'block' : 'none';
    updatePaginationUI(filtered.length);
    balanceDisplay.textContent = '0.00 ₼';
    return;
  }

  let balance = 0;
  filtered.forEach(tx => {
    balance += tx.type === 'income' ? tx.amount : -tx.amount;
  });

  paginated.forEach((tx, index) => {
    const li = document.createElement('li');
    li.classList.add(tx.type === 'expense' ? 'expense' : 'income');
    const star = tx.isFavorite ? '★' : '☆';

    li.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${tx.description}</strong> - ${tx.amount.toFixed(2)} ₼ ${tx.isFavorite ? '⭐' : ''}
          <br>
          <small>${tx.category} • ${new Date(tx.date).toLocaleDateString()}</small>
        </div>
        <div>
          <button class="favorite-btn" data-index="${index}" title="Toggle Favorite" style="font-size: 18px;">${star}</button>
          <button class="delete-btn" data-index="${index}" title="Delete">Delete</button>
        </div>
      </div>
    `;
    transactionList.appendChild(li);
  });

  balanceDisplay.textContent = `${balance.toFixed(2)} ₼`;
  updatePaginationUI(filtered.length);
}

function updatePaginationUI(totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / transactionsPerPage));
  document.getElementById('page-indicator').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages;
}

async function loadTransactions() {
  allTransactions = await window.budgetAPI.getTransactions();
  renderTransactions();
}

window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  loadTransactions();
});
