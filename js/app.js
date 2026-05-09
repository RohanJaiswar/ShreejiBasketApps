/* ==========================================================================
   SHREEJI BASKET — app.js (Premium Redesign)
   ========================================================================== */

const SUPABASE_URL     = 'https://tqtvxtipqbnvyquljgtg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_na3VEkRe9gb7Nysy5crL1g_oR-M2W9x';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

let currentUser   = null;
let allProducts   = [];
let cart          = {}; 

const splashScreen       = document.getElementById('splash-screen');
const registerScreen     = document.getElementById('register-screen');
const vendorLoginScreen  = document.getElementById('vendor-login-screen');
const homeScreen         = document.getElementById('home-screen');

const mockNotifications = [
    { id: 1, title: 'Order Confirmed', desc: 'Your fresh milk will arrive by 7:30 AM.', icon: 'check-circle', color: 'blue', read: false },
    { id: 2, title: 'Special Discount', desc: 'Get 20% off on organic paneer today!', icon: 'tag', color: 'green', read: false }
];

function showScreen(screen) {
    [splashScreen, registerScreen, vendorLoginScreen, homeScreen].forEach(s => {
        if (s && s !== screen) {
            s.classList.add('hidden');
            s.classList.remove('flex');
        }
    });
    if(screen) {
        screen.classList.remove('hidden');
        screen.classList.add('flex');
    }
}

function showToast(msg, duration = 2500) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').innerHTML = msg;
    t.classList.remove('opacity-0', 'translate-y-4');
    setTimeout(() => t.classList.add('opacity-0', 'translate-y-4'), duration);
}

function showFormError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
}
function clearFormError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
}

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
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>';
    btn.disabled = true;
    lucide.createIcons();

    try {
        const { data, error } = await sb.from('vendors').select('*').eq('username', username).eq('password', password).single();
        if (error || !data) {
            showFormError('vendor-error', 'Invalid username or password.');
            return;
        }
        currentUser = { type: 'vendor', ...data };
        localStorage.setItem('shreeji_session', JSON.stringify(currentUser));
        enterHome();
    } catch (err) {
        showFormError('vendor-error', 'Connection error. Please retry.');
    } finally {
        btn.innerHTML = orig;
        btn.disabled = false;
        lucide.createIcons();
    }
}

async function handleVendorRegister(e) {
    e.preventDefault();
    clearFormError('register-error');

    const storeName = document.getElementById('reg-store-name').value.trim();
    const username  = document.getElementById('reg-username').value.trim();
    const phone     = document.getElementById('reg-phone').value.trim();
    const zone      = document.getElementById('reg-zone').value.trim();
    const address   = document.getElementById('reg-address').value.trim();
    const password  = document.getElementById('reg-password').value;
    const btn       = document.getElementById('btn-register');

    if (!storeName || !username || !phone || !zone || !address || !password) {
        showFormError('register-error', 'Please fill in all fields.');
        return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
        showFormError('register-error', 'Enter a valid 10-digit phone number.');
        return;
    }
    if (password.length < 4) {
        showFormError('register-error', 'Password must be at least 4 characters.');
        return;
    }

    const orig = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> <span>Registering...</span>';
    btn.disabled = true;
    lucide.createIcons();

    try {
        // Check if username already exists
        const { data: existing } = await sb.from('vendors').select('id').eq('username', username).maybeSingle();
        if (existing) {
            showFormError('register-error', 'Username already taken. Please choose another.');
            return;
        }

        const { data, error } = await sb.from('vendors').insert([{
            store_name: storeName,
            username,
            phone_number: phone,
            zone,
            address,
            password,
            containers_balance: 0
        }]).select().single();

        if (error) throw error;

        // Show success and auto-navigate to login
        const successEl = document.getElementById('register-success');
        if (successEl) {
            successEl.textContent = '✅ Registration successful! You can now login.';
            successEl.classList.remove('hidden');
        }
        document.getElementById('register-form').reset();

        setTimeout(() => {
            successEl && successEl.classList.add('hidden');
            clearFormError('vendor-error');
            showScreen(vendorLoginScreen);
        }, 2000);

    } catch (err) {
        showFormError('register-error', 'Registration failed. Please try again.');
    } finally {
        btn.innerHTML = orig;
        btn.disabled = false;
        lucide.createIcons();
    }
}

