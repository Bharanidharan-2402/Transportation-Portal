/* ============================================
   COLLEGE TRANSPORT INFORMATION PORTAL
   Govt. Arts & Science College, C.Mutlur
   Complete JavaScript — v2.0 (JSON Database)
   ============================================ */

// ==========================================
// GLOBAL STATE
// ==========================================
let APP_DATA = null;
let currentSchedule = 'morning';
let currentFilter = 'all';
let currentSearch = '';
let currentFeePeriod = 'semester';
let currentFeeType = 'non-ac';
let currentFormStep = 1;
const totalSteps = 4;

// ==========================================
// LOAD DATA FROM JSON
// ==========================================
async function loadAppData() {
  try {
    const response = await fetch('data.json');
    APP_DATA = await response.json();
    initializeApp();
  } catch (err) {
    console.error('Failed to load data.json:', err);
    showToast('⚠️ Failed to load data. Trying local fallback...', 'warning');
    // Still try to init with empty data
    APP_DATA = { routes: [], fees: { semester: [], annual: [] }, announcements: [], tickerMessages: [], users: [], college: {}, applications: [], feedback: [] };
    initializeApp();
  }
}

function initializeApp() {
  initTicker();
  renderRoutes();
  renderFees();
  renderAnnouncements();
  renderLiveTracker();
  renderContactCards();
  populateFormRoutes();
  populateCompareDropdowns();
  renderMapLegend();
  initCountdown();
  initScrollReveal();

  // Welcome toast
  setTimeout(() => {
    showToast('👋 Welcome to GASC TransitHub! Explore routes & apply for your bus pass.', 'info');
  }, 2500);
}

// ==========================================
// PRELOADER
// ==========================================
window.addEventListener('load', () => {
  loadAppData();
  setTimeout(() => {
    document.getElementById('preloader').classList.add('hidden');
  }, 2000);
});

// ==========================================
// THEME TOGGLE
// ==========================================
const themeToggle = document.getElementById('themeToggle');
let currentTheme = localStorage.getItem('gasc-theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('gasc-theme', currentTheme);
  themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  showToast(`${currentTheme === 'dark' ? '🌙' : '☀️'} Switched to ${currentTheme} mode`, 'info');
});

// ==========================================
// NAVBAR
// ==========================================
const navbar = document.getElementById('navbar');
const navHamburger = document.getElementById('navHamburger');
const navMobile = document.getElementById('navMobile');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  document.getElementById('backToTop').classList.toggle('visible', window.scrollY > 500);
  updateActiveNavLink();
});

navHamburger.addEventListener('click', () => {
  navHamburger.classList.toggle('active');
  navMobile.classList.toggle('open');
});

document.querySelectorAll('.nav-mobile .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navHamburger.classList.remove('active');
    navMobile.classList.remove('open');
  });
});

function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 100) {
      current = section.getAttribute('id');
    }
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-section') === current);
  });
}

// ==========================================
// HERO
// ==========================================
function createParticles() {
  const container = document.getElementById('heroParticles');
  for (let i = 0; i < 35; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (Math.random() * 8 + 5) + 's';
    p.style.animationDelay = (Math.random() * 5) + 's';
    p.style.width = (Math.random() * 3 + 1) + 'px';
    p.style.height = p.style.width;
    container.appendChild(p);
  }
}
createParticles();

// Clock
function updateClock() {
  const el = document.getElementById('heroClock');
  const now = new Date();
  el.textContent = '🕐 ' + now.toLocaleString('en-IN', {
    weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
}
updateClock();
setInterval(updateClock, 1000);

// Counter Animation
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(counter => {
    const target = parseInt(counter.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      counter.textContent = Math.floor(current).toLocaleString() + (target >= 10 ? '+' : '');
    }, 16);
  });
}

const heroObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) { animateCounters(); heroObs.disconnect(); }
}, { threshold: 0.5 });
heroObs.observe(document.querySelector('.hero'));

// ==========================================
// ANNOUNCEMENT TICKER
// ==========================================
function initTicker() {
  const el = document.getElementById('tickerContent');
  if (!APP_DATA.tickerMessages) return;
  const items = APP_DATA.tickerMessages.map(msg => `<span class="ticker-item">${msg}</span>`).join('');
  el.innerHTML = items + items;
}

