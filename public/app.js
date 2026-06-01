function getToken() { return localStorage.getItem('token'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }

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
    const headers = { 'Content-Type': 'application/json' };
    if (getToken()) headers['Authorization'] = `Bearer ${getToken()}`;

    const response = await fetch('/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({ company })
    });

    const data = await response.json();
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
  const logoutBtn = document.querySelector('.logout-btn');
  const historyBtn = document.querySelector('.history-btn');
  const userNameEl = document.getElementById('userName');
  const authButtons = document.getElementById('authButtons');

  if (user) {
    if (userNameEl) userNameEl.textContent = user.username;
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (historyBtn) historyBtn.style.display = 'block';
    if (authButtons) authButtons.style.display = 'none';
  } else {
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (historyBtn) historyBtn.style.display = 'none';
    if (userNameEl) userNameEl.style.display = 'none';
    if (authButtons) authButtons.style.display = 'flex';
  }

  document.getElementById('companyInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyze();
  });
});

<<<<<<< HEAD

=======
>>>>>>> eec5152 (Make dashboard public with optional auth)
async function loadHistory() {
  try {
    const response = await fetch('/history', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await response.json();

    const listEl = document.getElementById('historyList');

    if (!data.searches || data.searches.length === 0) {
      listEl.innerHTML = '<p class="history-empty">No searches yet.</p>';
      return;
    }

    listEl.innerHTML = data.searches.map(s => `
      <div class="history-item" id="hist-${s._id}">
        <div class="history-item-info" onclick="reAnalyze('${s.company}')">
          <span class="history-company">${s.company}</span>
          <span class="history-date">${new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <button class="history-delete" onclick="deleteHistory('${s._id}')" title="Delete">✕</button>
      </div>
    `).join('');

  } catch (err) {
    console.error('History error:', err);
  }
}

function toggleHistory() {
  const user = getUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  const sidebar = document.getElementById('historySidebar');
  const overlay = document.getElementById('historyOverlay');
  const isOpen = sidebar.classList.contains('open');

<<<<<<< HEAD
  if (!isOpen) {
    loadHistory(); 
  }
=======
  if (!isOpen) loadHistory();
>>>>>>> eec5152 (Make dashboard public with optional auth)

  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

async function deleteHistory(id) {
  try {
    await fetch(`/history/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    document.getElementById(`hist-${id}`).remove();

<<<<<<< HEAD
   
=======
>>>>>>> eec5152 (Make dashboard public with optional auth)
    const listEl = document.getElementById('historyList');
    if (listEl.children.length === 0) {
      listEl.innerHTML = '<p class="history-empty">No searches yet.</p>';
    }
  } catch (err) {
    console.error('Delete error:', err);
  }
}

function reAnalyze(company) {
  document.getElementById('companyInput').value = company;
<<<<<<< HEAD
  toggleHistory(); 
  analyze(); 
=======
  toggleHistory();
  analyze();
>>>>>>> eec5152 (Make dashboard public with optional auth)
}

async function exportPDF() {
  const { jsPDF } = window.jspdf;
  const company = document.getElementById('resultsCompanyName').textContent;
  const btn = document.querySelector('.export-btn');

  btn.textContent = 'Generating...';
  btn.disabled = true;

  try {
    const canvas = await html2canvas(document.getElementById('results'), {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true,
      imageTimeout: 0,
      onclone: (clonedDoc) => {
<<<<<<< HEAD
        clonedDoc.querySelectorAll('.card').forEach(card => {
          card.style.background = '#ffffff';
          card.style.border = '1px solid #e8e6e1';
        });
        clonedDoc.querySelectorAll('p, li, h2, span').forEach(el => {
          if (!el.style.color || el.style.color === '') {
            el.style.color = '#1a1917';
          }
        });
        clonedDoc.querySelectorAll('.swot-cell.s').forEach(el => el.style.background = '#f0fdf4');
        clonedDoc.querySelectorAll('.swot-cell.w').forEach(el => el.style.background = '#fff7ed');
        clonedDoc.querySelectorAll('.swot-cell.o').forEach(el => el.style.background = '#eff6ff');
        clonedDoc.querySelectorAll('.swot-cell.t').forEach(el => el.style.background = '#fef2f2');
=======
        const results = clonedDoc.getElementById('results');
        results.style.background = '#ffffff';

        clonedDoc.querySelectorAll('p, li, h2, h3, span, div').forEach(el => {
          el.style.color = '#1a1917';
        });
        clonedDoc.querySelectorAll('.card').forEach(el => {
          el.style.background = '#ffffff';
          el.style.border = '1px solid #e8e6e1';
          el.style.boxShadow = 'none';
        });
        clonedDoc.querySelectorAll('.card-label').forEach(el => el.style.color = '#6b6860');
        clonedDoc.querySelectorAll('.swot-cell.s').forEach(el => { el.style.background = '#f0fdf4'; el.style.border = '1px solid #bbf7d0'; });
        clonedDoc.querySelectorAll('.swot-cell.w').forEach(el => { el.style.background = '#fff7ed'; el.style.border = '1px solid #fed7aa'; });
        clonedDoc.querySelectorAll('.swot-cell.o').forEach(el => { el.style.background = '#eff6ff'; el.style.border = '1px solid #bfdbfe'; });
        clonedDoc.querySelectorAll('.swot-cell.t').forEach(el => { el.style.background = '#fef2f2'; el.style.border = '1px solid #fecaca'; });
        clonedDoc.querySelectorAll('.swot-cell.s .swot-tag').forEach(el => el.style.color = '#166534');
        clonedDoc.querySelectorAll('.swot-cell.w .swot-tag').forEach(el => el.style.color = '#9a3412');
        clonedDoc.querySelectorAll('.swot-cell.o .swot-tag').forEach(el => el.style.color = '#1e40af');
        clonedDoc.querySelectorAll('.swot-cell.t .swot-tag').forEach(el => el.style.color = '#7f1d1d');
        clonedDoc.querySelectorAll('.swot-cell li').forEach(el => el.style.color = '#374151');
>>>>>>> eec5152 (Make dashboard public with optional auth)
        clonedDoc.querySelectorAll('.growth-item').forEach(el => {
          el.style.background = '#eef3fd';
          el.style.color = '#1a1917';
          el.style.borderLeft = '3px solid #1a56db';
        });
        clonedDoc.querySelectorAll('.comp-item').forEach(el => {
          el.style.background = '#f3f2ef';
          el.style.color = '#1a1917';
        });
<<<<<<< HEAD
        clonedDoc.querySelectorAll('.summary-text, .risk-text').forEach(el => {
          el.style.color = '#1a1917';
        });
=======
        clonedDoc.querySelectorAll('.comp-num').forEach(el => el.style.color = '#6b6860');
        clonedDoc.querySelectorAll('.summary-text, .risk-text').forEach(el => el.style.color = '#374151');
        clonedDoc.querySelectorAll('.results-company').forEach(el => el.style.color = '#1a1917');
        clonedDoc.querySelectorAll('.results-eyebrow').forEach(el => el.style.color = '#6b6860');
        clonedDoc.querySelectorAll('.export-btn, .results-badge').forEach(el => el.style.display = 'none');
>>>>>>> eec5152 (Make dashboard public with optional auth)
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${company}_CompanyRadar_Report.pdf`);

  } catch (err) {
    console.error('PDF error:', err);
  } finally {
    btn.textContent = '↓ Export PDF';
    btn.disabled = false;
  }
}
