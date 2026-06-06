/* ===========================================================
   E-Portfolio — shared behavior
   nav · scroll reveal · tweak application · project modal
   =========================================================== */
(function () {
  'use strict';

  /* ---------- Tweaks (persisted, applied across pages) ---------- */
  var TWEAK_KEY = 'ep-tweaks-v1';
  var TWEAK_DEFAULTS = { accentHue: 292, fontScale: 1, hero: 'a' };

  function getTweaks() {
    try {
      var saved = JSON.parse(localStorage.getItem(TWEAK_KEY) || '{}');
      return Object.assign({}, TWEAK_DEFAULTS, saved);
    } catch (e) { return Object.assign({}, TWEAK_DEFAULTS); }
  }
  function applyTweaks(t) {
    var root = document.documentElement;
    root.style.setProperty('--accent-h', String(t.accentHue));
    root.style.setProperty('--fs', String(t.fontScale));
    if (document.body) document.body.setAttribute('data-hero', t.hero);
  }
  function setTweak(key, val) {
    var t = getTweaks();
    if (typeof key === 'object') { t = Object.assign(t, key); }
    else { t[key] = val; }
    try { localStorage.setItem(TWEAK_KEY, JSON.stringify(t)); } catch (e) {}
    applyTweaks(t);
    window.dispatchEvent(new CustomEvent('ep:tweaks', { detail: t }));
    return t;
  }

  // Apply ASAP (before DOM ready where possible)
  applyTweaks(getTweaks());

  window.EP = { getTweaks: getTweaks, setTweak: setTweak, applyTweaks: applyTweaks, DEFAULTS: TWEAK_DEFAULTS };

  /* ---------- DOM ready ---------- */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    applyTweaks(getTweaks());

    /* Nav scroll state */
    var nav = document.querySelector('.nav');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* Mobile nav toggle */
    var toggle = document.querySelector('.nav__toggle');
    var links = document.querySelector('.nav__links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) { links.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
      });
    }

    /* Scroll reveal */
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* ---------- Project modal (projects page) ---------- */
    var modal = document.getElementById('project-modal');
    if (modal) {
      var mDialog  = modal.querySelector('.modal__dialog');
      var mClose   = modal.querySelector('.modal__close');
      var mBody    = modal.querySelector('[data-modal-body]');
      var lastFocus = null;
      var currentCarousel = null;

      /* Build an image switcher for any [data-carousel] inside the modal */
      function initCarousels(root) {
        var first = null;
        root.querySelectorAll('[data-carousel]').forEach(function (car) {
          var slides = Array.prototype.slice.call(car.querySelectorAll('.mcarousel__slide'));
          if (!slides.length) return;
          var idx = 0;
          var dots = [];
          var dotsWrap = car.querySelector('.mcarousel__dots');

          function go(n) {
            idx = (n + slides.length) % slides.length;
            slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
            dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
          }

          if (dotsWrap && slides.length > 1) {
            slides.forEach(function (_, i) {
              var d = document.createElement('button');
              d.type = 'button';
              d.className = 'mcarousel__dot' + (i === 0 ? ' is-active' : '');
              d.setAttribute('aria-label', 'Go to image ' + (i + 1));
              d.addEventListener('click', function () { go(i); });
              dotsWrap.appendChild(d);
              dots.push(d);
            });
          }

          var prev = car.querySelector('.mcarousel__btn--prev');
          var next = car.querySelector('.mcarousel__btn--next');
          if (prev) prev.addEventListener('click', function () { go(idx - 1); });
          if (next) next.addEventListener('click', function () { go(idx + 1); });
          if (slides.length < 2) {
            if (prev) prev.style.display = 'none';
            if (next) next.style.display = 'none';
          }

          if (!first) first = { prev: function () { go(idx - 1); }, next: function () { go(idx + 1); } };
        });
        return first;
      }

      function openModal(card) {
        var tpl = card.querySelector('template');
        if (!tpl) return;
        mBody.innerHTML = '';
        mBody.appendChild(tpl.content.cloneNode(true));
        currentCarousel = initCarousels(mBody);
        lastFocus = document.activeElement;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        mDialog.scrollTop = 0;
        mClose.focus();
      }
      function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }

      document.querySelectorAll('.pcard').forEach(function (card) {
        card.addEventListener('click', function () { openModal(card); });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card); }
        });
      });
      mClose.addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) {
        if (e.target === modal || e.target.classList.contains('modal__backdrop')) closeModal();
      });
      document.addEventListener('keydown', function (e) {
        if (!modal.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeModal();
        else if (e.key === 'ArrowLeft' && currentCarousel) currentCarousel.prev();
        else if (e.key === 'ArrowRight' && currentCarousel) currentCarousel.next();
      });
    }
  });
})();
