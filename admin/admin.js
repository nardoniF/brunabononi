const REPO = 'nardoniF/brunabononi';
const FILE = 'content/site.json';
const TOKEN_KEY = 'bruna-admin-token';
const AUTH_KEY = 'bruna-admin-auth';
const PASSWORD_HASH = '6d3f2ae249d667261536bce9bd2360681b348eb17a3deb15c23b1ae868682358';

let state = null;
let sha = null;
let adminUnlocked = false;

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Pure JS SHA-256 for insecure contexts where crypto.subtle is missing (plain http://). */
function sha256Fallback(text) {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);
  const rotr = (value, shift) => (value >>> shift) | (value << (32 - shift));
  const bytes = new TextEncoder().encode(text);
  const bitLen = bytes.length * 8;
  const withPad = new Uint8Array(((bytes.length + 9 + 63) & ~63));
  withPad.set(bytes);
  withPad[bytes.length] = 0x80;
  const view = new DataView(withPad.buffer);
  view.setUint32(withPad.length - 4, bitLen >>> 0);
  view.setUint32(withPad.length - 8, Math.floor(bitLen / 0x100000000));

  let h0 = 0x6a09e667; let h1 = 0xbb67ae85; let h2 = 0x3c6ef372; let h3 = 0xa54ff53a;
  let h4 = 0x510e527f; let h5 = 0x9b05688c; let h6 = 0x1f83d9ab; let h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let offset = 0; offset < withPad.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0; let b = h1; let c = h2; let d = h3;
    let e = h4; let f = h5; let g = h6; let h = h7;
    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0); outView.setUint32(4, h1); outView.setUint32(8, h2); outView.setUint32(12, h3);
  outView.setUint32(16, h4); outView.setUint32(20, h5); outView.setUint32(24, h6); outView.setUint32(28, h7);
  return bytesToHex(out);
}

async function sha256(text) {
  if (globalThis.crypto?.subtle) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return bytesToHex(new Uint8Array(digest));
    } catch (_) {
      // Fall through to the pure-JS path (some browsers expose subtle but reject insecure contexts).
    }
  }
  return sha256Fallback(text);
}

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === PASSWORD_HASH;
}

function showLoginError(message) {
  const node = document.getElementById('login-error');
  if (node) node.textContent = message;
}

const fields = document.getElementById('fields');
const status = document.getElementById('status');
const dialog = document.getElementById('token-dialog');

const escapeAttr = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escapeText = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;');

function setStatus(message) {
  status.textContent = message;
}

function setPath(path, value) {
  const parts = path.split('.');
  let current = state;
  for (let index = 0; index < parts.length - 1; index += 1) current = current[parts[index]];
  current[parts.at(-1)] = value;
}

function field(label, path, value, options = {}) {
  const hint = options.hint ? `<small>${options.hint}</small>` : '';
  if (options.area) {
    return `<label class="field">${label}${hint}<textarea data-path="${path}" rows="${options.rows || 4}">${escapeText(value)}</textarea></label>`;
  }
  const preview = options.image
    ? `<img class="img-preview" alt="" ${String(value || '').startsWith('https://') ? `src="${escapeAttr(value)}"` : 'hidden'}>`
    : '';
  return `<label class="field">${label}${hint}<input data-path="${path}" ${options.image ? 'data-kind="image"' : ''} value="${escapeAttr(value)}">${preview}</label>`;
}

function slug(text) {
  const base = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base || 'tratamento';
}