// ==========================================
// LIVE BUS TRACKER (UNIQUE)
// ==========================================
function renderLiveTracker() {
  const grid = document.getElementById('trackerGrid');
  if (!APP_DATA.routes) return;

  grid.innerHTML = APP_DATA.routes.map(route => {
    const occupancyPercent = ((route.seatsTotal - route.seatsAvailable) / route.seatsTotal * 100).toFixed(0);
    const availPercent = (route.seatsAvailable / route.seatsTotal * 100).toFixed(0);
    let fillClass = 'high';
    if (availPercent < 30) fillClass = 'low';
    else if (availPercent < 60) fillClass = 'medium';

    // Simulated status
    const statuses = ['on-route', 'arriving', 'on-route'];
    const statusLabels = { 'on-route': 'On Route', 'arriving': 'Arriving Soon' };
    const status = route.seatsAvailable < 10 ? 'arriving' : 'on-route';

    // Simulated ETA
    const etas = ['12 min', '8 min', '22 min', '15 min', '5 min', '18 min', '35 min', '28 min'];
    const eta = etas[APP_DATA.routes.indexOf(route)] || '10 min';

    return `
      <div class="live-bus-card" style="--route-color: ${route.gradient}">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${route.gradient};border-radius:20px 20px 0 0;"></div>
        <div class="live-bus-header">
          <div class="live-bus-route">
            <div class="live-bus-badge" style="background:${route.gradient}">${route.number}</div>
            <div>
              <div class="live-bus-name">${route.from}</div>
              <div style="font-size:0.72rem;color:var(--clr-text-muted);">${route.type.toUpperCase()} · ${route.category}</div>
            </div>
          </div>
          <div class="live-bus-status ${status}">
            <span class="live-bus-status-dot"></span>
            ${statusLabels[status]}
          </div>
        </div>
        <div class="seat-bar-wrapper">
          <div class="seat-bar-label">
            <span>Seats: ${route.seatsAvailable} / ${route.seatsTotal} available</span>
            <span>${availPercent}% free</span>
          </div>
          <div class="seat-bar">
            <div class="seat-bar-fill ${fillClass}" style="width: ${availPercent}%"></div>
          </div>
        </div>
        <div class="live-bus-eta">
          ⏱️ ETA to college: <strong>${eta}</strong>
          &nbsp;·&nbsp; 📍 ${route.distance}
        </div>
      </div>`;
  }).join('');
}

// Countdown Timer to Next Bus
function initCountdown() {
  function update() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Target: 8:15 AM (first bus arrives) for morning, 4:30 PM for evening
    let targetHour, targetMin, label;
    if (hours < 8 || (hours === 8 && minutes < 15)) {
      targetHour = 8; targetMin = 15; label = 'until first bus arrives at college';
    } else if (hours < 16 || (hours === 16 && minutes < 30)) {
      targetHour = 16; targetMin = 30; label = 'until evening departure from college';
    } else {
      targetHour = 8; targetMin = 15; label = 'until tomorrow\'s first bus';
    }

    let target = new Date(now);
    target.setHours(targetHour, targetMin, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const diff = target - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    document.getElementById('countHours').textContent = String(h).padStart(2, '0');
    document.getElementById('countMinutes').textContent = String(m).padStart(2, '0');
    document.getElementById('countSeconds').textContent = String(s).padStart(2, '0');
    document.getElementById('countdownLabel').textContent = label;
  }
  update();
  setInterval(update, 1000);
}

