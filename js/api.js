const API_URL = 'https://lkz-shop.onrender.com';

const API = {
  async register(username, email, password) {
    const r = await fetch(API_URL + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    return data;
  },

  async login(username, password) {
    const r = await fetch(API_URL + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    return data;
  },

  async createOrder(token, items) {
    const r = await fetch(API_URL + '/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ items })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    return data;
  },

  async getMe(token) {
    const r = await fetch(API_URL + '/api/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    return data;
  }
};
