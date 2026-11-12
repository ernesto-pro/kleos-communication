/* ==========================================================================
   KLEOS COMMUNICATION — main.js
   Vanilla JS · no dependencies
   ========================================================================== */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header ---------- */
  const header = document.querySelector('.site-header');
  const progressBar = document.querySelector('[data-scroll-progress]');
  let lastScroll = window.scrollY;
  const onScrollHeader = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('is-solid', y > 24);
      const hide = y > 420 && y > lastScroll && !document.body.classList.contains('nav-open');
      header.classList.toggle('is-hidden', hide);
      document.documentElement.classList.toggle('header-hidden', hide);
    }
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
    lastScroll = y;
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  window.addEventListener('resize', onScrollHeader);

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const closeNav = () => {
    document.body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  };
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) {
        const first = mobileNav.querySelector('a');
        if (first) setTimeout(() => first.focus(), 120);
      }
    });
    mobileNav.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        closeNav();
        if (toggle) toggle.focus();
      }
    });
  }

  /* ---------- Split heading reveal ---------- */
  const splitTargets = Array.from(new Set(Array.from(document.querySelectorAll(
    'h1, .section-head h2, .statement__title, .ig-head h2, .reel-head h2, .spotlight__body h2, .cta h2, .about-grid h2'
  )).filter((el) => !el.closest('.lead-form') && !el.closest('.next-project') && !el.dataset.noSplit)));

  const splitHeading = (el) => {
    if (el.dataset.splitDone) return;
    let wordIndex = 0;
    const make = (node) => {
      const frag = document.createDocumentFragment();
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          const word = document.createElement('span');
          word.className = 'w';
          const inner = document.createElement('span');
          inner.className = 'wi';
          inner.style.setProperty('--w', wordIndex++);
          inner.textContent = part;
          word.appendChild(inner);
          frag.appendChild(word);
        });
      } else if (node.nodeType === 1) {
        const clone = node.cloneNode(false);
        Array.from(node.childNodes).forEach((child) => clone.appendChild(make(child)));
        frag.appendChild(clone);
      }
      return frag;
    };
    const frag = document.createDocumentFragment();
    Array.from(el.childNodes).forEach((child) => frag.appendChild(make(child)));
    el.replaceChildren(frag);
    el.classList.add('split');
    el.dataset.splitDone = 'true';
  };

  if (!reduceMotion && splitTargets.length) {
    splitTargets.forEach(splitHeading);
    const splitIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          splitIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.split').forEach((el) => {
      if (el.closest('.hero, .case-hero, .page-hero')) {
        setTimeout(() => el.classList.add('is-in'), 120);
      } else {
        splitIO.observe(el);
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Auto counters ---------- */
  document.querySelectorAll('.case-result strong, .stat strong').forEach((el) => {
    if (el.dataset.count) return;
    const raw = el.textContent.trim();
    if (!raw || /\s/.test(raw)) return;
    const match = raw.match(/^([^\d]*)([\d.,]+)([^\d]*)$/);
    if (!match) return;
    const numeric = match[2].replace(/\./g, '').replace(',', '.');
    if (!numeric || Number.isNaN(Number(numeric))) return;
    el.dataset.count = numeric;
    el.dataset.prefix = match[1];
    el.dataset.suffix = match[3];
  });

  /* ---------- Count up ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const value = target * eased;
        el.textContent = prefix + (decimals ? value.toFixed(decimals).replace('.', ',') : fmt(value)) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + (decimals ? target.toFixed(decimals).replace('.', ',') : fmt(target)) + suffix;
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { run(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Works filters ---------- */
  const filterBar = document.querySelector('[data-filters]');
  if (filterBar) {
    const cards = Array.from(document.querySelectorAll('.work-card[data-cat], .explorer-row[data-cat]'));
    const countEl = document.querySelector('[data-visible-count]');
    const buttons = Array.from(filterBar.querySelectorAll('.filter'));
    const empty = document.querySelector('[data-explorer-empty]');
    const apply = (cat) => {
      const visible = [];
      cards.forEach((card) => {
        const cats = card.dataset.cat.split(' ');
        const show = cat === 'all' || cats.includes(cat);
        card.classList.toggle('is-hidden', !show);
        if (show) visible.push(card);
      });
      if (countEl) countEl.textContent = String(visible.length).padStart(2, '0');
      if (empty) empty.hidden = visible.length > 0;
      buttons.forEach((b) => b.setAttribute('aria-pressed', b.dataset.filter === cat ? 'true' : 'false'));
      document.dispatchEvent(new CustomEvent('kleos:filter', { detail: { visible } }));
    };
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => apply(btn.dataset.filter));
    });
    apply('all');
  }

  /* ---------- Portfolio reel ---------- */
  const reel = document.querySelector('[data-reel]');
  if (reel) {
    const viewport = reel.querySelector('[data-reel-viewport]');
    const cards = Array.from(reel.querySelectorAll('.reel-card'));
    const prev = document.querySelector('[data-reel-prev]');
    const next = document.querySelector('[data-reel-next]');
    const currentEl = document.querySelector('[data-reel-current]');
    const progressEl = document.querySelector('[data-reel-progress]');

    const gap = () => parseFloat(getComputedStyle(reel.querySelector('.reel__track')).gap) || 0;
    const step = () => (cards[0] ? cards[0].getBoundingClientRect().width + gap() : viewport.clientWidth);

    const update = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      const ratio = max > 0 ? Math.min(Math.max(viewport.scrollLeft / max, 0), 1) : 1;
      const nearest = Math.round(ratio * (cards.length - 1));
      if (currentEl) currentEl.textContent = String(nearest + 1).padStart(2, '0');
      if (progressEl) progressEl.style.transform = 'scaleX(' + Math.max(ratio, 0.02) + ')';
      if (prev) prev.disabled = viewport.scrollLeft <= 2;
      if (next) next.disabled = viewport.scrollLeft >= max - 2;
    };

    let ticking = false;
    viewport.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });

    if (prev) prev.addEventListener('click', () => viewport.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    if (next) next.addEventListener('click', () => viewport.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }));

    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); viewport.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); viewport.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });

    let down = false;
    let startX = 0;
    let startScroll = 0;
    let moved = 0;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true;
      moved = 0;
      startX = e.clientX;
      startScroll = viewport.scrollLeft;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      viewport.scrollLeft = startScroll - dx;
    });
    const endDrag = () => {
      if (!down) return;
      down = false;
      viewport.classList.remove('is-dragging');
      const index = Math.round(viewport.scrollLeft / step());
      viewport.scrollTo({ left: index * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('click', (e) => {
      if (moved > 7) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    update();
    setTimeout(update, 300);
  }

  /* ---------- Project explorer ---------- */
  const explorer = document.querySelector('[data-explorer]');
  if (explorer) {
    const rows = Array.from(explorer.querySelectorAll('.explorer-row'));
    const slides = Array.from(explorer.querySelectorAll('.explorer-slide'));
    const open = explorer.querySelector('[data-explorer-open]');
    const indexEl = explorer.querySelector('[data-explorer-index]');
    const captionEl = explorer.querySelector('[data-explorer-caption]');

    const activate = (row) => {
      if (!row) return;
      rows.forEach((r) => r.classList.toggle('is-active', r === row));
      const slug = row.dataset.project;
      slides.forEach((slide) => slide.classList.toggle('is-active', slide.dataset.slide === slug));
      if (open) open.href = row.href;
      if (indexEl) indexEl.textContent = row.querySelector('.explorer-row__num') ? row.querySelector('.explorer-row__num').textContent : '';
      if (captionEl) captionEl.textContent = row.querySelector('.explorer-row__name') ? row.querySelector('.explorer-row__name').textContent : '';
    };

    rows.forEach((row) => {
      row.addEventListener('mouseenter', () => activate(row));
      row.addEventListener('focus', () => activate(row));
    });
    activate(rows[0]);

    document.addEventListener('kleos:filter', (e) => {
      const visible = rows.filter((row) => !row.classList.contains('is-hidden'));
      if (visible.length) activate(visible[0]);
    });
  }

  /* ---------- Works index / grid toggle ---------- */
  const worksView = document.querySelector('[data-works-view]');
  const worksExplorer = document.querySelector('[data-explorer]');
  if (worksView && worksExplorer) {
    const viewButtons = Array.from(worksView.querySelectorAll('[data-view]'));
    const setView = (view) => {
      const grid = view === 'grid';
      worksExplorer.classList.toggle('is-grid', grid);
      viewButtons.forEach((btn) => btn.setAttribute('aria-pressed', btn.dataset.view === view ? 'true' : 'false'));
      try { window.localStorage.setItem('kleos:works-view', view); } catch (err) {}
    };
    viewButtons.forEach((btn) => {
      btn.addEventListener('click', () => setView(btn.dataset.view));
    });
    let savedView = 'index';
    try { savedView = window.localStorage.getItem('kleos:works-view') || 'index'; } catch (err) {}
    if (savedView === 'grid') setView('grid');
  }

  /* ---------- Mega menu ---------- */
  const megaItems = Array.from(document.querySelectorAll('[data-mega]'));
  if (megaItems.length) {
    let closeTimer = null;
    const closeAll = (except) => {
      megaItems.forEach((item) => {
        if (item === except) return;
        item.classList.remove('is-open');
        const link = item.querySelector('.nav-link--mega');
        if (link) link.setAttribute('aria-expanded', 'false');
      });
    };
    const open = (item) => {
      window.clearTimeout(closeTimer);
      closeAll(item);
      item.classList.add('is-open');
      const link = item.querySelector('.nav-link--mega');
      if (link) link.setAttribute('aria-expanded', 'true');
    };
    megaItems.forEach((item) => {
      const link = item.querySelector('.nav-link--mega');
      item.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        open(item);
      });
      item.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'touch') return;
        closeTimer = window.setTimeout(() => {
          item.classList.remove('is-open');
          if (link) link.setAttribute('aria-expanded', 'false');
        }, 160);
      });
      item.addEventListener('focusin', () => open(item));
      item.addEventListener('focusout', (e) => {
        if (!item.contains(e.relatedTarget)) {
          item.classList.remove('is-open');
          if (link) link.setAttribute('aria-expanded', 'false');
        }
      });
      if (link) {
        link.addEventListener('click', (e) => {
          if (window.matchMedia('(pointer: coarse)').matches && !item.classList.contains('is-open')) {
            e.preventDefault();
            open(item);
          }
        });
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-mega]')) closeAll();
    });
    window.addEventListener('scroll', () => closeAll(), { passive: true });
  }

  /* ---------- Search overlay ---------- */
  const searchOverlay = document.getElementById('site-search');
  const searchInput = searchOverlay ? searchOverlay.querySelector('[data-search-input]') : null;
  const searchResults = searchOverlay ? searchOverlay.querySelector('[data-search-results]') : null;
  const searchStatus = searchOverlay ? searchOverlay.querySelector('[data-search-status]') : null;
  const searchDataEl = document.getElementById('kleos-search-data');
  if (searchOverlay && searchInput && searchResults) {
    let items = [];
    try { items = JSON.parse(searchDataEl ? searchDataEl.textContent : '[]'); } catch (err) { items = []; }
    let focusBack = null;
    let activeIndex = -1;
    let rendered = [];
    let activeType = 'all';
    let recent = [];
    try { recent = JSON.parse(window.localStorage.getItem('kleos:recent') || '[]'); } catch (err) { recent = []; }
    if (!Array.isArray(recent)) recent = [];

    const recentBox = searchOverlay.querySelector('[data-search-recent]');
    const recentRow = searchOverlay.querySelector('[data-search-recent-row]');
    const searchCount = searchOverlay.querySelector('[data-search-count]');
    const searchChips = Array.from(searchOverlay.querySelectorAll('[data-search-type]'));

    const typeIcon = (type) => type === 'Servizio'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>'
      : type === 'Pagina'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></svg>';

    const recentIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/></svg>';

    const norm = (value) => (value || '')
      .toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const escapeHTML = (value) => (value || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));

    const highlight = (text, query) => {
      const safe = escapeHTML(text);
      if (!query) return safe;
      const clean = norm(text);
      const q = norm(query);
      const at = clean.indexOf(q);
      if (at < 0) return safe;
      return escapeHTML(text.slice(0, at)) + '<mark>' + escapeHTML(text.slice(at, at + q.length)) + '</mark>' + escapeHTML(text.slice(at + q.length));
    };

    const saveRecent = (value) => {
      const clean = (value || '').trim();
      if (clean.length < 2) return;
      recent = [clean, ...recent.filter((entry) => norm(entry) !== norm(clean))].slice(0, 5);
      try { window.localStorage.setItem('kleos:recent', JSON.stringify(recent)); } catch (err) {}
    };

    const renderRecent = () => {
      if (!recentBox || !recentRow) return;
      const show = !searchInput.value.trim() && recent.length > 0;
      recentBox.hidden = !show;
      if (!show) return;
      recentRow.innerHTML = recent.map((entry) =>
        `<button class="search-recent__item" type="button" data-recent="${escapeHTML(entry)}">${recentIcon}${escapeHTML(entry)}</button>`
      ).join('') + '<button class="search-recent__clear" type="button" data-recent-clear>Svuota</button>';
    };

    const render = (query) => {
      const q = norm(query).trim();
      const pool = activeType === 'all' ? items : items.filter((item) => item.type === activeType);
      if (!q) {
        const order = { 'Progetto': 0, 'Servizio': 1, 'Pagina': 2 };
        const quotas = { 'Progetto': 3, 'Servizio': 2, 'Pagina': 2 };
        const counts = {};
        rendered = pool.slice()
          .sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9))
          .filter((item) => {
            if (activeType !== 'all') return true;
            counts[item.type] = (counts[item.type] || 0) + 1;
            return counts[item.type] <= (quotas[item.type] || 2);
          })
          .slice(0, 7);
      } else {
        const terms = q.split(/\s+/).filter(Boolean);
        rendered = pool
          .map((item) => {
            const title = norm(item.title);
            const desc = norm(item.desc);
            const tags = norm(item.tags);
            const meta = norm(item.meta);
            let score = 0;
            terms.forEach((term) => {
              if (title.startsWith(term)) score += 12;
              else if (title.includes(term)) score += 8;
              if (tags.includes(term)) score += 4;
              if (meta.includes(term)) score += 3;
              if (desc.includes(term)) score += 2;
            });
            return { item, score };
          })
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map((entry) => entry.item);
      }
      activeIndex = rendered.length ? 0 : -1;
      if (searchStatus) {
        searchStatus.textContent = rendered.length
          ? rendered.length + (rendered.length === 1 ? ' risultato' : ' risultati') + (activeType === 'all' ? '' : ' in ' + activeType.toLowerCase())
          : 'Nessun risultato';
      }
      if (searchCount) {
        searchCount.textContent = rendered.length + (rendered.length === 1 ? ' risultato' : ' risultati');
      }
      renderRecent();
      if (!rendered.length) {
        searchResults.innerHTML = '<div class="search-panel__empty"><strong>Nessun risultato</strong>Prova con “branding”, “social”, “sviluppo” o il nome di un progetto.<button class="search-empty__reset" type="button" data-reset-search>Mostra tutti i contenuti</button></div>';
        searchResults.removeAttribute('aria-activedescendant');
        return;
      }
      searchResults.innerHTML = rendered.map((item, i) => {
        const thumb = item.thumb
          ? `<span class="search-result__thumb"><img src="${item.thumb}" alt="" width="48" height="48" loading="lazy" decoding="async"></span>`
          : `<span class="search-result__thumb" aria-hidden="true">${typeIcon(item.type)}</span>`;
        const tag = item.tags ? item.tags.split(',')[0].trim() : '';
        return `<a class="search-result${i === activeIndex ? ' is-active' : ''}" role="option" id="search-opt-${i}" data-index="${i}" aria-selected="${i === activeIndex}" href="${item.url}">
          ${thumb}
          <span class="search-result__body">
            <span class="search-result__kicker">${item.type}${tag ? ' · <b>' + escapeHTML(tag) + '</b>' : ''}</span>
            <span class="search-result__title">${highlight(item.title, query)}</span>
            <span class="search-result__desc">${escapeHTML(item.desc)}</span>
          </span>
          <span class="search-result__meta">${escapeHTML(item.meta || '')}</span>
        </a>`;
      }).join('');
      updateActive(false);
    };

    const updateActive = (scroll) => {
      const nodes = Array.from(searchResults.querySelectorAll('.search-result'));
      nodes.forEach((node, i) => {
        const on = i === activeIndex;
        node.classList.toggle('is-active', on);
        node.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on && scroll) node.scrollIntoView({ block: 'nearest' });
      });
      if (activeIndex > -1) searchInput.setAttribute('aria-activedescendant', 'search-opt-' + activeIndex);
      else searchInput.removeAttribute('aria-activedescendant');
    };

    const openSearch = () => {
      focusBack = document.activeElement;
      searchOverlay.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      searchInput.value = '';
      activeType = 'all';
      searchChips.forEach((chip) => chip.setAttribute('aria-pressed', chip.dataset.searchType === 'all' ? 'true' : 'false'));
      render('');
      window.requestAnimationFrame(() => {
        searchOverlay.classList.add('is-open');
        searchInput.focus();
      });
    };

    const closeSearch = () => {
      if (searchOverlay.hidden) return;
      searchOverlay.classList.remove('is-open');
      searchInput.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      const finish = () => { searchOverlay.hidden = true; };
      window.setTimeout(finish, reduceMotion ? 0 : 240);
      if (focusBack && typeof focusBack.focus === 'function') focusBack.focus();
    };

    document.querySelectorAll('[data-search-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeNav();
        openSearch();
      });
    });
    searchOverlay.querySelectorAll('[data-search-close]').forEach((btn) => {
      btn.addEventListener('click', closeSearch);
    });

    searchInput.addEventListener('input', () => {
      searchInput.setAttribute('aria-expanded', 'true');
      render(searchInput.value);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && rendered.length) {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % rendered.length;
        updateActive(true);
      } else if (e.key === 'ArrowUp' && rendered.length) {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + rendered.length) % rendered.length;
        updateActive(true);
      } else if (e.key === 'Enter') {
        const active = rendered[activeIndex];
        if (active) {
          e.preventDefault();
          saveRecent(searchInput.value || active.title);
          window.location.href = active.url;
        }
      }
    });

    searchChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        activeType = chip.dataset.searchType;
        searchChips.forEach((other) => other.setAttribute('aria-pressed', other === chip ? 'true' : 'false'));
        render(searchInput.value);
        searchInput.focus();
      });
    });

    if (recentRow) {
      recentRow.addEventListener('click', (e) => {
        const clear = e.target.closest('[data-recent-clear]');
        if (clear) {
          recent = [];
          try { window.localStorage.removeItem('kleos:recent'); } catch (err) {}
          renderRecent();
          return;
        }
        const entry = e.target.closest('[data-recent]');
        if (!entry) return;
        searchInput.value = entry.dataset.recent;
        searchInput.setAttribute('aria-expanded', 'true');
        render(searchInput.value);
        searchInput.focus();
      });
    }

    searchResults.addEventListener('click', (e) => {
      const reset = e.target.closest('[data-reset-search]');
      if (reset) {
        e.preventDefault();
        activeType = 'all';
        searchChips.forEach((chip) => chip.setAttribute('aria-pressed', chip.dataset.searchType === 'all' ? 'true' : 'false'));
        searchInput.value = '';
        render('');
        searchInput.focus();
        return;
      }
      const link = e.target.closest('.search-result');
      if (link) {
        const title = link.querySelector('.search-result__title');
        saveRecent(searchInput.value || (title ? title.textContent : ''));
      }
    });
    searchResults.addEventListener('pointermove', (e) => {
      const row = e.target.closest('.search-result');
      if (!row) return;
      activeIndex = Number(row.dataset.index);
      updateActive(false);
    });
    searchOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(searchOverlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    if (!/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)) {
      document.querySelectorAll('.header-search kbd, .mobile-nav__search kbd').forEach((kbd) => {
        kbd.textContent = 'Ctrl K';
      });
    }
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchOverlay.hidden) openSearch(); else closeSearch();
      }
    });
  }

  /* ---------- Project journey ---------- */
  const journey = document.querySelector('[data-journey]');
  if (journey) {
    const viewport = journey.querySelector('[data-journey-viewport]');
    const slides = Array.from(journey.querySelectorAll('[data-journey-slide]'));
    const currentEl = journey.querySelector('[data-journey-current]');
    const progressEl = journey.querySelector('[data-journey-progress]');
    const closeBtn = journey.querySelector('[data-journey-close]');
    let journeyOpen = false;

    const pad = (n) => String(n).padStart(2, '0');
    const index = () => {
      if (!viewport || !slides.length) return 0;
      return Math.min(Math.max(Math.round(viewport.scrollLeft / viewport.clientWidth), 0), slides.length - 1);
    };
    const sync = () => {
      const i = index();
      if (currentEl) currentEl.textContent = pad(i + 1);
      if (progressEl) progressEl.style.transform = 'scaleX(' + ((i + 1) / slides.length) + ')';
      journey.querySelectorAll('[data-journey-prev]').forEach((btn) => { btn.disabled = i === 0; });
      journey.querySelectorAll('[data-journey-next]').forEach((btn) => { btn.disabled = i === slides.length - 1; });
    };
    const go = (delta) => {
      if (!viewport) return;
      const i = Math.min(Math.max(index() + delta, 0), slides.length - 1);
      viewport.scrollTo({ left: i * viewport.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    const openJourney = (start) => {
      journeyOpen = true;
      if (typeof journey.showModal === 'function') journey.showModal();
      else journey.setAttribute('open', '');
      document.documentElement.style.overflow = 'hidden';
      if (viewport) {
        viewport.scrollLeft = (start || 0) * viewport.clientWidth;
        sync();
      }
      window.setTimeout(() => { if (closeBtn) closeBtn.focus(); }, 60);
    };
    const closeJourney = () => {
      journeyOpen = false;
      document.documentElement.style.overflow = '';
      if (typeof journey.close === 'function') journey.close();
      else journey.removeAttribute('open');
    };

    document.querySelectorAll('[data-journey-open]').forEach((btn) => {
      btn.addEventListener('click', () => openJourney(0));
    });
    journey.querySelectorAll('[data-journey-close]').forEach((btn) => {
      btn.addEventListener('click', closeJourney);
    });
    journey.querySelectorAll('[data-journey-prev]').forEach((btn) => btn.addEventListener('click', () => go(-1)));
    journey.querySelectorAll('[data-journey-next]').forEach((btn) => btn.addEventListener('click', () => go(1)));

    let jTicking = false;
    if (viewport) {
      viewport.addEventListener('scroll', () => {
        if (!jTicking) {
          requestAnimationFrame(() => { sync(); jTicking = false; });
          jTicking = true;
        }
      }, { passive: true });
      viewport.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      });

      let down = false;
      let startX = 0;
      let startScroll = 0;
      let moved = 0;
      viewport.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (e.target.closest('a, button')) return;
        down = true; moved = 0; startX = e.clientX; startScroll = viewport.scrollLeft;
        viewport.classList.add('is-dragging');
        viewport.setPointerCapture(e.pointerId);
      });
      viewport.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        viewport.scrollLeft = startScroll - dx;
      });
      const endDrag = () => {
        if (!down) return;
        down = false;
        viewport.classList.remove('is-dragging');
        const i = Math.round(viewport.scrollLeft / viewport.clientWidth);
        viewport.scrollTo({ left: i * viewport.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
      };
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
      viewport.addEventListener('click', (e) => {
        if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
      }, true);
    }
    journey.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeJourney();
    });
    journey.addEventListener('close', () => {
      journeyOpen = false;
      document.documentElement.style.overflow = '';
    });
    document.addEventListener('keydown', (e) => {
      if (!journeyOpen) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'Escape') closeJourney();
    });
  }

  /* ---------- Service nav active state ---------- */
  const serviceNav = document.querySelector('[data-service-nav]');
  if (serviceNav) {
    const links = Array.from(serviceNav.querySelectorAll('[data-service-link]'));
    const blocks = Array.from(document.querySelectorAll('[data-service]'));
    if ('IntersectionObserver' in window && blocks.length) {
      const sio = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          links.forEach((link) => {
            const on = link.dataset.serviceLink === id;
            link.classList.toggle('is-active', on);
            if (on) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      blocks.forEach((block) => sio.observe(block));
    }
  }

  /* ---------- Conversion dock ---------- */
  const dock = document.querySelector('[data-conv-dock]');
  if (dock && document.body.dataset.page !== 'contatti') {
    let dismissed = false;
    try { dismissed = localStorage.getItem('kleos_dock_dismissed') === '1'; } catch (err) { /* noop */ }
    if (!dismissed) {
      let shown = false;
      const showDock = () => {
        if (shown) return;
        const cookie = document.getElementById('cookie-bar');
        let cookieChoice = null;
        try { cookieChoice = localStorage.getItem('kleos_cookie_choice'); } catch (err) { /* noop */ }
        if (cookie && !cookieChoice) {
          window.setTimeout(showDock, 2500);
          return;
        }
        shown = true;
        dock.hidden = false;
        window.requestAnimationFrame(() => dock.classList.add('is-visible'));
      };
      const onDockScroll = () => {
        if (window.scrollY > 900) showDock();
      };
      window.addEventListener('scroll', onDockScroll, { passive: true });
      window.setTimeout(showDock, 9000);
      const close = dock.querySelector('[data-conv-close]');
      if (close) {
        close.addEventListener('click', () => {
          dock.classList.remove('is-visible');
          try { localStorage.setItem('kleos_dock_dismissed', '1'); } catch (err) { /* noop */ }
          window.setTimeout(() => { dock.hidden = true; }, reduceMotion ? 0 : 420);
        });
      }
    }
  }

  /* ---------- Magnetic buttons ---------- */
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    document.querySelectorAll('.btn, .reel-arrow, .ig-handle').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.14;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.18;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Hero spotlight + tilt ---------- */
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        hero.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    }

    document.querySelectorAll('[data-tilt]').forEach((el) => {
      const stage = el.closest('.hero-case') || el;
      stage.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = 'rotateX(' + (-y * 4) + 'deg) rotateY(' + (x * 5) + 'deg)';
      });
      stage.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Hero featured switcher ---------- */
  const heroCase = document.querySelector('[data-hero-case]');
  if (heroCase) {
    const heroSlides = Array.from(heroCase.querySelectorAll('[data-hero-slide]'));
    const heroTabs = Array.from(heroCase.querySelectorAll('[data-hero-tab]'));
    let heroIndex = 0;
    let heroTimer = null;
    let heroHover = false;
    let heroVisible = true;

    const heroHydrate = (slide) => {
      const im = slide.querySelector('img[data-src]');
      if (!im) return;
      if (im.dataset.srcset) im.srcset = im.dataset.srcset;
      if (im.dataset.src) im.src = im.dataset.src;
      im.removeAttribute('data-src');
      im.removeAttribute('data-srcset');
    };

    const heroShow = (next) => {
      heroIndex = (next + heroSlides.length) % heroSlides.length;
      heroSlides.forEach((slide, n) => {
        const on = n === heroIndex;
        if (on) heroHydrate(slide);
        slide.classList.toggle('is-active', on);
        slide.setAttribute('aria-hidden', on ? 'false' : 'true');
        slide.tabIndex = on ? 0 : -1;
      });
      heroTabs.forEach((tab, n) => {
        const on = n === heroIndex;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };

    const heroStop = () => {
      if (heroTimer) { window.clearInterval(heroTimer); heroTimer = null; }
    };
    const heroStart = () => {
      heroStop();
      if (reduceMotion || heroHover || !heroVisible || document.hidden) return;
      heroTimer = window.setInterval(() => heroShow(heroIndex + 1), 6500);
    };

    heroTabs.forEach((tab, n) => {
      tab.addEventListener('click', () => { heroShow(n); heroStart(); });
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        const step = event.key === 'ArrowRight' ? 1 : -1;
        heroShow(heroIndex + step);
        heroTabs[heroIndex].focus();
        heroStart();
      });
    });

    heroCase.addEventListener('pointerenter', () => { heroHover = true; heroStop(); });
    heroCase.addEventListener('pointerleave', () => { heroHover = false; heroStart(); });
    heroCase.addEventListener('focusin', () => { heroHover = true; heroStop(); });
    heroCase.addEventListener('focusout', () => {
      if (!heroCase.contains(document.activeElement)) { heroHover = false; heroStart(); }
    });
    document.addEventListener('visibilitychange', heroStart);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => { heroVisible = entry.isIntersecting; });
        heroStart();
      }, { threshold: 0.2 }).observe(heroCase);
    }

    const heroPreload = () => heroSlides.forEach(heroHydrate);
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(heroPreload, { timeout: 4000 });
    } else {
      window.addEventListener('load', () => window.setTimeout(heroPreload, 2500));
    }

    heroStart();
  }

  /* ---------- Parallax ---------- */
  const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
  if (parallaxEls.length && !reduceMotion) {
    let pTicking = false;
    const updateParallax = () => {
      parallaxEls.forEach((el) => {
        const media = el.querySelector('img');
        if (!media) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.bottom < -80 || rect.top > vh + 80) return;
        const offset = ((rect.top + rect.height / 2) - vh / 2) / vh;
        media.style.transform = 'translate3d(0,' + (offset * -42) + 'px,0) scale(1.1)';
      });
      pTicking = false;
    };
    const requestParallax = () => {
      if (!pTicking) {
        requestAnimationFrame(updateParallax);
        pTicking = true;
      }
    };
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);
    updateParallax();
  }

  /* ---------- Lightbox ---------- */
  const galleryButtons = Array.from(document.querySelectorAll('[data-lightbox]'));
  const dialog = document.getElementById('lightbox');
  if (galleryButtons.length && dialog) {
    const img = dialog.querySelector('.lightbox__img');
    const count = dialog.querySelector('.lightbox__count');
    let current = 0;
    const show = (i) => {
      current = (i + galleryButtons.length) % galleryButtons.length;
      const btn = galleryButtons[current];
      const source = btn.dataset.lightbox;
      img.src = source;
      img.alt = btn.querySelector('img') ? btn.querySelector('img').alt : '';
      if (count) count.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(galleryButtons.length).padStart(2, '0');
    };
    galleryButtons.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        show(i);
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      });
    });
    dialog.querySelector('.lightbox__close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.lightbox__prev').addEventListener('click', () => show(current - 1));
    dialog.querySelector('.lightbox__next').addEventListener('click', () => show(current + 1));
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  /* ---------- Forms (static demo) ---------- */
  document.querySelectorAll('form[data-demo]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const success = form.parentElement.querySelector('.form-success');
      const fields = form.querySelector('.form-fields');
      if (fields) fields.hidden = true;
      if (success) {
        success.classList.add('is-visible');
        success.setAttribute('tabindex', '-1');
        success.focus();
      }
      form.reset();
    });
  });

  /* ---------- Cookie bar ---------- */
  const cookie = document.getElementById('cookie-bar');
  if (cookie) {
    let choice = null;
    try { choice = localStorage.getItem('kleos_cookie_choice'); } catch (err) { /* noop */ }
    if (!choice) {
      setTimeout(() => cookie.classList.add('is-visible'), 1400);
    }
    cookie.querySelectorAll('[data-cookie]').forEach((btn) => {
      btn.addEventListener('click', () => {
        try { localStorage.setItem('kleos_cookie_choice', btn.dataset.cookie); } catch (err) { /* noop */ }
        cookie.classList.remove('is-visible');
      });
    });
  }

  /* ---------- Smooth anchor with header offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerEl = document.querySelector('.site-header');
      const serviceNavEl = document.querySelector('[data-service-nav]');
      const headerHidden = headerEl && headerEl.classList.contains('is-hidden');
      const headerH = headerHidden ? 0 : (headerEl ? Math.min(headerEl.offsetHeight || 68, 68) : 68);
      const extraH = serviceNavEl ? serviceNavEl.offsetHeight : 0;
      const offset = target.classList.contains('service-block')
        ? Math.max(headerH + extraH - 84, 0)
        : headerH + extraH + 14;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