// ==========================================
// BUS ROUTES
// ==========================================
function renderRoutes() {
  const grid = document.getElementById('routesGrid');
  if (!APP_DATA.routes) return;

  let filtered = [...APP_DATA.routes];

  if (currentFilter !== 'all') {
    if (currentFilter === 'express') filtered = filtered.filter(r => r.category === 'express');
    else filtered = filtered.filter(r => r.type === currentFilter);
  }

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.from.toLowerCase().includes(q) ||
      r.stops.some(s => s.name.toLowerCase().includes(q)) ||
      r.id.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="no-results"><div class="no-results-icon">🔍</div><h3 style="font-family:var(--font-heading);margin-bottom:8px;">No routes found</h3><p style="color:var(--clr-text-muted);">Try adjusting your search or filter</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(route => {
    const timeKey = currentSchedule === 'morning' ? 'morningTime' : 'eveningTime';
    const previewStops = route.stops.slice(0, 3);

    return `
      <div class="route-card" style="--route-color:${route.gradient}" data-route-id="${route.id}">
        <div class="route-card-header">
          <div class="route-number">
            <div class="route-number-badge" style="background:${route.gradient}">${route.number}</div>
            <div class="route-info">
              <h3>${route.name}</h3>
              <div class="route-type">
                <span class="route-type-badge ${route.type === 'ac' ? 'ac-badge' : 'non-ac-badge'}">${route.type.toUpperCase()}</span>
                <span>${route.category === 'express' ? '⚡ Express' : '🚌 Regular'}</span>
              </div>
            </div>
          </div>
          <button class="route-expand-btn" onclick="toggleRouteDetails('${route.id}')" aria-label="Expand">▼</button>
        </div>
        <div class="route-stops-preview">
          ${previewStops.map((s, i) => `
            <span class="route-stop-chip">${s.name}</span>
            ${i < previewStops.length - 1 ? '<span class="route-stop-arrow">→</span>' : ''}
          `).join('')}
          ${route.stops.length > 3 ? `<span class="route-stop-chip">+${route.stops.length - 3} more</span>` : ''}
        </div>
        <div class="route-meta">
          <div class="route-meta-item"><span>📍</span>${route.distance}</div>
          <div class="route-meta-item"><span>⏱️</span>${route.duration}</div>
          <div class="route-meta-item"><span>🚌</span>${route.busCount} Buses</div>
          <div class="route-meta-item"><span>🕐</span>${route.stops[0][timeKey]}</div>
        </div>
        <div class="route-details" id="details-${route.id}">
          <div class="route-details-inner">
            <h4 style="font-family:var(--font-heading);font-size:0.92rem;margin-bottom:16px;color:var(--clr-text-secondary);">
              ${currentSchedule === 'morning' ? '☀️ Morning' : '🌙 Evening'} Schedule — All Stops
            </h4>
            <div class="route-timeline">
              ${route.stops.map(s => `
                <div class="timeline-stop">
                  <div>
                    <div class="timeline-stop-name">${s.name}</div>
                    <div class="timeline-stop-landmark">📍 ${s.landmark}</div>
                  </div>
                  <span class="timeline-stop-time">${s[timeKey]}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function toggleRouteDetails(routeId) {
  const details = document.getElementById('details-' + routeId);
  const card = details.closest('.route-card');
  const btn = card.querySelector('.route-expand-btn');
  details.classList.toggle('open');
  btn.classList.toggle('expanded');
}

document.getElementById('filterTabs').addEventListener('click', (e) => {
  if (e.target.classList.contains('filter-tab')) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-filter');
    renderRoutes();
  }
});

document.getElementById('morningBtn').addEventListener('click', () => {
  currentSchedule = 'morning';
  document.getElementById('morningBtn').classList.add('active');
  document.getElementById('eveningBtn').classList.remove('active');
  renderRoutes();
});

document.getElementById('eveningBtn').addEventListener('click', () => {
  currentSchedule = 'evening';
  document.getElementById('eveningBtn').classList.add('active');
  document.getElementById('morningBtn').classList.remove('active');
  renderRoutes();
});

document.getElementById('routeSearch').addEventListener('input', (e) => {
  currentSearch = e.target.value;
  renderRoutes();
});

// ==========================================
// MAP LEGEND
// ==========================================
function renderMapLegend() {
  const legend = document.getElementById('mapLegend');
  if (!APP_DATA.routes) return;
  legend.innerHTML = APP_DATA.routes.map(r =>
    `<div class="map-legend-item"><div class="map-legend-color" style="background:${r.color}"></div>R${r.number}: ${r.from}</div>`
  ).join('');
}

// ==========================================
// FEE STRUCTURE
// ==========================================
function renderFees() {
  const container = document.getElementById('feeCards');
  if (!APP_DATA.fees) return;
  const fees = APP_DATA.fees[currentFeePeriod];
  const priceKey = currentFeeType === 'ac' ? 'acPrice' : 'nonAcPrice';

  container.innerHTML = fees.map(fee => {
    const features = [
      `${currentFeeType === 'ac' ? 'AC' : 'Non-AC'} Bus`,
      currentFeePeriod === 'annual' ? 'Full Year Access' : 'One Semester',
      currentFeePeriod === 'annual' ? 'Save 10% vs Semester' : 'Flexible Renewal',
      'Seat Guaranteed',
      'Student ID Required'
    ];

    return `
      <div class="fee-card ${fee.popular ? 'popular' : ''}">
        <div class="fee-card-icon">${fee.icon}</div>
        <div class="fee-card-label">${fee.label}</div>
        <div class="fee-card-distance">${fee.distance}</div>
        <div class="fee-card-price">₹${fee[priceKey].toLocaleString()}</div>
        <div class="fee-card-period">per ${currentFeePeriod}</div>
        <div class="fee-card-features">
          ${features.map(f => `<div class="fee-card-feature">${f}</div>`).join('')}
        </div>
      </div>`;
  }).join('');
}

document.getElementById('semesterBtn').addEventListener('click', () => {
  currentFeePeriod = 'semester';
  document.getElementById('semesterBtn').classList.add('active');
  document.getElementById('annualBtn').classList.remove('active');
  renderFees();
});

document.getElementById('annualBtn').addEventListener('click', () => {
  currentFeePeriod = 'annual';
  document.getElementById('annualBtn').classList.add('active');
  document.getElementById('semesterBtn').classList.remove('active');
  renderFees();
});

document.getElementById('feeNonAcBtn').addEventListener('click', () => {
  currentFeeType = 'non-ac';
  document.getElementById('feeNonAcBtn').classList.add('active');
  document.getElementById('feeAcBtn').classList.remove('active');
  renderFees();
});

document.getElementById('feeAcBtn').addEventListener('click', () => {
  currentFeeType = 'ac';
  document.getElementById('feeAcBtn').classList.add('active');
  document.getElementById('feeNonAcBtn').classList.remove('active');
  renderFees();
});

// ==========================================
// BUS PASS APPLICATION FORM
// ==========================================
function populateFormRoutes() {
  const sel = document.getElementById('routeSelect');
  if (!APP_DATA.routes) return;
  APP_DATA.routes.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `Route ${r.number} — ${r.name} (${r.type.toUpperCase()})`;
    sel.appendChild(opt);
  });
}