function enterHome() {
    const name  = currentUser.store_name || currentUser.username || 'User';
    const initial = name.charAt(0).toUpperCase();

    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = name;
    
    const storeEl = document.getElementById('profile-store');
    if(storeEl) storeEl.textContent = currentUser.zone || currentUser.phone || '';
    
    const roleEl = document.getElementById('profile-role');
    if(roleEl) roleEl.textContent = currentUser.type === 'vendor' ? 'Delivery Partner' : 'Customer';
    
    const avatarEl = document.getElementById('profile-avatar-lg');
    if(avatarEl) avatarEl.textContent = initial;

    const zoneEl = document.getElementById('user-zone-display');
    if(zoneEl) zoneEl.textContent = currentUser.zone || 'Mumbai';

    showScreen(homeScreen);
    loadProducts();
    updateNotifications();
    lucide.createIcons();
}

async function loadProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '<div class="col-span-2 flex flex-col items-center justify-center py-10 text-slate-400"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mb-2 text-primary-500"></i><p class="text-sm font-medium">Loading fresh products...</p></div>';
    lucide.createIcons();

    try {
        const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        allProducts = data || [];
        buildCategoryTabs();
        renderProducts('all');
    } catch (err) {
        grid.innerHTML = '<div class="col-span-2 text-center text-red-500 py-4 font-bold">Failed to load products.</div>';
    }
}

function buildCategoryTabs() {
    const tabs = document.getElementById('category-tabs');
    const categories = ['all', ...new Set(allProducts.map(p => p.category))];
    
    tabs.innerHTML = categories.map(cat => {
        let label = cat === 'all' ? 'All' : cat;
        return `
        <div class="flex flex-col items-center gap-2 cursor-pointer min-w-[70px] group cat-tab-circle ${cat === 'all' ? 'active' : ''}" data-cat="${cat}">
            <div class="w-16 h-16 rounded-[20px] bg-white dark:bg-dark-surface shadow-sm border-2 transition-all flex items-center justify-center text-3xl group-hover:border-primary-300 icon-box ${cat === 'all' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent'}">
                ${productEmoji(cat)}
            </div>
            <span class="text-xs font-bold transition-colors ${cat === 'all' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}">${label}</span>
        </div>`;
    }).join('');

    tabs.querySelectorAll('.cat-tab-circle').forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.querySelectorAll('.cat-tab-circle').forEach(t => {
                t.classList.remove('active');
                t.querySelector('.icon-box').classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
                t.querySelector('.icon-box').classList.add('border-transparent');
                t.querySelector('span').classList.remove('text-primary-600', 'dark:text-primary-400');
                t.querySelector('span').classList.add('text-slate-500', 'dark:text-slate-400');
            });
            tab.classList.add('active');
            tab.querySelector('.icon-box').classList.remove('border-transparent');
            tab.querySelector('.icon-box').classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
            tab.querySelector('span').classList.remove('text-slate-500', 'dark:text-slate-400');
            tab.querySelector('span').classList.add('text-primary-600', 'dark:text-primary-400');
            renderProducts(tab.dataset.cat);
        });
    });
}

