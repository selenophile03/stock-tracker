// State Management
let portfolio = JSON.parse(localStorage.getItem('portfolio_stocks')) || [];
const simulatedMarketPrices = {};

// UI References
const stockForm = document.getElementById('stock-form');
const tableBody = document.getElementById('portfolio-table-body');
const emptyState = document.getElementById('empty-state');
const totalValueEl = document.getElementById('total-value');
const totalPnlEl = document.getElementById('total-pnl');
const assetCountEl = document.getElementById('asset-count');
const clockEl = document.getElementById('live-clock');

// Initialize simulated base prices for common stocks if tracking them
function initializePrice(symbol) {
    if (!simulatedMarketPrices[symbol]) {
        // Generate a random stable base price between $10 and $500
        simulatedMarketPrices[symbol] = Math.random() * (500 - 10) + 10;
    }
}

// Simulated real-time market data variance (-0.5% to +0.5% ticks)
function simulateMarketTick() {
    portfolio.forEach(stock => {
        initializePrice(stock.symbol);
        const changePercent = (Math.random() - 0.5) * 0.01; // max 0.5% shift
        simulatedMarketPrices[stock.symbol] *= (1 + changePercent);
    });
    updateUI();
}

// Format numbers securely to clean currencies
function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

// Add New Stock Transaction
stockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const symbol = document.getElementById('symbol').value.trim().toUpperCase();
    const buyPrice = parseFloat(document.getElementById('buyPrice').value);
    const quantity = parseFloat(document.getElementById('quantity').value);

    // Initial price anchor setting if new symbol
    if (!simulatedMarketPrices[symbol]) {
        simulatedMarketPrices[symbol] = buyPrice * (1 + (Math.random() - 0.5) * 0.05);
    }

    // Check if asset already exists to aggregate positions
    const existingAsset = portfolio.find(item => item.symbol === symbol);
    if (existingAsset) {
        const totalCost = (existingAsset.buyPrice * existingAsset.quantity) + (buyPrice * quantity);
        existingAsset.quantity += quantity;
        existingAsset.buyPrice = totalCost / existingAsset.quantity; // New weighted average price
    } else {
        portfolio.push({ id: Date.now(), symbol, buyPrice, quantity });
    }

    saveAndRefresh();
    stockForm.reset();
    document.getElementById('symbol').focus();
});

// Remove Stock Position
window.deletePosition = function(id) {
    portfolio = portfolio.filter(item => item.id !== id);
    saveAndRefresh();
};

function saveAndRefresh() {
    localStorage.setItem('portfolio_stocks', JSON.stringify(portfolio));
    updateUI();
}

// Calculate Metrics & Render Interface Layout
function updateUI() {
    tableBody.innerHTML = '';
    
    if (portfolio.length === 0) {
        emptyState.classList.remove('hidden');
        totalValueEl.textContent = formatCurrency(0);
        totalPnlEl.textContent = `${formatCurrency(0)} (0.00%)`;
        totalPnlEl.className = "text-3xl font-bold mt-1 text-slate-100";
        assetCountEl.textContent = "0 Assets";
        return;
    }
    
    emptyState.classList.add('hidden');
    assetCountEl.textContent = `${portfolio.length} Asset${portfolio.length > 1 ? 's' : ''}`;

    let overallPortfolioValue = 0;
    let overallCostBasis = 0;

    portfolio.forEach(stock => {
        initializePrice(stock.symbol);
        const currentPrice = simulatedMarketPrices[stock.symbol];
        const costBasis = stock.buyPrice * stock.quantity;
        const currentMarketValue = currentPrice * stock.quantity;
        
        overallPortfolioValue += currentMarketValue;
        overallCostBasis += costBasis;

        const assetPnl = currentMarketValue - costBasis;
        const assetPnlPercent = costBasis > 0 ? (assetPnl / costBasis) * 100 : 0;
        
        const pnlClass = assetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400';
        const pnlSign = assetPnl >= 0 ? '+' : '';

        const row = document.createElement('tr');
        row.className = "hover:bg-slate-800/20 transition-colors group border-b border-slate-800/40";
        row.innerHTML = `
            <td class="py-4 px-6 font-bold tracking-wider text-slate-100">${stock.symbol}</td>
            <td class="py-4 px-6 text-right font-mono text-slate-300">${stock.quantity.toFixed(4)}</td>
            <td class="py-4 px-6 text-right font-mono text-slate-400">${formatCurrency(stock.buyPrice)}</td>
            <td class="py-4 px-6 text-right font-mono text-slate-200 animate-pulse-subtle">${formatCurrency(currentPrice)}</td>
            <td class="py-4 px-6 text-right font-mono font-semibold ${pnlClass}">
                ${pnlSign}${formatCurrency(assetPnl)}<br>
                <span class="text-xs opacity-80">${pnlSign}${assetPnlPercent.toFixed(2)}%</span>
            </td>
            <td class="py-4 px-6 text-center">
                <button onclick="deletePosition(${stock.id})" class="text-slate-500 hover:text-rose-400 font-medium text-xs transition-colors py-1 px-2.5 rounded-md hover:bg-rose-500/10 cursor-pointer">
                    Sell / Clear
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Render Global Portfolio Metadata Metrics
    const totalPnl = overallPortfolioValue - overallCostBasis;
    const totalPnlPercent = overallCostBasis > 0 ? (totalPnl / overallCostBasis) * 100 : 0;
    
    totalValueEl.textContent = formatCurrency(overallPortfolioValue);
    
    const globalPnlSign = totalPnl >= 0 ? '+' : '';
    totalPnlEl.textContent = `${globalPnlSign}${formatCurrency(totalPnl)} (${globalPnlSign}${totalPnlPercent.toFixed(2)}%)`;
    if (totalPnl > 0) {
        totalPnlEl.className = "text-3xl font-bold mt-1 text-emerald-400";
    } else if (totalPnl < 0) {
        totalPnlEl.className = "text-3xl font-bold mt-1 text-rose-400";
    } else {
        totalPnlEl.className = "text-3xl font-bold mt-1 text-slate-100";
    }
}

// Clock element updating execution
function updateClock() {
    const now = new Date();
    clockEl.textContent = `System Live: ${now.toLocaleTimeString()}`;
}

// Active Intervals loops for pricing engine simulations
setInterval(simulateMarketTick, 3500);
setInterval(updateClock, 1000);

// Initialize App Frame state
updateUI();
updateClock();