function renderForm() {
  const scroll = window.scrollY;
  const identity = state.identity;
  const home = state.home;
  fields.innerHTML = `
    <section class="block" id="identidade">
      <h2>Identidade e contato</h2>
      <p class="help">Estes dados aparecem no topo, no rodapé e nos botões de WhatsApp.</p>
      ${field('Nome', 'identity.name', identity.name)}
      ${field('Subtítulo', 'identity.tagline', identity.tagline)}
      ${field('Telefone / WhatsApp', 'identity.phone', identity.phone, { hint: 'Pode usar (11) 97865-7709. O link do WhatsApp é montado a partir dos números.' })}
      ${field('E-mail do formulário', 'identity.email', identity.email)}
      ${field('Endereço', 'identity.address', identity.address)}
      ${field('Mensagem padrão do WhatsApp', 'identity.whatsappText', identity.whatsappText, { area: true, rows: 3 })}
      ${field('Título do bloco de endereço no rodapé', 'identity.footerPlaceTitle', identity.footerPlaceTitle)}
      ${field('Título dos links no rodapé', 'identity.footerPagesTitle', identity.footerPagesTitle)}
      ${field('Copyright', 'identity.copyright', identity.copyright)}
    </section>
    <section class="block" id="menu">
      <h2>Menu</h2>
      ${field('Início', 'nav.home', state.nav.home)}
      ${field('A Dra. Bruna', 'nav.about', state.nav.about)}
      ${field('Tratamentos', 'nav.services', state.nav.services)}
      ${field('Contato', 'nav.contact', state.nav.contact)}
      ${field('Botão do menu', 'nav.cta', state.nav.cta)}
    </section>
    <section class="block" id="inicio">
      <h2>Página inicial</h2>
      ${field('Título da aba', 'home.metaTitle', home.metaTitle)}
      ${field('Descrição da aba', 'home.metaDescription', home.metaDescription, { area: true, rows: 3 })}
      ${field('Linha acima do título', 'home.eyebrow', home.eyebrow)}
      ${field('Título principal', 'home.title', home.title, { area: true, rows: 3 })}
      ${field('Subtítulo', 'home.subtitle', home.subtitle, { area: true, rows: 3 })}
      ${field('Botão do topo', 'home.cta', home.cta)}
      ${field('Imagem do topo', 'home.heroImage', home.heroImage, { image: true, hint: 'Cole um link https:// de uma imagem da internet.' })}
      ${field('Rótulo do endereço', 'home.addressLabel', home.addressLabel)}
      ${field('Rótulo do telefone', 'home.phoneLabel', home.phoneLabel)}
      ${field('Linha da seção sobre', 'home.aboutEyebrow', home.aboutEyebrow)}
      ${field('Título da seção sobre', 'home.aboutTitle', home.aboutTitle, { area: true, rows: 2 })}
      ${field('Texto da seção sobre', 'home.aboutText', home.aboutText, { area: true, rows: 6 })}
      ${field('Imagem da seção sobre', 'home.aboutImage', home.aboutImage, { image: true })}
      ${field('Descrição da imagem', 'home.aboutImageAlt', home.aboutImageAlt)}
      ${field('Botão da seção sobre', 'home.aboutButton', home.aboutButton)}
      ${field('Linha das especialidades', 'home.servicesEyebrow', home.servicesEyebrow)}
      ${field('Título das especialidades', 'home.servicesTitle', home.servicesTitle)}
      ${field('Link dos cartões', 'home.cardLink', home.cardLink)}
    </section>
    <section class="block" id="diferenciais">
      <h2>Diferenciais</h2>
      ${field('Linha da seção', 'reasons.eyebrow', state.reasons.eyebrow)}
      ${field('Título', 'reasons.title', state.reasons.title)}
      ${state.reasons.items.map((item, index) => `
        <div class="item">
          <div class="item-head"><strong>Diferencial ${index + 1}</strong><button class="btn-danger" type="button" data-action="remove-reason" data-index="${index}">Remover</button></div>
          ${field('Título', `reasons.items.${index}.title`, item.title)}
          ${field('Texto', `reasons.items.${index}.text`, item.text, { area: true, rows: 3 })}
        </div>`).join('')}
      <button class="btn-quiet" type="button" data-action="add-reason">Adicionar diferencial</button>
    </section>
    <section class="block" id="chamada">
      <h2>Chamada final</h2>
      ${field('Título', 'cta.title', state.cta.title)}
      ${field('Texto', 'cta.text', state.cta.text, { area: true, rows: 3 })}
      ${field('Botão', 'cta.button', state.cta.button)}
      ${field('Imagem de fundo', 'cta.image', state.cta.image, { image: true })}
    </section>
    <section class="block" id="sobre">
      <h2>Página A Dra. Bruna</h2>
      ${field('Título da aba', 'about.metaTitle', state.about.metaTitle)}
      ${field('Descrição da aba', 'about.metaDescription', state.about.metaDescription, { area: true, rows: 3 })}
      ${field('Linha acima do título', 'about.eyebrow', state.about.eyebrow)}
      ${field('Título', 'about.title', state.about.title)}
      ${field('Imagem', 'about.image', state.about.image, { image: true })}
      ${field('Descrição da imagem', 'about.imageAlt', state.about.imageAlt)}
      ${state.about.paragraphs.map((paragraph, index) => `
        <div class="item">
          <div class="item-head"><strong>Parágrafo ${index + 1}</strong><button class="btn-danger" type="button" data-action="remove-paragraph" data-index="${index}">Remover</button></div>
          ${field('Texto', `about.paragraphs.${index}`, paragraph, { area: true, rows: 5 })}
        </div>`).join('')}
      <button class="btn-quiet" type="button" data-action="add-paragraph">Adicionar parágrafo</button>
      ${field('Botão', 'about.cta', state.about.cta)}
    </section>
    <section class="block" id="tratamentos">
      <h2>Tratamentos</h2>
      <p class="help">O resumo aparece no cartão da página inicial. O texto e os benefícios aparecem na página de tratamentos.</p>
      ${field('Título da aba', 'servicesPage.metaTitle', state.servicesPage.metaTitle)}
      ${field('Descrição da aba', 'servicesPage.metaDescription', state.servicesPage.metaDescription, { area: true, rows: 3 })}
      ${field('Linha acima do título', 'servicesPage.eyebrow', state.servicesPage.eyebrow)}
      ${field('Título da página', 'servicesPage.title', state.servicesPage.title)}
      ${field('Subtítulo', 'servicesPage.subtitle', state.servicesPage.subtitle, { area: true, rows: 3 })}
      ${field('Botão de cada tratamento', 'servicesPage.button', state.servicesPage.button)}
      ${state.treatments.map((item, index) => `
        <div class="item">
          <div class="item-head">
            <strong>${escapeText(item.title || 'Tratamento')}</strong>
            <div class="row">
              <button class="btn-quiet" type="button" data-action="move-treatment" data-index="${index}" data-dir="-1">Subir</button>
              <button class="btn-quiet" type="button" data-action="move-treatment" data-index="${index}" data-dir="1">Descer</button>
              <button class="btn-danger" type="button" data-action="remove-treatment" data-index="${index}">Remover</button>
            </div>
          </div>
          ${field('Nome', `treatments.${index}.title`, item.title)}
          ${field('Identificador do link', `treatments.${index}.id`, item.id, { hint: 'Usado no endereço da página. Evite espaços.' })}
          ${field('Resumo', `treatments.${index}.summary`, item.summary, { area: true, rows: 3 })}
          ${field('Texto', `treatments.${index}.text`, item.text, { area: true, rows: 6 })}
          ${field('Imagem', `treatments.${index}.image`, item.image, { image: true })}
          ${field('Descrição da imagem', `treatments.${index}.imageAlt`, item.imageAlt)}
          ${field('Mensagem do WhatsApp deste tratamento', `treatments.${index}.whatsappText`, item.whatsappText, { area: true, rows: 2 })}
          <p class="help">Benefícios</p>
          ${item.benefits.map((benefit, benefitIndex) => `
            <div class="row" style="align-items:end;margin-bottom:10px;">
              <label class="field" style="flex:1;margin:0;">Benefício
                <input data-path="treatments.${index}.benefits.${benefitIndex}" value="${escapeAttr(benefit)}">
              </label>
              <button class="btn-danger" type="button" data-action="remove-benefit" data-index="${index}" data-benefit="${benefitIndex}">Remover</button>
            </div>`).join('')}
          <button class="btn-quiet" type="button" data-action="add-benefit" data-index="${index}">Adicionar benefício</button>
        </div>`).join('')}
      <button class="btn-quiet" type="button" data-action="add-treatment">Adicionar tratamento</button>
    </section>
    <section class="block" id="contato">
      <h2>Página de contato</h2>
      ${field('Título da aba', 'contact.metaTitle', state.contact.metaTitle)}
      ${field('Descrição da aba', 'contact.metaDescription', state.contact.metaDescription, { area: true, rows: 3 })}
      ${field('Linha acima do título', 'contact.eyebrow', state.contact.eyebrow)}
      ${field('Título', 'contact.title', state.contact.title)}
      ${field('Texto de apoio', 'contact.intro', state.contact.intro, { area: true, rows: 4 })}
      ${field('Título do cartão', 'contact.cardTitle', state.contact.cardTitle)}
      ${field('Botão do WhatsApp', 'contact.whatsappButton', state.contact.whatsappButton)}
      ${field('Título do horário', 'contact.hoursTitle', state.contact.hoursTitle)}
      ${state.contact.hours.map((hour, index) => `
        <div class="item">
          <div class="item-head"><strong>Horário ${index + 1}</strong><button class="btn-danger" type="button" data-action="remove-hour" data-index="${index}">Remover</button></div>
          ${field('Dia', `contact.hours.${index}.label`, hour.label)}
          ${field('Atendimento', `contact.hours.${index}.value`, hour.value)}
        </div>`).join('')}
      <button class="btn-quiet" type="button" data-action="add-hour">Adicionar horário</button>
      ${field('Título do formulário', 'contact.formTitle', state.contact.formTitle)}
      ${field('Texto do formulário', 'contact.formIntro', state.contact.formIntro, { area: true, rows: 3 })}
      ${field('Campo nome', 'contact.formName', state.contact.formName)}
      ${field('Campo e-mail', 'contact.formEmail', state.contact.formEmail)}
      ${field('Campo telefone', 'contact.formPhone', state.contact.formPhone)}
      ${field('Campo mensagem', 'contact.formMessage', state.contact.formMessage)}
      ${field('Botão de envio', 'contact.formSubmit', state.contact.formSubmit)}
      ${field('Mensagem de sucesso', 'contact.formSuccess', state.contact.formSuccess)}
      ${field('Assunto do e-mail', 'contact.formSubject', state.contact.formSubject)}
      ${field('Busca do mapa', 'contact.mapQuery', state.contact.mapQuery, { hint: 'Endereço usado para posicionar o mapa.' })}
    </section>`;

  window.scrollTo(0, scroll);
}

