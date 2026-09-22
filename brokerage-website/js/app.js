(() => {
  const QUOTES = [
    { symbol: 'NLX', name: 'Northline Index ETF', price: 412.18, change: 1.24 },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 198.42, change: -0.86 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 428.9, change: 0.54 },
    { symbol: 'VTI', name: 'Vanguard Total Stock', price: 268.15, change: 0.71 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 186.33, change: 1.12 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 165.08, change: -0.42 },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', price: 412.55, change: 0.18 },
    { symbol: 'SCHD', name: 'Schwab US Dividend', price: 82.44, change: -0.31 },
  ];

  const STORAGE_KEY = 'northline-portfolio-v1';
  const DEFAULT_PORTFOLIO = {
    cash: 25000,
    holdings: [
      { symbol: 'VTI', shares: 24 },
      { symbol: 'NLX', shares: 15 },
      { symbol: 'MSFT', shares: 8 },
    ],
  };

  function money(n) {
    return n.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  }

  function pct(n) {
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}%`;
  }

  function getQuote(symbol) {
    return QUOTES.find((q) => q.symbol === symbol);
  }

  function loadPortfolio() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_PORTFOLIO);
      return JSON.parse(raw);
    } catch {
      return structuredClone(DEFAULT_PORTFOLIO);
    }
  }

  function savePortfolio(p) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }

  function jitterQuotes() {
    QUOTES.forEach((q) => {
      const delta = (Math.random() - 0.48) * q.price * 0.0018;
      q.price = Math.max(1, +(q.price + delta).toFixed(2));
      q.change = +((q.change || 0) + delta * 0.15).toFixed(2);
    });
  }

  function showToast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('is-visible'), 2800);
  }

  /* Nav */
  function initNav() {
    const nav = document.querySelector('.site-nav');
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    if (nav && !nav.classList.contains('is-scrolled')) {
      const onScroll = () => {
        nav.classList.toggle('is-scrolled', window.scrollY > 24);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      links.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          links.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* Reveal on scroll */
  function initReveal() {
    const nodes = document.querySelectorAll('.reveal');
    if (!nodes.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    nodes.forEach((n) => io.observe(n));
  }

  /* Home tickers */
  function renderHomeTickers() {
    const root = document.getElementById('home-tickers');
    if (!root) return;
    const slice = QUOTES.slice(0, 4);
    root.innerHTML = slice
      .map((q) => {
        const up = q.change >= 0;
        return `
          <article class="ticker">
            <div class="ticker-sym">${q.symbol}</div>
            <div class="ticker-name">${q.name}</div>
            <div class="ticker-price">${money(q.price)}</div>
            <div class="ticker-change ${up ? 'up' : 'down'}">
              ${up ? '+' : ''}${q.change.toFixed(2)} (${pct((q.change / q.price) * 100)})
            </div>
          </article>`;
      })
      .join('');
  }

  /* Markets page */
  let tradeSymbol = null;

  function renderMarkets(filter = '') {
    const body = document.getElementById('markets-body');
    if (!body) return;
    const q = filter.trim().toLowerCase();
    const rows = QUOTES.filter(
      (item) =>
        !q ||
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q)
    );
    body.innerHTML = rows
      .map((item) => {
        const up = item.change >= 0;
        return `
          <tr>
            <td class="sym">${item.symbol}</td>
            <td>${item.name}</td>
            <td>${money(item.price)}</td>
            <td class="change ${up ? 'up' : 'down'}">
              ${up ? '+' : ''}${item.change.toFixed(2)}
            </td>
            <td>
              <button class="trade-btn" type="button" data-symbol="${item.symbol}">Trade</button>
            </td>
          </tr>`;
      })
      .join('');

    body.querySelectorAll('.trade-btn').forEach((btn) => {
      btn.addEventListener('click', () => openTradeModal(btn.dataset.symbol));
    });
  }

  function openTradeModal(symbol) {
    tradeSymbol = symbol;
    const quote = getQuote(symbol);
    const modal = document.getElementById('trade-modal');
    const title = document.getElementById('trade-title');
    const sub = document.getElementById('trade-sub');
    if (!modal || !quote) return;
    title.textContent = `Trade ${symbol}`;
    sub.textContent = `${quote.name} · ${money(quote.price)}`;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeTradeModal() {
    const modal = document.getElementById('trade-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    tradeSymbol = null;
  }

  function initMarkets() {
    if (!document.getElementById('markets-body')) return;
    renderMarkets();
    const search = document.getElementById('market-search');
    const refresh = document.getElementById('refresh-quotes');
    search?.addEventListener('input', () => renderMarkets(search.value));
    refresh?.addEventListener('click', () => {
      jitterQuotes();
      renderMarkets(search?.value || '');
      showToast('Quotes refreshed');
    });

    document.getElementById('trade-cancel')?.addEventListener('click', closeTradeModal);
    document.getElementById('trade-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'trade-modal') closeTradeModal();
    });

    document.getElementById('trade-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!tradeSymbol) return;
      const side = document.getElementById('trade-side').value;
      const qty = Math.max(1, parseInt(document.getElementById('trade-qty').value, 10) || 1);
      const quote = getQuote(tradeSymbol);
      const cost = quote.price * qty;
      const portfolio = loadPortfolio();

      if (side === 'buy') {
        if (portfolio.cash < cost) {
          showToast('Insufficient cash for this order');
          return;
        }
        portfolio.cash -= cost;
        const h = portfolio.holdings.find((x) => x.symbol === tradeSymbol);
        if (h) h.shares += qty;
        else portfolio.holdings.push({ symbol: tradeSymbol, shares: qty });
      } else {
        const h = portfolio.holdings.find((x) => x.symbol === tradeSymbol);
        if (!h || h.shares < qty) {
          showToast('Not enough shares to sell');
          return;
        }
        h.shares -= qty;
        portfolio.cash += cost;
        if (h.shares === 0) {
          portfolio.holdings = portfolio.holdings.filter((x) => x.symbol !== tradeSymbol);
        }
      }

      savePortfolio(portfolio);
      closeTradeModal();
      showToast(
        `${side === 'buy' ? 'Bought' : 'Sold'} ${qty} ${tradeSymbol || ''} · ${money(cost)}`
      );
    });
  }

  /* Portfolio page */
  function portfolioTotals(p) {
    let invested = 0;
    let day = 0;
    p.holdings.forEach((h) => {
      const q = getQuote(h.symbol);
      if (!q) return;
      invested += q.price * h.shares;
      day += q.change * h.shares;
    });
    const equity = invested + p.cash;
    return { invested, day, equity };
  }

  function renderPortfolio() {
    if (!document.getElementById('equity-value')) return;
    const p = loadPortfolio();
    const { invested, day, equity } = portfolioTotals(p);
    const dayPct = invested ? (day / invested) * 100 : 0;

    document.getElementById('equity-value').textContent = money(equity);
    const delta = document.getElementById('equity-delta');
    delta.textContent = `${day >= 0 ? '+' : '-'}${money(Math.abs(day))} (${pct(dayPct)}) today`;
    delta.classList.toggle('up', day >= 0);
    delta.classList.toggle('down', day < 0);

    document.getElementById('cash-value').textContent = money(p.cash);
    document.getElementById('invested-value').textContent = money(invested);

    const list = document.getElementById('holdings-list');
    if (!p.holdings.length) {
      list.innerHTML = '<li class="holding"><div><div class="holding-sym">No holdings</div><div class="holding-meta">Buy something on Markets to get started.</div></div></li>';
      return;
    }

    list.innerHTML = p.holdings
      .map((h) => {
        const q = getQuote(h.symbol);
        const value = q ? q.price * h.shares : 0;
        const alloc = invested ? (value / invested) * 100 : 0;
        return `
          <li class="holding">
            <div>
              <div class="holding-sym">${h.symbol}</div>
              <div class="holding-meta">${h.shares} shares · ${q ? q.name : ''}</div>
            </div>
            <div class="holding-value">${money(value)}</div>
            <div class="holding-alloc" title="${alloc.toFixed(1)}%"><span style="width:${alloc}%"></span></div>
          </li>`;
      })
      .join('');
  }

  function initPortfolio() {
    if (!document.getElementById('equity-value')) return;
    renderPortfolio();
    document.getElementById('reset-portfolio')?.addEventListener('click', () => {
      savePortfolio(structuredClone(DEFAULT_PORTFOLIO));
      renderPortfolio();
      showToast('Demo portfolio reset');
    });
  }

  /* Live tick on home */
  function initLiveTick() {
    if (!document.getElementById('home-tickers')) return;
    renderHomeTickers();
    setInterval(() => {
      jitterQuotes();
      renderHomeTickers();
    }, 3500);
  }

  initNav();
  initReveal();
  initLiveTick();
  initMarkets();
  initPortfolio();
})();
