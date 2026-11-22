import { loadStaticSnapshot } from './staticFallback';
import { calculateShippingFee, resolveVolumeTier } from './pricing';
import { ALL_ADMIN_PERMISSIONS } from './rbac';
import { buildLiveShippingTracking } from './shippingTracking';
import {
  normalizeMembershipTierName,
  resolveEffectiveMembershipTier,
  ROAR_MEMBERSHIP_TIERS,
} from './membershipTiers';

const STATIC_STATE_KEY = 'roar_static_runtime_v1';

interface StaticUserRecord {
  id: number;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'b2b_partner' | 'admin';
  adminRole?: string;
  adminPermissions?: string[];
  memberCode: string;
  tier: string;
  emailVerified: boolean;
  companyName?: string;
  b2bVerified?: boolean;
  walletBalance?: number;
  points?: number;
  createdAt: string;
}

interface StaticRuntimeState {
  users: StaticUserRecord[];
  orders: any[];
  b2bInquiries: any[];
  newsletterSubscribers: Array<{ id: number; email: string; lang: string; created_at: string }>;
  settingsOverlay: Record<string, string>;
  productsOverlay: Record<number, any>;
  createdProducts: any[];
  walletTransactions: any[];
  checkins: Record<number, { streak: number; lastCheckinDate: string; history: any[] }>;
}

function getDefaultUsers(): StaticUserRecord[] {
  return [
    {
      id: 1,
      email: 'admin@roarcoffee.vn',
      password: 'RoarAdmin2026!',
      fullName: 'ROAR Super Admin',
      phone: '0901234567',
      role: 'admin',
      adminRole: 'super_admin',
      adminPermissions: [...ALL_ADMIN_PERMISSIONS],
      memberCode: 'RC-ADM-000001',
      tier: 'ROAR Reserve',
      emailVerified: true,
      createdAt: '2026-01-01 08:00:00',
    },
    {
      id: 2,
      email: 'customer@roarcoffee.vn',
      password: 'RoarMember2026!',
      fullName: 'Nguyễn Minh Quân',
      phone: '0912345678',
      role: 'customer',
      memberCode: 'RC-MEM-100001',
      tier: 'ROAR Member',
      emailVerified: true,
      createdAt: '2026-02-01 09:00:00',
    },
  ];
}

function getDefaultOrders(): any[] {
  return [
    {
      id: 9001,
      order_number: 'RC-20261114-1892',
      user_id: 2,
      customer_name: 'Nguyễn Minh Khôi',
      customer_email: 'member@roarcoffee.vn',
      customer_phone: '0909 123 456',
      shipping_address: '12 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      currency: 'VND',
      subtotal: 440000,
      discount_amount: 0,
      points_redeemed: 0,
      points_discount: 0,
      shipping_fee: 0,
      total: 440000,
      voucher_code: '',
      payment_method: 'momo',
      payment_status: 'paid',
      order_status: 'Shipping',
      tracking_code: 'GHN-ROAR-884210',
      notes: 'Đã đóng gói chống sốc',
      created_at: '2026-11-18 09:15:00',
      updated_at: '2026-11-20 10:30:00',
      items: [
        {
          id: 1,
          sku: 'RC-ESG-500',
          product_name_vi: 'ROAR Espresso Gold (Đại Bàng)',
          product_name_en: 'ROAR Espresso Gold (Eagle)',
          variant_label: '500g · Whole Bean (Gold)',
          quantity: 1,
          unit_price_vnd: 440000,
          line_total_vnd: 440000,
        },
      ],
    },
    {
      id: 9002,
      order_number: 'RC-20261115-2048',
      user_id: 2,
      customer_name: 'Nguyễn Minh Khôi',
      customer_email: 'member@roarcoffee.vn',
      customer_phone: '0909 123 456',
      shipping_address: '45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      currency: 'VND',
      subtotal: 390000,
      discount_amount: 50000,
      points_redeemed: 0,
      points_discount: 0,
      shipping_fee: 35000,
      total: 375000,
      voucher_code: 'ROARESPRESSO50',
      payment_method: 'vietqr',
      payment_status: 'pending_verification',
      order_status: 'Pending',
      tracking_code: '',
      notes: 'Giao giờ hành chính.',
      created_at: '2026-11-20 08:40:00',
      updated_at: '2026-11-20 08:40:00',
      items: [
        {
          id: 2,
          sku: 'RC-ESP-250',
          product_name_vi: 'ROAR Espresso (Cáo)',
          product_name_en: 'ROAR Espresso (Fox)',
          variant_label: '250g · Whole Bean',
          quantity: 2,
          unit_price_vnd: 195000,
          line_total_vnd: 390000,
        },
      ],
    },
    {
      id: 9003,
      order_number: 'RC-20261101-1001',
      user_id: 2,
      customer_name: 'Nguyễn Minh Khôi',
      customer_email: 'member@roarcoffee.vn',
      customer_phone: '0909 123 456',
      shipping_address: '12 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      currency: 'VND',
      subtotal: 490000,
      discount_amount: 0,
      points_redeemed: 0,
      points_discount: 0,
      shipping_fee: 0,
      total: 490000,
      voucher_code: '',
      payment_method: 'bank_transfer',
      payment_status: 'confirmed_demo',
      order_status: 'Completed',
      tracking_code: 'VN-DEMO-1001',
      notes: '',
      created_at: '2026-11-01 10:00:00',
      updated_at: '2026-11-03 14:20:00',
      items: [
        {
          id: 3,
          sku: 'RC-RES-250',
          product_name_vi: 'ROAR Signature Reserve (Báo Đen)',
          product_name_en: 'ROAR Signature Reserve (Black Panther)',
          variant_label: '250g · Signature Tin (Whole Bean)',
          quantity: 1,
          unit_price_vnd: 490000,
          line_total_vnd: 490000,
        },
      ],
    },
  ];
}

function readState(): StaticRuntimeState {
  try {
    const raw = window.localStorage.getItem(STATIC_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const rawUsers = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : getDefaultUsers();
      return {
        users: rawUsers.map((u: StaticUserRecord) => ({
          ...u,
          tier: normalizeMembershipTierName(u.tier),
        })),
        orders: Array.isArray(parsed.orders) && parsed.orders.length > 0 ? parsed.orders : getDefaultOrders(),
        b2bInquiries: Array.isArray(parsed.b2bInquiries) ? parsed.b2bInquiries : [],
        newsletterSubscribers: Array.isArray(parsed.newsletterSubscribers) ? parsed.newsletterSubscribers : [],
        settingsOverlay: parsed.settingsOverlay || {},
        productsOverlay: parsed.productsOverlay || {},
        createdProducts: Array.isArray(parsed.createdProducts) ? parsed.createdProducts : [],
        walletTransactions: Array.isArray(parsed.walletTransactions) ? parsed.walletTransactions : [],
        checkins: parsed.checkins && typeof parsed.checkins === 'object' ? parsed.checkins : {},
      };
    }
  } catch {
    // ignore
  }
  return {
    users: getDefaultUsers(),
    orders: getDefaultOrders(),
    b2bInquiries: [],
    newsletterSubscribers: [],
    settingsOverlay: {},
    productsOverlay: {},
    createdProducts: [],
    walletTransactions: [],
    checkins: {},
  };
}

function writeState(state: StaticRuntimeState): void {
  try {
    window.localStorage.setItem(STATIC_STATE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('roar:runtime-updated'));
  } catch {
    // ignore
  }
}

function normalizePhoneKey(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('84') && digits.length >= 10) return `0${digits.slice(2)}`;
  return digits;
}

function resolveOrCreateStaticCustomer(
  state: StaticRuntimeState,
  params: {
    authUser?: StaticUserRecord | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }
): { user: StaticUserRecord; isNewMember: boolean; matchedExisting: boolean; welcomePoints: number } {
  const cleanName = String(params.customerName || '').trim() || 'ROAR Customer';
  const cleanEmail = String(params.customerEmail || '').trim().toLowerCase();
  const cleanPhone = String(params.customerPhone || '').trim();
  const phoneKey = normalizePhoneKey(cleanPhone);

  const authU = params.authUser || null;
  const authEmail = authU ? authU.email.toLowerCase() : '';
  const authPhoneKey = authU ? normalizePhoneKey(authU.phone) : '';
  const shouldUseSessionUser =
    Boolean(authU) &&
    (authU!.role !== 'admin' ||
      (cleanEmail ? cleanEmail === authEmail : !phoneKey || phoneKey === authPhoneKey));

  if (shouldUseSessionUser && authU) {
    if (cleanPhone && !String(authU.phone || '').trim()) {
      authU.phone = cleanPhone;
    }
    return { user: authU, isNewMember: false, matchedExisting: true, welcomePoints: 0 };
  }

  let existing =
    (cleanEmail ? state.users.find((x) => x.email.toLowerCase() === cleanEmail) : undefined) ||
    (phoneKey.length >= 8 ? state.users.find((x) => normalizePhoneKey(x.phone) === phoneKey) : undefined) ||
    null;

  if (existing) {
    if (cleanPhone && !String(existing.phone || '').trim()) {
      existing.phone = cleanPhone;
    }
    return { user: existing, isNewMember: false, matchedExisting: true, welcomePoints: 0 };
  }

  const nextId = Math.max(10, ...state.users.map((x) => x.id)) + 1;
  const newMember: StaticUserRecord = {
    id: nextId,
    email: cleanEmail || `${phoneKey || `guest${Date.now()}`}@member.roarcoffee.vn`,
    password: `auto-${Date.now()}`,
    fullName: cleanName,
    phone: cleanPhone,
    role: 'customer',
    memberCode: `RC-MEM-${Math.floor(100000 + Math.random() * 900000)}`,
    tier: 'ROAR Member',
    emailVerified: false,
    walletBalance: 0,
    points: 50,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  state.users.push(newMember);
  return { user: newMember, isNewMember: true, matchedExisting: false, welcomePoints: 50 };
}

function syncStaticOrderCustomers(state: StaticRuntimeState): boolean {
  let changed = false;
  for (const order of state.orders) {
    const hasValidUser = order.user_id && state.users.some((u) => u.id === Number(order.user_id));
    if (hasValidUser) continue;
    const email = String(order.customer_email || '').trim().toLowerCase();
    const phone = String(order.customer_phone || '').trim();
    const name = String(order.customer_name || '').trim() || 'ROAR Customer';
    if (!email && !phone) continue;
    const resolved = resolveOrCreateStaticCustomer(state, {
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
    });
    order.user_id = resolved.user.id;
    changed = true;
  }
  if (changed) writeState(state);
  return changed;
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function syncStaticUserTier(state: StaticRuntimeState, user: StaticUserRecord): boolean {
  const xPhoneKey = normalizePhoneKey(user.phone);
  const lifetimeSpendVnd = state.orders
    .filter(
      (o) =>
        o.order_status !== 'Cancelled' &&
        (Number(o.user_id) === user.id ||
          String(o.customer_email || '').trim().toLowerCase() === user.email.toLowerCase() ||
          (xPhoneKey.length >= 8 && normalizePhoneKey(o.customer_phone) === xPhoneKey))
    )
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const effective = resolveEffectiveMembershipTier({
    currentTierName: user.tier,
    lifetimeSpendVnd,
    lifetimePoints: Number(user.points ?? 0),
  }).tier.name;

  if (effective !== user.tier) {
    user.tier = effective;
    return true;
  }
  return false;
}

function toPublicUser(u: StaticUserRecord) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    adminRole: u.adminRole,
    adminPermissions: u.adminPermissions,
    memberCode: u.memberCode,
    tier: normalizeMembershipTierName(u.tier),
    emailVerified: u.emailVerified,
    companyName: u.companyName || '',
    b2bVerified: Boolean(u.b2bVerified),
    addresses: [],
    walletBalance: u.walletBalance ?? 0,
    walletBalanceVnd: u.walletBalance ?? 0,
    points: { available: u.points ?? 50, pending: 0, redeemed: 0, expired: 0, expiringSoon: 0 },
    unreadNotifications: 0,
  };
}