document.getElementById('routeSelect').addEventListener('change', (e) => {
  const routeId = e.target.value;
  const bp = document.getElementById('boardingPoint');
  bp.innerHTML = '<option value="">Select boarding point</option>';
  if (routeId && APP_DATA.routes) {
    const route = APP_DATA.routes.find(r => r.id === routeId);
    if (route) {
      route.stops.slice(0, -1).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = `${s.name} (${s.landmark})`;
        bp.appendChild(opt);
      });
    }
  }
});

function updateWizard() {
  for (let i = 1; i <= totalSteps; i++) {
    document.getElementById('step' + i).classList.remove('active');
  }
  document.getElementById('step' + currentFormStep).classList.add('active');

  document.querySelectorAll('.wizard-step-indicator').forEach(ind => {
    const step = parseInt(ind.getAttribute('data-step'));
    ind.classList.remove('active', 'completed');
    if (step === currentFormStep) ind.classList.add('active');
    else if (step < currentFormStep) {
      ind.classList.add('completed');
      ind.querySelector('.wizard-step-circle').textContent = '✓';
    } else {
      ind.querySelector('.wizard-step-circle').textContent = step;
    }
  });

  const progress = ((currentFormStep - 1) / (totalSteps - 1)) * 100;
  const barEl = document.getElementById('wizardProgressBar');
  const totalWidth = document.querySelector('.wizard-progress').offsetWidth - 80;
  barEl.style.width = (progress / 100 * totalWidth) + 'px';

  if (currentFormStep === 4) populatePreview();
}

function validateStep(step) {
  let valid = true;
  const fieldsByStep = {
    1: ['fullName', 'studentId', 'email', 'phone', 'department', 'year'],
    2: ['routeSelect', 'boardingPoint', 'passType'],
    3: ['address', 'guardianName', 'emergencyContact']
  };

  (fieldsByStep[step] || []).forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.classList.add('error'); valid = false; }
    else el.classList.remove('error');
  });

  if (step === 1) {
    const email = document.getElementById('email');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add('error');
      valid = false;
    }
  }

  if (!valid) showToast('Please fill in all required fields', 'error');
  return valid;
}

