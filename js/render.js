(async function () {
  const page = document.body.dataset.page;
  const app = document.getElementById('app');
  if (!page || !app) return;

  const params = new URLSearchParams(location.search);
  let data;
  if (params.get('preview') === '1') {
    try {
      data = JSON.parse(localStorage.getItem('bruna-preview') || '');
    } catch (error) {
      data = null;
    }
  }
  if (!data) {
    const response = await fetch('content/site.json', { cache: 'no-cache' });
    data = await response.json();
  }

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const digits = String(data.identity.phone || '').replace(/\D/g, '');
  const phoneNumber = digits.startsWith('55') ? digits : `55${digits}`;
  const wa = (text) => `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text || data.identity.whatsappText || '')}`;
  const safeImage = (url) => /^https:\/\//.test(url || '') ? url : '';

  const meta = {
    home: [data.home.metaTitle, data.home.metaDescription],
    about: [data.about.metaTitle, data.about.metaDescription],
    services: [data.servicesPage.metaTitle, data.servicesPage.metaDescription],
    contact: [data.contact.metaTitle, data.contact.metaDescription]
  }[page];
  if (meta) {
    document.title = meta[0] || data.identity.name;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', meta[1] || '');
  }

  const active = (name) => name === page ? ' class="is-active"' : '';
  const header = `
    <header class="header">
      <div class="container nav">
        <a href="index.html" class="logo-link">
          <span class="logo-text">${esc(data.identity.name)}<small>${esc(data.identity.tagline)}</small></span>
        </a>
        <button class="nav-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="site-nav">
          <span></span><span></span><span></span>
        </button>
        <nav class="site-nav" id="site-nav">
          <a href="index.html"${active('home')}>${esc(data.nav.home)}</a>
          <a href="sobre.html"${active('about')}>${esc(data.nav.about)}</a>
          <a href="servicos.html"${active('services')}>${esc(data.nav.services)}</a>
          <a href="contato.html"${active('contact')}>${esc(data.nav.contact)}</a>
          <a class="btn" href="${wa(data.identity.whatsappText)}" target="_blank" rel="noopener">${esc(data.nav.cta)}</a>
        </nav>
      </div>
    </header>`;

  const footer = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h2>${esc(data.identity.name)}</h2>
            <p>${esc(data.identity.tagline)}</p>
          </div>
          <div>
            <p class="footer-title">${esc(data.identity.footerPlaceTitle)}</p>
            <p>${esc(data.identity.address)}</p>
            <p><a href="tel:+${phoneNumber}">${esc(data.identity.phone)}</a></p>
            <p><a href="mailto:${esc(data.identity.email)}">${esc(data.identity.email)}</a></p>
          </div>
          <div>
            <p class="footer-title">${esc(data.identity.footerPagesTitle)}</p>
            <div class="footer-links">
              <a href="index.html">${esc(data.nav.home)}</a>
              <a href="sobre.html">${esc(data.nav.about)}</a>
              <a href="servicos.html">${esc(data.nav.services)}</a>
              <a href="contato.html">${esc(data.nav.contact)}</a>
              <a href="admin/index.html">Administrar</a>
            </div>
          </div>
        </div>
        <p class="copy">${esc(data.identity.copyright)}</p>
      </div>
    </footer>
    <a href="${wa(data.identity.whatsappText)}" class="whatsapp-float" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="" width="30" height="30">
    </a>`;

  const ctaBand = `
    <section class="cta-band">
      <div class="container reveal">
        <h2>${esc(data.cta.title)}</h2>
        <p>${esc(data.cta.text)}</p>
        <a class="btn" href="${wa(data.identity.whatsappText)}" target="_blank" rel="noopener">${esc(data.cta.button)}</a>
      </div>
    </section>`;

  let main = '';
  if (page === 'home') {
    main = `
      <section class="hero">
        <div class="container">
          <p class="eyebrow reveal">${esc(data.home.eyebrow)}</p>
          <h1 class="reveal">${esc(data.home.title)}</h1>
          <p class="reveal">${esc(data.home.subtitle)}</p>
          <a class="btn reveal" href="${wa(data.identity.whatsappText)}" target="_blank" rel="noopener">${esc(data.home.cta)}</a>
        </div>
      </section>
      <section class="highlights">
        <div class="container highlights-grid">
          <a class="highlight" href="contato.html">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" stroke="#b89553" stroke-width="1.8"/><circle cx="12" cy="10" r="2.2" stroke="#b89553" stroke-width="1.8"/></svg>
            <div><strong>${esc(data.home.addressLabel)}</strong><span>${esc(data.identity.address)}</span></div>
          </a>
          <a class="highlight" href="${wa('')}" target="_blank" rel="noopener">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 4h3l1.5 4-2 1.2a12 12 0 0 0 5.3 5.3L17 12.5 21 14v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 6.2 2 2 0 0 1 6 4h2z" stroke="#b89553" stroke-width="1.8" stroke-linejoin="round"/></svg>
            <div><strong>${esc(data.home.phoneLabel)}</strong><span>${esc(data.identity.phone)}</span></div>
          </a>
        </div>
      </section>
      <section class="section">
        <div class="container split">
          <img class="portrait reveal" src="${esc(safeImage(data.home.aboutImage))}" alt="${esc(data.home.aboutImageAlt)}">
          <div class="reveal">
            <p class="eyebrow">${esc(data.home.aboutEyebrow)}</p>
            <h2>${esc(data.home.aboutTitle)}</h2>
            <div class="prose"><p>${esc(data.home.aboutText)}</p></div>
            <a class="btn" href="sobre.html" style="margin-top: 28px;">${esc(data.home.aboutButton)}</a>
          </div>
        </div>
      </section>
      <section class="section bg" id="tratamentos">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">${esc(data.home.servicesEyebrow)}</p>
            <h2>${esc(data.home.servicesTitle)}</h2>
          </div>
          <div class="grid">
            ${data.treatments.map((item) => `
              <a class="card reveal" href="servicos.html#${esc(item.id)}">
                ${safeImage(item.image) ? `<img class="card-photo" src="${esc(safeImage(item.image))}" alt="${esc(item.imageAlt)}">` : ''}
                <div class="card-body">
                  <h3>${esc(item.title)}</h3>
                  <p>${esc(item.summary)}</p>
                  <span class="card-link">${esc(data.home.cardLink)}</span>
                </div>
              </a>`).join('')}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="section-head center reveal">
            <p class="eyebrow">${esc(data.reasons.eyebrow)}</p>
            <h2>${esc(data.reasons.title)}</h2>
          </div>
          <div class="reasons">
            ${data.reasons.items.map((item) => `
              <article class="reason reveal">
                <h3>${esc(item.title)}</h3>
                <p>${esc(item.text)}</p>
              </article>`).join('')}
          </div>
        </div>
      </section>
      ${ctaBand}`;
  }

  if (page === 'about') {
    main = `
      <section class="page-hero">
        <div class="container">
          <p class="eyebrow">${esc(data.about.eyebrow)}</p>
          <h1>${esc(data.about.title)}</h1>
        </div>
      </section>
      <section class="section">
        <div class="container split">
          <img class="portrait" src="${esc(safeImage(data.about.image))}" alt="${esc(data.about.imageAlt)}">
          <div class="prose">
            ${data.about.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}
            <a class="btn" href="${wa(data.identity.whatsappText)}" target="_blank" rel="noopener" style="margin-top: 28px;">${esc(data.about.cta)}</a>
          </div>
        </div>
      </section>`;
  }

  if (page === 'services') {
    main = `
      <section class="page-hero">
        <div class="container">
          <p class="eyebrow">${esc(data.servicesPage.eyebrow)}</p>
          <h1>${esc(data.servicesPage.title)}</h1>
          <p class="lead" style="color: rgba(255,255,255,0.82); margin-top: 16px; max-width: 680px;">${esc(data.servicesPage.subtitle)}</p>
        </div>
      </section>
      <section class="section" style="padding-top: 20px; padding-bottom: 20px;">
        <div class="container">
          ${data.treatments.map((item) => `
            <article class="treatment" id="${esc(item.id)}">
              <div class="treatment-grid">
                ${safeImage(item.image) ? `<img class="treatment-photo" src="${esc(safeImage(item.image))}" alt="${esc(item.imageAlt)}">` : ''}
                <div>
                  <h2>${esc(item.title)}</h2>
                  <div class="prose"><p>${esc(item.text)}</p></div>
                  <ul class="benefits">
                    ${item.benefits.filter(Boolean).map((benefit) => `<li>${esc(benefit)}</li>`).join('')}
                  </ul>
                  <a class="btn" href="${wa(item.whatsappText)}" target="_blank" rel="noopener">${esc(data.servicesPage.button)}</a>
                </div>
              </div>
            </article>`).join('')}
        </div>
      </section>
      ${ctaBand}`;
  }

  if (page === 'contact') {
    main = `
      <section class="page-hero">
        <div class="container">
          <p class="eyebrow">${esc(data.contact.eyebrow)}</p>
          <h1>${esc(data.contact.title)}</h1>
        </div>
      </section>
      <section class="section">
        <div class="container contact-grid">
          <div>
            <p class="lead" style="margin-bottom: 28px;">${esc(data.contact.intro)}</p>
            <div class="contact-card">
              <h2>${esc(data.contact.cardTitle)}</h2>
              <p>${esc(data.identity.address)}</p>
              <p style="margin-top: 12px;"><a href="${wa('')}" target="_blank" rel="noopener">${esc(data.identity.phone)}</a></p>
              <p><a href="mailto:${esc(data.identity.email)}">${esc(data.identity.email)}</a></p>
              <a class="btn" href="${wa(data.identity.whatsappText)}" target="_blank" rel="noopener" style="margin-top: 20px;">${esc(data.contact.whatsappButton)}</a>
            </div>
            <div class="hours">
              <h2>${esc(data.contact.hoursTitle)}</h2>
              <ul>
                ${data.contact.hours.map((hour) => `<li><span>${esc(hour.label)}</span><span>${esc(hour.value)}</span></li>`).join('')}
              </ul>
            </div>
          </div>
          <div>
            <h2 style="margin-bottom: 8px;">${esc(data.contact.formTitle)}</h2>
            <p class="lead" style="margin-bottom: 20px;">${esc(data.contact.formIntro)}</p>
            <p class="form-sucesso" id="form-sucesso" hidden>${esc(data.contact.formSuccess)}</p>
            <form class="form-contato" action="https://formsubmit.co/${encodeURIComponent(data.identity.email)}" method="POST">
              <input type="hidden" name="_subject" value="${esc(data.contact.formSubject)}">
              <input type="hidden" name="_captcha" value="false">
              <input type="hidden" name="_template" value="table">
              <input type="hidden" name="_next" id="next-url" value="">
              <label for="nome">${esc(data.contact.formName)}</label>
              <input id="nome" type="text" name="name" required autocomplete="name">
              <label for="email">${esc(data.contact.formEmail)}</label>
              <input id="email" type="email" name="email" required autocomplete="email">
              <label for="telefone">${esc(data.contact.formPhone)}</label>
              <input id="telefone" type="tel" name="phone" autocomplete="tel">
              <label for="mensagem">${esc(data.contact.formMessage)}</label>
              <textarea id="mensagem" name="message" rows="5" required></textarea>
              <button type="submit" class="btn">${esc(data.contact.formSubmit)}</button>
            </form>
          </div>
        </div>
        <div class="container">
          <iframe class="map" title="Mapa do consultório" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${encodeURIComponent(data.contact.mapQuery || data.identity.address)}&amp;z=16&amp;output=embed"></iframe>
        </div>
      </section>`;
  }

  app.innerHTML = header + main + footer;

  const heroImage = safeImage(data.home.heroImage);
  const ctaImage = safeImage(data.cta.image);
  document.querySelectorAll('.hero').forEach((el) => {
    if (heroImage) {
      el.style.backgroundImage = `linear-gradient(90deg, rgba(12,20,38,0.92) 0%, rgba(12,20,38,0.72) 52%, rgba(12,20,38,0.45) 100%), url("${heroImage}")`;
    }
  });
  document.querySelectorAll('.cta-band').forEach((el) => {
    if (ctaImage) {
      el.style.backgroundImage = `linear-gradient(rgba(12,20,38,0.9), rgba(12,20,38,0.9)), url("${ctaImage}")`;
    }
  });

  const scrollToHash = () => {
    const id = decodeURIComponent(location.hash.replace('#', ''));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - (document.querySelector('.header')?.offsetHeight || 84) - 16;
    window.scrollTo(0, top);
  };
  scrollToHash();
  window.addEventListener('load', scrollToHash);
  if (window.initSite) window.initSite();
})();
