function getToken() { return localStorage.getItem('token'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }

if (!getToken() || !getUser()) {
  window.location.href = '/login.html';
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ company })
    });

    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      return;
    }

    if (!response.ok) throw new Error(data.error);

    renderResults(company, data.analysis, data.stockData);

  } catch (error) {
    showError(error.message || 'Something went wrong. Please try again.');
  } finally {
    showLoading(false);
    document.getElementById('analyzeBtn').disabled = false;
  }
}

function renderResults(company, a, stockData) {
  document.getElementById('resultsCompanyName').textContent = company;
  document.getElementById('summary').textContent = a.summary;
  document.getElementById('risk').textContent = a.risk_assessment;

  fillSwot('strengths', a.swot.strengths);
  fillSwot('weaknesses', a.swot.weaknesses);
  fillSwot('opportunities', a.swot.opportunities);
  fillSwot('threats', a.swot.threats);

  const compEl = document.getElementById('competitors');
  compEl.innerHTML = a.competitors
    .map((c, i) => `
      <div class="comp-item">
        <span class="comp-num">${String(i + 1).padStart(2, '0')}</span>
        ${c}
      </div>`)
    .join('');

  const growthEl = document.getElementById('growth');
  growthEl.innerHTML = a.growth_opportunities
    .map(g => `<div class="growth-item">${g}</div>`)
    .join('');

  const stockCard = document.getElementById('stockCard');

  if (stockData && stockData.prices.length > 0) {
    stockCard.classList.remove('hidden');
    document.getElementById('stockTickerLabel').textContent = `${a.ticker} — 10 Day Performance`;

    if (currentChart) currentChart.destroy();

    const ctx = document.getElementById('stockChart').getContext('2d');
    currentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stockData.dates,
        datasets: [{
          label: 'Closing Price ($)',
          data: stockData.prices,
          borderColor: '#1a56db',
          borderWidth: 2,
          pointBackgroundColor: '#1a56db',
          tension: 0.2,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9e9b96' } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9e9b96' } }
        }
      }
    });
  } else {
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
  const user = getUser();
  if (user && document.getElementById('userName')) {
    document.getElementById('userName').textContent = user.name;
  }

  document.getElementById('companyInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyze();
  });
});