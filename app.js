// ==========================================
// FORMATS FFTA
// ==========================================
const FFTA_FORMATS = [
  // ── SALLE ──
  { id:'salle-40',    name:'Salle 18m — 40cm',       detail:'18m · 40cm · 20×3 = 60 flèches',   distance:18, blason:'40cm',         volleys:20, apv:3, maxScore:600,  section:'Salle',     arcs:['Arc classique','Arc nu'] },
  { id:'salle-vegas', name:'Salle 18m — Vegas',       detail:'18m · Trispot · 20×3 = 60 flèches', distance:18, blason:'Vegas trispot', volleys:20, apv:3, maxScore:600,  section:'Salle',     arcs:['Arc à poulies'] },
  { id:'salle-60',    name:'Salle 18m — 60cm',        detail:'18m · 60cm · 20×3 = 60 flèches',   distance:18, blason:'60cm',         volleys:20, apv:3, maxScore:600,  section:'Salle',     arcs:[] },

  // ── EXTÉRIEUR ──
  { id:'ext-20',      name:'Extérieur 20m',           detail:'20m · 80cm · 12×6 = 72 flèches',   distance:20, blason:'80cm',         volleys:12, apv:6, maxScore:720,  section:'Extérieur', arcs:['Arc classique'] },
  { id:'ext-30',      name:'Extérieur 30m',           detail:'30m · 80cm · 12×6 = 72 flèches',   distance:30, blason:'80cm',         volleys:12, apv:6, maxScore:720,  section:'Extérieur', arcs:['Arc classique','Arc à poulies','Arc nu'] },
  { id:'ext-40',      name:'Extérieur 40m',           detail:'40m · 122cm · 12×6 = 72 flèches',  distance:40, blason:'122cm',        volleys:12, apv:6, maxScore:720,  section:'Extérieur', arcs:['Arc classique','Arc à poulies','Arc nu'] },
  { id:'ext-50',      name:'Extérieur 50m',           detail:'50m · 122cm · 12×6 = 72 flèches',  distance:50, blason:'122cm',        volleys:12, apv:6, maxScore:720,  section:'Extérieur', arcs:['Arc classique','Arc nu'] },
  { id:'ext-50-comp', name:'Extérieur 50m',           detail:'50m · 80cm · 12×6 = 72 flèches',   distance:50, blason:'80cm',         volleys:12, apv:6, maxScore:720,  section:'Extérieur', arcs:['Arc à poulies'] },
  { id:'ext-60',      name:'Extérieur 60m',           detail:'60m · 122cm · 12×6 = 72 flèches',  distance:60, blason:'122cm',        volleys:12, apv:6, maxScore:720,  section:'Extérieur', arcs:['Arc classique'] },
  { id:'ext-70',      name:'Extérieur 70m',           detail:'70m · 122cm · 12×6 = 72 flèches',  distance:70, blason:'122cm',        volleys:12, apv:6, maxScore:720,  section:'Extérieur', arcs:['Arc classique'] },

  // ── AUTRES ──
  { id:'beursault',   name:'Beursault',               detail:'Blason Beursault · 12×6',           distance:null, blason:'Beursault', volleys:12, apv:6, maxScore:null, section:'Autres',    arcs:[] },
  { id:'libre',       name:'⚙️ Format libre',         detail:'Personnalisez votre session',        distance:null, blason:null,        volleys:null, apv:null, maxScore:null, section:'Autres', arcs:[] },
];

const COLORS = [
  {name:'Blanc',hex:'#FFFFFF'},{name:'Noir',hex:'#222222'},{name:'Rouge',hex:'#E74C3C'},
  {name:'Bleu',hex:'#3498DB'},{name:'Vert',hex:'#2ECC71'},{name:'Orange',hex:'#E67E22'},
  {name:'Jaune',hex:'#F1C40F'},{name:'Violet',hex:'#9B59B6'},{name:'Rose',hex:'#FF69B4'},{name:'Gris',hex:'#95A5A6'},
];

// ==========================================
// STATE
// ==========================================
let selectedFormatId = null;
let objectifEnabled = false;
let mode = 'solo';
let currentSession = null;
let currentImageBase64 = null;
let archer1Fleche = {};
let archer2Fleche = {};
let profil = {};

// ── DEBUG LOG (branche dev uniquement — V4.6.4-dev) ──
let debugLog = [];
let debugPhotos = []; // { filename, base64, iaFilename, iaData }

function logEvent(action, data = {}) {
  debugLog.push({ ts: new Date().toISOString(), action, ...data });
}

function logVollee(volleeIndex, imageBase64, iaResponse, durationMs, scoreCorrige = null) {
  const ts = new Date();
  const hh = String(ts.getHours()).padStart(2,'0');
  const mm = String(ts.getMinutes()).padStart(2,'0');
  const label = `vollee_${String(volleeIndex).padStart(2,'0')}_${hh}h${mm}`;
  debugPhotos.push({
    filename: `${label}.jpg`,
    base64: imageBase64,
    iaFilename: `${label}_ia.json`,
    iaData: iaResponse
  });
  logEvent('vollee_analysee', {
    vollee: volleeIndex,
    photo_file: `${label}.jpg`,
    ia_file: `${label}_ia.json`,
    duration_ms: durationMs,
    score_ia: iaResponse?.total ?? null,
    score_corrige: scoreCorrige,
    correction: scoreCorrige !== null && scoreCorrige !== iaResponse?.total,
    type_cible: iaResponse?.type ?? null
  });
}

// ==========================================
// NAVIGATION
// ==========================================
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  if (name === 'history') renderHistoryScreen();
  if (name === 'home')    { renderHomeRecap(); renderProfilCard(); }
  if (name === 'setup')   buildFormatsGrid();
  if (name === 'profil')  loadProfilScreen();
}

// ==========================================
// PROFIL
// ==========================================
function loadProfilScreen() {
  document.getElementById('profil-prenom').value = profil.prenom || '';
  document.querySelectorAll('#profil-arc-chips .chip').forEach(c => {
    c.classList.toggle('selected', c.textContent === profil.arc);
  });
  loadProfilFleche();
}

function selectProfilArc(arc) {
  profil.arc = profil.arc === arc ? null : arc;
  document.querySelectorAll('#profil-arc-chips .chip').forEach(c => {
    c.classList.toggle('selected', c.textContent === profil.arc);
  });
  saveProfil();
}


function saveProfil() {
  profil.prenom = document.getElementById('profil-prenom').value;
  localStorage.setItem('archerProfil', JSON.stringify(profil));
  renderProfilCard();
}

function renderProfilCard() {
  const nameEl = document.getElementById('profil-name-display');
  const arcEl  = document.getElementById('profil-arc-display');
  const colEl  = document.getElementById('profil-colors-display');
  nameEl.textContent = profil.prenom || 'Mon profil';
  arcEl.textContent  = profil.arc || '';
  const f = profil.fleche || {};
  const dots = [f.coq, f.lat1, f.lat2, f.enc].filter(Boolean);
  colEl.innerHTML = dots.map(name => {
    const c = COLORS.find(x => x.name === name);
    return `<div class="profil-color-dot" style="background:${c ? c.hex : '#888'}"></div>`;
  }).join('');
}

// ==========================================
// HOME RECAP
// ==========================================
function renderHomeRecap() {
  const sessions = getSavedSessions();
  const recap = document.getElementById('last-session-recap');
  if (!sessions.length) { recap.style.display = 'none'; return; }
  recap.style.display = 'block';
  const last = sessions[0];
  document.getElementById('recap-format').textContent = last.format.name + (last.arc ? ' — ' + last.arc : '');
  document.getElementById('recap-date').textContent = formatDate(last.endDate || last.startDate);
  document.getElementById('recap-score').textContent = last.totalScore + (last.format.maxScore ? ' / ' + last.format.maxScore : '');
}

// ==========================================
// SETUP — FORMATS
// ==========================================
function buildFormatsGrid() {
  const grid = document.getElementById('formats-grid');
  const arcType = profil.arc || null;
  const recommended = arcType ? FFTA_FORMATS.filter(f => f.arcs.includes(arcType)) : [];
  const sections = ['Salle', 'Extérieur', 'Autres'];
  let html = '';

  sections.forEach(section => {
    const formats = FFTA_FORMATS.filter(f => f.section === section);
    if (!formats.length) return;
    html += `<div class="format-section-label${section !== 'Autres' ? '' : ''}">${section}</div>`;
    // Recommandés en premier dans chaque section
    const rec = formats.filter(f => recommended.includes(f));
    const others = formats.filter(f => !recommended.includes(f));
    html += rec.map(f => formatCardHtml(f, true)).join('');
    html += others.map(f => formatCardHtml(f, false)).join('');
  });

  grid.innerHTML = html;

  if (selectedFormatId) {
    const el = document.getElementById('fc-' + selectedFormatId);
    if (el) el.classList.add('selected');
    document.getElementById('custom-fields').classList.toggle('visible', selectedFormatId === 'libre');
  }
}

