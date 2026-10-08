const SESSION_KEY = 'bruna_admin_session';
const CONTENT_STORAGE_KEY = 'bruna_site_content';
const CREDENTIALS_STORAGE_KEY = 'bruna_admin_credentials';
const CONTENT_URL = '../content/site.json';

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const contentForm = document.getElementById('content-form');
const passwordForm = document.getElementById('password-form');
const passwordStatus = document.getElementById('password-status');
const reasonsEditor = document.getElementById('reasons-editor');
const paragraphsEditor = document.getElementById('paragraphs-editor');
const treatmentsEditor = document.getElementById('treatments-editor');
const hoursEditor = document.getElementById('hours-editor');
const saveStatus = document.getElementById('save-status');

let currentContent = null;

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function loadStoredCredentials() {
  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAuthConfig() {
  const stored = loadStoredCredentials();
  const base = window.ADMIN_CONFIG || {};
  return {
    user: (stored && stored.user) || base.user || 'admin',
    passwordHash: (stored && stored.passwordHash) || base.passwordHash || '',
  };
}

function downloadConfigJs(user, passwordHash) {
  const body = `/**
 * Credenciais do admin.
 * Gerado pelo painel em Trocar senha.
 */
window.ADMIN_CONFIG = {
  user: ${JSON.stringify(user)},
  passwordHash: ${JSON.stringify(passwordHash)},
};
`;
  const blob = new Blob([body], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'config.js';
  a.click();
  URL.revokeObjectURL(url);
}

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

function setLoggedIn(value) {
  if (value) sessionStorage.setItem(SESSION_KEY, '1');
  else sessionStorage.removeItem(SESSION_KEY);
}

function showAdmin(show) {
  loginView.hidden = show;
  adminView.hidden = !show;
}

function setByPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {};
    cur = cur[key];
  }
  cur[keys[keys.length - 1]] = value;
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

async function fetchDefaultContent() {
  const res = await fetch(CONTENT_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar site.json');
  return res.json();
}

function loadStoredContent() {
  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fillForm(content) {
  contentForm.querySelectorAll('[name]').forEach((field) => {
    const value = getByPath(content, field.name);
    if (value != null && typeof value !== 'object') field.value = value;
    else field.value = '';
  });
  const reasons = content.reasons && Array.isArray(content.reasons.items) ? content.reasons.items : [];
  const paragraphs = content.about && Array.isArray(content.about.paragraphs) ? content.about.paragraphs : [];
  const treatments = Array.isArray(content.treatments) ? content.treatments : [];
  const hours = content.contact && Array.isArray(content.contact.hours) ? content.contact.hours : [];
  renderReasons(reasons);
  renderParagraphs(paragraphs);
  renderTreatments(treatments);
  renderHours(hours);
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderReasons(items) {
  reasonsEditor.innerHTML = '';
  items.forEach((item, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'area-item';
    wrap.innerHTML = `
      <div class="area-item-head">
        <span>Diferencial ${index + 1}</span>
        <button type="button" class="btn-remove" data-remove="${index}">Remover</button>
      </div>
      <label>Título
        <input type="text" data-reason-field="title" value="${escapeAttr(item.title || '')}">
      </label>
      <label>Texto
        <textarea rows="2" data-reason-field="text">${escapeText(item.text || '')}</textarea>
      </label>
    `;
    reasonsEditor.appendChild(wrap);
  });
}

function renderParagraphs(items) {
  paragraphsEditor.innerHTML = '';
  items.forEach((item, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'area-item';
    wrap.innerHTML = `
      <div class="area-item-head">
        <span>Parágrafo ${index + 1}</span>
        <button type="button" class="btn-remove" data-remove="${index}">Remover</button>
      </div>
      <label>Texto
        <textarea rows="4" data-paragraph-field="text">${escapeText(item || '')}</textarea>
      </label>
    `;
    paragraphsEditor.appendChild(wrap);
  });
}

function renderTreatments(items) {
  treatmentsEditor.innerHTML = '';
  items.forEach((item, index) => {
    const benefits = Array.isArray(item.benefits) ? item.benefits.join('\n') : '';
    const wrap = document.createElement('div');
    wrap.className = 'area-item';
    wrap.innerHTML = `
      <div class="area-item-head">
        <span>Tratamento ${index + 1}</span>
        <button type="button" class="btn-remove" data-remove="${index}">Remover</button>
      </div>
      <label>Nome
        <input type="text" data-treatment-field="title" value="${escapeAttr(item.title || '')}">
      </label>
      <label>Identificador do link
        <input type="text" data-treatment-field="id" value="${escapeAttr(item.id || '')}">
      </label>
      <label>Resumo (cartão da página inicial)
        <textarea rows="2" data-treatment-field="summary">${escapeText(item.summary || '')}</textarea>
      </label>
      <label>Texto
        <textarea rows="4" data-treatment-field="text">${escapeText(item.text || '')}</textarea>
      </label>
      <label>Benefícios (um por linha)
        <textarea rows="3" data-treatment-field="benefits">${escapeText(benefits)}</textarea>
      </label>
      <label>URL da imagem
        <input type="url" data-treatment-field="image" value="${escapeAttr(item.image || '')}">
      </label>
      <label>Descrição da imagem
        <input type="text" data-treatment-field="imageAlt" value="${escapeAttr(item.imageAlt || '')}">
      </label>
      <label>Mensagem do WhatsApp
        <textarea rows="2" data-treatment-field="whatsappText">${escapeText(item.whatsappText || '')}</textarea>
      </label>
    `;
    treatmentsEditor.appendChild(wrap);
  });
}

function renderHours(items) {
  hoursEditor.innerHTML = '';
  items.forEach((item, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'area-item';
    wrap.innerHTML = `
      <div class="area-item-head">
        <span>Horário ${index + 1}</span>
        <button type="button" class="btn-remove" data-remove="${index}">Remover</button>
      </div>
      <label>Dia
        <input type="text" data-hour-field="label" value="${escapeAttr(item.label || '')}">
      </label>
      <label>Atendimento
        <input type="text" data-hour-field="value" value="${escapeAttr(item.value || '')}">
      </label>
    `;
    hoursEditor.appendChild(wrap);
  });
}

function readReasons() {
  return Array.from(reasonsEditor.querySelectorAll('.area-item')).map((item) => ({
    title: item.querySelector('[data-reason-field="title"]').value.trim(),
    text: item.querySelector('[data-reason-field="text"]').value.trim(),
  }));
}

function readParagraphs() {
  return Array.from(paragraphsEditor.querySelectorAll('.area-item')).map((item) =>
    item.querySelector('[data-paragraph-field="text"]').value.trim()
  );
}

function slug(text) {
  const base = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'tratamento';
}

function readTreatments() {
  const used = new Set();
  return Array.from(treatmentsEditor.querySelectorAll('.area-item')).map((item) => {
    const title = item.querySelector('[data-treatment-field="title"]').value.trim();
    let id = item.querySelector('[data-treatment-field="id"]').value.trim();
    if (!id) id = slug(title);
    let unique = id;
    let n = 2;
    while (used.has(unique)) {
      unique = `${id}-${n}`;
      n += 1;
    }
    used.add(unique);
    return {
      id: unique,
      title,
      summary: item.querySelector('[data-treatment-field="summary"]').value.trim(),
      text: item.querySelector('[data-treatment-field="text"]').value.trim(),
      benefits: item.querySelector('[data-treatment-field="benefits"]').value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      image: item.querySelector('[data-treatment-field="image"]').value.trim(),
      imageAlt: item.querySelector('[data-treatment-field="imageAlt"]').value.trim(),
      whatsappText: item.querySelector('[data-treatment-field="whatsappText"]').value.trim(),
    };
  });
}

function readHours() {
  return Array.from(hoursEditor.querySelectorAll('.area-item')).map((item) => ({
    label: item.querySelector('[data-hour-field="label"]').value.trim(),
    value: item.querySelector('[data-hour-field="value"]').value.trim(),
  }));
}

function collectFormContent() {
  const content = structuredClone(currentContent || {});
  contentForm.querySelectorAll('[name]').forEach((field) => {
    setByPath(content, field.name, field.value);
  });
  if (!content.reasons || typeof content.reasons !== 'object') content.reasons = {};
  content.reasons.items = readReasons();
  if (!content.about || typeof content.about !== 'object') content.about = {};
  content.about.paragraphs = readParagraphs();
  content.treatments = readTreatments();
  if (!content.contact || typeof content.contact !== 'object') content.contact = {};
  content.contact.hours = readHours();
  return content;
}

function setStatus(message, isError = false) {
  saveStatus.textContent = message;
  saveStatus.classList.toggle('error', isError);
}

function setPasswordStatus(message, isError = false) {
  passwordStatus.textContent = message;
  passwordStatus.classList.toggle('error', isError);
}

function downloadContent(content) {
  const blob = new Blob([JSON.stringify(content, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'site.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function initContent() {
  const stored = loadStoredContent();
  currentContent = stored || (await fetchDefaultContent());
  fillForm(currentContent);
}

function bindRemovableList(editor, read, render) {
  editor.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn || !editor.contains(btn)) return;
    const index = Number(btn.getAttribute('data-remove'));
    const items = read().filter((_, i) => i !== index);
    render(items);
  });
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;

  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const hash = await sha256(pass);
  const config = getAuthConfig();

  if (user === config.user && hash === config.passwordHash) {
    setLoggedIn(true);
    showAdmin(true);
    await initContent();
  } else {
    loginError.hidden = false;
  }
});

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setPasswordStatus('');

  const currentUser = document.getElementById('pass-current-user').value.trim();
  const currentPass = document.getElementById('pass-current').value;
  const newUser = document.getElementById('pass-new-user').value.trim();
  const newPass = document.getElementById('pass-new').value;
  const newPassConfirm = document.getElementById('pass-new-confirm').value;

  if (!newUser) {
    setPasswordStatus('Informe o novo usuário.', true);
    return;
  }
  if (newPass.length < 6) {
    setPasswordStatus('A nova senha deve ter pelo menos 6 caracteres.', true);
    return;
  }
  if (newPass !== newPassConfirm) {
    setPasswordStatus('A confirmação da nova senha não confere.', true);
    return;
  }

  const config = getAuthConfig();
  const currentHash = await sha256(currentPass);
  if (currentUser !== config.user || currentHash !== config.passwordHash) {
    setPasswordStatus('Usuário ou senha atual incorretos.', true);
    return;
  }

  const newHash = await sha256(newPass);
  localStorage.setItem(
    CREDENTIALS_STORAGE_KEY,
    JSON.stringify({ user: newUser, passwordHash: newHash })
  );
  downloadConfigJs(newUser, newHash);
  passwordForm.reset();
  setPasswordStatus(
    'Senha alterada. O arquivo config.js foi baixado — substitua admin/config.js na hospedagem.'
  );
});

document.getElementById('btn-logout').addEventListener('click', () => {
  setLoggedIn(false);
  showAdmin(false);
  loginForm.reset();
  setStatus('');
  setPasswordStatus('');
});

document.getElementById('btn-add-reason').addEventListener('click', () => {
  const items = readReasons();
  items.push({ title: 'Novo diferencial', text: '' });
  renderReasons(items);
});

document.getElementById('btn-add-paragraph').addEventListener('click', () => {
  const items = readParagraphs();
  items.push('');
  renderParagraphs(items);
});

document.getElementById('btn-add-treatment').addEventListener('click', () => {
  const items = readTreatments();
  items.push({
    id: 'novo-tratamento',
    title: 'Novo tratamento',
    summary: '',
    text: '',
    benefits: [],
    image: '',
    imageAlt: '',
    whatsappText: '',
  });
  renderTreatments(items);
});

document.getElementById('btn-add-hour').addEventListener('click', () => {
  const items = readHours();
  items.push({ label: 'Novo horário', value: '' });
  renderHours(items);
});

bindRemovableList(reasonsEditor, readReasons, renderReasons);
bindRemovableList(paragraphsEditor, readParagraphs, renderParagraphs);
bindRemovableList(treatmentsEditor, readTreatments, renderTreatments);
bindRemovableList(hoursEditor, readHours, renderHours);

contentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  try {
    const content = collectFormContent();
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    currentContent = content;
    setStatus('Alterações salvas. Abra o site neste navegador para conferir.');
  } catch (err) {
    console.error(err);
    setStatus('Erro ao salvar. Tente novamente.', true);
  }
});

document.getElementById('btn-download').addEventListener('click', () => {
  const content = collectFormContent();
  downloadContent(content);
  setStatus('Arquivo site.json baixado. Substitua content/site.json no projeto para publicar.');
});

document.getElementById('btn-reset').addEventListener('click', async () => {
  if (!confirm('Restaurar o conteúdo padrão do arquivo content/site.json? As alterações locais serão apagadas.')) {
    return;
  }
  localStorage.removeItem(CONTENT_STORAGE_KEY);
  currentContent = await fetchDefaultContent();
  fillForm(currentContent);
  setStatus('Conteúdo padrão restaurado.');
});

(async function boot() {
  if (isLoggedIn()) {
    showAdmin(true);
    try {
      await initContent();
    } catch (err) {
      console.error(err);
      setStatus('Não foi possível carregar o conteúdo.', true);
    }
  } else {
    showAdmin(false);
  }
})();