function nextStep(current) {
  if (!validateStep(current)) return;
  if (current < totalSteps) { currentFormStep = current + 1; updateWizard(); }
}

function prevStep(current) {
  if (current > 1) { currentFormStep = current - 1; updateWizard(); }
}

function populatePreview() {
  const preview = document.getElementById('formPreview');
  const getSelText = (id) => { const el = document.getElementById(id); return el.options[el.selectedIndex]?.text || '—'; };

  const data = [
    ['Full Name', document.getElementById('fullName').value],
    ['Student ID', document.getElementById('studentId').value],
    ['Email', document.getElementById('email').value],
    ['Phone', document.getElementById('phone').value],
    ['Department', getSelText('department')],
    ['Year', document.getElementById('year').value + ' Year'],
    ['Route', getSelText('routeSelect')],
    ['Boarding Point', getSelText('boardingPoint')],
    ['Pass Type', document.getElementById('passType').value],
    ['Bus Type', document.getElementById('busPreference').value],
    ['Guardian', document.getElementById('guardianName').value],
    ['Emergency Contact', document.getElementById('emergencyContact').value],
    ['Blood Group', document.getElementById('bloodGroup').value || 'Not specified'],
  ];

  preview.innerHTML = data.map(([l, v]) =>
    `<div class="form-preview-row"><span class="form-preview-label">${l}</span><span class="form-preview-value">${v || '—'}</span></div>`
  ).join('');
}

function submitApplication() {
  const ref = 'GACM-' + Date.now().toString(36).toUpperCase().slice(-6);
  document.getElementById('refNumber').textContent = ref;

  // Save to JSON data (in-memory for demo, persisted via localStorage)
  const application = {
    refNumber: ref,
    fullName: document.getElementById('fullName').value,
    studentId: document.getElementById('studentId').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    department: document.getElementById('department').value,
    year: document.getElementById('year').value,
    route: document.getElementById('routeSelect').value,
    boardingPoint: document.getElementById('boardingPoint').value,
    passType: document.getElementById('passType').value,
    busPreference: document.getElementById('busPreference').value,
    address: document.getElementById('address').value,
    guardianName: document.getElementById('guardianName').value,
    emergencyContact: document.getElementById('emergencyContact').value,
    bloodGroup: document.getElementById('bloodGroup').value,
    medical: document.getElementById('medical').value,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };

  // Save to localStorage
  const savedApps = JSON.parse(localStorage.getItem('gasc-applications') || '[]');
  savedApps.push(application);
  localStorage.setItem('gasc-applications', JSON.stringify(savedApps));

  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.querySelector('.wizard-progress').style.display = 'none';
  document.getElementById('formSuccess').classList.add('visible');

  showToast('🎉 Application submitted! Ref: ' + ref, 'success');
}

function resetForm() {
  currentFormStep = 1;
  document.querySelector('.wizard-progress').style.display = 'flex';
  document.getElementById('formSuccess').classList.remove('visible');
  document.querySelectorAll('#formWizard .form-input, #formWizard .form-select').forEach(el => {
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
    el.classList.remove('error');
  });
  updateWizard();
}

document.querySelectorAll('#formWizard .form-input, #formWizard .form-select').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('error'));
  el.addEventListener('change', () => el.classList.remove('error'));
});

// ==========================================
// ROUTE COMPARISON (UNIQUE)
// ==========================================
function populateCompareDropdowns() {
  ['compareRouteA', 'compareRouteB'].forEach(id => {
    const sel = document.getElementById(id);
    if (!APP_DATA.routes) return;
    APP_DATA.routes.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `Route ${r.number} — ${r.from}`;
      sel.appendChild(opt);
    });
  });
}