function formatCardHtml(f, isRecommended) {
  return `<div class="format-card${isRecommended ? ' recommended-card' : ''}" id="fc-${f.id}" onclick="selectFormat('${f.id}')">
    <div class="format-card-left">
      <div class="format-name">${f.name}</div>
      <div class="format-detail">${f.detail}</div>
    </div>
    <div class="format-right">
      ${isRecommended ? '<span class="badge-recommended">⭐</span>' : ''}
      <div class="format-score-max">${f.maxScore || '—'}</div>
    </div>
  </div>`;
}

function selectFormat(id) {
  selectedFormatId = id;
  document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('fc-' + id).classList.add('selected');
  document.getElementById('custom-fields').classList.toggle('visible', id === 'libre');
}

function toggleObjectif() {
  objectifEnabled = !objectifEnabled;
  document.getElementById('objectif-switch').classList.toggle('on', objectifEnabled);
  document.getElementById('objectif-fields').classList.toggle('visible', objectifEnabled);
}

function getSelectedFormat() {
  if (!selectedFormatId) return null;
  if (selectedFormatId === 'libre') {
    const dist   = document.getElementById('custom-distance').value;
    const blason = document.getElementById('custom-blason').value;
    const vol    = parseInt(document.getElementById('custom-volleys').value);
    const apv    = parseInt(document.getElementById('custom-arrows').value);
    if (!dist || !blason || !vol || !apv) return null;
    return { id:'libre', name:'Session libre', detail:`${dist}m · ${blason} · ${vol}×${apv} = ${vol*apv} flèches`,
      distance:parseInt(dist), blason, volleys:vol, apv, maxScore:vol*apv*10 };
  }
  const f = FFTA_FORMATS.find(x => x.id === selectedFormatId);
  return f ? { ...f, apv: f.apv } : null;
}

// ==========================================
// START SESSION
// ==========================================
function startSession() {
  const format = getSelectedFormat();
  if (!format) { alert('Veuillez sélectionner un format de tir.'); return; }

  const objectif = objectifEnabled ? {
    score: parseInt(document.getElementById('obj-score').value) || null,
    date:  document.getElementById('obj-date').value || null
  } : null;

  currentSession = { format, arc: profil.arc || null, objectif, volleys:[], totalScore:0, arrowCount:0, startDate:new Date().toISOString(), referencePhoto: null };
  logEvent('nouvelle_session', { mode: mode });
  if (typeof renderReferenceButton === 'function') renderReferenceButton();

  document.getElementById('session-format-name').textContent = format.name + (profil.arc ? ' — ' + profil.arc : '');
  document.getElementById('session-format-detail').textContent = format.detail;

  const barWrap = document.getElementById('objectif-bar-wrap');
  if (objectif && objectif.score) {
    barWrap.classList.add('visible');
    document.getElementById('obj-bar-label').textContent = `Objectif ${objectif.score}${format.maxScore ? ' / '+format.maxScore : ''}`;
    if (objectif.date) {
      const diff = Math.ceil((new Date(objectif.date) - new Date()) / 86400000);
      document.getElementById('objectif-deadline').textContent = diff > 0 ? `⏳ ${diff} jour${diff>1?'s':''} avant l'échéance` : '📅 Échéance atteinte';
    } else document.getElementById('objectif-deadline').textContent = '';
  } else barWrap.classList.remove('visible');

  // Pré-remplir Archer 1 depuis profil
  document.getElementById('archer1-name').value = profil.prenom || '';
  archer1Fleche = { ...(profil.fleche || {}) };
  archer2Fleche = JSON.parse(localStorage.getItem('archer2Fleche') || '{}');
  buildDuoFleche(1);
  buildDuoFleche(2);

  updateVolleyLabel();
  showScreen('session');
}

function updateVolleyLabel() {
  if (!currentSession) return;
  const total = currentSession.format.volleys;
  document.getElementById('volley-label').textContent = total ? `/ ${total} Vol.` : 'Volées';
}

// ==========================================
// FLECHE CONFIG (coq / latérales / encoche)
// ==========================================

// Structure : { coq: 'Rouge', lat: 'Blanc', enc: 'Noir' }

function buildFlecheChips(containerId, currentVal, target, key) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = COLORS.map(c => `
    <div class="fleche-chip${currentVal === c.name ? ' selected' : ''}" onclick="selectFlecheColor('${target}','${key}','${c.name}')">
      <div class="color-dot" style="background:${c.hex}"></div>${c.name}
    </div>`).join('');
}

function selectFlecheColor(target, key, colorName) {
  if (target === 'profil') {
    profil.fleche = Object.assign({}, profil.fleche||{}, {[key]: colorName});
    saveProfil();
    loadProfilFleche();
  } else {
    const idx = parseInt(target);
    if (idx === 1) archer1Fleche = Object.assign({}, archer1Fleche, {[key]: colorName});
    else archer2Fleche = Object.assign({}, archer2Fleche, {[key]: colorName});
    saveDuoProfiles();
    buildDuoFleche(idx);
  }
}

function renderFlechePreview(previewId, fleche) {
  const el = document.getElementById(previewId);
  if (!el) return;
  const { coq, lat1, lat2, enc } = fleche || {};
  if (!coq && !lat1 && !lat2 && !enc) { el.innerHTML = '<span class="fleche-preview-empty">Configurez vos plumes</span>'; return; }
  const parts = [];
  if (coq)  { const c = COLORS.find(x => x.name === coq);  parts.push(`<div class="fleche-preview-item"><div class="fleche-preview-dot" style="background:${c?c.hex:'#888'}"></div>Coq: ${coq}</div>`); }
  if (lat1) { const c = COLORS.find(x => x.name === lat1); parts.push(`<div class="fleche-preview-item"><div class="fleche-preview-dot" style="background:${c?c.hex:'#888'}"></div>Lat.G: ${lat1}</div>`); }
  if (lat2) { const c = COLORS.find(x => x.name === lat2); parts.push(`<div class="fleche-preview-item"><div class="fleche-preview-dot" style="background:${c?c.hex:'#888'}"></div>Lat.D: ${lat2}</div>`); }
  if (enc)  { const c = COLORS.find(x => x.name === enc);  parts.push(`<div class="fleche-preview-item"><div class="fleche-preview-dot" style="background:${c?c.hex:'#888'}"></div>Encoche: ${enc}</div>`); }
  el.innerHTML = parts.join('<span class="fleche-preview-sep">·</span>');
}

function describeFleche(fleche) {
  if (!fleche) return 'inconnue';
  const parts = [];
  if (fleche.coq)  parts.push(`plume coq ${fleche.coq}`);
  if (fleche.lat1) parts.push(`latérale gauche ${fleche.lat1}`);
  if (fleche.lat2) parts.push(`latérale droite ${fleche.lat2}`);
  if (fleche.enc)  parts.push(`encoche ${fleche.enc}`);
  return parts.length ? parts.join(', ') : 'inconnue';
}

// ── PROFIL FLECHE ──
function loadProfilFleche() {
  const f = profil.fleche || {};
  buildFlecheChips('profil-coq-chips',  f.coq,  'profil', 'coq');
  buildFlecheChips('profil-lat1-chips', f.lat1, 'profil', 'lat1');
  buildFlecheChips('profil-lat2-chips', f.lat2, 'profil', 'lat2');
  buildFlecheChips('profil-enc-chips',  f.enc,  'profil', 'enc');
  renderFlechePreview('profil-fleche-preview', profil.fleche);
}

// ── DUO FLECHE ──

function buildDuoFleche(archerIdx) {
  const f = archerIdx === 1 ? archer1Fleche : archer2Fleche;
  const prefix = archerIdx === 1 ? 'a1' : 'a2';
  const t = String(archerIdx);
  buildFlecheChips(`${prefix}-coq-chips`,  f.coq,  t, 'coq');
  buildFlecheChips(`${prefix}-lat1-chips`, f.lat1, t, 'lat1');
  buildFlecheChips(`${prefix}-lat2-chips`, f.lat2, t, 'lat2');
  buildFlecheChips(`${prefix}-enc-chips`,  f.enc,  t, 'enc');
  renderFlechePreview(`preview${archerIdx}`, archerIdx === 1 ? archer1Fleche : archer2Fleche);
}

function saveDuoProfiles() {
  localStorage.setItem('archer2Fleche', JSON.stringify(archer2Fleche));
  localStorage.setItem('archer2Name', document.getElementById('archer2-name').value);
}

