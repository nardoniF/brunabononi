function initSite() {
  document.body.classList.add('js-enabled');

  const reveals = document.querySelectorAll('.reveal');
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    reveals.forEach((el) => {
      if (el.getBoundingClientRect().top < windowHeight - 80) {
        el.classList.add('active');
      }
    });
  };

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav && !toggle.dataset.bound) {
    toggle.dataset.bound = 'true';
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menu');
      });
    });
  }

  const nextField = document.getElementById('next-url');
  if (nextField) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    nextField.value = `${url.href}?enviado=1`;
  }

  const sucesso = document.getElementById('form-sucesso');
  if (sucesso && new URLSearchParams(window.location.search).get('enviado') === '1') {
    sucesso.hidden = false;
  }

  if (!window.__revealBound) {
    window.__revealBound = true;
    window.addEventListener('scroll', revealOnScroll);
  }
  revealOnScroll();
}

window.initSite = initSite;