function updateComparison() {
  const idA = document.getElementById('compareRouteA').value;
  const idB = document.getElementById('compareRouteB').value;

  [['compareDetailA', idA], ['compareDetailB', idB]].forEach(([containerId, routeId]) => {
    const container = document.getElementById(containerId);
    if (!routeId) { container.innerHTML = '<p style="color:var(--clr-text-muted);font-size:0.88rem;margin-top:16px;">Select a route to compare</p>'; return; }

    const route = APP_DATA.routes.find(r => r.id === routeId);
    if (!route) return;

    container.innerHTML = `
      <div class="compare-row"><span class="compare-label">From</span><span class="compare-value">${route.from}</span></div>
      <div class="compare-row"><span class="compare-label">Distance</span><span class="compare-value">${route.distance}</span></div>
      <div class="compare-row"><span class="compare-label">Duration</span><span class="compare-value">${route.duration}</span></div>
      <div class="compare-row"><span class="compare-label">Bus Type</span><span class="compare-value">${route.type.toUpperCase()}</span></div>
      <div class="compare-row"><span class="compare-label">Category</span><span class="compare-value">${route.category}</span></div>
      <div class="compare-row"><span class="compare-label">Buses</span><span class="compare-value">${route.busCount}</span></div>
      <div class="compare-row"><span class="compare-label">Seats Available</span><span class="compare-value">${route.seatsAvailable} / ${route.seatsTotal}</span></div>
      <div class="compare-row"><span class="compare-label">Total Stops</span><span class="compare-value">${route.stops.length}</span></div>
      <div class="compare-row"><span class="compare-label">First Departure</span><span class="compare-value">${route.stops[0].morningTime}</span></div>
      <div class="compare-row"><span class="compare-label">Arrives at College</span><span class="compare-value">${route.stops[route.stops.length-1].morningTime}</span></div>
    `;
  });
}

// ==========================================
// ANNOUNCEMENTS
// ==========================================
function renderAnnouncements() {
  const grid = document.getElementById('announcementsGrid');
  if (!APP_DATA.announcements) return;

  grid.innerHTML = APP_DATA.announcements.map((ann, i) => `
    <div class="announcement-card" onclick="toggleAnnouncement(${i})" id="ann-${i}">
      <div class="announcement-priority ${ann.priority}">${ann.icon}</div>
      <div class="announcement-content">
        <h3>${ann.title} <span class="announcement-badge ${ann.priority}">${ann.priority}</span></h3>
        <p class="announcement-text">${ann.text}</p>
        <div class="announcement-expand">
          <p class="announcement-text" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--clr-border);">${ann.expandText}</p>
        </div>
        <p class="announcement-date">📅 ${ann.date}</p>
      </div>
    </div>
  `).join('');
}

function toggleAnnouncement(i) {
  document.getElementById('ann-' + i).classList.toggle('expanded');
}

// ==========================================
// STUDENT DASHBOARD
// ==========================================
function loginDashboard() {
  const sid = document.getElementById('loginStudentId').value.trim();
  const pwd = document.getElementById('loginPassword').value.trim();

  if (!APP_DATA.users) return;
  const user = APP_DATA.users.find(u => u.studentId === sid && u.password === pwd);

  if (user) {
    document.getElementById('dashboardLogin').style.display = 'none';
    document.getElementById('dashboardPanel').classList.add('visible');

    // Populate profile
    document.getElementById('profileAvatar').textContent = user.initials;
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileMeta').textContent = `${user.studentId} · ${user.department} · ${user.year}`;

    document.getElementById('profileDetails').innerHTML = [
      ['Bus Route', user.routeName],
      ['Boarding Point', user.boardingPoint],
      ['Pass Type', `${user.passType} (${user.busType})`],
      ['Valid Until', user.validUntil],
      ['Morning Pickup', user.morningPickup],
      ['Evening Drop', user.eveningDrop],
      ['Fees Paid', user.feesPaid],
      ['Pass Number', user.passNumber]
    ].map(([l, v]) =>
      `<div class="profile-detail"><div class="profile-detail-label">${l}</div><div class="profile-detail-value">${v}</div></div>`
    ).join('');

    // Bus Pass Card
    document.getElementById('passNumber').textContent = user.passNumber;
    document.getElementById('busPassDetails').innerHTML = [
      ['Name', user.name],
      ['Route', user.routeName],
      ['Boarding', user.boardingPoint],
      ['Pass Type', user.passType],
      ['Bus Type', user.busType],
      ['Valid Until', user.validUntil]
    ].map(([l, v]) =>
      `<div><div class="bus-pass-detail-label">${l}</div><div class="bus-pass-detail-value">${v}</div></div>`
    ).join('');

    // Tracker steps
    document.getElementById('trackerSteps').innerHTML = user.trackerSteps.map(s =>
      `<div class="tracker-step ${s.status}"><div class="tracker-step-dot">${s.status === 'completed' ? '✔' : '●'}</div><span class="tracker-step-label">${s.label}</span></div>`
    ).join('');

    showToast(`✅ Welcome back, ${user.name.split(' ')[0]}!`, 'success');
  } else {
    showToast('❌ Invalid credentials. Try demo accounts listed above.', 'error');
  }
}