function setMode(m) {
  mode = m;
  document.getElementById('btn-mode-solo').classList.toggle('active', m === 'solo');
  document.getElementById('btn-mode-duo').classList.toggle('active', m === 'duo');
  document.getElementById('archers-config').classList.toggle('visible', m === 'duo');
  document.getElementById('result-card').classList.remove('visible');
  document.getElementById('result-duo').classList.remove('visible');
}

// ==========================================
// FILE / DRAG
// ==========================================
function handleDragOver(e) { e.preventDefault(); document.getElementById('upload-zone').classList.add('dragover'); }
function handleDragLeave()  { document.getElementById('upload-zone').classList.remove('dragover'); }
function handleDrop(e) {
  e.preventDefault(); document.getElementById('upload-zone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) processFile(file);
}
function handleFile(e) { const file = e.target.files[0]; if (file) processFile(file); }

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function processFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    // Compression via canvas — max 1200px, qualité 0.82
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else       { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', 0.82);
      currentImageBase64 = compressed.split(',')[1];
      logEvent('photo_uploadee', { size_kb: Math.round(currentImageBase64.length * 0.75 / 1024) });
      document.getElementById('preview-img').src = compressed;
      document.getElementById('analyze-section').classList.add('visible');
      document.getElementById('result-card').classList.remove('visible');
      document.getElementById('result-duo').classList.remove('visible');
      document.getElementById('btn-analyze').disabled = false;
      document.getElementById('analyze-section').scrollIntoView({behavior:'smooth',block:'nearest'});
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

// ==========================================
// PHOTO DE RÉFÉRENCE DU BLASON — V4.6.5-dev
// ==========================================
async function captureReferencePhoto(file) {
  const btn = document.getElementById('btn-photo-reference');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Compression...'; }
  try {
    const dataUrl = await compressImageFile(file);
    const base64 = dataUrl.split(',')[1];
    currentSession.referencePhoto = {
      base64: base64,
      ts: new Date().toISOString(),
      captured: true
    };
    autoSaveSession();
    logEvent('reference_blason_capturee', {
      ts: currentSession.referencePhoto.ts,
      size_kb: Math.round(base64.length * 0.75 / 1024)
    });
    showReferenceCaptured();
  } catch(e) {
    console.error('Reference photo error:', e);
    alert('Erreur capture référence : ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📸 Photo du blason (référence)'; }
  }
}

function showReferenceCaptured() {
  const wrapper = document.getElementById('reference-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = `
    <div style="
      padding: 12px;
      border: 1px solid rgba(46,204,113,0.4);
      background: rgba(46,204,113,0.05);
      border-radius: 8px;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text);
    ">
      ✅ Photo de référence enregistrée
      <button onclick="resetReferencePhoto()" style="
        margin-left: 8px;
        background: transparent;
        border: none;
        color: var(--gold);
        cursor: pointer;
        text-decoration: underline;
        font-size: 0.8rem;
      ">refaire</button>
    </div>
  `;
}

function resetReferencePhoto() {
  currentSession.referencePhoto = null;
  autoSaveSession();
  logEvent('reference_blason_supprimee');
  renderReferenceButton();
}

function renderReferenceButton() {
  const wrapper = document.getElementById('reference-wrapper');
  if (!wrapper) return;
  if (currentSession?.referencePhoto?.captured) {
    showReferenceCaptured();
    return;
  }
  wrapper.innerHTML = `
    <label for="input-photo-reference" id="btn-photo-reference" style="
      display: block;
      width: 100%;
      background: transparent;
      border: 1px dashed rgba(201,168,76,0.4);
      color: var(--gold);
      padding: 14px 20px;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
      text-align: center;
      cursor: pointer;
    ">📸 Photo du blason (référence)</label>
    <input type="file" id="input-photo-reference" accept="image/*" capture="environment"
           style="display:none" onchange="if(this.files[0]) captureReferencePhoto(this.files[0])">
    <p style="text-align:center; font-size:0.7rem; color:var(--text-muted); margin-top:6px; font-style:italic;">
      Optionnel — facilite l'analyse des volées (branche dev)
    </p>
  `;
}

// ==========================================
// OFFLINE QUEUE
// ==========================================
const QUEUE_KEY = 'archerAI_queue';
function getQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]'); } catch { return []; } }
function saveQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }

function addToQueue(imageBase64) {
  const q = getQueue();
  q.push({ imageBase64, mode, archer1Fleche, archer2Fleche,
    archer1Name: document.getElementById('archer1-name').value,
    archer2Name: document.getElementById('archer2-name').value, timestamp:Date.now() });
  saveQueue(q); updateQueueBanner();
}

function updateQueueBanner() {
  const q = getQueue();
  let banner = document.getElementById('queue-banner');
  if (!q.length) { if (banner) banner.remove(); return; }
  if (!banner) { banner = document.createElement('div'); banner.id = 'queue-banner'; banner.onclick = processQueue; document.body.appendChild(banner); }
  banner.innerHTML = `📶 ${q.length} photo(s) en attente — Analyser`;
}

async function processQueue() {
  const q = getQueue(); if (!q.length) return;
  const banner = document.getElementById('queue-banner');
  if (banner) banner.innerHTML = '⏳ Analyse en cours...';
  let done = 0;
  for (const item of q) {
    try { const r = await callAPI(item.imageBase64, item.mode, item.archer1Fleche||{}, item.archer2Fleche||{}, item.archer1Name, item.archer2Name); if (r) done++; }
    catch { break; }
  }
  saveQueue(done === q.length ? [] : q.slice(done));
  updateQueueBanner();
}

// ==========================================
// API
// ==========================================
async function callAPI(imageBase64, currentMode, a1fleche, a2fleche, a1name, a2name) {
  if (!currentSession) return null; // pas de session active : la queue reste en attente
  const isDuo = currentMode === 'duo';
  const a1 = a1name || 'Archer 1', a2 = a2name || 'Archer 2';
  const desc1 = describeFleche(a1fleche);
  const desc2 = describeFleche(a2fleche);

  const t0 = Date.now();
  const response = await fetch("/api/analyze", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ imageBase64, mode: isDuo ? 'duo' : 'solo', a1, a2, desc1, desc2 })
  });
  const durationMs = Date.now() - t0;
  const result = await response.json();
  if (result.error) return null;

  const apv = currentSession.format?.apv;
  if (isDuo && result.archer1) {
    displayDuoResult(result);
    currentSession.volleys.push({ duo:true, archer1:result.archer1, archer2:result.archer2, photo:imageBase64 });
    currentSession.totalScore += (result.archer1.total||0) + (result.archer2.total||0);
    currentSession.arrowCount += apv ? apv * 2 : (result.archer1.count||0) + (result.archer2.count||0);
  } else if (result.arrows) {
    displayResult(result);
    currentSession.volleys.push({ ...result, photo:imageBase64 });
    currentSession.totalScore += result.total || 0;
    currentSession.arrowCount += apv || result.count || 0;
  }
  updateSessionBar(); updateHistory();
  autoSaveSession();
  const volleeIndex = currentSession.volleys.length;
  logVollee(volleeIndex, imageBase64, result, durationMs);
  logEvent('session_state', { total: currentSession.totalScore, volleys: volleeIndex, arrows: currentSession.arrowCount });
  // Relance auto du timer si mode boucle activé
  if (timerState.loop && timerState.lastDuration) {
    setTimeout(() => startTimer(timerState.lastDuration), 1500);
  }
  return result;
}

async function analyzeImage() {
  if (!currentImageBase64) return;
  if (mode === 'duo' && (!archer1Fleche.coq && !archer1Fleche.lat1) && (!archer2Fleche.coq && !archer2Fleche.lat1)) { alert('⚠️ Configurez les plumes des 2 archers !'); return; }
  const btn = document.getElementById('btn-analyze');
  const overlay = document.getElementById('preview-overlay');
  btn.disabled = true; overlay.classList.add('analyzing');
  if (!navigator.onLine) {
    overlay.classList.remove('analyzing'); btn.disabled = false;
    addToQueue(currentImageBase64);
    document.getElementById('analyze-section').classList.remove('visible');
    document.getElementById('file-input').value = ''; currentImageBase64 = null;
    alert('📶 Pas de connexion — photo mise en file d\'attente !'); return;
  }
  try {
    const a1 = document.getElementById('archer1-name').value;
    const a2 = document.getElementById('archer2-name').value;
    await callAPI(currentImageBase64, mode, archer1Fleche, archer2Fleche, a1, a2);
    overlay.classList.remove('analyzing');
  } catch(err) {
    overlay.classList.remove('analyzing'); btn.disabled = false;
    if (!navigator.onLine) { addToQueue(currentImageBase64); alert('📶 Connexion perdue — photo mise en file d\'attente !'); }
    else alert('Erreur lors de l\'analyse.');
  }
  document.getElementById('analyze-section').classList.remove('visible');
  document.getElementById('preview-overlay').classList.remove('analyzing');
  currentImageBase64 = null; document.getElementById('file-input').value = '';
}

// ==========================================
// BADGES + DISPLAY
// ==========================================
function getBadgeClass(s) {
  if (s === 'X' || s === 10) return 'badge-x';
  if (s === 9) return 'badge-10'; if (s === 8||s === 7) return 'badge-8';
  if (s === 6||s === 5) return 'badge-6'; if (s === 4||s === 3) return 'badge-4';
  if (s === 2||s === 1) return 'badge-low'; return 'badge-miss';
}

function arrowsHtml(arrows, prefix, gridId) {
  return (arrows||[]).map((s,i) => `
    <div class="arrow-score">
      <div class="arrow-badge ${getBadgeClass(s)} editable" onclick="editArrow('${gridId}',${i},'${s}')" title="Corriger">${s}</div>
      <div class="arrow-label">${prefix}${i+1}</div>
    </div>`).join('');
}

function editArrow(gridId, idx, currentVal) {
  const values = ['X','10','9','8','7','6','5','4','3','2','1','M'];
  const val = prompt(`Corriger la flèche ${idx+1} (valeur actuelle: ${currentVal})`, currentVal);
  if (val === null) return;
  const clean = val.trim().toUpperCase();
  if (!values.includes(clean)) { alert('Valeur invalide. Utilisez : X, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1 ou M'); return; }
  const parsed = clean === 'M' ? 'M' : (clean === 'X' ? 'X' : parseInt(clean));

  // Trouver la volée correspondante (dernière volée affichée)
  const lastIdx = currentSession.volleys.length - 1;
  if (lastIdx < 0) return;
  const volley = currentSession.volleys[lastIdx];

  if (gridId === 'arrows-grid') {
    const old = volley.arrows[idx];
    const oldVal = old === 'M' ? 0 : (old === 'X' ? 10 : parseInt(old));
    const newVal = parsed === 'M' ? 0 : (parsed === 'X' ? 10 : parseInt(parsed));
    volley.arrows[idx] = parsed;
    volley.total = volley.total - oldVal + newVal;
    currentSession.totalScore = currentSession.totalScore - oldVal + newVal;
    document.getElementById('arrows-grid').innerHTML = arrowsHtml(volley.arrows, 'F', 'arrows-grid');
    document.getElementById('result-total-value').textContent = volley.total;
  } else if (gridId === 'arrows-grid-1') {
    const old = volley.archer1.arrows[idx];
    const oldVal = old === 'M' ? 0 : (old === 'X' ? 10 : parseInt(old));
    const newVal = parsed === 'M' ? 0 : (parsed === 'X' ? 10 : parseInt(parsed));
    volley.archer1.arrows[idx] = parsed;
    volley.archer1.total = volley.archer1.total - oldVal + newVal;
    currentSession.totalScore = currentSession.totalScore - oldVal + newVal;
    document.getElementById('arrows-grid-1').innerHTML = arrowsHtml(volley.archer1.arrows, 'F', 'arrows-grid-1');
    document.getElementById('total-value-1').textContent = volley.archer1.total;
  } else if (gridId === 'arrows-grid-2') {
    const old = volley.archer2.arrows[idx];
    const oldVal = old === 'M' ? 0 : (old === 'X' ? 10 : parseInt(old));
    const newVal = parsed === 'M' ? 0 : (parsed === 'X' ? 10 : parseInt(parsed));
    volley.archer2.arrows[idx] = parsed;
    volley.archer2.total = volley.archer2.total - oldVal + newVal;
    currentSession.totalScore = currentSession.totalScore - oldVal + newVal;
    document.getElementById('arrows-grid-2').innerHTML = arrowsHtml(volley.archer2.arrows, 'F', 'arrows-grid-2');
    document.getElementById('total-value-2').textContent = volley.archer2.total;
  }

  updateSessionBar();
  updateHistory();
  autoSaveSession();
}

function displayResult(result) {
  document.getElementById('result-volley-label').textContent = `Volée ${currentSession.volleys.length + 1}`;
  document.getElementById('arrows-grid').innerHTML = arrowsHtml(result.arrows, 'F', 'arrows-grid');
  document.getElementById('result-total-value').textContent = result.total;
  document.getElementById('result-analysis').textContent = result.analysis || '';
  const card = document.getElementById('result-card');
  card.classList.add('visible');
  card.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function displayDuoResult(result) {
  document.getElementById('duo-name-1').textContent = result.archer1.name || 'Archer 1';
  document.getElementById('arrows-grid-1').innerHTML = arrowsHtml(result.archer1.arrows, 'F', 'arrows-grid-1');
  document.getElementById('total-value-1').textContent = result.archer1.total || 0;
  document.getElementById('analysis-1').textContent = result.archer1.analysis || '';
  document.getElementById('duo-name-2').textContent = result.archer2.name || 'Archer 2';
  document.getElementById('arrows-grid-2').innerHTML = arrowsHtml(result.archer2.arrows, 'F', 'arrows-grid-2');
  document.getElementById('total-value-2').textContent = result.archer2.total || 0;
  document.getElementById('analysis-2').textContent = result.archer2.analysis || '';
  const f1 = archer1Fleche || {}, f2 = archer2Fleche || {};
  document.getElementById('duo-colors-1').innerHTML = [f1.coq, f1.lat1, f1.lat2, f1.enc].filter(Boolean).map(name => {
    const c = COLORS.find(x => x.name === name);
    return `<div class="duo-color-dot" style="background:${c?c.hex:'#888'}"></div>`;
  }).join('');
  document.getElementById('duo-colors-2').innerHTML = [f2.coq, f2.lat1, f2.lat2, f2.enc].filter(Boolean).map(name => {
    const c = COLORS.find(x => x.name === name);
    return `<div class="duo-color-dot" style="background:${c?c.hex:'#888'}"></div>`;
  }).join('');
  const duo = document.getElementById('result-duo');
  duo.classList.add('visible');
  duo.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ==========================================
// SESSION BAR
// ==========================================
function updateSessionBar() {
  if (!currentSession) return;
  const s = currentSession;
  document.getElementById('total-score').textContent = s.totalScore;
  document.getElementById('volley-count').textContent = s.volleys.length;
  document.getElementById('arrow-count').textContent = s.arrowCount;
  document.getElementById('avg-per-arrow').textContent = s.arrowCount > 0 ? (s.totalScore/s.arrowCount).toFixed(1) : '—';
  if (s.objectif && s.objectif.score) {
    const pct = Math.min(100, Math.round((s.totalScore / s.objectif.score) * 100));
    const fill = document.getElementById('objectif-bar-fill');
    fill.style.width = pct + '%';
    document.getElementById('obj-bar-pct').textContent = pct + '%';
    const vol = s.volleys.length, tot = s.format.volleys;
    if (tot && vol > 0) {
      const exp = Math.round((vol/tot)*100);
      fill.classList.toggle('on-track', pct >= exp);
      fill.classList.toggle('off-track', pct < exp - 10);
    }
  }
  updateVolleyLabel();
}

function updateHistory() {
  const container = document.getElementById('history-container');
  if (!currentSession || !currentSession.volleys.length) {
    container.innerHTML = '<div class="history-empty">Aucune volée encore — prenez votre première photo !</div>'; return;
  }
  container.innerHTML = '<div class="history-list">' +
    [...currentSession.volleys].reverse().map((v,ri) => {
      const i = currentSession.volleys.length - ri;
      if (v.duo) return `<div class="history-item"><div class="history-left"><div class="history-volley">VOLÉE ${i}</div><div style="font-size:0.76rem;color:var(--text-muted)">${v.archer1.name}: ${v.archer1.total}pts &nbsp;|&nbsp; ${v.archer2.name}: ${v.archer2.total}pts</div></div><div class="history-score">${(v.archer1.total||0)+(v.archer2.total||0)}</div></div>`;
      return `<div class="history-item"><div class="history-left"><div class="history-volley">VOLÉE ${i}</div><div class="history-arrows">${(v.arrows||[]).map(s=>`<div class="mini-badge ${getBadgeClass(s)}">${s}</div>`).join('')}</div></div><div class="history-score">${v.total}</div></div>`;
    }).join('') + '</div>';
}

// ==========================================
// END SESSION
// ==========================================
function endSession() {
  if (typeof cancelTimer === 'function') cancelTimer();
  if (!currentSession || !currentSession.volleys.length) { alert('Aucune volée enregistrée !'); return; }
  const s = currentSession;
  logEvent('session_terminee', { total: s.totalScore, volleys: s.volleys.length });
  const total = s.totalScore;
  const avg = s.arrowCount > 0 ? (total/s.arrowCount).toFixed(1) : 0;
  document.getElementById('modal-total').textContent = total + (s.format.maxScore ? ' / '+s.format.maxScore : '');
  document.getElementById('modal-volleys').textContent = s.volleys.length;
  document.getElementById('modal-arrows').textContent = s.arrowCount;
  document.getElementById('modal-avg').textContent = avg;
  document.getElementById('modal-icon').textContent = '🏆';
  const sessions = getSavedSessions();
  const same = sessions.filter(ss => ss.format.id === s.format.id);
  const compEl = document.getElementById('modal-comparison');
  if (!same.length) { compEl.textContent = '🏹 Première session sur ce format !'; compEl.className = 'modal-comparison comparison-first'; }
  else {
    const diff = total - same[0].totalScore;
    if (diff > 0)      { compEl.textContent = `🎉 +${diff} pts vs dernière session !`; compEl.className = 'modal-comparison comparison-better'; document.getElementById('modal-icon').textContent = '🏆'; }
    else if (diff < 0) { compEl.textContent = `💪 ${Math.abs(diff)} pts de moins — la prochaine sera meilleure !`; compEl.className = 'modal-comparison comparison-worse'; document.getElementById('modal-icon').textContent = '🎯'; }
    else               { compEl.textContent = '👌 Même score — régularité parfaite !'; compEl.className = 'modal-comparison comparison-first'; }
  }
  const objEl = document.getElementById('modal-objectif');
  if (s.objectif && s.objectif.score) {
    objEl.style.display = 'block';
    if (total >= s.objectif.score) { objEl.textContent = `✅ Objectif ${s.objectif.score} atteint !`; objEl.className = 'modal-objectif ok'; }
    else { objEl.textContent = `❌ Objectif ${s.objectif.score} — il manque ${s.objectif.score - total} pts`; objEl.className = 'modal-objectif nok'; }
  } else objEl.style.display = 'none';
  const volleysClean = s.volleys.map(v => {
    const { photo, ...rest } = v;
    if (rest.archer1) { const { photo: p1, ...a1 } = rest.archer1; rest.archer1 = a1; }
    if (rest.archer2) { const { photo: p2, ...a2 } = rest.archer2; rest.archer2 = a2; }
    return rest;
  });
  saveSession({ ...s, volleys: volleysClean, totalScore:total, endDate:new Date().toISOString() });
  clearSessionDraft();
  // Afficher le bouton photos si des photos existent
  const hasPhotos = s.volleys.some(v => v.photo || (v.archer1 && v.archer1.photo));
  const btnPhotos = document.getElementById('btn-download-photos');
  if (btnPhotos) btnPhotos.style.display = hasPhotos ? 'block' : 'none';
  document.getElementById('modal-overlay').classList.add('visible');
}

function restartSession() {
  const { format, arc, objectif } = currentSession;
  currentSession = { format, arc, objectif, volleys:[], totalScore:0, arrowCount:0, startDate:new Date().toISOString(), referencePhoto: null };
  logEvent('nouvelle_session', { mode: mode });
  if (typeof renderReferenceButton === 'function') renderReferenceButton();
  clearSessionDraft();
  updateSessionBar(); updateHistory();
  document.getElementById('result-card').classList.remove('visible');
  document.getElementById('result-duo').classList.remove('visible');
  document.getElementById('analyze-section').classList.remove('visible');
  document.getElementById('modal-overlay').classList.remove('visible');
}

function goHome() {
  currentSession = null;
  document.getElementById('modal-overlay').classList.remove('visible');
  showScreen('home');
}

async function downloadSessionPhotos() {
  if (!currentSession) return;
  const volleys = currentSession.volleys.filter(v => v.photo);
  if (!volleys.length) return;

  const btn = document.getElementById('btn-download-photos');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Préparation...'; }

  try {
    const zip = new JSZip();
    const date = new Date().toISOString().slice(0,10);
    const folder = zip.folder(`ArcherAI_${date}`);

    volleys.forEach((v, i) => {
      const score = v.total || (v.archer1 ? `${v.archer1.total}-${v.archer2.total}` : '');
      const filename = `volee-${i+1}_${score}pts.jpg`;
      folder.file(filename, v.photo, { base64: true });
    });

    const blob = await zip.generateAsync({ type:'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ArcherAI_${date}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    if (btn) { btn.textContent = '✅ Téléchargé !'; }
    setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = '📥 Télécharger les photos'; } }, 3000);
  } catch(e) {
    console.error(e);
    if (btn) { btn.disabled = false; btn.textContent = '📥 Télécharger les photos'; }
    alert('Erreur lors de la création du zip.');
  }
}

// ==========================================
// AUTO-SAVE SESSION EN COURS
// ==========================================
const SESSION_DRAFT_KEY = 'archerAI_session_draft';

function autoSaveSession() {
  if (!currentSession) return;
  currentSession.lastActivityAt = new Date().toISOString();
  localStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(currentSession));
}

function clearSessionDraft() {
  localStorage.removeItem(SESSION_DRAFT_KEY);
}

// ── Seuil de restauration ──
const SEUIL_MODAL = 4 * 60 * 60 * 1000;  // < 4h : restauration + toast | > 4h : modal de choix

function restoreSessionIfExists() {
  try {
    const draft = localStorage.getItem(SESSION_DRAFT_KEY);
    if (!draft) return false;
    const s = JSON.parse(draft);
    if (!s || !s.volleys || s.volleys.length === 0) return false;
    const ref = s.lastActivityAt || s.startDate;
    const age = Date.now() - new Date(ref).getTime();
    if (age < SEUIL_MODAL) {
      _applyRestoredSession(s);
      _showRestoreToast(s);
      logEvent('session_restauree', { age_minutes: Math.round(age / 60000) });
    } else {
      _showRestoreModal(s, age);
      logEvent('session_restauree', { age_minutes: Math.round(age / 60000) });
    }
    return true;
  } catch { return false; }
}

function _showRestoreModal(s, age) {
  const heures = Math.floor(age / 3600000);
  const nb = s.volleys.length;
  document.getElementById('restore-session-summary').textContent =
    `${nb} volée${nb>1?'s':''} · ${s.totalScore} pts · il y a ~${heures}h`;
  window._pendingRestore = s;
  document.getElementById('restore-modal-overlay').style.display = 'flex';
}

function confirmRestoreSession() {
  if (window._pendingRestore) {
    _applyRestoredSession(window._pendingRestore);
    window._pendingRestore = null;
  }
  document.getElementById('restore-modal-overlay').style.display = 'none';
}

function confirmDiscardSession() {
  window._pendingRestore = null;
  clearSessionDraft();
  document.getElementById('restore-modal-overlay').style.display = 'none';
}

function _applyRestoredSession(s) {
  currentSession = s;
  document.getElementById('session-format-name').textContent = s.format.name + (s.arc ? ' — ' + s.arc : '');
  document.getElementById('session-format-detail').textContent = s.format.detail;
  const barWrap = document.getElementById('objectif-bar-wrap');
  if (s.objectif && s.objectif.score) {
    barWrap.classList.add('visible');
    document.getElementById('obj-bar-label').textContent = `Objectif ${s.objectif.score}${s.format.maxScore ? ' / '+s.format.maxScore : ''}`;
  } else { barWrap.classList.remove('visible'); }
  updateSessionBar(); updateHistory();
  if (typeof renderReferenceButton === 'function') renderReferenceButton();
  showScreen('session');
}

function _showRestoreToast(s) {
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;top:16px;left:50%;transform:translateX(-50%);
    background:#1E1E1E;border:1px solid #C9A84C;border-radius:12px;
    padding:12px 20px;font-size:0.85rem;color:#E8E0D0;z-index:200;
    text-align:center;max-width:320px;width:calc(100% - 32px);
    box-shadow:0 4px 24px rgba(0,0,0,0.5);`;
  const nb = s.volleys.length;
  toast.innerHTML = `🏹 Session retrouvée — <span style="color:#C9A84C;font-weight:500">${nb} volée${nb>1?'s':''}, ${s.totalScore} pts</span>. On continue !`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}


// ==========================================
// PERSISTENCE
// ==========================================
const SESSIONS_KEY = 'archerAI_sessions';
function getSavedSessions() { try { return JSON.parse(localStorage.getItem(SESSIONS_KEY)||'[]'); } catch { return []; } }
function saveSession(s) { const all = getSavedSessions(); all.unshift(s); localStorage.setItem(SESSIONS_KEY, JSON.stringify(all)); }
function deleteSession(i) {
  if (!confirm('Supprimer cette session ?')) return;
  const all = getSavedSessions(); all.splice(i,1); localStorage.setItem(SESSIONS_KEY, JSON.stringify(all)); renderHistoryScreen();
}

// ==========================================
// HISTORIQUE SCREEN
// ==========================================
function renderHistoryScreen() {
  const sessions = getSavedSessions();
  const container = document.getElementById('history-sessions-list');
  const filtersEl = document.getElementById('history-filters');
  if (!sessions.length) { filtersEl.innerHTML = ''; container.innerHTML = '<div class="history-empty">Aucune session sauvegardée.</div>'; return; }
  const formatIds = [...new Set(sessions.map(s => s.format.id))];
  const active = filtersEl.dataset.active || 'all';
  filtersEl.innerHTML = `<div class="filter-chip ${active==='all'?'active':''}" onclick="setHistoryFilter('all')">Tout</div>` +
    formatIds.map(id => { const f = sessions.find(s => s.format.id===id).format; return `<div class="filter-chip ${active===id?'active':''}" onclick="setHistoryFilter('${id}')">${f.name}</div>`; }).join('');
  const filtered = active === 'all' ? sessions : sessions.filter(s => s.format.id === active);
  if (!filtered.length) { container.innerHTML = '<div class="history-empty">Aucune session pour ce format.</div>'; return; }
  container.innerHTML = filtered.map((s,i) => {
    const pct = s.format.maxScore ? Math.round((s.totalScore/s.format.maxScore)*100) : null;
    const objTag = s.objectif && s.objectif.score
      ? s.totalScore >= s.objectif.score
        ? `<div class="objectif-tag achieved">✅ Objectif ${s.objectif.score} atteint</div>`
        : `<div class="objectif-tag missed">❌ Objectif ${s.objectif.score} — manque ${s.objectif.score-s.totalScore} pts</div>`
      : '';
    const bar = pct !== null ? `<div class="progress-mini"><div class="progress-mini-labels"><span>${s.totalScore} pts</span><span>${s.format.maxScore} max</span></div><div class="progress-mini-track"><div class="progress-mini-fill" style="width:${pct}%"></div></div></div>` : '';
    const avg = s.arrowCount > 0 ? (s.totalScore/s.arrowCount).toFixed(1) : '—';
    // Détail des volées si disponible
    const hasVolleys = s.volleys && s.volleys.length > 0 && s.volleys[0].arrows;
    const volleysHtml = hasVolleys ? `
      <div class="history-volleys" id="volleys-${i}" style="display:none">
        <div style="height:1px;background:var(--border);margin:10px 0"></div>
        ${s.volleys.map((v,vi) => `
          <div class="history-volley-row">
            <span class="history-volley-label">V${vi+1}</span>
            <div class="history-volley-arrows">${(v.arrows||[]).map(a => `<div class="mini-badge ${getBadgeClass(a)}">${a}</div>`).join('')}</div>
            <span class="history-volley-total">${v.total||0}</span>
          </div>`).join('')}
      </div>` : '';
    const chevron = hasVolleys ? `<span class="history-chevron" id="chev-${i}">▼</span>` : '';
    return `<div class="session-card ${hasVolleys?'session-card-expandable':''}" ${hasVolleys?`onclick="toggleHistoryDetail(${i})"`:''}> 
      <div class="session-card-header">
        <div>
          <div class="session-card-format">${s.format.name}${s.arc?' — '+s.arc:''} ${chevron}</div>
          <div class="session-card-meta">${formatDate(s.endDate||s.startDate)} · ${s.format.detail}</div>
          ${objTag}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end">
          <div class="session-card-score">${s.totalScore}</div>
          <div class="session-card-max">${s.format.maxScore?'/ '+s.format.maxScore:''}</div>
          <button class="btn-delete-session" onclick="event.stopPropagation();deleteSession(${i})">🗑</button>
        </div>
      </div>
      ${bar}
      <div class="session-card-stats">
        <div class="mini-stat">Volées: <span>${s.volleys.length}</span></div>
        <div class="mini-stat">Flèches: <span>${s.arrowCount}</span></div>
        <div class="mini-stat">Moy.: <span>${avg}</span></div>
        ${pct!==null?`<div class="mini-stat">Score: <span>${pct}%</span></div>`:''}
      </div>
      ${volleysHtml}
    </div>`;
  }).join('');
}

function toggleHistoryDetail(i) {
  const el = document.getElementById(`volleys-${i}`);
  const chev = document.getElementById(`chev-${i}`);
  if (!el) return;
  const open = el.style.display === 'block';
  el.style.display = open ? 'none' : 'block';
  if (chev) chev.textContent = open ? '▼' : '▲';
}

function setHistoryFilter(id) { document.getElementById('history-filters').dataset.active = id; renderHistoryScreen(); }

// ==========================================
// UTILS
// ==========================================
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
}

// ==========================================
// ADMIN — appui long sur le logo (3 sec)
// ==========================================
let adminPressTimer = null;

document.getElementById('logo-admin').addEventListener('touchstart', () => {
  adminPressTimer = setTimeout(showAdminPanel, 3000);
}, { passive: true });

document.getElementById('logo-admin').addEventListener('touchend', () => {
  clearTimeout(adminPressTimer);
});

document.getElementById('logo-admin').addEventListener('mousedown', () => {
  adminPressTimer = setTimeout(showAdminPanel, 3000);
});

document.getElementById('logo-admin').addEventListener('mouseup', () => {
  clearTimeout(adminPressTimer);
});

async function showAdminPanel() {
  const panel = document.getElementById('admin-panel');
  const countEl = document.getElementById('admin-count');
  panel.style.display = 'block';
  countEl.textContent = '…';
  try {
    const r = await fetch('/api/analyze?stats=1');
    const d = await r.json();
    countEl.textContent = d.total_analyses ?? '—';
  } catch {
    countEl.textContent = '—';
  }
}

// ==========================================
// TIMER COMPÉTITION
// ==========================================
let timerState = { interval:null, phase:null, remaining:0, ac:null, loop:false, lastDuration:120 };

function toggleTimerLoop() {
  timerState.loop = !timerState.loop;
  const btn = document.getElementById('timer-loop-btn');
  if (btn) btn.classList.toggle('active', timerState.loop);
}

function startTimer(durationSec) {
  cancelTimer();
  timerState.phase = 'prep';
  timerState.remaining = 10; // 10 secondes de préparation
  timerState._duration = durationSec;
  timerState.lastDuration = durationSec;
  document.getElementById('timer-controls').style.display = 'none';
  document.getElementById('timer-display').style.display = 'block';
  _playBeep(600, 0.15);
  _renderTimer();
  timerState.interval = setInterval(_tickTimer, 1000);
}

function cancelTimer() {
  if (timerState.interval) clearInterval(timerState.interval);
  timerState.interval = null; timerState.phase = null;
  const ctrl = document.getElementById('timer-controls');
  const disp = document.getElementById('timer-display');
  if (ctrl) ctrl.style.display = 'flex';
  if (disp) disp.style.display = 'none';
}

function _tickTimer() {
  timerState.remaining--;
  if (timerState.remaining < 0) {
    if (timerState.phase === 'prep') {
      // Fin de la préparation : début du tir
      timerState.phase = 'tir';
      timerState.remaining = timerState._duration;
      _playBeep(800, 0.2);
      _renderTimer();
    } else {
      // Fin du tir : buzzer 3 tons
      _playBuzzer();
      cancelTimer();
    }
    return;
  }
  _renderTimer();
}

function _renderTimer() {
  const phaseEl = document.getElementById('timer-phase');
  const timeEl  = document.getElementById('timer-time');
  if (!phaseEl || !timeEl) return;
  const m = Math.floor(timerState.remaining / 60);
  const s = timerState.remaining % 60;
  timeEl.textContent = `${m}:${s.toString().padStart(2,'0')}`;
  const warning = timerState.phase === 'tir' && timerState.remaining <= 30;
  phaseEl.textContent = timerState.phase === 'prep' ? 'PRÉPARATION' : 'TEMPS DE TIR';
  phaseEl.className = 'timer-phase ' + (warning ? 'warning' : timerState.phase);
  timeEl.className = 'timer-time' + (warning ? ' warning' : '');
}

function _audioCtx() {
  if (!timerState.ac) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) timerState.ac = new Ctx();
  }
  return timerState.ac;
}

