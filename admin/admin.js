const REPO = 'nardoniF/brunabononi';
const FILE = 'content/site.json';
const TOKEN_KEY = 'bruna-admin-token';

let state = null;
let sha = null;

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

const savedToken = sessionStorage.getItem(TOKEN_KEY);
if (savedToken) {
  connect(savedToken).catch(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    loadContent();
  });
} else {
  loadContent().catch((error) => setStatus(error.message));
}