function decodeBase64(value) {
  const binary = atob(value.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

async function loadContent() {
  const local = await fetch('../content/site.json', { cache: 'no-cache' });
  state = await local.json();
  const headers = { Accept: 'application/vnd.github+json' };
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  const remote = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}?ref=main`, { headers, cache: 'no-cache' });
  if (remote.ok) {
    const payload = await remote.json();
    sha = payload.sha;
    state = JSON.parse(decodeBase64(payload.content));
    setStatus(token ? 'Conectado. As alterações ainda não publicadas ficam só na pré-visualização.' : 'Campos carregados. Conecte o GitHub para publicar.');
  } else {
    setStatus('Campos carregados da versão local. Conecte o GitHub para publicar.');
  }
  renderForm();
}

async function connect(token) {
  const response = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  });
  if (!response.ok) throw new Error('Token recusado. Ele precisa ter permissão de escrita no repositório.');
  const user = await response.json();
  sessionStorage.setItem(TOKEN_KEY, token);
  document.getElementById('who').textContent = `Conectado como ${user.login}. Publicar grava a alteração no site.`;
  await loadContent();
}

fields.addEventListener('input', (event) => {
  const path = event.target.dataset.path;
  if (!path) return;
  setPath(path, event.target.value);
  if (event.target.dataset.kind === 'image') {
    const preview = event.target.parentElement.querySelector('.img-preview');
    const ok = event.target.value.startsWith('https://');
    if (preview) {
      preview.hidden = !ok;
      if (ok) preview.src = event.target.value;
    }
  }
});

fields.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const index = Number(button.dataset.index);
  if (button.dataset.action === 'add-reason') state.reasons.items.push({ title: '', text: '' });
  if (button.dataset.action === 'remove-reason') state.reasons.items.splice(index, 1);
  if (button.dataset.action === 'add-paragraph') state.about.paragraphs.push('');
  if (button.dataset.action === 'remove-paragraph') state.about.paragraphs.splice(index, 1);
  if (button.dataset.action === 'add-hour') state.contact.hours.push({ label: '', value: '' });
  if (button.dataset.action === 'remove-hour') state.contact.hours.splice(index, 1);
  if (button.dataset.action === 'add-treatment') {
    const idBase = slug('Novo tratamento');
    const id = state.treatments.some((item) => item.id === idBase) ? `${idBase}-${Date.now()}` : idBase;
    state.treatments.push({
      id, title: 'Novo tratamento', summary: '', text: '', benefits: [''], image: '', imageAlt: '', whatsappText: ''
    });
  }
  if (button.dataset.action === 'remove-treatment') state.treatments.splice(index, 1);
  if (button.dataset.action === 'move-treatment') {
    const next = index + Number(button.dataset.dir);
    if (next >= 0 && next < state.treatments.length) {
      const [item] = state.treatments.splice(index, 1);
      state.treatments.splice(next, 0, item);
    }
  }
  if (button.dataset.action === 'add-benefit') state.treatments[index].benefits.push('');
  if (button.dataset.action === 'remove-benefit') state.treatments[index].benefits.splice(Number(button.dataset.benefit), 1);
  renderForm();
});

document.querySelectorAll('[data-jump]').forEach((button) => {
  button.addEventListener('click', () => {
    document.getElementById(button.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.getElementById('preview').addEventListener('click', () => {
  localStorage.setItem('bruna-preview', JSON.stringify(state));
  window.open('../index.html?preview=1', '_blank');
});

document.getElementById('connect').addEventListener('click', () => {
  document.getElementById('token-error').textContent = '';
  dialog.showModal();
});
document.getElementById('close-token').addEventListener('click', () => dialog.close());
document.getElementById('save-token').addEventListener('click', async () => {
  const token = document.getElementById('token-input').value.trim();
  document.getElementById('token-error').textContent = '';
  try {
    await connect(token);
    document.getElementById('token-input').value = '';
    dialog.close();
  } catch (error) {
    document.getElementById('token-error').textContent = error.message;
  }
});

document.getElementById('publish').addEventListener('click', async () => {
  if (!isAuthenticated()) {
    showLoginError('Digite a senha para entrar.');
    return;
  }
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    dialog.showModal();
    return;
  }
  setStatus('Publicando…');
  try {
    const payloadBody = {
      message: 'Atualiza os textos do site pelo administrador.',
      content: encodeBase64(`${JSON.stringify(state, null, 2)}\n`),
      branch: 'main'
    };
    if (sha) payloadBody.sha = sha;
    const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadBody)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Não foi possível publicar.');
    sha = payload.content.sha;
    setStatus('Publicado. O site no ar atualiza em cerca de um minuto.');
  } catch (error) {
    setStatus(error.message);
  }
});

function openAdmin() {
  if (!isAuthenticated()) return;
  adminUnlocked = true;
  document.getElementById('login').hidden = true;
  document.getElementById('admin').hidden = false;
  document.getElementById('admin').classList.add('is-open');
  const savedToken = sessionStorage.getItem(TOKEN_KEY);
  if (savedToken) {
    connect(savedToken).catch(() => {
      sessionStorage.removeItem(TOKEN_KEY);
      loadContent();
    });
    return;
  }
  loadContent().catch((error) => setStatus(error.message));
}

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  showLoginError('');
  const password = document.getElementById('login-password').value;
  try {
    const hash = await sha256(password);
    if (hash !== PASSWORD_HASH) {
      showLoginError('Senha incorreta.');
      return;
    }
    // Persist the verified hash (not a bare flag) so a stale "1" value cannot unlock the panel.
    sessionStorage.setItem(AUTH_KEY, hash);
    openAdmin();
  } catch (error) {
    showLoginError('Não foi possível validar a senha neste navegador. Atualize a página e tente de novo.');
    console.error(error);
  }
});

document.getElementById('logout').addEventListener('click', () => {
  sessionStorage.removeItem(AUTH_KEY);
  adminUnlocked = false;
  location.reload();
});

// Migrate/ignore the old session flag that unlocked without proving the current password.
if (sessionStorage.getItem(AUTH_KEY) === '1') sessionStorage.removeItem(AUTH_KEY);
if (isAuthenticated()) openAdmin();
else {
  document.getElementById('login').hidden = false;
  document.getElementById('admin').hidden = true;
  document.getElementById('admin').classList.remove('is-open');
}