function _playBeep(freq, duration) {
  const ac = _audioCtx(); if (!ac) return;
  const osc = ac.createOscillator(); const gain = ac.createGain();
  osc.type = 'square'; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(gain); gain.connect(ac.destination);
  osc.start(); osc.stop(ac.currentTime + duration);
}

function _playBuzzer() {
  // 3 tons descendants type signal de fin de tir
  [880, 660, 440].forEach((f, i) => setTimeout(() => _playBeep(f, 0.35), i * 400));
}

// ==========================================
// EXPORT / IMPORT DES DONNÉES
// ==========================================
function exportData() {
  try {
    const dump = {
      version: '4.6.3',
      exportDate: new Date().toISOString(),
      data: {
        archerProfil: JSON.parse(localStorage.getItem('archerProfil') || '{}'),
        archerAI_sessions: JSON.parse(localStorage.getItem('archerAI_sessions') || '[]'),
        archerAI_session_draft: JSON.parse(localStorage.getItem('archerAI_session_draft') || 'null'),
        archer2Fleche: JSON.parse(localStorage.getItem('archer2Fleche') || '{}'),
        archer2Name: localStorage.getItem('archer2Name') || '',
        archerAI_tri_draft: JSON.parse(localStorage.getItem('archerAI_tri_draft') || 'null')
      }
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ArcherAI_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch(e) {
    console.error(e);
    alert('Erreur lors de l\'export.');
  }
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dump = JSON.parse(e.target.result);
      if (!dump || !dump.data) throw new Error('Fichier invalide');
      const nbSessions = (dump.data.archerAI_sessions || []).length;
      const ok = confirm(`Importer ces données ?\n\n• Profil : ${dump.data.archerProfil?.prenom || '—'}\n• ${nbSessions} session${nbSessions>1?'s':''} dans l'historique\n• Date export : ${dump.exportDate?.slice(0,10) || '—'}\n\n⚠️ Cela écrasera vos données actuelles.`);
      if (!ok) { event.target.value = ''; return; }

      const d = dump.data;
      if (d.archerProfil)            localStorage.setItem('archerProfil', JSON.stringify(d.archerProfil));
      if (d.archerAI_sessions)       localStorage.setItem('archerAI_sessions', JSON.stringify(d.archerAI_sessions));
      if (d.archerAI_session_draft)  localStorage.setItem('archerAI_session_draft', JSON.stringify(d.archerAI_session_draft));
      else                           localStorage.removeItem('archerAI_session_draft');
      if (d.archer2Fleche)           localStorage.setItem('archer2Fleche', JSON.stringify(d.archer2Fleche));
      if (d.archer2Name)             localStorage.setItem('archer2Name', d.archer2Name);
      if (d.archerAI_tri_draft)      localStorage.setItem('archerAI_tri_draft', JSON.stringify(d.archerAI_tri_draft));

      alert('✅ Import réussi ! Rechargement de l\'app...');
      window.location.reload();
    } catch(err) {
      console.error(err);
      alert('❌ Fichier invalide ou corrompu.');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ==========================================
// INIT
// ==========================================
window.addEventListener('load', () => {
  profil = JSON.parse(localStorage.getItem('archerProfil') || '{}');
  archer2Fleche = JSON.parse(localStorage.getItem('archer2Fleche') || '{}');
  const a2input = document.getElementById('archer2-name');
  if (a2input) a2input.value = localStorage.getItem('archer2Name') || '';
  renderProfilCard();
  renderHomeRecap();
  updateQueueBanner();
  if (!restoreSessionIfExists()) restoreTriIfExists();
  window.addEventListener('online', () => { if (getQueue().length) processQueue(); });

  // ── SERVICE WORKER & BANDEAU DE MISE À JOUR ──
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(newSW);
          }
        });
      });
    });
  }
});