function logoutDashboard() {
  document.getElementById('dashboardPanel').classList.remove('visible');
  document.getElementById('dashboardLogin').style.display = 'block';
  document.getElementById('loginStudentId').value = '';
  document.getElementById('loginPassword').value = '';
  showToast('👋 Logged out successfully', 'info');
}

document.getElementById('loginPassword').addEventListener('keypress', (e) => { if (e.key === 'Enter') loginDashboard(); });
document.getElementById('loginStudentId').addEventListener('keypress', (e) => { if (e.key === 'Enter') loginDashboard(); });

// ==========================================
// CONTACT CARDS
// ==========================================
function renderContactCards() {
  const container = document.getElementById('contactCards');
  if (!APP_DATA.college) return;
  const c = APP_DATA.college;

  container.innerHTML = `
    <div class="contact-info-card"><div class="contact-info-icon phone">📞</div><div class="contact-info-text"><h4>Phone</h4><p>${c.phone}</p></div></div>
    <div class="contact-info-card"><div class="contact-info-icon email">📧</div><div class="contact-info-text"><h4>Email</h4><p>${c.email}</p></div></div>
    <div class="contact-info-card"><div class="contact-info-icon location">📍</div><div class="contact-info-text"><h4>Office</h4><p>${c.officeLocation}</p></div></div>
    <div class="contact-info-card"><div class="contact-info-icon emergency">🚨</div><div class="contact-info-text"><h4>Emergency Helpline (24/7)</h4><p>${c.emergencyHelpline}</p></div></div>
  `;
}

// ==========================================
// SOS EMERGENCY (UNIQUE)
// ==========================================
document.getElementById('sosBtn').addEventListener('click', () => {
  document.getElementById('sosModal').classList.add('open');
});

function closeSOS() {
  document.getElementById('sosModal').classList.remove('open');
}

document.getElementById('sosModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('sosModal')) closeSOS();
});

// ==========================================
// FAQ ACCORDION
// ==========================================
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ==========================================
// FEEDBACK (Saved to localStorage)
// ==========================================
function submitFeedback() {
  const name = document.getElementById('feedbackName').value.trim();
  const message = document.getElementById('feedbackMessage').value.trim();

  if (!name || !message) {
    showToast('Please fill in your name and message', 'warning');
    return;
  }

  const feedback = {
    name,
    type: document.getElementById('feedbackType').value,
    message,
    submittedAt: new Date().toISOString()
  };

  const savedFeedback = JSON.parse(localStorage.getItem('gasc-feedback') || '[]');
  savedFeedback.push(feedback);
  localStorage.setItem('gasc-feedback', JSON.stringify(savedFeedback));

  showToast(`📤 Feedback sent! Thank you, ${name}.`, 'success');
  document.getElementById('feedbackName').value = '';
  document.getElementById('feedbackMessage').value = '';
  document.getElementById('feedbackType').selectedIndex = 0;
}

// ==========================================
// BACK TO TOP
// ==========================================
document.getElementById('backToTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ==========================================
// TOAST
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// SCROLL REVEAL
// ==========================================
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    navHamburger.classList.remove('active');
    navMobile.classList.remove('open');
    closeSOS();
  }
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    document.getElementById('routeSearch').focus();
    document.getElementById('routes').scrollIntoView({ behavior: 'smooth' });
  }
});

// ==========================================
// CONSOLE
// ==========================================
console.log('%c🚌 GASC TransitHub — College Transport Portal', 'font-size:16px;font-weight:bold;color:#3b82f6;background:#0a0e1a;padding:8px 16px;border-radius:8px;');
console.log('%cGovt. Arts & Science College, C.Mutlur, Chidambaram', 'font-size:12px;color:#94a3b8;');
console.log('%cData loaded from data.json • Applications saved to localStorage', 'font-size:11px;color:#64748b;');
