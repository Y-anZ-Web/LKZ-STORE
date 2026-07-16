import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors({ origin: '*' }));
app.use((req, res, next) => {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf-8');
    if (raw) {
      try { req.body = JSON.parse(raw); } catch { req.body = {}; }
    }
    next();
  });
});

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Token necessário' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function adminAuth(req, res, next) {
  const b64 = req.headers.authorization?.split(' ')[1];
  if (!b64) return res.status(401).json({ error: 'Autenticação necessária' });
  const [user, pass] = Buffer.from(b64, 'base64').toString().split(':');
  if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
  return res.status(401).json({ error: 'Credenciais inválidas' });
}

async function sendDiscord(content) {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  } catch {}
}

// Rota raiz para teste
app.get('/', (req, res) => res.json({ status: 'online', name: 'LKZ Shop API', version: '1.0.0' }));

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) return res.status(400).json({ error: 'Usuário ou email já existe' });

    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hash);
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: result.lastInsertRowid, username, email } });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(400).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Perfil do usuário
app.get('/api/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

// Criar pedido
app.post('/api/orders', auth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'Carrinho vazio' });

    const totalItems = items.reduce((s, i) => s + i.qty, 0);
    const result = db.prepare('INSERT INTO orders (user_id, username, items, total_items) VALUES (?, ?, ?, ?)').run(
      req.user.id, req.user.username, JSON.stringify(items), totalItems
    );

    const itemList = items.map(i => `- ${i.name} (x${i.qty})`).join('\n');
    const content = `🛒 **NOVO PEDIDO**\n👤 Cliente: ${req.user.username}\n📦 Itens:\n${itemList}\n💰 Total de itens: ${totalItems}\n📅 Data: ${new Date().toLocaleString('pt-BR')}\n🆔 Pedido #${result.lastInsertRowid}`;
    await sendDiscord(content);

    res.json({ id: result.lastInsertRowid, message: 'Pedido criado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// Listar pedidos (admin basic auth)
app.get('/api/orders', adminAuth, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) })));
  } catch {
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LKZ Shop API running on port ${PORT}`);
});