function showUpdateBanner(newSW) {
  const banner = document.getElementById('update-banner');
  if (banner) {
    banner.style.display = 'flex';
    banner.querySelector('button').onclick = () => {
      // Attendre l'activation effective du nouveau SW avant de recharger
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });
      newSW.postMessage('skipWaiting');
    };
  }
}
// ==========================================
// TRI DE FLÈCHES
// ==========================================
let triState = {
  nbFleches: 6,
  nbVolleys: 6,
  nbKeep: 6,
  currentVolley: 0,
  currentFleche: 0,
  data: []
};

let triMarkerPos = null;
let triZoom = 1;
let triPanX = 0, triPanY = 0;
let triPinchStartDist = null;
let triPinchStartZoom = 1;

function selectTriNb(n) {
  triState.nbFleches = n;
  if (triState.nbKeep > n) {
    triState.nbKeep = n;
    const keepInput = document.getElementById('tri-keep-input');
    if (keepInput) keepInput.value = n;
  }
}

function selectTriVol(n) {
  triState.nbVolleys = n;
}

const TRI_DRAFT_KEY = 'archerAI_tri_draft';

function autoSaveTri() {
  localStorage.setItem(TRI_DRAFT_KEY, JSON.stringify(triState));
}

function clearTriDraft() {
  localStorage.removeItem(TRI_DRAFT_KEY);
}