function renderProducts(category) {
    const grid = document.getElementById('products-grid');
    const filtered = category === 'all' ? allProducts : allProducts.filter(p => p.category === category);

    if (!filtered.length) {
        grid.innerHTML = '<div class="col-span-2 text-center text-slate-400 py-10 font-bold">No products found.</div>';
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const qty = cart[p.id]?.qty || 0;
        const imgUrl = p.image_url || 'assets/logo-shree.png';
        const isNew = true; 

        return `
        <div class="bg-white dark:bg-dark-surface rounded-3xl border border-slate-100 dark:border-dark-border shadow-sm overflow-hidden flex flex-col relative group transition-all duration-300" onclick="expandProduct('${p.id}')" data-id="${p.id}">
            ${isNew ? '<div class="absolute top-2 left-2 bg-[#FEF3C7] text-[#D97706] text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg z-10 shadow-sm">New</div>' : ''}
            <div class="h-32 bg-slate-50 dark:bg-slate-800/50 p-4 relative flex items-center justify-center transition-all duration-300 product-img-container">
                <img src="${imgUrl}" alt="${p.product_name}" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover:scale-110" onerror="this.src='assets/logo-shree.png'">
                
                <div id="qty-overlay-${p.id}" class="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-lg flex items-center justify-between overflow-hidden min-w-[70px] h-9 transition-colors ${qty > 0 ? 'bg-primary-600 dark:bg-primary-600 border-primary-600' : ''}" onclick="event.stopPropagation()">
                    ${qty > 0 ? `
                        <button class="w-8 h-full flex items-center justify-center text-white font-bold active:bg-primary-700 transition-colors" onclick="changeQty('${p.id}', -1)">−</button>
                        <span class="text-white font-bold text-sm w-4 text-center">${qty}</span>
                        <button class="w-8 h-full flex items-center justify-center text-white font-bold active:bg-primary-700 transition-colors" onclick="changeQty('${p.id}', 1)">+</button>
                    ` : `
                        <button class="w-full h-full px-4 text-primary-600 dark:text-primary-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="changeQty('${p.id}', 1)">ADD</button>
                    `}
                </div>
            </div>
            <div class="p-4 pt-6 flex flex-col flex-1">
                <div class="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded flex-start self-start mb-2 uppercase tracking-wider">${p.unit_weight}</div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug mb-3 line-clamp-2 product-name-display transition-all duration-300">${p.product_name}</div>
                <div class="mt-auto flex justify-between items-center">
                    <span class="font-extrabold text-slate-900 dark:text-white">₹${parseFloat(p.base_price).toFixed(2)}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

window.expandProduct = function(id) {
    const card = document.querySelector(`div[data-id="${id}"]`);
    if(card) {
        const imgContainer = card.querySelector('.product-img-container');
        const img = card.querySelector('img');
        const title = card.querySelector('.product-name-display');
        
        if (card.classList.contains('expanded')) {
            card.classList.remove('expanded');
            imgContainer.classList.remove('h-48');
            imgContainer.classList.add('h-32');
            img.classList.remove('scale-125');
            title.classList.add('line-clamp-2');
        } else {
            card.classList.add('expanded');
            imgContainer.classList.remove('h-32');
            imgContainer.classList.add('h-48');
            img.classList.add('scale-125');
            title.classList.remove('line-clamp-2');
        }
    }
}

window.changeQty = function(productId, delta) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;

    if (!cart[productId]) cart[productId] = { product, qty: 0 };
    cart[productId].qty = Math.max(0, cart[productId].qty + delta);

    if (cart[productId].qty === 0) delete cart[productId];

    const overlay = document.getElementById(`qty-overlay-${productId}`);
    if (overlay) {
        const qty = cart[productId]?.qty || 0;
        if (qty > 0) {
            overlay.className = "absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary-600 border border-primary-600 rounded-xl shadow-lg flex items-center justify-between overflow-hidden min-w-[70px] h-9 transition-colors";
            overlay.innerHTML = `
                <button class="w-8 h-full flex items-center justify-center text-white font-bold active:bg-primary-700 transition-colors" onclick="changeQty('${productId}', -1)">−</button>
                <span class="text-white font-bold text-sm w-4 text-center">${qty}</span>
                <button class="w-8 h-full flex items-center justify-center text-white font-bold active:bg-primary-700 transition-colors" onclick="changeQty('${productId}', 1)">+</button>
            `;
        } else {
            overlay.className = "absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-lg flex items-center justify-between overflow-hidden min-w-[70px] h-9 transition-colors";
            overlay.innerHTML = `
                <button class="w-full h-full px-4 text-primary-600 dark:text-primary-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="changeQty('${productId}', 1)">ADD</button>
            `;
        }
    }

    updateCartBadge();
}

function updateCartBadge() {
    const totalItems = Object.values(cart).reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.textContent = totalItems;
        if(totalItems > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
}

function openCart() {
    const overlay = document.getElementById('cart-overlay');
    const itemsList = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    const placeBtn = document.getElementById('btn-place-order');

    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
        itemsList.innerHTML = '<div class="text-center py-10 text-slate-400"><i data-lucide="shopping-cart" class="w-12 h-12 mx-auto mb-3 opacity-50"></i><p class="font-bold">Your cart is empty</p></div>';
        totalEl.textContent = '₹0.00';
        placeBtn.disabled = true;
    } else {
        let total = 0;
        itemsList.innerHTML = cartItems.map(({ product, qty }) => {
            const subtotal = parseFloat(product.base_price) * qty;
            total += subtotal;
            return `
            <div class="flex items-center gap-4 py-4 border-b border-slate-100 dark:border-dark-border">
                <div class="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">${productEmoji(product.category)}</div>
                <div class="flex-1">
                    <div class="text-sm font-bold text-slate-800 dark:text-slate-100">${product.product_name}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">${product.unit_weight} × ${qty}</div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-extrabold text-primary-600 dark:text-primary-400 mb-1">₹${subtotal.toFixed(2)}</div>
                    <button class="text-[10px] uppercase font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded hover:bg-red-100 transition-colors" onclick="removeFromCart('${product.id}')">Remove</button>
                </div>
            </div>`;
        }).join('');
        totalEl.textContent = `₹${total.toFixed(2)}`;
        placeBtn.disabled = false;
    }

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        overlay.querySelector('div').classList.remove('translate-y-full');
    }, 10);
    lucide.createIcons();
}

function closeCart() {
    const overlay = document.getElementById('cart-overlay');
    overlay.classList.add('opacity-0');
    overlay.querySelector('div').classList.add('translate-y-full');
    setTimeout(() => { 
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }, 300);
}

window.removeFromCart = function(productId) {
    delete cart[productId];
    updateCartBadge();
    openCart(); 

    const overlay = document.getElementById(`qty-overlay-${productId}`);
    if (overlay) {
        overlay.className = "absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-lg flex items-center justify-between overflow-hidden min-w-[70px] h-9 transition-colors";
        overlay.innerHTML = `<button class="w-full h-full px-4 text-primary-600 dark:text-primary-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onclick="changeQty('${productId}', 1)">ADD</button>`;
    }
}

