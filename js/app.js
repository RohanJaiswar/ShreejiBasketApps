/* ==========================================================================
   SHREEJI BASKET — app.js
   Supabase-powered: Vendor login, Product catalog, Cart, Orders
   ========================================================================== */

// ── Supabase Init ────────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://tqtvxtipqbnvyquljgtg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_na3VEkRe9gb7Nysy5crL1g_oR-M2W9x';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Product emoji map by category keyword ───────────────────────────────────
function productEmoji(category = '') {
    const c = category.toLowerCase();
    if (c.includes('paneer'))    return '🧀';
    if (c.includes('ghee'))      return '🫙';
    if (c.includes('curd') || c.includes('yogurt')) return '🥛';
    if (c.includes('butter'))    return '🧈';
    if (c.includes('by-product') || c.includes('byproduct')) return '🍶';
    if (c.includes('milk'))      return '🥛';
    return '🥛';
}

// ── State ────────────────────────────────────────────────────────────────────
let currentUser   = null; // { type: 'vendor'|'customer', ...vendorRow }
let allProducts   = [];
let cart          = {}; // { productId: { product, qty } }

// ── DOM refs ─────────────────────────────────────────────────────────────────
const splashScreen       = document.getElementById('splash-screen');
const loginScreen        = document.getElementById('login-screen');
const vendorLoginScreen  = document.getElementById('vendor-login-screen');
const homeScreen         = document.getElementById('home-screen');

// ── Utility: Show Screen ─────────────────────────────────────────────────────
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => {
        if (s !== screen) {
            s.classList.remove('active');
            setTimeout(() => { if (!s.classList.contains('active')) s.style.display = 'none'; }, 500);
        }
    });
    screen.style.display = 'flex';
    setTimeout(() => screen.classList.add('active'), 30);
}

// ── Utility: Toast ───────────────────────────────────────────────────────────
function showToast(msg, duration = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

// ── Utility: Greeting ────────────────────────────────────────────────────────
function greetingText() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning,';
    if (h < 17) return 'Good Afternoon,';
    return 'Good Evening,';
}

// ── Utility: Show error under form ───────────────────────────────────────────
function showFormError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}
function clearFormError(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

// ── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const light = document.getElementById('theme-icon-light');
    const dark  = document.getElementById('theme-icon-dark');
    if (light) light.style.display = theme === 'dark' ? 'none' : 'block';
    if (dark)  dark.style.display  = theme === 'dark' ? 'block' : 'none';
    lucide.createIcons();
}