function restoreTriIfExists() {
  try {
    const draft = localStorage.getItem(TRI_DRAFT_KEY);
    if (!draft) return false;
    const s = JSON.parse(draft);
    if (!s || !s.data || s.data.every(d => d.length === 0)) return false;
    triState = s;
    updateTriView();
    showScreen('tri-saisie');
    initTriTouch();
    return true;
  } catch { return false; }
}

function selectTriKeep(n) {
  triState.nbKeep = n;
}

function startTri() {
  if (!triState.nbFleches || !triState.nbVolleys) { alert('Configurez le nombre de flèches et de volées !'); return; }
  if (triState.nbKeep > triState.nbFleches) { triState.nbKeep = triState.nbFleches; }
  triState.currentVolley = 0;
  triState.currentFleche = 0;
  triState.data = Array.from({length: triState.nbFleches}, () => []);
  triMarkerPos = null;
  triZoom = 1; triPanX = 0; triPanY = 0;
  updateTriView();
  showScreen('tri-saisie');
  initTriTouch();
}

function updateTriView() {
  const f = triState.currentFleche + 1;
  const v = triState.currentVolley + 1;
  document.getElementById('tri-progress-label').textContent = `Flèche ${f} — Volée ${v}`;
  const total = triState.nbFleches * triState.nbVolleys;
  const done = triState.currentVolley * triState.nbFleches + triState.currentFleche;
  document.getElementById('tri-progress-fill').style.width = (done / total * 100) + '%';
  resetTriMarker();
}