function resolveTokenUser(headers: Headers, state: StaticRuntimeState): StaticUserRecord | null {
  const auth = headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim() || window.localStorage.getItem('roar_auth_token') || '';
  if (!token.startsWith('static-token-')) return null;
  const uid = Number(token.replace('static-token-', ''));
  return state.users.find((u) => u.id === uid) || null;
}

export async function handleStaticApiFallback(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response | null> {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.pathname + input.search : input.url;
  let pathname = urlStr;
  let searchParams = new URLSearchParams();
  try {
    const u = new URL(urlStr, window.location.origin);
    pathname = u.pathname;
    searchParams = u.searchParams;
  } catch {
    // fallback
  }

  if (!pathname.startsWith('/api/')) return null;

  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});
  let body: any = {};
  if (typeof init.body === 'string' && init.body.trim()) {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = {};
    }
  }

  const state = readState();
  const snap = await loadStaticSnapshot();

  // 1. Auth: Register
  if (pathname === '/api/auth/register' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.fullName || '').trim();
    const phone = String(body.phone || '').trim();
    if (!email || !password || !fullName) {
      return jsonResponse({ error: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.' }, 400);
    }
    if (password.length < 6) {
      return jsonResponse({ error: 'Mật khẩu cần tối thiểu 6 ký tự.' }, 400);
    }
    if (state.users.some((u) => u.email.toLowerCase() === email)) {
      return jsonResponse({ error: 'Email này đã được đăng ký tài khoản.' }, 409);
    }
    const role = body.roleIntent === 'b2b_partner' ? 'b2b_partner' : 'customer';
    const nextId = Math.max(10, ...state.users.map((u) => u.id)) + 1;
    const newUser: StaticUserRecord = {
      id: nextId,
      email,
      password,
      fullName,
      phone,
      role,
      memberCode: `RC-${role === 'b2b_partner' ? 'B2B' : 'MEM'}-${Math.floor(100000 + Math.random() * 900000)}`,
      tier: 'ROAR Member',
      emailVerified: true,
      companyName: String(body.companyName || '').trim(),
      b2bVerified: false,
      walletBalance: 0,
      points: 50,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    state.users.push(newUser);
    writeState(state);
    return jsonResponse({ ok: true, user: toPublicUser(newUser), token: `static-token-${newUser.id}` }, 201);
  }

  // 2. Auth: Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    let found = state.users.find((u) => u.email.toLowerCase() === email && u.password === password);
    // Also accept backend default credentials on static hosts (even if localStorage had older defaults)
    if (!found && email === 'admin@roarcoffee.vn' && (password === 'Admin@Roar2026!' || password === 'RoarAdmin2026!' || password === 'RoarAdmin!2026')) {
      found = state.users.find((u) => u.email.toLowerCase() === 'admin@roarcoffee.vn');
    }
    if (!found && email === 'member@roarcoffee.vn' && (password === 'Member@Roar2026!' || password === 'RoarMember2026!')) {
      found = state.users.find((u) => u.email.toLowerCase() === 'member@roarcoffee.vn');
      if (!found) {
        found = {
          id: 3,
          email: 'member@roarcoffee.vn',
          password: 'Member@Roar2026!',
          fullName: 'Nguyễn Minh Khôi',
          phone: '0912345678',
          role: 'customer',
          memberCode: 'RC-MEM-1001',
          tier: 'ROAR Silver',
          emailVerified: true,
          walletBalance: 500000,
          points: 120,
          createdAt: '2026-02-01 09:00:00',
        };
        state.users.push(found);
        writeState(state);
      }
    }
    if (!found && email === 'editor@roarcoffee.vn' && (password === 'Editor@Roar2026!' || password === 'RoarEditor!2026')) {
      found = state.users.find((u) => u.email.toLowerCase() === 'editor@roarcoffee.vn');
      if (!found) {
        found = {
          id: 4,
          email: 'editor@roarcoffee.vn',
          password: 'Editor@Roar2026!',
          fullName: 'Trần Thảo Vy (Biên tập CMS)',
          phone: '0909888777',
          role: 'admin',
          adminRole: 'editor',
          adminPermissions: [...ALL_ADMIN_PERMISSIONS],
          memberCode: 'RC-ADM-0002',
          tier: 'ROAR Gold',
          emailVerified: true,
          createdAt: '2026-01-15 09:00:00',
        };
        state.users.push(found);
        writeState(state);
      }
    }
    if (!found) {
      return jsonResponse({ error: 'Sai email hoặc mật khẩu.' }, 401);
    }
    if (syncStaticUserTier(state, found)) writeState(state);
    return jsonResponse({ ok: true, user: toPublicUser(found), token: `static-token-${found.id}` });
  }

  // 2b. Auth: Social (Google / Facebook)
  if (pathname === '/api/auth/social' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const fullName = String(body.fullName || '').trim() || (email ? email.split('@')[0] : 'ROAR Member');
    if (!email || !email.includes('@')) {
      return jsonResponse({ error: 'Vui lòng cung cấp email tài khoản hợp lệ.' }, 400);
    }
    let found = state.users.find((u) => u.email.toLowerCase() === email);
    if (!found) {
      const nextId = Math.max(10, ...state.users.map((u) => u.id)) + 1;
      found = {
        id: nextId,
        email,
        password: `social-${Date.now()}`,
        fullName,
        phone: '',
        role: 'customer',
        memberCode: `RC-MEM-${Math.floor(100000 + Math.random() * 900000)}`,
        tier: 'ROAR Member',
        emailVerified: true,
        walletBalance: 0,
        points: 50,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      state.users.push(found);
      writeState(state);
    }
    return jsonResponse({ ok: true, user: toPublicUser(found), token: `static-token-${found.id}` });
  }

  // 2c. AI Barista Chat (Smart catalog-aware advisor on static hosting)
  if (pathname === '/api/ai/chat' && method === 'POST') {
    const q = String(body.message || '').toLowerCase();
    const isEn = body.lang === 'en';
    const kgMatch = q.match(/(\d+)\s*kg/);
    const requestedKg = kgMatch ? Math.max(1, Number(kgMatch[1])) : null;
    const allProds = (snap?.tables?.products || []).filter((p: any) => p.status !== 'draft');

    const hydrate = (p: any) => ({
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      sub_category: p.sub_category || '',
      category: p.category,
      name_vi: p.name_vi,
      name_en: p.name_en,
      price_vnd: p.price_vnd,
      price_usd: p.price_usd,
      image_key: p.image_key,
      tasting_notes_vi: p.tasting_notes_vi || '',
      tasting_notes_en: p.tasting_notes_en || '',
      pricing_tiers: Array.isArray(p.pricing_tiers) ? p.pricing_tiers : JSON.parse(p.pricing_tiers_json || '[]'),
      variants: Array.isArray(p.variants) ? p.variants : JSON.parse(p.variants_json || '[]'),
      to: `/product/${p.slug}`,
    });

    let matched = allProds.filter((p: any) => p.category !== 'green_bean');
    let quickLinks: Array<{ label: string; to: string }> = [];
    let reply = '';

    if (q.includes('kg') || q.includes('sỉ') || q.includes('hạt rang') || q.includes('s18') || q.includes('báo giá') || q.includes('wholesale')) {
      const beans = allProds.filter((p: any) => p.category === 'roasted_beans');
      matched = beans.filter((p: any) => {
        if (q.includes('arabica')) return p.name_vi.toLowerCase().includes('arabica');
        if (q.includes('culi')) return p.name_vi.toLowerCase().includes('culi');
        if (q.includes('honey')) return p.name_vi.toLowerCase().includes('honey');
        if (q.includes('cbu')) return p.name_vi.toLowerCase().includes('cbu');
        if (q.includes('robusta')) return p.name_vi.toLowerCase().includes('robusta');
        return true;
      });
      if (matched.length === 0) matched = beans;
      const top = matched.slice(0, 3);
      if (requestedKg) {
        const lines = top
          .map((p: any) => {
            const tiers = Array.isArray(p.pricing_tiers) ? p.pricing_tiers : JSON.parse(p.pricing_tiers_json || '[]');
            const tier = resolveVolumeTier(tiers, requestedKg);
            const unitP = tier ? tier.priceVnd : p.price_vnd;
            return `• ${p.name_vi} (${p.sub_category}): ${unitP.toLocaleString('vi-VN')} ₫/kg → ${requestedKg} kg = ${(unitP * requestedKg).toLocaleString('vi-VN')} ₫`;
          })
          .join('\n');
        reply = isEn
          ? `Instant quote for ${requestedKg} kg of ROAR Roasted Coffee Beans:\n${lines}`
          : `Báo giá nhanh cho ${requestedKg} kg Cà phê Hạt rang ROAR:\n${lines}`;
      } else {
        reply = isEn
          ? 'ROAR Roasted Coffee Beans feature 6 S18 SKUs with 5 automatic kg tiers (1kg, 5–19kg, 20–49kg, 50–99kg, Wholesale ≥100kg from 180,000 VND/kg). Pick a product below:'
          : 'Danh mục Cà phê Hạt rang ROAR gồm 6 mã S18 với 5 mức giá tự động theo kg (1kg, 5–19kg, 20–49kg, 50–99kg, Sỉ ≥100kg từ 180.000 ₫/kg). Bạn bấm chọn sản phẩm bên dưới nhé:';
      }
      quickLinks = [{ label: isEn ? 'All Roasted Beans (kg)' : 'Xem tất cả Cà phê Hạt rang (kg)', to: '/coffee/roasted-beans' }];
    } else if (q.includes('phin') || q.includes('đậm') || q.includes('mạnh') || q.includes('sữa đá') || q.includes('robusta')) {
      matched = allProds.filter((p: any) => p.slug.includes('lion') || p.slug.includes('tiger') || p.slug.includes('robusta')).slice(0, 3);
      reply = isEn
        ? 'For bold Vietnamese Phin or iced milk coffee, try Lion (Sư Tử), Tiger (Hổ), or Robusta S18 below:'
        : 'Với gu đậm đà pha Phin hoặc cà phê sữa đá, mình gợi ý Sư Tử (Lion), Hổ (Tiger) hoặc Robusta S18 bên dưới nhé:';
      quickLinks = [{ label: isEn ? 'Brewing Guide' : 'Hướng dẫn pha Phin chuẩn', to: '/brewing' }];
    } else if (q.includes('espresso') || q.includes('arabica') || q.includes('chua thanh') || q.includes('nhẹ') || q.includes('quà') || q.includes('signature')) {
      matched = allProds
        .filter((p: any) => p.slug.includes('signature') || p.slug.includes('fox') || p.slug.includes('eagle') || p.slug.includes('arabica'))
        .slice(0, 3);
      reply = isEn
        ? 'For smooth Espresso, aromatic Arabica, or executive gifting, explore Black Panther Signature Reserve, Fox Espresso, or Arabica S18 CBU:'
        : 'Với gu Espresso hậu ngọt, thơm thanh hoặc làm quà biếu, bạn xem Báo Đen Signature Reserve, Cáo Espresso hoặc Arabica S18 CBU bên dưới nhé:';
      quickLinks = [{ label: isEn ? '7 Brand Personalities' : 'Khám phá 7 Cá tính ROAR', to: '/personalities' }];
    } else {
      matched = allProds.filter((p: any) => p.category === 'roasted' || p.category === 'roasted_beans').slice(0, 3);
      reply = isEn
        ? 'Welcome to ROAR COFFEE® AI Barista! Tell me your taste preference (bold Phin, smooth Espresso, kg wholesale quote, or B2B green beans) and I will recommend the best products!'
        : 'Chào bạn đến với ROAR COFFEE® AI Barista! Hãy cho mình biết gu uống (đậm đà pha Phin, thơm mượt Espresso, báo giá hạt rang theo kg hay nhân xanh B2B) để mình gợi ý sản phẩm & báo giá chính xác nhé!';
      quickLinks = [
        { label: isEn ? 'Roasted Beans (5-tier kg)' : 'Cà phê Hạt rang (5 mức kg)', to: '/coffee/roasted-beans' },
        { label: isEn ? 'Vouchers & Promos' : 'Xem Voucher ưu đãi', to: '/promotions' },
      ];
    }

    return jsonResponse({
      ok: true,
      reply,
      recommendedProducts: matched.slice(0, 3).map(hydrate),
      quickLinks,
      fallback: true,
    });
  }

  // 3. Auth: Me & Logout
  if (pathname === '/api/auth/me' && method === 'GET') {
    const u = resolveTokenUser(headers, state);
    if (u && syncStaticUserTier(state, u)) writeState(state);
    return jsonResponse({ user: u ? toPublicUser(u) : null });
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    return jsonResponse({ ok: true });
  }

  // 4. Account Dashboard
  if (pathname === '/api/account/dashboard' && method === 'GET') {
    const u = resolveTokenUser(headers, state);
    if (!u) return jsonResponse({ error: 'Unauthorized' }, 401);
    if (syncStaticUserTier(state, u)) writeState(state);
    const userOrders = state.orders.filter(
      (o) => o.user_id === u.id || String(o.customer_email || '').toLowerCase() === u.email.toLowerCase()
    );
    const snapTiers = Array.isArray(snap?.tables?.membership_tiers) && snap.tables.membership_tiers.length > 0
      ? snap.tables.membership_tiers
      : ROAR_MEMBERSHIP_TIERS.map((t, idx) => ({
          id: idx + 1,
          name: t.name,
          min_spend_vnd: t.minSpendVnd,
          point_multiplier: t.multiplier,
          benefits_vi: t.benefitsVi.join(' · '),
          benefits_en: t.benefitsEn.join(' · '),
        }));
    return jsonResponse({
      user: {
        id: u.id,
        email: u.email,
        full_name: u.fullName,
        phone: u.phone,
        role: u.role,
        member_code: u.memberCode,
        tier: normalizeMembershipTierName(u.tier),
        email_verified: 1,
        addresses: [],
      },
      points: { available: u.points ?? 120, pending: 0, redeemed: 0, expired: 0, expiringSoon: 0 },
      ledger: [],
      orders: userOrders,
      giftDispatches: userOrders
        .flatMap((o: any) => (Array.isArray(o.gift_dispatches) ? o.gift_dispatches : []))
        .map((d: any) =>
          d.status === 'pending_payment'
            ? { ...d, voucher_code: 'ROAR-GIFT-••••-••••', is_code_masked: true }
            : d
        ),
      activeVouchers: (snap?.tables?.promotions || []).filter((p: any) => p.active),
      tiers: snapTiers,
      loyaltySettings: (snap?.tables?.loyalty_settings || [])[0] || null,
      notifications: [],
    });
  }

  // 5. Promotions Validate
  if (pathname === '/api/promotions/validate' && method === 'POST') {
    const code = String(body.code || '').trim().toUpperCase();
    const sub = Number(body.subtotal || 0);
    const promos = snap?.tables?.promotions || [];
    const promo = promos.find((p: any) => String(p.code || '').toUpperCase() === code && p.active);
    if (!promo) return jsonResponse({ error: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.' }, 404);
    if (sub < Number(promo.min_order_value || 0)) {
      return jsonResponse({ error: `Đơn hàng tối thiểu ${Number(promo.min_order_value).toLocaleString('vi-VN')} ₫.` }, 400);
    }
    let discountAmount = 0;
    if (promo.discount_type === 'percent') {
      discountAmount = Math.round((sub * promo.discount_value) / 100);
      if (promo.max_discount > 0) discountAmount = Math.min(discountAmount, promo.max_discount);
    } else if (promo.discount_type === 'fixed') {
      discountAmount = Math.min(sub, promo.discount_value);
    } else if (promo.discount_type === 'free_shipping') {
      discountAmount = promo.discount_value || 35000;
    }
    return jsonResponse({ valid: true, promo, discountAmount });
  }

  // 6. Create Order & Track Order
  if (pathname === '/api/orders' && method === 'POST') {
    const cleanCustomerName = String(body.customerName || '').trim();
    const cleanCustomerEmail = String(body.customerEmail || '').trim().toLowerCase();
    const cleanCustomerPhone = String(body.customerPhone || '').trim();
    const cleanShippingAddress = String(body.shippingAddress || '').trim();
    if (!cleanCustomerName || !cleanCustomerEmail || !cleanCustomerPhone || !cleanShippingAddress || !Array.isArray(body.items) || body.items.length === 0) {
      return jsonResponse({ error: 'Vui lòng nhập đầy đủ thông tin nhận hàng và sản phẩm.' }, 400);
    }

    const allProds = [...(snap?.tables?.products || []), ...state.createdProducts];
    let subtotal = 0;
    const resolvedItems: any[] = [];
    for (const item of body.items || []) {
      const p = allProds.find((x: any) => x.id === Number(item.productId));
      if (!p) continue;
      const qty = Math.max(1, Number(item.quantity || 1));
      const tiers = Array.isArray(p.pricing_tiers) ? p.pricing_tiers : JSON.parse(p.pricing_tiers_json || '[]');
      const variants = Array.isArray(p.variants) ? p.variants : JSON.parse(p.variants_json || '[]');
      let unitPriceVnd = Number(p.price_vnd || 0);
      let variantLabel = String(item.variantLabel || 'Standard');
      let unit: 'kg' | 'unit' = 'unit';
      if (tiers.length > 0) {
        const tier = resolveVolumeTier(tiers, qty);
        if (tier) {
          unitPriceVnd = tier.priceVnd;
          variantLabel = `${qty} kg (${tier.labelVi})`;
          unit = 'kg';
        }
      } else if (variants.length > 0) {
        const matchedVariant = variants.find((v: any) => v.label === item.variantLabel);
        if (matchedVariant) {
          unitPriceVnd = Number(matchedVariant.priceVnd || p.price_vnd || 0);
          variantLabel = String(matchedVariant.label || variantLabel);
        }
      }
      const lineTotalVnd = unitPriceVnd * qty;
      subtotal += lineTotalVnd;
      resolvedItems.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        product_id: p.id,
        sku: p.sku,
        product_name_vi: p.name_vi,
        product_name_en: p.name_en,
        product_image_key: p.image_key,
        variant_label: variantLabel,
        quantity: qty,
        unit,
        unit_price_vnd: unitPriceVnd,
        line_total_vnd: lineTotalVnd,
      });
    }
    const mergedSettings: Record<string, string> = {};
    for (const row of snap?.tables?.site_settings || []) mergedSettings[row.key] = row.value;
    Object.assign(mergedSettings, state.settingsOverlay);
    const shippingCalc = calculateShippingFee(subtotal, mergedSettings);
    let shippingFee = shippingCalc.feeVnd;
    let discountAmount = 0;
    let appliedVoucher = '';
    if (body.voucherCode) {
      const code = String(body.voucherCode).trim().toUpperCase();
      const promo = (snap?.tables?.promotions || []).find(
        (p: any) => String(p.code || '').toUpperCase() === code && p.active
      );
      if (promo && subtotal >= Number(promo.min_order_value || 0)) {
        appliedVoucher = promo.code;
        if (promo.discount_type === 'percent') {
          discountAmount = Math.round((subtotal * promo.discount_value) / 100);
          if (promo.max_discount > 0) discountAmount = Math.min(discountAmount, promo.max_discount);
        } else if (promo.discount_type === 'fixed') {
          discountAmount = Math.min(subtotal, promo.discount_value);
        } else if (promo.discount_type === 'free_shipping') {
          shippingFee = 0;
        }
      }
    }

    const u = resolveTokenUser(headers, state);
    let pointsRedeemed = 0;
    let pointsDiscount = 0;
    const requestedPoints = Math.max(0, Math.floor(Number(body.pointsToRedeem || 0)));
    if (requestedPoints > 0 && u) {
      const loyalty = (snap?.tables?.loyalty_settings || [])[0] || { vnd_per_point: 100, max_redeem_percent: 30 };
      const maxDiscountVnd = Math.floor((subtotal * (loyalty.max_redeem_percent || 30)) / 100);
      const maxPts = Math.floor(maxDiscountVnd / (loyalty.vnd_per_point || 100));
      pointsRedeemed = Math.min(requestedPoints, u.points ?? 0, maxPts);
      pointsDiscount = pointsRedeemed * (loyalty.vnd_per_point || 100);
    }

    const total = Math.max(0, subtotal - discountAmount - pointsDiscount + shippingFee);
    const paymentMethod = String(body.paymentMethod || 'vietqr');
    let initialPaymentStatus = 'awaiting_payment';
    const orderNumber = `RC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (paymentMethod === 'wallet') {
      if (!u) return jsonResponse({ error: 'Vui lòng đăng nhập để thanh toán bằng Ví ROAR.' }, 401);
      if ((u.walletBalance ?? 0) < total) {
        return jsonResponse({ error: `Số dư Ví ROAR (${(u.walletBalance ?? 0).toLocaleString('vi-VN')}₫) không đủ.` }, 400);
      }
      u.walletBalance = (u.walletBalance ?? 0) - total;
      state.walletTransactions.unshift({
        id: Date.now(),
        user_id: u.id,
        type: 'spend',
        amount: total,
        bonus_amount: 0,
        points_delta: 0,
        balance_after: u.walletBalance,
        note: `Thanh toán đơn hàng ${orderNumber}`,
        created_at: new Date().toISOString(),
      });
      initialPaymentStatus = 'paid';
    } else if (paymentMethod === 'points') {
      if (!u) return jsonResponse({ error: 'Vui lòng đăng nhập để thanh toán bằng Điểm ROAR.' }, 401);
      const loyalty = (snap?.tables?.loyalty_settings || [])[0] || { vnd_per_point: 100 };
      const needed = Math.ceil(total / (loyalty.vnd_per_point || 100));
      if ((u.points ?? 0) < needed) {
        return jsonResponse({ error: `Bạn cần ${needed.toLocaleString('vi-VN')} điểm để thanh toán đơn này.` }, 400);
      }
      u.points = Math.max(0, (u.points ?? 0) - needed);
      pointsRedeemed += needed;
      pointsDiscount += total;
      initialPaymentStatus = 'paid';
    } else if (pointsRedeemed > 0 && u) {
      u.points = Math.max(0, (u.points ?? 0) - pointsRedeemed);
    }

    const resolvedCustomer = resolveOrCreateStaticCustomer(state, {
      authUser: u,
      customerName: cleanCustomerName,
      customerEmail: cleanCustomerEmail,
      customerPhone: cleanCustomerPhone,
    });

    const newOrder = {
      id: Date.now(),
      order_number: orderNumber,
      user_id: resolvedCustomer.user.id,
      customer_name: cleanCustomerName,
      customer_email: cleanCustomerEmail || resolvedCustomer.user.email,
      customer_phone: cleanCustomerPhone,
      shipping_address: cleanShippingAddress,
      currency: body.currency || 'VND',
      subtotal,
      discount_amount: discountAmount,
      points_redeemed: pointsRedeemed,
      points_discount: pointsDiscount,
      shipping_fee: shippingFee,
      total,
      voucher_code: appliedVoucher,
      payment_method: paymentMethod,
      payment_status: initialPaymentStatus,
      order_status: 'Pending',
      notes: body.notes || '',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      items: resolvedItems,
    };
    state.orders.unshift(newOrder);
    writeState(state);
    return jsonResponse({
      ok: true,
      order: {
        orderId: newOrder.id,
        orderNumber,
        total,
        subtotal,
        discountAmount,
        pointsDiscount,
        shippingFee,
        paymentMethod: newOrder.payment_method,
        customerEmail: newOrder.customer_email,
      },
      membership: {
        isNewMember: resolvedCustomer.isNewMember,
        matchedExisting: resolvedCustomer.matchedExisting,
        memberCode: resolvedCustomer.user.memberCode,
        tier: resolvedCustomer.user.tier,
        fullName: resolvedCustomer.user.fullName,
        welcomePoints: resolvedCustomer.welcomePoints,
      },
      ...(!u && resolvedCustomer.isNewMember
        ? { auth: { token: `static-token-${resolvedCustomer.user.id}`, user: toPublicUser(resolvedCustomer.user) } }
        : {}),
    }, 201);
  }

  if (pathname === '/api/orders/shipping-status' && method === 'GET') {
    const orderId = (searchParams.get('orderId') || searchParams.get('orderNumber') || '').trim().toUpperCase();
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    if (!orderId || !email) {
      return jsonResponse({ error: 'Vui lòng nhập đầy đủ Mã đơn hàng (Order ID) và Email đặt hàng.' }, 400);
    }
    const matched = state.orders.find(
      (o) =>
        String(o.order_number || '').trim().toUpperCase() === orderId &&
        String(o.customer_email || '').trim().toLowerCase() === email
    );
    if (!matched) {
      return jsonResponse({ error: 'Không tìm thấy đơn hàng khớp với Mã đơn hàng và Email đã nhập.' }, 404);
    }
    const shipping = buildLiveShippingTracking(matched);
    return jsonResponse({
      ok: true,
      shipping,
      order: { ...matched, shipping_tracking: shipping },
    });
  }

  // 6b. Gift Voucher Checkout, My Vouchers & Payment Confirmation (Static Fallback)
  if (pathname === '/api/gift-vouchers/checkout' && method === 'POST') {
    const normalizePhoneKey = (raw: string) => {
      const d = String(raw || '').replace(/\D/g, '');
      if (!d) return '';
      return d.startsWith('84') && d.length >= 10 ? `0${d.slice(2)}` : d;
    };
    const maskDispatches = (list: any[]) =>
      list.map((d) =>
        d.status === 'pending_payment'
          ? { ...d, voucher_code: 'ROAR-GIFT-••••-••••', is_code_masked: true }
          : d
      );

    const allProds = [...(snap?.tables?.products || []), ...state.createdProducts];
    const product = allProds.find(
      (p: any) => p.id === Number(body.productId) || (body.productSlug && p.slug === String(body.productSlug))
    );
    if (!product || (product.sub_category !== 'Gift Voucher' && !String(product.slug || '').startsWith('gift-voucher-'))) {
      return jsonResponse({ error: 'Sản phẩm Gift Voucher không tồn tại' }, 404);
    }

    const mode = body.purchaseMode === 'self' ? 'self' : 'gift';
    const channel = body.deliveryChannel === 'email' ? 'email' : 'zalo_sms';
    const authU = resolveTokenUser(headers, state);
    const finalSenderName = String(body.senderName || authU?.fullName || '').trim();
    const finalSenderEmail = String(body.senderEmail || authU?.email || '').trim().toLowerCase();
    const finalSenderPhone = String(body.senderPhone || authU?.phone || '').trim();
    const senderPhoneKey = normalizePhoneKey(finalSenderPhone);

    if (!finalSenderName || (!finalSenderEmail && !finalSenderPhone)) {
      return jsonResponse({ error: 'Vui lòng nhập họ tên và số điện thoại hoặc email của người mua.' }, 400);
    }

    const normalizedRecipients: Array<{ name: string; contact: string }> = [];
    if (mode === 'self') {
      const qty = Math.min(20, Math.max(1, Math.floor(Number(body.selfQuantity || 1))));
      const contact = channel === 'email' ? finalSenderEmail || finalSenderPhone : finalSenderPhone || finalSenderEmail;
      for (let i = 0; i < qty; i++) normalizedRecipients.push({ name: finalSenderName, contact });
    } else {
      const recs = Array.isArray(body.recipients) ? body.recipients : [];
      if (recs.length === 0 || recs.length > 20) {
        return jsonResponse({ error: 'Vui lòng thêm từ 1 đến 20 người nhận Voucher.' }, 400);
      }
      for (const r of recs) {
        if (!String(r?.name || '').trim() || !String(r?.contact || '').trim()) {
          return jsonResponse({ error: 'Mỗi người nhận cần nhập đầy đủ tên và SĐT Zalo hoặc Email.' }, 400);
        }
        normalizedRecipients.push({ name: String(r.name).trim(), contact: String(r.contact).trim() });
      }
    }

    const resolvedCustomer = resolveOrCreateStaticCustomer(state, {
      authUser: authU,
      customerName: finalSenderName,
      customerEmail: finalSenderEmail,
      customerPhone: finalSenderPhone,
    });
    const member = resolvedCustomer.user;
    const isNewMember = resolvedCustomer.isNewMember;
    const matchedExisting = resolvedCustomer.matchedExisting;

    const unitPriceVnd = Number(product.price_vnd || 0);
    const qty = normalizedRecipients.length;
    const subtotal = unitPriceVnd * qty;
    const finalMethod = String(body.paymentMethod || 'vietqr');
    let discountAmount = 0;
    if (body.promoCode) {
      const promo = (snap?.tables?.promotions || []).find(
        (p: any) => String(p.code || '').toUpperCase() === String(body.promoCode).trim().toUpperCase() && p.active
      );
      if (promo && subtotal >= Number(promo.min_order_value || 0)) {
        discountAmount =
          promo.discount_type === 'percent'
            ? Math.min(promo.max_discount || subtotal, Math.round((subtotal * promo.discount_value) / 100))
            : Math.min(subtotal, promo.discount_value || 0);
      }
    }
    const total = Math.max(0, subtotal - discountAmount);
    const orderNumber = `RC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isPaid = finalMethod === 'wallet' || finalMethod === 'points' || total === 0;
    const dispatchStatus = isPaid ? 'active' : 'pending_payment';
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const resolvedOrderEmail = finalSenderEmail || member.email;

    const dispatches = normalizedRecipients.map((r, idx) => ({
      id: Date.now() + idx,
      order_id: Date.now(),
      order_number: orderNumber,
      product_id: product.id,
      product_slug: product.slug,
      voucher_code: `ROAR-GIFT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      purchase_mode: mode,
      delivery_channel: channel,
      sender_name: finalSenderName,
      recipient_name: r.name,
      recipient_contact: r.contact,
      gift_message: String(body.giftMessage || '').trim().slice(0, 300),
      face_value_vnd: unitPriceVnd,
      status: dispatchStatus,
      expires_at: expiresAt,
    }));

    const newOrder = {
      id: Date.now(),
      order_number: orderNumber,
      user_id: member.id,
      customer_name: finalSenderName,
      customer_email: resolvedOrderEmail,
      customer_phone: finalSenderPhone || resolvedOrderEmail,
      shipping_address: `[E-Voucher Digital Dispatch]`,
      currency: 'VND',
      subtotal,
      discount_amount: discountAmount,
      points_discount: 0,
      shipping_fee: 0,
      total,
      payment_method: finalMethod,
      payment_status: isPaid ? 'paid' : 'awaiting_payment',
      order_status: isPaid ? 'Completed' : 'Pending',
      notes: String(body.giftMessage || ''),
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      items: [
        {
          id: Date.now(),
          product_id: product.id,
          sku: product.sku,
          product_name_vi: product.name_vi,
          product_name_en: product.name_en,
          variant_label: `E-Voucher (${unitPriceVnd.toLocaleString('vi-VN')}₫)`,
          quantity: qty,
          unit_price_vnd: unitPriceVnd,
          line_total_vnd: subtotal,
        },
      ],
      gift_dispatches: dispatches,
    };
    state.orders.unshift(newOrder);
    writeState(state);

    return jsonResponse(
      {
        ok: true,
        order: {
          orderId: newOrder.id,
          orderNumber,
          subtotal,
          discountAmount,
          pointsDiscount: 0,
          shippingFee: 0,
          total,
          paymentMethod: finalMethod,
          paymentStatus: newOrder.payment_status,
          orderStatus: newOrder.order_status,
          customerEmail: resolvedOrderEmail,
          customerPhone: finalSenderPhone,
        },
        dispatches: maskDispatches(dispatches),
        membership: {
          isNewMember,
          matchedExisting,
          memberCode: member.memberCode,
          tier: member.tier,
          fullName: member.fullName,
          email: isNewMember ? member.email : undefined,
          phone: isNewMember ? member.phone : undefined,
          welcomePoints: isNewMember ? 50 : 0,
        },
        ...(!authU && isNewMember ? { auth: { token: `static-token-${member.id}`, user: toPublicUser(member) } } : {}),
      },
      201
    );
  }

  if (pathname === '/api/gift-vouchers/mine' && method === 'GET') {
    const me = resolveTokenUser(headers, state);
    if (!me) return jsonResponse({ error: 'Unauthorized' }, 401);
    const list = state.orders
      .filter((o: any) => o.user_id === me.id || String(o.customer_email || '').toLowerCase() === me.email.toLowerCase())
      .flatMap((o: any) => (Array.isArray(o.gift_dispatches) ? o.gift_dispatches : []))
      .map((d: any) =>
        d.status === 'pending_payment'
          ? { ...d, voucher_code: 'ROAR-GIFT-••••-••••', is_code_masked: true }
          : d
      );
    return jsonResponse({ dispatches: list });
  }

  if (/^\/api\/orders\/[^/]+\/confirm-payment-reference$/.test(pathname) && method === 'POST') {
    const orderNo = decodeURIComponent(pathname.split('/')[3] || '').toUpperCase();
    const email = String(body.email || '').trim().toLowerCase();
    const target = state.orders.find(
      (o: any) =>
        String(o.order_number || '').toUpperCase() === orderNo &&
        (!email || String(o.customer_email || '').toLowerCase() === email)
    );
    if (!target) return jsonResponse({ error: 'Order not found' }, 404);
    target.payment_status = 'pending_verification';
    writeState(state);
    return jsonResponse({ ok: true, paymentStatus: 'pending_verification' });
  }

  if (pathname === '/api/orders/track' && method === 'GET') {
    const orderNumber = (searchParams.get('orderNumber') || '').trim().toUpperCase();
    const phone = (searchParams.get('phone') || '').replace(/\D/g, '').replace(/^84/, '0');
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    const matches = state.orders.filter((o) => {
      if (orderNumber && email) {
        return (
          String(o.order_number || '').trim().toUpperCase() === orderNumber &&
          String(o.customer_email || '').trim().toLowerCase() === email
        );
      }
      if (orderNumber && String(o.order_number || '').trim().toUpperCase() === orderNumber) return true;
      if (email && String(o.customer_email || '').trim().toLowerCase() === email) return true;
      if (phone) {
        const op = String(o.customer_phone || '').replace(/\D/g, '').replace(/^84/, '0');
        if (op === phone) return true;
      }
      return false;
    });
    if (matches.length === 0) return jsonResponse({ error: 'Không tìm thấy đơn hàng phù hợp.' }, 404);
    const enriched = matches.map((o) => ({
      ...o,
      shipping_tracking: buildLiveShippingTracking(o),
      gift_dispatches: Array.isArray(o.gift_dispatches)
        ? o.gift_dispatches.map((d: any) =>
            d.status === 'pending_payment'
              ? { ...d, voucher_code: 'ROAR-GIFT-••••-••••', is_code_masked: true }
              : d
          )
        : [],
    }));
    return jsonResponse({ orders: enriched, order: enriched[0] });
  }

  // 7. B2B & Newsletter Public Submissions
  if (pathname === '/api/b2b/inquiries' && method === 'POST') {
    const rec = {
      id: Date.now(),
      inquiry_type: body.inquiryType || 'wholesale',
      company_name: body.companyName || '',
      contact_name: body.contactName || '',
      email: body.email || '',
      phone: body.phone || '',
      country: body.country || 'Vietnam',
      product_sku: body.productSku || '',
      estimated_volume: body.estimatedVolume || '',
      message: body.message || '',
      status: 'new',
      quoted_price: '',
      admin_notes: '',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    state.b2bInquiries.unshift(rec);
    writeState(state);
    return jsonResponse({ ok: true, id: rec.id }, 201);
  }

  if (pathname === '/api/newsletter' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return jsonResponse({ error: 'Email không hợp lệ.' }, 400);
    if (!state.newsletterSubscribers.some((n) => n.email === email)) {
      state.newsletterSubscribers.unshift({
        id: Date.now(),
        email,
        lang: body.lang === 'en' ? 'en' : 'vi',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
      writeState(state);
    }
    return jsonResponse({ ok: true });
  }

  // 8. Admin CMS Static Fallback Endpoints
  if (pathname.startsWith('/api/admin/')) {
    const u = resolveTokenUser(headers, state);
    if (!u || u.role !== 'admin') return jsonResponse({ error: 'Admin access required' }, 403);

    if (pathname === '/api/admin/overview') {
      syncStaticOrderCustomers(state);
      const products = snap?.tables?.products || [];
      const articles = snap?.tables?.journal_articles || [];
      const revenue = state.orders.reduce((s, o) => s + Number(o.total || 0), 0);
      const totalOrders = state.orders.length;
      const avgOrderValue = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;
      const members = state.users.filter((x) => x.role !== 'admin').length;
      const pointsIssued = state.users.reduce((s, x) => s + Number(x.points || 0), 0);
      return jsonResponse({
        metrics: {
          revenue,
          avgOrderValue,
          totalOrders,
          grossRevenueVnd: revenue,
          members,
          customers: members,
          pointsIssued,
          products: products.length,
          articles: articles.length,
          b2bInquiries: state.b2bInquiries.length,
          newsletterCount: state.newsletterSubscribers.length,
          activeProducts: products.filter((p: any) => p.status !== 'draft').length,
        },
        revenueByCategory: [],
        recentOrders: state.orders.slice(0, 5),
        topProducts: [],
      });
    }
    if (pathname === '/api/admin/products' && method === 'GET') {
      const list = [...(snap?.tables?.products || []), ...state.createdProducts].map((p: any) => ({
        ...p,
        ...(state.productsOverlay[p.id] || {}),
        variants: Array.isArray(p.variants) ? p.variants : JSON.parse(p.variants_json || '[]'),
        pricing_tiers: Array.isArray(p.pricing_tiers) ? p.pricing_tiers : JSON.parse(p.pricing_tiers_json || '[]'),
        gallery_images: Array.isArray(p.gallery_images) ? p.gallery_images : JSON.parse(p.gallery_images_json || '[]'),
      }));
      return jsonResponse({ products: list });
    }
    if (pathname.startsWith('/api/admin/products/') && method === 'PATCH') {
      const id = Number(pathname.split('/').pop());
      state.productsOverlay[id] = { ...(state.productsOverlay[id] || {}), ...body };
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (pathname === '/api/admin/orders' && method === 'GET') {
      return jsonResponse({ orders: state.orders });
    }
    if (/^\/api\/admin\/orders\/\d+$/.test(pathname) && method === 'PATCH') {
      const id = Number(pathname.split('/').pop());
      const order = state.orders.find((o) => Number(o.id) === id);
      if (!order) {
        return jsonResponse({ error: 'Không tìm thấy đơn hàng.' }, 404);
      }

      const prevStatus = order.order_status || 'Pending';
      const nextStatus = body.orderStatus || prevStatus;
      const nextPayment = body.paymentStatus || order.payment_status || 'awaiting_payment';
      const nextTracking =
        body.trackingCode !== undefined ? String(body.trackingCode).trim() : order.tracking_code || '';
      const cleanResolution = typeof body.resolutionNote === 'string' ? body.resolutionNote.trim() : '';
      const nextNotes = cleanResolution
        ? `${order.notes ? `${order.notes}\n` : ''}[Xử lý ${new Date().toISOString().slice(0, 16).replace('T', ' ')}] ${cleanResolution}`
        : order.notes || '';

      order.order_status = nextStatus;
      order.payment_status = nextPayment;
      order.tracking_code = nextTracking;
      order.notes = nextNotes;
      order.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

      if (Array.isArray(order.gift_dispatches)) {
        if (nextPayment === 'paid' && nextStatus !== 'Cancelled' && nextStatus !== 'Returned') {
          order.gift_dispatches = order.gift_dispatches.map((d: any) =>
            d.status === 'pending_payment' ? { ...d, status: 'active' } : d
          );
        } else if (nextStatus === 'Cancelled' || nextStatus === 'Returned') {
          order.gift_dispatches = order.gift_dispatches.map((d: any) =>
            d.status === 'pending_payment' || d.status === 'active' ? { ...d, status: 'cancelled' } : d
          );
        }
      }

      if (order.user_id && nextStatus === 'Completed' && !order.points_awarded) {
        const netEligible = Math.max(0, Number(order.subtotal || 0) - Number(order.discount_amount || 0) - Number(order.points_discount || 0));
        const buyer = state.users.find((usr) => usr.id === Number(order.user_id));
        const buyerTier = buyer ? normalizeMembershipTierName(buyer.tier) : 'ROAR Member';
        const tierMult = ROAR_MEMBERSHIP_TIERS.find((t) => t.name === buyerTier)?.multiplier || 1;
        const pts = Math.floor((netEligible / 10000) * tierMult);
        if (buyer) {
          if (pts > 0) buyer.points = (buyer.points ?? 0) + pts;
          syncStaticUserTier(state, buyer);
        }
        order.points_awarded = pts;
      }

      if (order.user_id && (nextStatus === 'Cancelled' || nextStatus === 'Returned') && Number(order.points_awarded || 0) > 0) {
        const buyer = state.users.find((usr) => usr.id === Number(order.user_id));
        if (buyer) buyer.points = Math.max(0, (buyer.points ?? 0) - Number(order.points_awarded || 0));
        order.points_awarded = 0;
      }

      writeState(state);
      return jsonResponse({ ok: true, order });
    }
    if (pathname === '/api/admin/customers' && method === 'GET') {
      syncStaticOrderCustomers(state);
      let anyTierChanged = false;
      for (const usr of state.users) {
        if (syncStaticUserTier(state, usr)) anyTierChanged = true;
      }
      if (anyTierChanged) writeState(state);
      const sortedUsers = [...state.users].sort((a, b) => b.id - a.id);
      return jsonResponse({
        customers: sortedUsers.map((x) => {
          const xPhoneKey = normalizePhoneKey(x.phone);
          const userOrders = state.orders.filter(
            (o) =>
              o.order_status !== 'Cancelled' &&
              (Number(o.user_id) === x.id ||
                String(o.customer_email || '').trim().toLowerCase() === x.email.toLowerCase() ||
                (xPhoneKey.length >= 8 && normalizePhoneKey(o.customer_phone) === xPhoneKey))
          );
          const totalSpent = userOrders.reduce((s, o) => s + Number(o.total || 0), 0);
          return {
            id: x.id,
            email: x.email,
            full_name: x.fullName,
            phone: x.phone || '',
            role: x.role,
            admin_role: x.adminRole || (x.role === 'admin' ? 'super_admin' : 'none'),
            member_code: x.memberCode,
            tier: normalizeMembershipTierName(x.tier),
            company_name: x.companyName || '',
            b2b_verified: Boolean(x.b2bVerified),
            wallet_balance_vnd: x.walletBalance ?? 0,
            orderCount: userOrders.length,
            totalSpent,
            unreadNotifications: 0,
            points: {
              available: x.points ?? 50,
              pending: 0,
              redeemed: 0,
            },
            created_at: x.createdAt,
          };
        }),
        loyaltySettings: (snap?.tables?.loyalty_settings || [])[0] || {
          points_per_10k_vnd: 1,
          vnd_per_point: 1000,
          policy_status: 'proposed_configurable',
        },
      });
    }
    if (/^\/api\/admin\/customers\/\d+$/.test(pathname) && method === 'PATCH') {
      const id = Number(pathname.split('/').pop());
      const target = state.users.find((x) => x.id === id);
      if (!target) return jsonResponse({ error: 'Không tìm thấy thành viên.' }, 404);
      if (body.tier) target.tier = normalizeMembershipTierName(String(body.tier));
      if (Number.isFinite(Number(body.pointsDelta)) && Number(body.pointsDelta) !== 0) {
        target.points = Math.max(0, (target.points ?? 0) + Number(body.pointsDelta));
        if (Number(body.pointsDelta) > 0) {
          syncStaticUserTier(state, target);
        }
      }
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (/^\/api\/admin\/customers\/(\d+|all)\/notify$/.test(pathname) && method === 'POST') {
      const targetParam = pathname.split('/')[4];
      const sentCount = targetParam === 'all' ? state.users.length : 1;
      return jsonResponse({ ok: true, sentCount });
    }
    if (pathname === '/api/admin/loyalty-settings' && method === 'PATCH') {
      state.settingsOverlay._loyalty_settings = JSON.stringify(body || {});
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (pathname === '/api/admin/b2b' && method === 'GET') {
      return jsonResponse({ inquiries: state.b2bInquiries });
    }
    if (pathname.startsWith('/api/admin/b2b/') && method === 'PATCH') {
      const id = Number(pathname.split('/').pop());
      state.b2bInquiries = state.b2bInquiries.map((inq) =>
        inq.id === id
          ? {
              ...inq,
              status: body.status ?? inq.status,
              quoted_price: body.quotedPrice ?? inq.quoted_price,
              admin_notes: body.adminNotes ?? inq.admin_notes,
            }
          : inq
      );
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (pathname.startsWith('/api/admin/b2b/') && method === 'DELETE') {
      const id = Number(pathname.split('/').pop());
      state.b2bInquiries = state.b2bInquiries.filter((inq) => inq.id !== id);
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (pathname === '/api/admin/newsletter' && method === 'GET') {
      return jsonResponse({ subscribers: state.newsletterSubscribers });
    }
    if (pathname.startsWith('/api/admin/newsletter/') && method === 'DELETE') {
      const id = Number(pathname.split('/').pop());
      state.newsletterSubscribers = state.newsletterSubscribers.filter((n) => n.id !== id);
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (pathname === '/api/admin/promotions' && method === 'GET') {
      const base = snap?.tables?.promotions || [];
      const custom = state.settingsOverlay._promotions ? JSON.parse(state.settingsOverlay._promotions) : null;
      return jsonResponse({ promotions: Array.isArray(custom) ? custom : base });
    }
    if (pathname === '/api/admin/promotions' && method === 'POST') {
      const base = snap?.tables?.promotions || [];
      const current = state.settingsOverlay._promotions ? JSON.parse(state.settingsOverlay._promotions) : [...base];
      const newPromo = {
        id: Date.now(),
        code: String(body.code || '').trim().toUpperCase(),
        title_vi: String(body.title_vi || ''),
        title_en: String(body.title_en || body.title_vi || ''),
        description_vi: String(body.title_vi || ''),
        description_en: String(body.title_en || body.title_vi || ''),
        promo_type: 'code',
        discount_type: body.discount_type || 'percent',
        discount_value: Number(body.discount_value || 10),
        max_discount: 0,
        min_order_value: 0,
        eligible_category: 'all',
        start_date: body.start_date || '2026-01-01',
        end_date: body.end_date || '2027-12-31',
        usage_limit: 1000,
        used_count: 0,
        per_customer_limit: 1,
        combinable: 0,
        member_only: 0,
        min_tier: '',
        terms_vi: '',
        terms_en: '',
        active: 1,
      };
      current.unshift(newPromo);
      state.settingsOverlay._promotions = JSON.stringify(current);
      writeState(state);
      return jsonResponse({ ok: true, id: newPromo.id }, 201);
    }
    if (/^\/api\/admin\/promotions\/\d+$/.test(pathname) && method === 'PATCH') {
      const id = Number(pathname.split('/').pop());
      const base = snap?.tables?.promotions || [];
      const current = state.settingsOverlay._promotions ? JSON.parse(state.settingsOverlay._promotions) : [...base];
      const next = current.map((p: any) => (p.id === id ? { ...p, ...body } : p));
      state.settingsOverlay._promotions = JSON.stringify(next);
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (/^\/api\/admin\/promotions\/\d+$/.test(pathname) && method === 'DELETE') {
      const id = Number(pathname.split('/').pop());
      const base = snap?.tables?.promotions || [];
      const current = state.settingsOverlay._promotions ? JSON.parse(state.settingsOverlay._promotions) : [...base];
      state.settingsOverlay._promotions = JSON.stringify(current.filter((p: any) => p.id !== id));
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (pathname === '/api/admin/settings' && method === 'GET') {
      const settings: Record<string, string> = {};
      for (const row of snap?.tables?.site_settings || []) settings[row.key] = row.value;
      return jsonResponse({ settings: { ...settings, ...state.settingsOverlay } });
    }
    if (pathname === '/api/admin/settings' && method === 'PATCH') {
      const payload = (body && typeof body.settings === 'object' ? body.settings : body) || {};
      const urlKeys = new Set(['facebook_url', 'instagram_url', 'tiktok_url', 'youtube_url', 'zalo_url']);
      for (const [k, rawVal] of Object.entries(payload)) {
        const val = String(rawVal ?? '').trim();
        if (urlKeys.has(k) && val && !/^https?:\/\//i.test(val)) {
          return jsonResponse({ error: `Liên kết ${k} phải bắt đầu bằng https:// hoặc http://` }, 400);
        }
        state.settingsOverlay[k] = val;
      }
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (pathname === '/api/admin/pages' && method === 'GET') {
      return jsonResponse({ pages: snap?.tables?.cms_pages || [] });
    }
    if (pathname === '/api/admin/journal' && method === 'GET') {
      return jsonResponse({ articles: snap?.tables?.journal_articles || [] });
    }
    if (pathname === '/api/admin/media' && method === 'GET') {
      return jsonResponse({ assets: snap?.tables?.media_assets || [] });
    }
    if (pathname === '/api/admin/team' && method === 'GET') {
      const admins = state.users
        .filter((x) => x.role === 'admin')
        .map((x) => {
          const roleKey = x.adminRole || 'super_admin';
          const perms =
            roleKey === 'super_admin'
              ? [...ALL_ADMIN_PERMISSIONS]
              : Array.isArray(x.adminPermissions)
                ? x.adminPermissions
                : ['overview'];
          return {
            id: x.id,
            email: x.email,
            fullName: x.fullName,
            phone: x.phone || '',
            role: x.role,
            adminRole: roleKey,
            adminPermissions: perms,
            memberCode: x.memberCode,
            tier: x.tier || 'ROAR Gold',
            createdAt: x.createdAt,
          };
        });
      const nonAdmins = state.users
        .filter((x) => x.role !== 'admin')
        .map((x) => ({
          id: x.id,
          email: x.email,
          full_name: x.fullName,
          phone: x.phone || '',
          role: x.role,
          member_code: x.memberCode,
        }));
      return jsonResponse({ admins, nonAdmins, auditLogs: [] });
    }
    if (pathname === '/api/admin/team' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const adminRole = String(body.adminRole || 'content_editor');
      const permissions =
        adminRole === 'super_admin'
          ? [...ALL_ADMIN_PERMISSIONS]
          : Array.isArray(body.permissions)
            ? body.permissions
            : ['overview'];

      const existingById =
        body.mode === 'promote' && body.existingUserId
          ? state.users.find((x) => x.id === Number(body.existingUserId))
          : undefined;
      const existingByEmail = email
        ? state.users.find((x) => x.email.toLowerCase() === email)
        : undefined;
      const existing = existingById || existingByEmail;

      if (existing) {
        const rawPromotePassword =
          body.password !== undefined && body.password !== null ? String(body.password) : '';
        if (rawPromotePassword.length > 0 && rawPromotePassword.length < 8) {
          return jsonResponse({ error: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' }, 400);
        }
        existing.role = 'admin';
        existing.adminRole = adminRole;
        existing.adminPermissions = permissions;
        existing.emailVerified = true;
        if (rawPromotePassword.length >= 8) {
          existing.password = rawPromotePassword;
        }
        writeState(state);
        return jsonResponse({ ok: true, id: existing.id, promoted: true });
      }

      const fullName = String(body.fullName || '').trim();
      const password = String(body.password || '');
      const phone = String(body.phone || '').trim();
      if (!email || !fullName || password.length < 6) {
        return jsonResponse({ error: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu (≥6 ký tự).' }, 400);
      }
      const nextId = Math.max(10, ...state.users.map((x) => x.id)) + 1;
      const newStaff: StaticUserRecord = {
        id: nextId,
        email,
        password,
        fullName,
        phone,
        role: 'admin',
        adminRole,
        adminPermissions: permissions,
        memberCode: `RC-ADM-${String(nextId).padStart(4, '0')}`,
        tier: 'ROAR Reserve',
        emailVerified: true,
        walletBalance: 0,
        points: 0,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      state.users.push(newStaff);
      writeState(state);
      return jsonResponse({ ok: true, id: newStaff.id, promoted: false }, 201);
    }
    if (pathname.startsWith('/api/admin/team/') && method === 'PATCH') {
      const id = Number(pathname.split('/').pop());
      const target = state.users.find((x) => x.id === id);
      if (!target) return jsonResponse({ error: 'Không tìm thấy nhân sự.' }, 404);
      const superAdmins = state.users.filter((x) => x.role === 'admin' && (x.adminRole || 'super_admin') === 'super_admin');
      if (body.revokeAdmin) {
        if (target.id === u.id) {
          return jsonResponse({ error: 'Không thể tự thu hồi quyền quản trị của chính tài khoản đang đăng nhập.' }, 400);
        }
        if ((target.adminRole || 'super_admin') === 'super_admin' && superAdmins.length <= 1) {
          return jsonResponse({ error: 'Phải giữ lại ít nhất 1 Quản trị Tối cao (Super Admin).' }, 400);
        }
        target.role = 'customer';
        target.adminRole = 'none';
        target.adminPermissions = [];
        writeState(state);
        return jsonResponse({ ok: true });
      }
      if (body.fullName && String(body.fullName).trim()) target.fullName = String(body.fullName).trim();
      if (body.adminRole) target.adminRole = String(body.adminRole);
      if (target.adminRole === 'super_admin') {
        target.adminPermissions = [...ALL_ADMIN_PERMISSIONS];
      } else if (Array.isArray(body.permissions)) {
        target.adminPermissions = body.permissions;
      }
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (pathname.startsWith('/api/admin/team/') && method === 'DELETE') {
      const id = Number(pathname.split('/').pop());
      const target = state.users.find((x) => x.id === id);
      if (!target) return jsonResponse({ error: 'Không tìm thấy nhân sự.' }, 404);
      target.role = 'customer';
      target.adminRole = 'none';
      target.adminPermissions = [];
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (/^\/api\/admin\/users\/\d+\/reset-password$/.test(pathname) && method === 'POST') {
      const id = Number(pathname.split('/')[4]);
      const newPassword = String(body.newPassword || '');
      if (newPassword.length < 8) {
        return jsonResponse({ error: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' }, 400);
      }
      const target = state.users.find((x) => x.id === id);
      if (!target) return jsonResponse({ error: 'Không tìm thấy tài khoản.' }, 404);

      const actorRole = u.adminRole || 'super_admin';
      const isActorSuper = actorRole === 'super_admin';
      const actorPerms = isActorSuper ? [...ALL_ADMIN_PERMISSIONS] : (u.adminPermissions || []);
      if (target.role === 'admin') {
        if (!isActorSuper && !actorPerms.includes('team')) {
          return jsonResponse({ error: 'Bạn cần quyền Phân quyền Thành viên (team) để đặt lại mật khẩu Quản trị viên.' }, 403);
        }
        if ((target.adminRole || 'super_admin') === 'super_admin' && !isActorSuper) {
          return jsonResponse({ error: 'Chỉ Super Admin mới được phép đặt lại mật khẩu của tài khoản Super Admin.' }, 403);
        }
      } else if (!isActorSuper && !actorPerms.includes('customers') && !actorPerms.includes('team')) {
        return jsonResponse({ error: 'Bạn chưa được cấp quyền Khách hàng hoặc Phân quyền Thành viên để đặt lại mật khẩu.' }, 403);
      }

      target.password = newPassword;
      writeState(state);
      return jsonResponse({ ok: true });
    }
    if (pathname === '/api/admin/wallets' && method === 'GET') {
      syncStaticOrderCustomers(state);
      let walletTierChanged = false;
      for (const usr of state.users) {
        if (syncStaticUserTier(state, usr)) walletTierChanged = true;
      }
      if (walletTierChanged) writeState(state);
      const members = [...state.users]
        .sort((a, b) => b.id - a.id)
        .map((usr) => ({
          id: usr.id,
          email: usr.email,
          full_name: usr.fullName,
          member_code: usr.memberCode,
          tier: normalizeMembershipTierName(usr.tier),
          wallet_balance_vnd: usr.walletBalance ?? 0,
          wallet_balance: usr.walletBalance ?? 0,
          points: { available: usr.points ?? 50, pending: 0, redeemed: 0 },
        }));
      return jsonResponse({
        members,
        users: members,
        transactions: state.walletTransactions.slice(0, 100),
      });
    }
    if (pathname === '/api/admin/wallets/adjust' && method === 'POST') {
      const targetUserId = Number(body.userId);
      const amountVnd = Math.floor(Number(body.amountVnd ?? body.amountDelta ?? 0));
      const pointsDelta = Math.floor(Number(body.pointsDelta || 0));
      const applyBonus = Boolean(body.applyBonus);
      const note = String(body.note || 'Admin điều chỉnh').trim();
      const target = state.users.find((u) => u.id === targetUserId);
      if (!target) return jsonResponse({ error: 'Không tìm thấy thành viên.' }, 404);
      let bonusPct = 0;
      let bonusVnd = 0;
      let totalCredit = amountVnd;
      let autoPoints = 0;
      if (amountVnd > 0 && applyBonus) {
        bonusPct = amountVnd >= 2000000 ? 30 : amountVnd >= 1000000 ? 20 : amountVnd >= 500000 ? 15 : 10;
        bonusVnd = Math.round((amountVnd * bonusPct) / 100);
        totalCredit = amountVnd + bonusVnd;
        autoPoints = Math.floor(totalCredit / 10000);
      }
      const finalPoints = pointsDelta + autoPoints;
      target.walletBalance = Math.max(0, (target.walletBalance ?? 0) + totalCredit);
      target.points = Math.max(0, (target.points ?? 0) + finalPoints);
      syncStaticUserTier(state, target);
      if (totalCredit !== 0) {
        state.walletTransactions.unshift({
          id: Date.now(),
          user_id: target.id,
          full_name: target.fullName,
          tx_type: totalCredit > 0 ? 'topup' : 'spend',
          type: totalCredit > 0 ? 'admin_credit' : 'admin_debit',
          amount_vnd: amountVnd,
          bonus_vnd: bonusVnd,
          amount: Math.abs(amountVnd),
          bonus_amount: bonusVnd,
          points_delta: finalPoints,
          balance_after: target.walletBalance,
          reference_code: `ADM-${Date.now().toString(36).toUpperCase()}`,
          note,
          created_at: new Date().toISOString(),
        });
      }
      writeState(state);
      return jsonResponse({
        ok: true,
        walletBalance: target.walletBalance,
        walletBalanceVnd: target.walletBalance,
        points: target.points,
      });
    }
    if (pathname === '/api/admin/wallet/requests' && method === 'GET') {
      const approvalMode = state.settingsOverlay.wallet_approval_mode === 'auto' ? 'auto' : 'manual';
      const requests = (state.settingsOverlay._wallet_requests ? JSON.parse(state.settingsOverlay._wallet_requests) : []) as any[];
      return jsonResponse({ approvalMode, requests });
    }
    if (pathname === '/api/admin/wallet/approval-mode' && method === 'PATCH') {
      const mode = body.mode === 'auto' ? 'auto' : 'manual';
      state.settingsOverlay.wallet_approval_mode = mode;
      writeState(state);
      return jsonResponse({ ok: true, approvalMode: mode });
    }
    if (/^\/api\/admin\/wallet\/requests\/\d+\/(approve|reject)$/.test(pathname) && method === 'POST') {
      const parts = pathname.split('/');
      const action = parts.pop();
      const id = Number(parts.pop());
      const requests = (state.settingsOverlay._wallet_requests ? JSON.parse(state.settingsOverlay._wallet_requests) : []) as any[];
      const reqItem = requests.find((r) => r.id === id);
      if (!reqItem) return jsonResponse({ error: 'Không tìm thấy yêu cầu nạp tiền.' }, 404);
      if (reqItem.status !== 'pending') return jsonResponse({ error: 'Yêu cầu đã được xử lý.' }, 400);
      reqItem.status = action === 'approve' ? 'approved' : 'rejected';
      reqItem.reviewed_at = new Date().toISOString();
      if (action === 'approve') {
        const target = state.users.find((u) => u.id === reqItem.user_id);
        if (target) {
          target.walletBalance = (target.walletBalance ?? 0) + Number(reqItem.total_credit_vnd || 0);
          target.points = (target.points ?? 0) + Number(reqItem.points_delta || 0);
          syncStaticUserTier(state, target);
          state.walletTransactions.unshift({
            id: Date.now(),
            user_id: target.id,
            type: 'topup',
            amount: reqItem.amount_vnd,
            bonus_amount: reqItem.bonus_vnd,
            points_delta: reqItem.points_delta,
            balance_after: target.walletBalance,
            note: `Duyệt nạp ví ${Number(reqItem.amount_vnd).toLocaleString('vi-VN')}₫ (+${reqItem.bonus_pct}%)`,
            created_at: new Date().toISOString(),
          });
        }
      }
      state.settingsOverlay._wallet_requests = JSON.stringify(requests);
      writeState(state);
      return jsonResponse({ ok: true });
    }
  }

  // ROAR Wallet (Member)
  if (pathname === '/api/wallet' && method === 'GET') {
    const me = resolveTokenUser(headers, state);
    if (!me) return jsonResponse({ error: 'Vui lòng đăng nhập.' }, 401);
    const transactions = state.walletTransactions.filter((t) => t.user_id === me.id).slice(0, 50);
    return jsonResponse({
      walletBalance: me.walletBalance ?? 0,
      walletBalanceVnd: me.walletBalance ?? 0,
      points: { available: me.points ?? 120, pending: 0, redeemed: 0 },
      transactions,
    });
  }

  if (pathname === '/api/wallet/topup' && method === 'POST') {
    const me = resolveTokenUser(headers, state);
    if (!me) return jsonResponse({ error: 'Vui lòng đăng nhập.' }, 401);
    const amount = Math.max(0, Number(body.amountVnd || body.amount || 0));
    if (amount < 50000) return jsonResponse({ error: 'Số tiền nạp tối thiểu 50.000đ.' }, 400);
    const bonusPct = amount >= 2000000 ? 30 : amount >= 1000000 ? 20 : amount >= 500000 ? 15 : 10;
    const bonusAmount = Math.round((amount * bonusPct) / 100);
    const totalCredit = amount + bonusAmount;
    const bonusPoints = Math.floor(totalCredit / 10000);
    const refCode = `TOPUP-${Date.now().toString(36).toUpperCase()}`;
    const approvalMode = state.settingsOverlay.wallet_approval_mode === 'auto' ? 'auto' : 'manual';
    const requests = (state.settingsOverlay._wallet_requests ? JSON.parse(state.settingsOverlay._wallet_requests) : []) as any[];

    if (approvalMode === 'manual') {
      const reqObj = {
        id: Date.now(),
        user_id: me.id,
        full_name: me.fullName,
        email: me.email,
        member_code: me.memberCode,
        amount_vnd: amount,
        bonus_pct: bonusPct,
        bonus_vnd: bonusAmount,
        total_credit_vnd: totalCredit,
        points_delta: bonusPoints,
        reference_code: refCode,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      requests.unshift(reqObj);
      state.settingsOverlay._wallet_requests = JSON.stringify(requests);
      writeState(state);
      return jsonResponse({
        ok: true,
        status: 'pending',
        approvalMode: 'manual',
        referenceCode: refCode,
        amountVnd: amount,
        bonusPct,
        bonusVnd: bonusAmount,
        totalCreditVnd: totalCredit,
        pointsDelta: bonusPoints,
        walletBalanceVnd: me.walletBalance ?? 0,
      });
    }

    me.walletBalance = (me.walletBalance ?? 0) + totalCredit;
    me.points = (me.points ?? 0) + bonusPoints;
    syncStaticUserTier(state, me);
    const tx = {
      id: Date.now(),
      user_id: me.id,
      type: 'topup',
      amount,
      bonus_amount: bonusAmount,
      points_delta: bonusPoints,
      balance_after: me.walletBalance,
      note: `Nạp ví ROAR +${bonusPct}% thưởng`,
      created_at: new Date().toISOString(),
    };
    state.walletTransactions.unshift(tx);
    writeState(state);
    return jsonResponse({
      ok: true,
      status: 'approved',
      approvalMode: 'auto',
      referenceCode: refCode,
      amountVnd: amount,
      bonusPct,
      bonusVnd: bonusAmount,
      totalCreditVnd: totalCredit,
      pointsDelta: bonusPoints,
      walletBalanceVnd: me.walletBalance,
      walletBalance: me.walletBalance,
      points: me.points,
      bonusAmount,
      bonusPoints,
      transaction: tx,
    });
  }

  // Daily Check-in 7-day Streak Game
  const CHECKIN_SCHEDULE = [
    { day: 1, points: 10, label: 'Ngày 1', bonus: false },
    { day: 2, points: 15, label: 'Ngày 2', bonus: false },
    { day: 3, points: 40, label: 'Ngày 3 • Bonus 3 ngày', bonus: true },
    { day: 4, points: 20, label: 'Ngày 4', bonus: false },
    { day: 5, points: 25, label: 'Ngày 5', bonus: false },
    { day: 6, points: 30, label: 'Ngày 6', bonus: false },
    { day: 7, points: 100, label: 'Ngày 7 • Quà Tuần ROAR', bonus: true },
  ];

  if (pathname === '/api/checkin/status' && method === 'GET') {
    const me = resolveTokenUser(headers, state);
    if (!me) return jsonResponse({ error: 'Vui lòng đăng nhập.' }, 401);
    const today = new Date().toISOString().slice(0, 10);
    const rec = state.checkins[me.id] || { streak: 0, lastCheckinDate: '', history: [] };
    const checkedInToday = rec.lastCheckinDate === today;
    return jsonResponse({
      checkedInToday,
      currentStreak: rec.streak,
      nextDay: checkedInToday ? rec.streak : (rec.streak % 7) + 1,
      schedule: CHECKIN_SCHEDULE,
      history: rec.history.slice(0, 14),
      points: me.points ?? 0,
    });
  }

  if (pathname === '/api/checkin' && method === 'POST') {
    const me = resolveTokenUser(headers, state);
    if (!me) return jsonResponse({ error: 'Vui lòng đăng nhập.' }, 401);
    const today = new Date().toISOString().slice(0, 10);
    const rec = state.checkins[me.id] || { streak: 0, lastCheckinDate: '', history: [] };
    if (rec.lastCheckinDate === today) {
      return jsonResponse({ error: 'Bạn đã điểm danh hôm nay rồi!' }, 400);
    }
    const nextDay = (rec.streak % 7) + 1;
    const reward = CHECKIN_SCHEDULE[nextDay - 1] || CHECKIN_SCHEDULE[0];
    rec.streak = nextDay;
    rec.lastCheckinDate = today;
    rec.history.unshift({
      date: today,
      day: nextDay,
      points: reward.points,
      label: reward.label,
    });
    state.checkins[me.id] = rec;
    me.points = (me.points ?? 0) + reward.points;
    syncStaticUserTier(state, me);
    writeState(state);
    return jsonResponse({
      ok: true,
      day: nextDay,
      pointsAwarded: reward.points,
      currentStreak: rec.streak,
      totalPoints: me.points,
      checkedInToday: true,
      schedule: CHECKIN_SCHEDULE,
    });
  }

  return null;
}
