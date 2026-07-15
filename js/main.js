// LKZ Shop - Main Application

document.addEventListener('DOMContentLoaded', () => {
  Particles.init();
  Navbar.init();
  Theme.init();
  Search.init();
  FAQ.init();
  Auth.init();
  Cart.init();
  Shop.init();
  Console.init();
  ScrollAnimations.init();
});

const LS = {
  get(k, def = null) { try { const d = localStorage.getItem('lkz_' + k); return d ? JSON.parse(d) : def; } catch { return def; } },
  set(k, v) { localStorage.setItem('lkz_' + k, JSON.stringify(v)); },
  remove(k) { localStorage.removeItem('lkz_' + k); }
};

const Particles = {
  init() {
    const c = document.getElementById('particles');
    if (!c) return;
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (Math.random() * 15 + 10) + 's';
      p.style.animationDelay = Math.random() * 10 + 's';
      p.style.width = (Math.random() * 3 + 1) + 'px';
      p.style.height = p.style.width;
      c.appendChild(p);
    }
  }
};

const Navbar = {
  init() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    const links = document.querySelectorAll('.nav-link');
    toggle.addEventListener('click', () => { toggle.classList.toggle('active'); menu.classList.toggle('active'); });
    links.forEach(l => l.addEventListener('click', () => { toggle.classList.remove('active'); menu.classList.remove('active'); }));
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 50));
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      let cur = '';
      sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) cur = s.id; });
      links.forEach(l => { l.classList.toggle('active', l.getAttribute('href') === '#' + cur); });
    });
  }
};

const Theme = {
  init() {
    const toggle = document.getElementById('themeToggle');
    toggle.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
    });
  }
};

const Search = {
  init() {
    const input = document.getElementById('searchInput');
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const q = input.value.trim().toLowerCase();
        if (!q) { Shop.render(produtos); return; }
        const filtered = produtos.filter(p =>
          p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
        );
        Shop.render(filtered);
      }, 300);
    });
  }
};

const FAQ = {
  init() {
    document.querySelectorAll('.faq-item').forEach(item => {
      item.addEventListener('click', () => {
        const was = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!was) item.classList.add('active');
      });
    });
  }
};

const Auth = {
  init() {
    this.overlay = document.getElementById('authOverlay');
    this.btn = document.getElementById('loginBtn');
    this.btnText = document.getElementById('loginBtnText');
    this.tabs = document.querySelectorAll('.auth-tab');
    this.forms = document.querySelectorAll('.auth-form');
    this.loginForm = document.getElementById('loginForm');
    this.registerForm = document.getElementById('registerForm');
    this.loginError = document.getElementById('loginError');
    this.registerError = document.getElementById('registerError');
    this.closeBtn = document.getElementById('authClose');
    this.loggedIn = false;
    this.username = '';

    this.btn.addEventListener('click', () => this.toggle());
    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    this.tabs.forEach(t => t.addEventListener('click', () => this.switchTab(t.dataset.tab)));
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    this.checkSession();
  },

  toggle() { this.loggedIn ? this.handleLogout() : this.open(); },
  open() { this.overlay.classList.add('active'); this.loginError.textContent = ''; this.registerError.textContent = ''; },
  close() { this.overlay.classList.remove('active'); },

  switchTab(tab) {
    this.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    this.forms.forEach(f => f.classList.remove('active'));
    document.getElementById(tab === 'login' ? 'loginForm' : 'registerForm').classList.add('active');
    this.loginError.textContent = '';
    this.registerError.textContent = '';
  },

  handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) { this.loginError.textContent = 'Preencha todos os campos.'; return; }

    const users = LS.get('users', {});
    if (!users[username]) { this.loginError.textContent = 'Usuário não encontrado.'; return; }
    if (users[username].password !== password) { this.loginError.textContent = 'Senha incorreta.'; return; }

    LS.set('session', { username });
    this.setLoggedIn(username);
    this.close();
    Stats.incrementMembers();
  },

  handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    if (!username || !email || !password) { this.registerError.textContent = 'Preencha todos os campos.'; return; }

    const users = LS.get('users', {});
    if (users[username]) { this.registerError.textContent = 'Usuário já existe.'; return; }

    users[username] = { email, password, created: Date.now() };
    LS.set('users', users);
    this.registerError.style.color = '#4ade80';
    this.registerError.textContent = 'Conta criada! Faça login.';
    setTimeout(() => this.switchTab('login'), 1000);
  },

  handleLogout() {
    LS.remove('session');
    this.setLoggedOut();
  },

  checkSession() {
    const s = LS.get('session');
    if (s) this.setLoggedIn(s.username);
  },

  setLoggedIn(username) {
    this.loggedIn = true;
    this.username = username;
    this.btn.classList.add('logged-in');
    this.btnText.textContent = username;
    this.btn.querySelector('i').className = 'fas fa-check-circle';
    Stats.updateDisplay();
  },

  setLoggedOut() {
    this.loggedIn = false;
    this.username = '';
    this.btn.classList.remove('logged-in');
    this.btnText.textContent = 'Entrar';
    this.btn.querySelector('i').className = 'fas fa-user';
  }
};