function resetTriMarker() {
  triMarkerPos = null;
  const marker = document.getElementById('tri-marker');
  marker.setAttribute('stroke', 'none');
  marker.setAttribute('fill', 'none');
  document.getElementById('tri-btn-validate').disabled = true;
}

function placeMarker(dx, dy) {
  triMarkerPos = {dx, dy};
  const cx = 200 + dx * 190;
  const cy = 200 + dy * 190;
  const marker = document.getElementById('tri-marker');
  marker.setAttribute('cx', cx);
  marker.setAttribute('cy', cy);
  marker.setAttribute('fill', '#FF4444');
  marker.setAttribute('stroke', 'white');
  marker.setAttribute('r', Math.max(5, 8 / triZoom));
  document.getElementById('tri-btn-validate').disabled = false;
}

function getZoneFromRadius(r) {
  if (r < 0.1) return 'X';
  if (r < 0.2) return 10;
  if (r < 0.3) return 9;
  if (r < 0.4) return 8;
  if (r < 0.5) return 7;
  if (r < 0.6) return 6;
  if (r < 0.7) return 5;
  if (r < 0.8) return 4;
  if (r < 0.9) return 3;
  if (r < 1.0) return 2;
  if (r < 1.1) return 1;
  return 'M';
}

function validateTriImpact() {
  if (!triMarkerPos) return;
  const r = Math.sqrt(triMarkerPos.dx ** 2 + triMarkerPos.dy ** 2);
  const zone = getZoneFromRadius(r);
  triState.data[triState.currentFleche].push({...triMarkerPos, zone});

  // Avancer
  triState.currentFleche++;
  if (triState.currentFleche >= triState.nbFleches) {
    triState.currentFleche = 0;
    triState.currentVolley++;
  }

  if (triState.currentVolley >= triState.nbVolleys) {
    clearTriDraft();
    showTriResults();
    return;
  }

  autoSaveTri();

  // Reset zoom entre chaque flèche
  triZoom = 1; triPanX = 0; triPanY = 0;
  applyTriTransform();
  updateTriView();
}

function endTri() {
  if (triState.data[0] && triState.data[0].length > 0) {
    showTriResults();
  } else {
    showScreen('home');
  }
}