async function placeOrder() {
    const cartItems = Object.values(cart);
    if (!cartItems.length) return;

    const btn = document.getElementById('btn-place-order');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Placing...';
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

        // ── Outstanding Container Tracking ──────────────────────────────────
        // For each cart item whose product has container = true (any truthy value),
        // add that item's quantity to the vendor's containers_balance count.
        if (currentUser.type === 'vendor' && currentUser.id) {
            const containerQty = cartItems.reduce((sum, { product, qty }) => {
                // Check 'includes_container' (actual DB column) as well as fallback 'container'
                return sum + ((!!product.includes_container || !!product.container) ? qty : 0);
            }, 0);

            console.log('[Containers] containerQty to add:', containerQty, 
                'Cart products:', cartItems.map(i => ({ name: i.product.product_name, container: i.product.container, qty: i.qty }))
            );

            if (containerQty > 0) {
                try {
                    // Fetch current value fresh from DB
                    const { data: vendorData, error: fetchErr } = await sb
                        .from('vendors')
                        .select('containers_balance')
                        .eq('id', currentUser.id)
                        .single();

                    if (fetchErr) {
                        console.error('[Containers] Fetch error:', fetchErr);
                    } else if (vendorData) {
                        const current = vendorData.containers_balance || 0;
                        const newTotal = current + containerQty;

                        const { error: updateErr } = await sb
                            .from('vendors')
                            .update({ containers_balance: newTotal })
                            .eq('id', currentUser.id);

                        if (updateErr) {
                            console.error('[Containers] Update error:', updateErr);
                            showToast('⚠️ Order placed but container count update failed.');
                        } else {
                            // Keep in-memory session in sync
                            currentUser.containers_balance = newTotal;
                            localStorage.setItem('shreeji_session', JSON.stringify(currentUser));
                            console.log('[Containers] Updated to:', newTotal);
                        }
                    }
                } catch (containerErr) {
                    console.error('[Containers] Unexpected error:', containerErr);
                }
            }
        }
        // ───────────────────────────────────────────────────────────────────

        closeCart();
        cart = {};
        updateCartBadge();
        renderProducts(document.querySelector('.cat-tab-circle.active')?.dataset.cat || 'all');

        const successOverlay = document.getElementById('order-success-overlay');
        successOverlay.classList.remove('hidden');
        successOverlay.classList.add('flex');
        setTimeout(() => {
            successOverlay.classList.remove('opacity-0');
            successOverlay.querySelector('div').classList.remove('scale-95');
            successOverlay.querySelector('div').classList.add('scale-100');
        }, 10);

    } catch (err) {
        showToast('❌ Failed to place order');
    } finally {
        btn.innerHTML = orig;
        btn.disabled = false;
        lucide.createIcons();
    }
}