const Shop = {
  init() {
    this.render(produtos);
    document.querySelectorAll('[data-cat]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = el.dataset.cat;
        const filtered = produtos.filter(p => p.category === cat);
        this.render(filtered);
        document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
      });
    });
  },

  render(list) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = list.map(p => `
      <div class="product-card" data-id="${p.id}">
        ${p.badge ? `<div class="product-badge ${p.badge === 'Novo' ? 'new' : p.badge === 'Promoção' ? 'sale' : 'bestseller'}">${p.badge}</div>` : ''}
        <div class="product-icon"><i class="fas ${p.icon}"></i></div>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="product-meta">
          <span class="product-category">${p.category}</span>
          <span class="product-downloads"><i class="fas fa-download"></i> ${p.downloads}</span>
        </div>
        <div class="product-price">${p.price > 0 ? 'R$ ' + p.price.toFixed(2) : 'A ser definido'}</div>
        <button class="btn-buy" data-id="${p.id}">
          <i class="fas fa-cart-plus"></i> Adicionar
        </button>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', () => Cart.add(btn.dataset.id));
    });
  }
};

const Cart = {
  init() {
    this.overlay = document.getElementById('cartOverlay');
    this.sidebar = document.getElementById('cartSidebar');
    this.itemsEl = document.getElementById('cartItems');
    this.totalEl = document.getElementById('cartTotal');
    this.badge = document.getElementById('cartBadge');
    this.closeBtn = document.getElementById('cartClose');
    this.checkoutBtn = document.getElementById('checkoutBtn');

    document.getElementById('cartBtn').addEventListener('click', () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    this.checkoutBtn.addEventListener('click', () => this.checkout());

    this.updateDisplay();
  },

  open() { this.overlay.classList.add('active'); this.updateDisplay(); },
  close() { this.overlay.classList.remove('active'); },

  getItems() { return LS.get('cart', []); },
  saveItems(items) { LS.set('cart', items); this.updateDisplay(); },

  add(productId) {
    const prod = produtos.find(p => p.id === productId);
    if (!prod) return;
    const items = this.getItems();
    const existing = items.find(i => i.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ id: productId, name: prod.name, price: prod.price, qty: 1 });
    }
    this.saveItems(items);
    this.showFeedback('adicionado');
  },

  remove(productId) {
    let items = this.getItems();
    items = items.filter(i => i.id !== productId);
    this.saveItems(items);
  },

  updateQty(productId, delta) {
    const items = this.getItems();
    const item = items.find(i => i.id === productId);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    this.saveItems(items);
  },

  updateDisplay() {
    const items = this.getItems();
    const count = items.reduce((s, i) => s + i.qty, 0);
    this.badge.textContent = count;
    this.badge.style.display = count > 0 ? 'flex' : 'none';

    if (!this.itemsEl) return;
    if (items.length === 0) {
      this.itemsEl.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-cart"></i><p>Carrinho vazio</p></div>';
      this.totalEl.textContent = 'R$ 0,00';
      return;
    }

    this.itemsEl.innerHTML = items.map(i => `
      <div class="cart-item">
        <div class="cart-item-info">
          <h4>${i.name}</h4>
          <span>R$ ${(i.price * i.qty).toFixed(2)}</span>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-id="${i.id}" data-delta="-1">-</button>
          <span>${i.qty}</span>
          <button class="qty-btn" data-id="${i.id}" data-delta="1">+</button>
        </div>
        <button class="cart-item-remove" data-id="${i.id}"><i class="fas fa-trash"></i></button>
      </div>
    `).join('');

    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    this.totalEl.textContent = `R$ ${total.toFixed(2)}`;

    this.itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => this.updateQty(btn.dataset.id, parseInt(btn.dataset.delta)));
    });
    this.itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => this.remove(btn.dataset.id));
    });
  },

  showFeedback(msg) {
    const el = document.getElementById('cartBadge');
    el.style.transform = 'scale(1.3)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
  },

  checkout() {
    const items = this.getItems();
    if (items.length === 0) return;
    if (!Auth.loggedIn) {
      this.close();
      Auth.open();
      return;
    }

    const username = Auth.username;
    const itemList = items.map(i => `- ${i.name} (x${i.qty})`).join('\n');
    const totalItems = items.reduce((s, i) => s + i.qty, 0);

    const message = `🛒 **Novo Pedido - LKZ Shop**\n\n👤 Cliente: ${username}\n\n📦 Itens:\n${itemList}\n\n💰 Total de itens: ${totalItems}`;

    navigator.clipboard.writeText(message).catch(() => {});

    LS.set('cart', []);
    this.updateDisplay();

    let sales = LS.get('sales', 0);
    sales += 1;
    LS.set('sales', sales);
    Stats.updateDisplay();

    const msg = document.getElementById('cartItems');
    msg.innerHTML = `
      <div class="cart-success">
        <i class="fab fa-discord"></i>
        <h3>Quase lá!</h3>
        <p>Mensagem copiada!</p>
        <p style="font-size:13px;color:var(--text-muted)">Cole no chat do Discord para finalizar o pedido.</p>
      </div>
    `;

    setTimeout(() => {
      this.close();
      this.updateDisplay();
      window.open('https://discord.gg/ZpWxwE3ZGE', '_blank');
    }, 1500);
  }
};

const Stats = {
  updateDisplay() {
    const pEl = document.getElementById('statProdutos');
    const vEl = document.getElementById('statVendas');
    const mEl = document.getElementById('statMembros');
    if (pEl) pEl.textContent = produtos.length;
    if (vEl) vEl.textContent = LS.get('sales', 0);
    if (mEl) mEl.textContent = LS.get('members', 0);
  },

  incrementMembers() {
    let m = LS.get('members', 0);
    m += 1;
    LS.set('members', m);
    this.updateDisplay();
  }
};

const ScrollAnimations = {
  init() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('animate-in'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.product-card, .quick-card, .faq-item, .stat').forEach(el => obs.observe(el));
  }
};

const Console = {
  init() {
    this.overlay = document.getElementById('consoleOverlay');
    this.body = document.getElementById('consoleBody');
    this.input = document.getElementById('consoleInput');
    this.pathEl = document.getElementById('consolePath');
    this.output = document.getElementById('consoleOutput');
    this.isOpen = false;
    this.history = [];
    this.historyIndex = -1;
    this.currentPath = 'Shop/Home';

    document.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') { e.preventDefault(); this.isOpen ? this.close() : this.open(); }
      if (this.isOpen && e.key === 'Escape') this.close();
    });
    this.input.addEventListener('keydown', (e) => this.handleInput(e));
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
  },

  open() { this.isOpen = true; this.overlay.classList.add('active'); setTimeout(() => this.input.focus(), 100); },
  close() { this.isOpen = false; this.overlay.classList.remove('active'); },

  handleInput(e) {
    if (e.key === 'Enter') {
      const cmd = this.input.value.trim();
      if (!cmd) return;
      this.execute(cmd);
      this.input.value = '';
      this.historyIndex = -1;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!this.history.length) return;
      this.historyIndex = Math.max(-1, this.historyIndex - 1);
      this.input.value = this.historyIndex === -1 ? '' : this.history[this.history.length - 1 - this.historyIndex] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.history.length) return;
      this.historyIndex = Math.min(this.history.length - 1, this.historyIndex + 1);
      this.input.value = this.history[this.history.length - 1 - this.historyIndex] || '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const val = this.input.value.trim().toLowerCase();
      if (!val) return;
      const cmds = ['help','clear','ls','products','cart','total','whoami','uptime','version','theme','exit'];
      const match = cmds.find(c => c.startsWith(val));
      if (match && match !== val) this.input.value = match;
    }
    this.body.scrollTop = this.body.scrollHeight;
  },

  execute(raw) {
    const args = raw.split(/\s+/);
    const cmd = args[0].toLowerCase();
    this.history.push(raw);
    this.w(`<span class="console-path">${this.currentPath} ></span> ${raw}`);

    switch (cmd) {
      case 'help': this.help(); break;
      case 'clear': this.output.innerHTML = ''; break;
      case 'ls': this.ls(); break;
      case 'products': this.products(); break;
      case 'cart': this.showCart(); break;
      case 'total': this.total(); break;
      case 'whoami': this.whoami(); break;
      case 'uptime': this.w(`  Sistema operacional desde ${new Date().toLocaleString()}`, 'info'); break;
      case 'version': this.w(`  LKZ Shop Console v1.0`, 'info'); break;
      case 'theme': this.toggleTheme(); break;
      case 'exit': this.close(); break;
      default: this.w(`  Comando não reconhecido: '${cmd}'. Digite 'help'.`, 'error');
    }
  },

  w(text, cls = '') {
    const l = document.createElement('div');
    l.className = 'console-line' + (cls ? ' ' + cls : '');
    l.innerHTML = text;
    this.output.appendChild(l);
    this.body.scrollTop = this.body.scrollHeight;
  },

  help() {
    ['Comandos:', '', '  help - Ajuda', '  clear - Limpar', '  ls - Listar produtos', '  products - Ver produtos',
     '  cart - Ver carrinho', '  total - Total do carrinho', '  whoami - Seu usuário', '  uptime - Sessão',
     '  version - Versão', '  theme - Trocar tema', '  exit - Fechar']
    .forEach(l => this.w(`  ${l}`));
  },

  ls() { this.products(); },

  products() {
    this.w(`  Produtos disponíveis (${produtos.length}):`, 'info');
    produtos.forEach(p => this.w(`  - ${p.name} (R$ ${p.price.toFixed(2)})`));
  },

  showCart() {
    const items = Cart.getItems();
    if (!items.length) { this.w('  Carrinho vazio.', 'info'); return; }
    this.w('  Carrinho:', 'info');
    items.forEach(i => this.w(`  ${i.name} x${i.qty} = R$ ${(i.price * i.qty).toFixed(2)}`));
  },

  total() {
    const items = Cart.getItems();
    const t = items.reduce((s, i) => s + i.price * i.qty, 0);
    this.w(`  Total do carrinho: R$ ${t.toFixed(2)}`, 'info');
  },

  whoami() {
    const u = Auth.loggedIn ? Auth.username : 'Visitante';
    this.w(`  Usuário: ${u}`, 'info');
  },

  toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
    this.w(`  Tema alterado para ${cur === 'dark' ? 'light' : 'dark'}`, 'success');
  }
};