// ── RÉSULTATS ──
function showTriResults() {
  clearTriDraft();
  showScreen('tri-results');
  const container = document.getElementById('tri-results-content');
  const keep = triState.nbKeep;

  const stats = triState.data.map((impacts, fi) => {
    if (!impacts.length) return { fi, meanDx:0, meanDy:0, disp:0, avgZone:0, count:0 };
    const meanDx = impacts.reduce((s,p) => s + p.dx, 0) / impacts.length;
    const meanDy = impacts.reduce((s,p) => s + p.dy, 0) / impacts.length;
    const disp = impacts.reduce((s,p) => s + Math.sqrt((p.dx-meanDx)**2 + (p.dy-meanDy)**2), 0) / impacts.length;
    const avgZone = impacts.reduce((s,p) => s + (p.zone === 'X' ? 10 : p.zone === 'M' ? 0 : p.zone), 0) / impacts.length;
    return { fi, meanDx, meanDy, disp, avgZone, count: impacts.length };
  });

  const ranked = [...stats].sort((a, b) => a.disp - b.disp);
  const rankMap = {}; ranked.forEach((s, i) => { rankMap[s.fi] = i + 1; });

  // Résumé en haut
  const headerHtml = `
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      <div style="flex:1;background:rgba(39,174,96,0.12);border:1px solid rgba(39,174,96,0.3);border-radius:12px;padding:12px 16px;text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#27AE60">${keep}</div>
        <div style="font-size:0.72rem;color:#27AE60;letter-spacing:1px">✅ À GARDER</div>
      </div>
      <div style="flex:1;background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);border-radius:12px;padding:12px 16px;text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#C0392B">${triState.nbFleches - keep}</div>
        <div style="font-size:0.72rem;color:#C0392B;letter-spacing:1px">❌ À ÉCARTER</div>
      </div>
    </div>`;

  // Grille mini-cibles
  let gridHtml = '<div class="tri-results-grid">';
  stats.forEach((s, fi) => {
    const rank = rankMap[fi];
    const isKeep = rank <= keep;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    const borderStyle = isKeep
      ? 'border-color:rgba(39,174,96,0.6);background:rgba(39,174,96,0.06)'
      : 'border-color:rgba(192,57,43,0.4);background:rgba(192,57,43,0.04)';
    const tag = isKeep
      ? `<div style="font-size:0.65rem;color:#27AE60;font-weight:600;margin-bottom:2px">✅ GARDER</div>`
      : `<div style="font-size:0.65rem;color:#C0392B;font-weight:600;margin-bottom:2px">❌ ÉCARTER</div>`;
    gridHtml += `<div class="tri-result-card" style="${borderStyle}">
      ${tag}
      <div class="tri-result-fleche">F${fi+1} ${medal}</div>
      ${miniTargetSVG(triState.data[fi], s.meanDx, s.meanDy)}
      <div class="tri-result-disp">Disp: ${(s.disp * 100).toFixed(1)}%</div>
      <div class="tri-result-disp">Moy: ${s.avgZone.toFixed(1)}</div>
    </div>`;
  });
  gridHtml += '</div>';

  // Classement
  let rankHtml = '<div class="tri-ranking"><div class="tri-ranking-title">CLASSEMENT</div>';
  ranked.forEach((s, i) => {
    const isKeep = i < keep;
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
    const tag = isKeep
      ? `<span style="font-size:0.7rem;color:#27AE60;margin-left:6px">✅</span>`
      : `<span style="font-size:0.7rem;color:#C0392B;margin-left:6px">❌</span>`;
    rankHtml += `<div class="tri-rank-row" style="${isKeep ? '' : 'opacity:0.6'}">
      <div class="tri-rank-pos ${i<3?'gold':''}">${medal}</div>
      <div class="tri-rank-name">Flèche ${s.fi+1} ${tag}</div>
      <div class="tri-rank-avg">${s.avgZone.toFixed(1)}</div>
      <div class="tri-rank-disp">disp: ${(s.disp*100).toFixed(1)}%</div>
    </div>`;
  });
  rankHtml += '</div>';

  container.innerHTML = `<p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:14px;">${triState.nbVolleys} volées · ${triState.nbFleches} flèches · garder les ${keep} meilleures</p>` + headerHtml + gridHtml + rankHtml;
}

function miniTargetSVG(impacts, meanDx, meanDy) {
  const S = 80; const C = S/2; const R = S/2 - 4;
  let dots = impacts.map(p => {
    const x = C + p.dx * R;
    const y = C + p.dy * R;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#FF4444" opacity="0.8"/>`;
  }).join('');
  const mx = C + meanDx * R, my = C + meanDy * R;
  const mean = impacts.length ? `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="4" fill="none" stroke="#FFD700" stroke-width="1.5"/>` : '';
  return `<svg viewBox="0 0 ${S} ${S}" width="72" height="72" style="display:block;margin:4px auto;">
    <circle cx="${C}" cy="${C}" r="${R}" fill="white" stroke="#ccc" stroke-width="0.5"/>
    <circle cx="${C}" cy="${C}" r="${R*0.8}" fill="white" stroke="#ccc" stroke-width="0.5"/>
    <circle cx="${C}" cy="${C}" r="${R*0.6}" fill="#1a1a1a"/>
    <circle cx="${C}" cy="${C}" r="${R*0.6}" fill="#3498DB"/>
    <circle cx="${C}" cy="${C}" r="${R*0.4}" fill="#C0392B"/>
    <circle cx="${C}" cy="${C}" r="${R*0.2}" fill="#FFD700"/>
    ${dots}${mean}
  </svg>`;
}

// ── TOUCH / ZOOM ──
function initTriTouch() {
  const wrapper = document.getElementById('tri-target-wrapper');
  const svg = document.getElementById('tri-target-svg');
  if (wrapper._triInitialized) return;
  wrapper._triInitialized = true;

  wrapper.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      // Pinch start
      triPinchStartDist = getTouchDist(e.touches);
      triPinchStartZoom = triZoom;
      e.preventDefault();
    } else if (e.touches.length === 1) {
      // Tap or drag marker
      e.preventDefault();
    }
  }, {passive: false});

  wrapper.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      const dist = getTouchDist(e.touches);
      triZoom = Math.min(5, Math.max(1, triPinchStartZoom * dist / triPinchStartDist));
      applyTriTransform();
      e.preventDefault();
    } else if (e.touches.length === 1 && triZoom > 1) {
      // Pan when zoomed
      e.preventDefault();
    }
  }, {passive: false});

  wrapper.addEventListener('touchend', e => {
    if (e.changedTouches.length === 1 && e.touches.length === 0 && triPinchStartDist === null) {
      // Single tap — place marker
      const touch = e.changedTouches[0];
      placeTap(touch.clientX, touch.clientY, svg);
    }
    if (e.touches.length < 2) triPinchStartDist = null;
  }, {passive: false});

  // Mouse support (desktop test)
  wrapper.addEventListener('click', e => {
    placeTap(e.clientX, e.clientY, svg);
  });
}

function placeTap(clientX, clientY, svg) {
  const rect = svg.getBoundingClientRect();
  const svgX = ((clientX - rect.left) / rect.width) * 400;
  const svgY = ((clientY - rect.top) / rect.height) * 400;
  const dx = (svgX - 200) / 190;
  const dy = (svgY - 200) / 190;
  placeMarker(dx, dy);
}

function applyTriTransform() {
  const wrapper = document.getElementById('tri-target-wrapper');
  wrapper.style.transform = `scale(${triZoom}) translate(${triPanX}px, ${triPanY}px)`;
  // Ajuster la taille du marker selon zoom
  if (triMarkerPos) {
    const marker = document.getElementById('tri-marker');
    marker.setAttribute('r', Math.max(4, 8 / triZoom));
  }
}

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx*dx + dy*dy);
}

// ── EXPORT DEBUG ZIP (branche dev uniquement — V4.6.4-dev) ──
async function exportDebugZip() {
  const btn = document.getElementById('btn-export-debug');
  if (btn) { btn.disabled = true; btn.textContent = '📦 Génération...'; }
  try {
    if (typeof JSZip === 'undefined') throw new Error('JSZip non chargé');
    const zip = new JSZip();
    const now = new Date();
    const sessionLabel = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}h${String(now.getMinutes()).padStart(2,'0')}`;
    const logData = {
      session_start: debugLog[0]?.ts ?? now.toISOString(),
      session_export: now.toISOString(),
      app_version: 'V4.6.5-dev',
      mode: mode,
      total_score: currentSession?.totalScore ?? 0,
      total_volleys: currentSession?.volleys?.length ?? 0,
      total_arrows: currentSession?.arrowCount ?? 0,
      events: debugLog
    };
    zip.file('log.json', JSON.stringify(logData, null, 2));
    if (currentSession?.referencePhoto?.captured) {
      const refData = currentSession.referencePhoto.base64.replace(/^data:image\/\w+;base64,/, '');
      zip.file('reference_blason.jpg', refData, { base64: true });
      zip.file('reference_blason_meta.json', JSON.stringify({
        ts: currentSession.referencePhoto.ts,
        note: 'Photo de référence du blason vide capturée en début de session'
      }, null, 2));
    }
    for (const item of debugPhotos) {
      const photoData = item.base64.replace(/^data:image\/\w+;base64,/, '');
      zip.file(item.filename, photoData, { base64: true });
      zip.file(item.iaFilename, JSON.stringify(item.iaData, null, 2));
    }
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archerAI_debug_${sessionLabel}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch(e) {
    console.error('Export debug error:', e);
    alert('Erreur export : ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📦 Exporter les données de debug'; }
  }
}