// ── Splash Particles ─────────────────────────────────────────────────────────
function createParticles() {
    const container = document.getElementById('splash-particles');
    if (!container) return;
    for (let i = 0; i < 18; i++) {
        const s = document.createElement('span');
        s.style.cssText = `
            left: ${Math.random() * 100}%;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            animation-duration: ${Math.random() * 8 + 6}s;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(s);
    }
}

// ── Vendor Login (Supabase) ───────────────────────────────────────────────────
async function handleVendorLogin(e) {
    e.preventDefault();
    clearFormError('vendor-error');

    const username = document.getElementById('vendor-username').value.trim();
    const password = document.getElementById('vendor-password').value;
    const btn      = document.getElementById('btn-vendor-login');

    if (!username || !password) {
        showFormError('vendor-error', 'Please fill in both fields.');
        return;
    }

    const orig = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader" style="animation:spin 1s linear infinite;"></i> Signing in...';
    btn.disabled = true;
    lucide.createIcons();

    try {
        const { data, error } = await sb
            .from('vendors')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) {
            showFormError('vendor-error', '❌ Invalid username or password.');
            return;
        }

        // Success — set session
        currentUser = { type: 'vendor', ...data };
        localStorage.setItem('shreeji_session', JSON.stringify(currentUser));
        enterHome();

    } catch (err) {
        showFormError('vendor-error', 'Connection error. Please retry.');
        console.error(err);
    } finally {
        btn.innerHTML = orig;
        btn.disabled = false;
        lucide.createIcons();
    }
}

// ── Customer Login (basic — phone + any password) ────────────────────────────
function handleCustomerLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('phone').value.trim();
    if (!phone) { showFormError('login-error', 'Enter your phone number.'); return; }

    currentUser = { type: 'customer', phone, store_name: 'Customer', username: `User ${phone.slice(-4)}` };
    localStorage.setItem('shreeji_session', JSON.stringify(currentUser));
    enterHome();
}

// ── Enter Home Screen ─────────────────────────────────────────────────────────
function enterHome() {
    // Update header
    const name  = currentUser.store_name || currentUser.username || 'User';
    const initial = name.charAt(0).toUpperCase();
    document.getElementById('user-name-display').textContent = name;
    document.getElementById('user-avatar-initial').textContent = initial;
    document.getElementById('greeting-time').textContent = greetingText();
    document.getElementById('banner-store-name').textContent = name;

    // Profile
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-store').textContent = currentUser.zone || currentUser.phone || '';
    document.getElementById('profile-role').textContent = currentUser.type === 'vendor' ? '🏪 Vendor' : '👤 Customer';
    document.getElementById('profile-avatar-lg').textContent = initial;

    showScreen(homeScreen);
    loadProducts();
    lucide.createIcons();
}

// ── Load Products ─────────────────────────────────────────────────────────────
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '<div class="loading-products" style="grid-column:span 2"><div class="spinner"></div>Loading products...</div>';

    try {
        const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        allProducts = data || [];
        buildCategoryTabs();
        renderProducts('all');

    } catch (err) {
        grid.innerHTML = '<div class="loading-products" style="grid-column:span 2; color:var(--danger);">Failed to load products. Please refresh.</div>';
        console.error(err);
    }
}

// ── Build Category Tabs ───────────────────────────────────────────────────────
function buildCategoryTabs() {
    const tabs = document.getElementById('category-tabs');
    const categories = ['all', ...new Set(allProducts.map(p => p.category))];
    tabs.innerHTML = categories.map(cat => `
        <div class="cat-tab ${cat === 'all' ? 'active' : ''}" data-cat="${cat}">
            ${cat === 'all' ? 'All' : cat}
        </div>`).join('');

    tabs.querySelectorAll('.cat-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderProducts(tab.dataset.cat);
        });
    });
}

// ── Render Products Grid ───────────────────────────────────────────────────────
function renderProducts(category) {
    const grid = document.getElementById('products-grid');
    const filtered = category === 'all' ? allProducts : allProducts.filter(p => p.category === category);

    if (!filtered.length) {
        grid.innerHTML = '<div class="loading-products" style="grid-column:span 2;">No products found.</div>';
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const qty = cart[p.id]?.qty || 0;
        return `
        <div class="product-card" data-id="${p.id}">
            <div class="product-card-img">${productEmoji(p.category)}</div>
            <div class="product-card-body">
                <div class="product-card-name">${p.product_name}</div>
                <div class="product-card-weight">${p.unit_weight}</div>
                <div class="product-card-footer">
                    <span class="product-price">₹${parseFloat(p.base_price).toFixed(2)}</span>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="changeQty('${p.id}', -1)">−</button>
                        <span class="qty-display" id="qty_${p.id}">${qty}</span>
                        <button class="qty-btn" onclick="changeQty('${p.id}', 1)">+</button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ── Cart Logic ────────────────────────────────────────────────────────────────
function changeQty(productId, delta) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;

    if (!cart[productId]) cart[productId] = { product, qty: 0 };
    cart[productId].qty = Math.max(0, cart[productId].qty + delta);

    if (cart[productId].qty === 0) delete cart[productId];

    // Update display in grid
    const qtyEl = document.getElementById(`qty_${productId}`);
    if (qtyEl) qtyEl.textContent = cart[productId]?.qty || 0;

    updateCartBadge();
}

function updateCartBadge() {
    const totalItems = Object.values(cart).reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// ── Cart Sheet ────────────────────────────────────────────────────────────────
function openCart() {
    const overlay = document.getElementById('cart-overlay');
    const itemsList = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    const placeBtn = document.getElementById('btn-place-order');

    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
        itemsList.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p>Your cart is empty. Add some products!</p></div>';
        totalEl.textContent = '₹0.00';
        placeBtn.disabled = true;
    } else {
        let total = 0;
        itemsList.innerHTML = cartItems.map(({ product, qty }) => {
            const subtotal = parseFloat(product.base_price) * qty;
            total += subtotal;
            return `
            <div class="cart-item">
                <span class="cart-item-emoji">${productEmoji(product.category)}</span>
                <div class="cart-item-info">
                    <div class="cart-item-name">${product.product_name}</div>
                    <div class="cart-item-meta">${product.unit_weight} × ${qty}</div>
                </div>
                <span class="cart-item-price">₹${subtotal.toFixed(2)}</span>
                <button class="cart-item-remove" onclick="removeFromCart('${product.id}')">✕</button>
            </div>`;
        }).join('');
        totalEl.textContent = `₹${total.toFixed(2)}`;
        placeBtn.disabled = false;
    }

    overlay.classList.add('show');
    overlay.style.display = 'flex';
    lucide.createIcons();
}

function closeCart() {
    const overlay = document.getElementById('cart-overlay');
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

function removeFromCart(productId) {
    delete cart[productId];
    updateCartBadge();
    openCart(); // refresh sheet

    // Also refresh qty in grid
    const qtyEl = document.getElementById(`qty_${productId}`);
    if (qtyEl) qtyEl.textContent = '0';
}

// ── Place Order (Supabase) ────────────────────────────────────────────────────
async function placeOrder() {
    const cartItems = Object.values(cart);
    if (!cartItems.length) return;

    const btn = document.getElementById('btn-place-order');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader" style="animation:spin 1s linear infinite;"></i> Placing...';
    btn.disabled = true;
    lucide.createIcons();

    const totalAmount = cartItems.reduce((s, { product, qty }) => s + parseFloat(product.base_price) * qty, 0);
    const itemsSummary = cartItems.map(({ product, qty }) => `${product.product_name} ×${qty}`).join(', ');

    const orderData = {
        vendor_id:    currentUser.type === 'vendor' ? currentUser.id : null,
        vendor_name:  currentUser.store_name || currentUser.username,
        vendor_zone:  currentUser.zone || null,
        phone_number: currentUser.phone_number || currentUser.phone || null,
        items:        cartItems.map(({ product, qty }) => ({
                          product_id:   product.id,
                          product_name: product.product_name,
                          category:     product.category,
                          unit_weight:  product.unit_weight,
                          unit_price:   parseFloat(product.base_price),
                          quantity:     qty,
                          subtotal:     parseFloat(product.base_price) * qty
                      })),
        items_summary: itemsSummary,
        total_amount:  parseFloat(totalAmount.toFixed(2)),
        status:        'pending',
        order_date:    new Date().toISOString().split('T')[0]
    };

    try {
        const { error } = await sb.from('orders').insert([orderData]);
        if (error) throw error;

        // Success
        closeCart();
        cart = {};
        updateCartBadge();
        renderProducts(document.querySelector('.cat-tab.active')?.dataset.cat || 'all');

        const successOverlay = document.getElementById('order-success-overlay');
        successOverlay.style.display = 'flex';
        successOverlay.classList.add('show');

    } catch (err) {
        console.error('Order error:', err);
        showToast('❌ Failed to place order: ' + (err.message || 'Unknown error'));
    } finally {
        btn.innerHTML = orig;
        btn.disabled = false;
        lucide.createIcons();
    }
}

// ── Load Orders History ───────────────────────────────────────────────────────
async function loadOrders() {
    const list = document.getElementById('orders-list');
    list.innerHTML = '<div class="loading-products"><div class="spinner"></div>Loading orders...</div>';

    try {
        let query = sb.from('orders').select('*').order('created_at', { ascending: false }).limit(30);

        // If vendor, filter by vendor_id
        if (currentUser?.type === 'vendor' && currentUser?.id) {
            query = query.eq('vendor_id', currentUser.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = '<div class="loading-products">No orders yet. Place your first order! 🛒</div>';
            return;
        }

        list.innerHTML = data.map(o => {
            const date = new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const statusClass = o.status === 'delivered' ? 'status-delivered' : 'status-pending';
            const statusLabel = o.status === 'delivered' ? '✅ Delivered' : '⏳ Pending';
            return `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <div class="order-id">#ORD-${String(o.id || '').slice(0,8).toUpperCase()}</div>
                        <div class="order-date">${date}</div>
                    </div>
                    <span class="order-status ${statusClass}">${statusLabel}</span>
                </div>
                <div class="order-store-name">${o.vendor_name || 'Order'}</div>
                <div class="order-items-summary">${o.items_summary || ''}</div>
                <div class="order-total">₹${parseFloat(o.total_amount || 0).toFixed(2)}</div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error(err);
        list.innerHTML = '<div class="loading-products" style="color:var(--danger);">Failed to load orders.</div>';
    }
}

// ── Bottom Nav Tabs ───────────────────────────────────────────────────────────
function initNav() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const tabId = item.dataset.tab;

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('#home-content > div[id^="tab-"]').forEach(tab => {
                tab.style.display = 'none';
            });

            const target = document.getElementById(tabId);
            if (target) target.style.display = 'block';

            // Lazy-load orders
            if (tabId === 'tab-orders') loadOrders();
        });
    });
}

// ── Restore Session ───────────────────────────────────────────────────────────
function restoreSession() {
    try {
        const saved = localStorage.getItem('shreeji_session');
        if (saved) {
            currentUser = JSON.parse(saved);
            return true;
        }
    } catch (_) {}
    return false;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Particles
    createParticles();

    // Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const cur = document.body.getAttribute('data-theme');
            const next = cur === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem('theme', next);
        });
    }

    // Icons
    lucide.createIcons();

    // ── Splash → Login ────────────────────────────────────────────────────
    setTimeout(() => {
        if (restoreSession()) {
            enterHome();
        } else {
            showScreen(loginScreen);
        }
    }, 5000);

    // ── Login Form ────────────────────────────────────────────────────────
    document.getElementById('login-form').addEventListener('submit', handleCustomerLogin);

    // ── Vendor Login Form ─────────────────────────────────────────────────
    document.getElementById('vendor-login-form').addEventListener('submit', handleVendorLogin);

    // ── Switch between login screens ──────────────────────────────────────
    document.getElementById('vendor-login-link').addEventListener('click', e => {
        e.preventDefault();
        clearFormError('vendor-error');
        showScreen(vendorLoginScreen);
    });
    document.getElementById('customer-login-link').addEventListener('click', e => {
        e.preventDefault();
        clearFormError('login-error');
        showScreen(loginScreen);
    });

    // ── Cart ──────────────────────────────────────────────────────────────
    document.getElementById('cart-btn').addEventListener('click', openCart);

    // Close cart by clicking overlay background
    document.getElementById('cart-overlay').addEventListener('click', e => {
        if (e.target === document.getElementById('cart-overlay')) closeCart();
    });

    // Place Order
    document.getElementById('btn-place-order').addEventListener('click', placeOrder);

    // Close success
    document.getElementById('btn-close-success').addEventListener('click', () => {
        const ov = document.getElementById('order-success-overlay');
        ov.classList.remove('show');
        setTimeout(() => { ov.style.display = 'none'; }, 300);
    });

    // ── Logout ────────────────────────────────────────────────────────────
    document.getElementById('btn-logout').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            currentUser = null;
            cart = {};
            localStorage.removeItem('shreeji_session');
            showScreen(loginScreen);
        }
    });

    // ── Nav Tabs ──────────────────────────────────────────────────────────
    initNav();
});
