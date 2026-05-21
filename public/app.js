let currentChart = null;
async function analyze() {
  const input = document.getElementById('companyInput');
  const company = input.value.trim();
  

  if (!company) {
    showError('Please enter a company name.');
    return;
  }

  hideError();
  showLoading(true, company);
  hideResults();
  document.getElementById('analyzeBtn').disabled = true;

  try {
    const response = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company })
    });

    

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    renderResults(company, data.analysis, data.stockData);
    saveToHistory(company);


  } catch (error) {
    showError(error.message || 'Something went wrong. Please try again.');
  } finally {
    showLoading(false);
    document.getElementById('analyzeBtn').disabled = false;
  }
}

function renderResults(company, a, stockData) {
  // Header
  document.getElementById('resultsCompanyName').textContent = company;

  // Summary & Risk
  document.getElementById('summary').textContent = a.summary;
  document.getElementById('risk').textContent = a.risk_assessment;

  // SWOT
  fillSwot('strengths', a.swot.strengths);
  fillSwot('weaknesses', a.swot.weaknesses);
  fillSwot('opportunities', a.swot.opportunities);
  fillSwot('threats', a.swot.threats);

  // Competitors
  const compEl = document.getElementById('competitors');
  compEl.innerHTML = a.competitors
    .map((c, i) => `
      <div class="comp-item">
        <span class="comp-num">${String(i + 1).padStart(2, '0')}</span>
        ${c}
      </div>`)
    .join('');

  // Growth
  const growthEl = document.getElementById('growth');
  growthEl.innerHTML = a.growth_opportunities
    .map(g => `<div class="growth-item">${g}</div>`)
    .join('');

  const stockCard = document.getElementById('stockCard');
  
  if (stockData && stockData.prices.length > 0) {
    stockCard.classList.remove('hidden');
    document.getElementById('stockTickerLabel').textContent = `${a.ticker} — 10 Day Performance`;
    
    // Destroy previous chart if it exists
    if (currentChart) {
      currentChart.destroy();
    }

    // Initialize Chart.js
    const ctx = document.getElementById('stockChart').getContext('2d');
    currentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stockData.dates,
        datasets: [{
          label: 'Closing Price ($)',
          data: stockData.prices,
          borderColor: '#c8f04a', // Matches your neon accent variable
          borderWidth: 2,
          pointBackgroundColor: '#c8f04a',
          tension: 0.2, // Smooths out the line edges slightly
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false } // Hides unnecessary labels
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b6a72' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b6a72' } }
        }
      }
    });
  } else {
    // Hide the stock card completely if the company is private/not found
    stockCard.classList.add('hidden');
  }

  document.getElementById('results').classList.remove('hidden');
}

 
function fillSwot(id, items) {
  document.getElementById(id).innerHTML = items
    .map(item => `<li>${item}</li>`)
    .join('');
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error').classList.add('hidden');
}

function showLoading(show, company = '') {
  const el = document.getElementById('loading');
  el.classList.toggle('hidden', !show);
  if (show && company) {
    document.getElementById('loadingCompany').textContent = company;
  }
}

function hideResults() {
  document.getElementById('results').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('companyInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyze();
  });
  renderHistory();
});
//Search History
const HISTORY_KEY = 'bizzai_search_history';
const MAX_HISTORY = 10;

function saveToHistory(company) {
  let history = getHistory();
  history = history.filter(h => h.company.toLowerCase() !== company.toLowerCase());
  history.unshift({ company, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch { return []; }
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  const wrap = document.getElementById('historyWrap');
  const list = document.getElementById('historyList');
  if (!wrap || !list) return;

  if (history.length === 0) {
    wrap.classList.add('hidden');
    return;
  }

  wrap.classList.remove('hidden');
  list.innerHTML = history.map(h => `
    <button class="history-item" onclick="runFromHistory('${h.company.replace(/'/g, "\\'")}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span class="history-name">${h.company}</span>
      <span class="history-time">${timeAgo(h.timestamp)}</span>
    </button>
  `).join('');
}

function runFromHistory(company) {
  document.getElementById('companyInput').value = company;
  analyze();
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