async function loadOrders() {
    const list = document.getElementById('orders-list');
    list.innerHTML = '<div class="flex items-center justify-center py-10 text-slate-400"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2"></i>Loading...</div>';
    lucide.createIcons();

    try {
        let query = sb.from('orders').select('*').order('created_at', { ascending: false }).limit(30);
        if (currentUser?.type === 'vendor' && currentUser?.id) {
            query = query.eq('vendor_id', currentUser.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = '<div class="bg-slate-50 dark:bg-dark-surface p-8 text-center rounded-3xl border border-slate-100 dark:border-dark-border text-slate-400 font-bold">No orders yet. Place your first order!</div>';
            return;
        }

        list.innerHTML = data.map(o => {
            const date = new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const isDelivered = o.status === 'delivered';
            const statusColor = isDelivered ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
            const statusLabel = isDelivered ? 'Delivered' : 'Pending';
            
            return `
            <div class="bg-white dark:bg-dark-surface rounded-3xl p-5 border border-slate-100 dark:border-dark-border shadow-sm">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <div class="text-sm font-extrabold text-primary-600 dark:text-primary-400">#ORD-${String(o.id || '').slice(0,8).toUpperCase()}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">${date}</div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusColor}">${statusLabel}</span>
                </div>
                <div class="font-bold text-slate-800 dark:text-slate-100 mb-1">${o.vendor_name || 'Order'}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">${o.items_summary || ''}</div>
                <div class="text-lg font-extrabold text-slate-900 dark:text-white">₹${parseFloat(o.total_amount || 0).toFixed(2)}</div>
            </div>`;
        }).join('');
    } catch (err) {
        list.innerHTML = '<div class="text-red-500 font-bold text-center py-4">Failed to load orders.</div>';
    }
}

async function loadWalletTransactions() {
    const list = document.getElementById('transactions-list');
    if (!list) return;
    list.innerHTML = '<div class="flex items-center justify-center py-10 text-slate-400"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2"></i>Loading...</div>';
    lucide.createIcons();

    try {
        let query = sb.from('transactions').select('*').order('created_at', { ascending: false }).limit(50);
        if (currentUser?.type === 'vendor' && currentUser?.id) {
            query = query.eq('vendor_id', currentUser.id);
        } else {
            list.innerHTML = '<div class="bg-slate-50 dark:bg-dark-surface p-8 text-center rounded-3xl border border-slate-100 dark:border-dark-border text-slate-400 font-bold">Wallet feature is for vendors.</div>';
            return;
        }

        const { data, error } = await query;
        if (error) throw error;

        let cashTotal = 0, upiTotal = 0;
        if (data) {
            data.forEach(t => {
                const amt = parseFloat(t.amount || 0);
                if (t.payment_mode === 'cash') cashTotal += amt;
                else if (t.payment_mode === 'upi') upiTotal += amt;
            });
        }
        document.getElementById('wallet-cash-total').textContent = `₹${cashTotal.toFixed(0)}`;
        document.getElementById('wallet-upi-total').textContent = `₹${upiTotal.toFixed(0)}`;

        if (!data || data.length === 0) {
            list.innerHTML = '<div class="text-center text-slate-400 font-bold py-4">No transactions found.</div>';
            return;
        }

        list.innerHTML = data.map(t => {
            const date = new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const time = new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const isUpi = t.payment_mode === 'upi';
            const icon = isUpi ? 'smartphone' : 'banknote';
            const color = isUpi ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-green-500 bg-green-50 dark:bg-green-900/20';
            const amtColor = isUpi ? 'text-primary-600 dark:text-primary-400' : 'text-green-600 dark:text-green-400';
            
            return `
            <div class="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-slate-100 dark:border-dark-border shadow-sm flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}">
                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                </div>
                <div class="flex-1">
                    <div class="font-bold text-slate-800 dark:text-slate-100">${isUpi ? 'UPI' : 'Cash'} Received</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">${date} at ${time}</div>
                    ${t.upi_ref ? `<div class="text-[10px] text-slate-400 font-mono mt-0.5">Ref: ${t.upi_ref}</div>` : ''}
                </div>
                <div class="text-lg font-extrabold ${amtColor}">+₹${parseFloat(t.amount || 0).toFixed(2)}</div>
            </div>`;
        }).join('');
        lucide.createIcons();

    } catch (err) {
        list.innerHTML = '<div class="text-red-500 font-bold text-center py-4">Failed to load transactions.</div>';
    }
}

function updateNotifications() {
    const list = document.getElementById('notif-list');
    const badge = document.getElementById('notif-badge');
    const unread = mockNotifications.filter(n => !n.read).length;

    if(unread > 0) {
        badge.textContent = unread;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    if(mockNotifications.length === 0) {
        list.innerHTML = '<div class="text-center text-slate-400 py-6 font-bold">No new notifications</div>';
        return;
    }

    list.innerHTML = mockNotifications.map(n => {
        let colorClasses = '';
        if(n.color === 'blue') colorClasses = 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 border-blue-100 dark:border-blue-800/30';
        if(n.color === 'green') colorClasses = 'bg-green-50 dark:bg-green-900/20 text-green-500 border-green-100 dark:border-green-800/30';
        
        return `
        <div class="flex gap-3 p-4 bg-white dark:bg-dark-surface rounded-2xl border ${n.read ? 'border-slate-100 dark:border-dark-border opacity-70' : 'border-primary-100 dark:border-primary-900 shadow-sm'} cursor-pointer" onclick="markRead(${n.id})">
            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${colorClasses}">
                <i data-lucide="${n.icon}" class="w-5 h-5"></i>
            </div>
            <div>
                <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">${n.title}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${n.desc}</p>
            </div>
        </div>
        `;
    }).join('');
    lucide.createIcons();
}

window.markRead = function(id) {
    const n = mockNotifications.find(x => x.id === id);
    if(n) n.read = true;
    updateNotifications();
}

function openNotif() {
    const modal = document.getElementById('notif-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('translate-y-full');
    }, 10);
}

function closeNotif() {
    const modal = document.getElementById('notif-modal');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}


function initNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const tabId = item.dataset.tab;

            navItems.forEach(n => {
                n.classList.remove('active', 'text-primary-600', 'dark:text-primary-400');
                n.classList.add('text-slate-400');
            });
            item.classList.add('active', 'text-primary-600', 'dark:text-primary-400');
            item.classList.remove('text-slate-400');

            document.querySelectorAll('#main-content > div[id^="tab-"]').forEach(tab => {
                tab.classList.add('hidden');
            });

            const target = document.getElementById(tabId);
            if (target) target.classList.remove('hidden');

            if (tabId === 'tab-orders') loadOrders();
            if (tabId === 'tab-wallet') loadWalletTransactions();
        });
    });
}

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

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            applyTheme(isDark ? 'light' : 'dark');
        });
    }

    lucide.createIcons();

    setTimeout(() => {
        splashScreen.classList.add('opacity-0');
        setTimeout(() => {
            if (restoreSession()) {
                enterHome();
            } else {
                showScreen(vendorLoginScreen);
            }
        }, 700);
    }, 2000);

    document.getElementById('vendor-login-form').addEventListener('submit', handleVendorLogin);
    document.getElementById('register-form').addEventListener('submit', handleVendorRegister);

    // Vendor login → Register screen
    document.getElementById('register-link').addEventListener('click', e => {
        e.preventDefault();
        clearFormError('register-error');
        document.getElementById('register-success')?.classList.add('hidden');
        showScreen(registerScreen);
    });

    // Register screen → back to Login
    document.getElementById('back-to-login-link').addEventListener('click', e => {
        e.preventDefault();
        clearFormError('vendor-error');
        showScreen(vendorLoginScreen);
    });

    document.getElementById('cart-btn').addEventListener('click', openCart);
    document.getElementById('close-cart-btn').addEventListener('click', closeCart);
    document.getElementById('cart-overlay').addEventListener('click', e => {
        if (e.target === document.getElementById('cart-overlay')) closeCart();
    });

    document.getElementById('btn-place-order').addEventListener('click', placeOrder);
    document.getElementById('btn-close-success').addEventListener('click', () => {
        const ov = document.getElementById('order-success-overlay');
        ov.classList.add('opacity-0');
        ov.querySelector('div').classList.remove('scale-100');
        ov.querySelector('div').classList.add('scale-95');
        setTimeout(() => { 
            ov.classList.add('hidden');
            ov.classList.remove('flex');
        }, 300);
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            currentUser = null;
            cart = {};
            localStorage.removeItem('shreeji_session');
            showScreen(loginScreen);
        }
    });

    document.getElementById('notif-btn').addEventListener('click', openNotif);
    document.getElementById('close-notif').addEventListener('click', closeNotif);
    document.getElementById('notif-modal').addEventListener('click', e => {
        if(e.target === document.getElementById('notif-modal')) closeNotif();
    });

    // ── Banner Slideshow Sync & Auto-scroll ─────────────────────────────────────────────
    const slidesWrapper = document.getElementById('banner-slides');
    const dotsContainer = document.getElementById('banner-dots');
    if (slidesWrapper && dotsContainer) {
        const slides = slidesWrapper.querySelectorAll('img');
        const numSlides = slides.length;
        
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = i === 0 ? 'w-4 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400 transition-all' : 'w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 transition-all';
            dotsContainer.appendChild(dot);
        });
        const dots = dotsContainer.querySelectorAll('div');
        
        let currentIndex = 0;
        let slideInterval;

        const updateDots = (index) => {
            dots.forEach((dot, i) => {
                if (i === index) {
                    dot.className = 'w-4 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400 transition-all';
                } else {
                    dot.className = 'w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 transition-all';
                }
            });
        };

        slidesWrapper.addEventListener('scroll', () => {
            const scrollLeft = slidesWrapper.scrollLeft;
            const slideWidth = slidesWrapper.clientWidth;
            currentIndex = Math.round(scrollLeft / slideWidth);
            updateDots(currentIndex);
        });

        // Auto-scroll logic
        const startSlideShow = () => {
            slideInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % numSlides;
                slidesWrapper.scrollTo({
                    left: currentIndex * slidesWrapper.clientWidth,
                    behavior: 'smooth'
                });
            }, 3000); // Change poster every 3 seconds
        };

        const stopSlideShow = () => {
            clearInterval(slideInterval);
        };

        // Start initially
        if (numSlides > 1) {
            startSlideShow();
            
            // Pause on interaction
            slidesWrapper.addEventListener('touchstart', stopSlideShow);
            slidesWrapper.addEventListener('touchend', startSlideShow);
            slidesWrapper.addEventListener('mouseenter', stopSlideShow);
            slidesWrapper.addEventListener('mouseleave', startSlideShow);
        }
    }

    initNav();
});
