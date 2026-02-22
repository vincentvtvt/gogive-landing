// FILE: app/gogiver/dashboard/page.tsx
// v2 — with Admin tab (role-based: admin + superuser)
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = '/api/gogiver';

// ═══ STATUS CONFIG ═══
const STATUS_CONF: Record<string, { label: string; emoji: string; color: string }> = {
  pending:       { label: 'Pending',        emoji: '⏳', color: 'text-gray-400' },
  injected:      { label: 'AI Contacting',  emoji: '🤖', color: 'text-blue-400' },
  contacted:     { label: 'In Conversation',emoji: '💬', color: 'text-indigo-400' },
  converted:     { label: 'Order Created',  emoji: '📋', color: 'text-purple-400' },
  processing:    { label: 'Processing',     emoji: '⚙️', color: 'text-yellow-400' },
  in_progress:   { label: 'AI Handling',    emoji: '🤖', color: 'text-blue-400' },
  completed:     { label: 'Completed',      emoji: '✅', color: 'text-emerald-400' },
  cancelled:     { label: 'Cancelled',      emoji: '🚫', color: 'text-red-400' },
  dropped:       { label: 'Not Interested', emoji: '👋', color: 'text-gray-500' },
  failed:        { label: 'Failed',         emoji: '❌', color: 'text-red-400' },
  inject_failed: { label: 'Contact Failed', emoji: '⚠️', color: 'text-red-400' },
};

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  NEW:        { bg: 'bg-blue-500/15',    text: 'text-blue-400' },
  PENDING:    { bg: 'bg-yellow-500/15',  text: 'text-yellow-400' },
  PROCESSING: { bg: 'bg-purple-500/15',  text: 'text-purple-400' },
  COMPLETE:   { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
};

type Tab = 'home' | 'refer' | 'products' | 'wallet' | 'admin';
type AdminView = 'stats' | 'givers' | 'feed' | 'withdrawals' | 'giver_detail' | 'products_mgmt' | 'product_edit';

// ═══ MAIN COMPONENT ═══
export default function GoGiverDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('home');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  // Refer form
  const [referPhone, setReferPhone] = useState('');
  const [referName, setReferName] = useState('');
  const [referProduct, setReferProduct] = useState('');
  const [referNote, setReferNote] = useState('');
  const [referring, setReferring] = useState(false);
  const [referResult, setReferResult] = useState<any>(null);

  // Wallet
  const [walletData, setWalletData] = useState<any>(null);

  // Expanded submission
  const [expandedSub, setExpandedSub] = useState<number | null>(null);

  // Admin state
  const [adminView, setAdminView] = useState<AdminView>('stats');
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminGivers, setAdminGivers] = useState<any>(null);
  const [adminFeed, setAdminFeed] = useState<any[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<any[]>([]);
  const [giverDetail, setGiverDetail] = useState<any>(null);
  const [giverSearch, setGiverSearch] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Product management state
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  const [adminBots, setAdminBots] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null); // null=list, {}=new, {id:..}=edit
  const [productForm, setProductForm] = useState({ name: '', description: '', category: '', commission_points: 10, gg_buyer_reward: 0, gg_giver_reward: 0, gg_upline_pct: 0.20, status: 'active', bot_id: '' });
  const [productSaving, setProductSaving] = useState(false);
  const [productMsg, setProductMsg] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const r = await fetch(`${API}/dashboard`);
      if (r.status === 401) { router.replace('/gogiver'); return; }
      const d = await r.json();
      setData(d);
      const role = d.role || 'gogiver';
      setIsAdmin(role === 'admin' || role === 'superuser');
      setIsSuperuser(role === 'superuser');
    } catch {} finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    try {
      const r = await fetch(`${API}/products`);
      if (r.ok) { const d = await r.json(); setProducts(d.products || []); }
    } catch {}
  };

  const fetchWallet = async () => {
    try {
      const r = await fetch(`${API}/wallet`);
      if (r.ok) setWalletData(await r.json());
    } catch {}
  };

  useEffect(() => { fetchDashboard(); fetchProducts(); }, []);
  useEffect(() => { const i = setInterval(fetchDashboard, 30000); return () => clearInterval(i); }, []);

  // Pusher real-time
  useEffect(() => {
    if (!data?.gogiver?.id) return;
    let pusher: any = null;
    let channel: any = null;
    const init = async () => {
      try {
        const PusherClient = (await import('pusher-js')).default;
        const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
        if (!key || !cluster) return;
        pusher = new PusherClient(key, { cluster });
        channel = pusher.subscribe(`referrer-${data.gogiver.id}`);
        channel.bind('stage-update', () => fetchDashboard());
      } catch {}
    };
    init();
    return () => { channel?.unbind_all(); pusher?.unsubscribe(`referrer-${data.gogiver.id}`); };
  }, [data?.gogiver?.id]);

  const handleRefer = async () => {
    if (!referPhone.trim() || !referProduct) return;
    setReferring(true); setReferResult(null);
    try {
      const r = await fetch(`${API}/refer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: referPhone, name: referName || undefined, product_id: parseInt(referProduct), note: referNote || undefined }),
      });
      const d = await r.json();
      if (r.ok) { setReferResult({ success: true, ...d }); setReferPhone(''); setReferName(''); setReferProduct(''); setReferNote(''); fetchDashboard(); }
      else setReferResult({ error: d.error || 'Failed' });
    } catch { setReferResult({ error: 'Connection failed' }); }
    finally { setReferring(false); }
  };

  const logout = async () => { await fetch(`${API}/auth/logout`, { method: 'POST' }); router.replace('/gogiver'); };

  // ─── Admin data fetchers ───
  const fetchAdminStats = useCallback(async () => {
    setAdminLoading(true);
    try { const r = await fetch(`${API}/admin/stats`); if (r.ok) setAdminStats(await r.json()); } catch {} finally { setAdminLoading(false); }
  }, []);

  const fetchAdminGivers = useCallback(async (search = '') => {
    setAdminLoading(true);
    try { const r = await fetch(`${API}/admin/givers?search=${encodeURIComponent(search)}`); if (r.ok) setAdminGivers(await r.json()); } catch {} finally { setAdminLoading(false); }
  }, []);

  const fetchAdminFeed = useCallback(async () => {
    setAdminLoading(true);
    try { const r = await fetch(`${API}/admin/feed`); if (r.ok) { const d = await r.json(); setAdminFeed(d.feed || []); } } catch {} finally { setAdminLoading(false); }
  }, []);

  const fetchAdminWithdrawals = useCallback(async () => {
    setAdminLoading(true);
    try { const r = await fetch(`${API}/admin/withdrawals`); if (r.ok) { const d = await r.json(); setAdminWithdrawals(d.withdrawals || []); } } catch {} finally { setAdminLoading(false); }
  }, []);

  const fetchGiverDetail = useCallback(async (id: number) => {
    setAdminLoading(true);
    try { const r = await fetch(`${API}/admin/givers/${id}`); if (r.ok) { setGiverDetail(await r.json()); setAdminView('giver_detail'); } } catch {} finally { setAdminLoading(false); }
  }, []);

  const doGiverAction = async (giverId: number, action: string) => {
    try {
      const r = await fetch(`${API}/admin/givers/${giverId}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      if (r.ok) { fetchAdminGivers(giverSearch); if (giverDetail?.giver?.id === giverId) fetchGiverDetail(giverId); }
    } catch {}
  };

  const approveWithdrawal = async (txId: number) => {
    try { await fetch(`${API}/admin/withdrawals/${txId}/approve`, { method: 'POST' }); fetchAdminWithdrawals(); } catch {}
  };
  const rejectWithdrawal = async (txId: number) => {
    try { await fetch(`${API}/admin/withdrawals/${txId}/reject`, { method: 'POST' }); fetchAdminWithdrawals(); } catch {}
  };

  // ─── Product management fetchers ───
  const fetchAdminProducts = useCallback(async () => {
    setAdminLoading(true);
    try { const r = await fetch(`${API}/admin/products`); if (r.ok) { const d = await r.json(); setAdminProducts(d.products || []); } } catch {} finally { setAdminLoading(false); }
  }, []);

  const fetchAdminBots = useCallback(async () => {
    try { const r = await fetch(`${API}/admin/bots`); if (r.ok) { const d = await r.json(); setAdminBots(d.bots || []); } } catch {}
  }, []);

  const openProductForm = (product?: any) => {
    if (product) {
      setProductForm({
        name: product.name || '', description: product.description || '', category: product.category || '',
        commission_points: product.commission_points || 10, gg_buyer_reward: product.gg_buyer_reward || 0,
        gg_giver_reward: product.gg_giver_reward || 0, gg_upline_pct: product.gg_upline_pct || 0.20,
        status: product.status || 'active', bot_id: '',
      });
      setEditingProduct(product);
      setAdminView('product_edit');
    } else {
      setProductForm({ name: '', description: '', category: '', commission_points: 10, gg_buyer_reward: 0, gg_giver_reward: 0, gg_upline_pct: 0.20, status: 'active', bot_id: '' });
      setEditingProduct({});
      setAdminView('product_edit');
    }
    setProductMsg(null);
    fetchAdminBots();
  };

  const saveProduct = async () => {
    if (!productForm.name.trim()) { setProductMsg({ error: 'Name required' }); return; }
    setProductSaving(true); setProductMsg(null);
    try {
      const isNew = !editingProduct?.id;
      const url = isNew ? `${API}/admin/products` : `${API}/admin/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const body: any = { ...productForm, gg_upline_pct: parseFloat(String(productForm.gg_upline_pct)) };
      if (isNew && body.bot_id) body.bot_id = parseInt(body.bot_id);
      else delete body.bot_id;

      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (r.ok) {
        setProductMsg({ success: isNew ? 'Product created!' : 'Product updated!' });
        fetchAdminProducts();
        fetchProducts(); // refresh gogiver products tab too
        setTimeout(() => { setAdminView('products_mgmt'); setEditingProduct(null); }, 800);
      } else {
        setProductMsg({ error: d.error || 'Failed' });
      }
    } catch { setProductMsg({ error: 'Connection failed' }); }
    finally { setProductSaving(false); }
  };

  const deleteProduct = async (productId: number) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      const r = await fetch(`${API}/admin/products/${productId}`, { method: 'DELETE' });
      if (r.ok) fetchAdminProducts();
    } catch {}
  };

  const mapBot = async (productId: number, botId: number) => {
    try {
      await fetch(`${API}/admin/products/${productId}/bots`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bot_id: botId, submission_type: 'lead' }) });
      await fetch(`${API}/admin/products/${productId}/bots`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bot_id: botId, submission_type: 'confirmed' }) });
      fetchAdminProducts();
    } catch {}
  };

  const unmapBot = async (productId: number, botId: number) => {
    try { await fetch(`${API}/admin/products/${productId}/bots/${botId}`, { method: 'DELETE' }); fetchAdminProducts(); } catch {}
  };

  if (loading && !data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );
  if (!data) return null;

  const gogiver = data.gogiver || {};
  const wallet = data.wallet || {};
  const stats = data.stats || {};
  const recent = data.recent || [];

  const tabs: [Tab, string, string][] = [
    ['home', '🏠', 'Home'],
    ['refer', '🎁', 'Refer'],
    ['products', '📦', 'Products'],
    ['wallet', '💰', 'Wallet'],
    ...(isAdmin ? [['admin', '⚡', 'Admin'] as [Tab, string, string]] : []),
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* ═══ HEADER ═══ */}
      <header className="bg-white/[0.02] border-b border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/15">
              {gogiver.name?.charAt(0)?.toUpperCase() || 'G'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold text-sm">{gogiver.name || 'GoGiver'}</p>
                {isAdmin && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold">{isSuperuser ? 'SUPER' : 'ADMIN'}</span>}
              </div>
              <p className="text-gray-500 text-[10px] font-mono">{gogiver.referrer_code}</p>
            </div>
          </div>
          <button onClick={logout} className="text-gray-600 hover:text-gray-400 p-2 transition-colors" title="Logout">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      {/* ═══ TAB BAR ═══ */}
      <nav className="sticky top-0 z-20 bg-[#0C0A1D]/95 backdrop-blur-md border-b border-white/[0.04]">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map(([k, icon, label]) => (
            <button key={k}
              onClick={() => {
                setTab(k);
                if (k === 'wallet') fetchWallet();
                if (k === 'admin') { setAdminView('stats'); fetchAdminStats(); }
              }}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-all ${
                tab === k ? (k === 'admin' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-purple-400 border-b-2 border-purple-400') : 'text-gray-600 hover:text-gray-400'
              }`}>
              <span className="text-base">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-5">

        {/* ═══════ HOME TAB ═══════ */}
        {tab === 'home' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-purple-600/20 via-purple-900/10 to-emerald-900/10 rounded-2xl p-5 border border-purple-500/15">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Your Wallet</p>
                  <p className="text-3xl font-bold text-white">RM {(wallet.active_balance || 0).toFixed(2)}</p>
                  <p className="text-emerald-400 text-xs mt-0.5">Available to withdraw</p>
                </div>
                {(wallet.dormant_balance || 0) > 0 && (
                  <div className="text-right">
                    <p className="text-gray-500 text-[10px]">Dormant</p>
                    <p className="text-gray-400 text-sm font-semibold">RM {wallet.dormant_balance?.toFixed(2)}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Referrals" value={stats.total || 0} />
                <MiniStat label="Active" value={stats.active || 0} accent="purple" />
                <MiniStat label="Completed" value={stats.completed || 0} accent="emerald" />
              </div>
            </div>

            <button onClick={() => setTab('refer')}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-2xl font-semibold transition-all active:scale-[0.98] shadow-lg shadow-purple-600/15 flex items-center justify-center gap-2 text-base">
              <span className="text-xl">🎁</span> Refer Someone Now
            </button>

            <div>
              <h3 className="text-gray-500 text-xs font-medium mb-3">Recent Referrals</h3>
              {recent.length === 0 ? (
                <div className="bg-white/[0.02] rounded-2xl p-8 text-center border border-white/[0.04]">
                  <p className="text-3xl mb-2">🎯</p>
                  <p className="text-gray-400 text-sm">No referrals yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.map((sub: any) => (
                    <ReferralCard key={sub.id} sub={sub} expanded={expandedSub === sub.id}
                      onToggle={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ REFER TAB ═══════ */}
        {tab === 'refer' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold mb-1">Refer a Friend</h2>
              <p className="text-gray-400 text-sm">Share their details and our AI will reach out instantly.</p>
            </div>
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5 space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Service / Product *</label>
                <select value={referProduct} onChange={e => setReferProduct(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 focus:outline-none appearance-none">
                  <option value="">Choose a service...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.gg_giver_reward ? ` — Earn RM${p.gg_giver_reward}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Their WhatsApp Number *</label>
                <input value={referPhone} onChange={e => setReferPhone(e.target.value)} placeholder="012 345 6789" type="tel"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:outline-none font-mono text-lg tracking-wider" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Their Name <span className="text-gray-600">(optional)</span></label>
                <input value={referName} onChange={e => setReferName(e.target.value)} placeholder="Ahmad"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Extra context <span className="text-gray-600">(optional)</span></label>
                <textarea value={referNote} onChange={e => setReferNote(e.target.value)} placeholder="e.g. Moving to new house, needs internet ASAP" rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:outline-none resize-none text-sm" />
              </div>
              {referResult && (
                <div className={`rounded-xl px-4 py-3 text-sm ${referResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {referResult.success ? '✅ Referral submitted! AI is contacting them now.' : referResult.error}
                </div>
              )}
              <button onClick={handleRefer} disabled={referring || !referPhone.trim() || !referProduct}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-semibold transition-all disabled:opacity-40 shadow-lg shadow-purple-600/15 active:scale-[0.98]">
                {referring ? <Spinner /> : '🎁 Submit Referral'}
              </button>
            </div>
          </div>
        )}

        {/* ═══════ PRODUCTS TAB ═══════ */}
        {tab === 'products' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Products & Rates</h2>
            {products.length === 0 ? <EmptyState text="No products available" /> : (
              <div className="space-y-3">
                {products.map((p: any) => (
                  <div key={p.id} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5 hover:border-purple-500/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{p.name}</h3>
                        {p.description && <p className="text-gray-500 text-xs mt-0.5">{p.description}</p>}
                      </div>
                      {p.gg_giver_reward > 0 && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-emerald-400 text-lg font-bold">RM{p.gg_giver_reward}</p>
                          <p className="text-gray-600 text-[10px]">your commission</p>
                        </div>
                      )}
                    </div>
                    {(p.gg_buyer_reward > 0 || p.gg_giver_reward > 0) && (
                      <div className="flex gap-2">
                        {p.gg_buyer_reward > 0 && <Badge text={`Buyer gets RM${p.gg_buyer_reward}`} color="blue" />}
                        {p.gg_giver_reward > 0 && <Badge text={`You earn RM${p.gg_giver_reward}`} color="emerald" />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ WALLET TAB ═══════ */}
        {tab === 'wallet' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Wallet</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-emerald-600/15 to-emerald-900/10 rounded-2xl p-4 border border-emerald-500/15">
                <p className="text-gray-400 text-[10px] font-medium mb-1">ACTIVE</p>
                <p className="text-emerald-400 text-2xl font-bold">RM {(wallet.active_balance || 0).toFixed(2)}</p>
                <p className="text-emerald-500/40 text-[10px] mt-0.5">Ready to withdraw</p>
              </div>
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                <p className="text-gray-400 text-[10px] font-medium mb-1">DORMANT</p>
                <p className="text-gray-300 text-2xl font-bold">RM {(wallet.dormant_balance || 0).toFixed(2)}</p>
                <p className="text-gray-600 text-[10px] mt-0.5">Pending completion</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                <p className="text-gray-500 text-[10px]">Total Earned</p>
                <p className="text-white text-lg font-bold">RM {(wallet.total_earned || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                <p className="text-gray-500 text-[10px]">Total Withdrawn</p>
                <p className="text-white text-lg font-bold">RM {(wallet.total_withdrawn || 0).toFixed(2)}</p>
              </div>
            </div>
            <button disabled={(wallet.active_balance || 0) < 50}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-semibold transition-all disabled:opacity-30 shadow-lg shadow-emerald-600/15 active:scale-[0.98]">
              {(wallet.active_balance || 0) < 50 ? `Min RM50 to withdraw` : 'Request Withdrawal'}
            </button>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-3">Recent Transactions</p>
              {(walletData?.transactions || []).length === 0 ? <EmptyState text="No transactions yet" /> : (
                <div className="space-y-1.5">
                  {(walletData?.transactions || []).map((tx: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.04]">
                      <div>
                        <p className="text-white text-sm">{tx.description}</p>
                        <p className="text-gray-600 text-[10px]">{new Date(tx.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}RM{Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ ADMIN TAB ═══════ */}
        {tab === 'admin' && isAdmin && (
          <div className="space-y-5">
            {/* Admin sub-nav */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {([
                ['stats', '📊', 'Stats'],
                ['givers', '👥', 'GoGivers'],
                ['feed', '📡', 'Live Feed'],
                ['products_mgmt', '📦', 'Products'],
                ...(isSuperuser ? [['withdrawals', '🏦', 'Withdrawals']] : []),
              ] as [AdminView, string, string][]).map(([k, icon, label]) => (
                <button key={k}
                  onClick={() => {
                    setAdminView(k);
                    if (k === 'stats') fetchAdminStats();
                    if (k === 'givers') fetchAdminGivers(giverSearch);
                    if (k === 'feed') fetchAdminFeed();
                    if (k === 'products_mgmt') { fetchAdminProducts(); fetchAdminBots(); }
                    if (k === 'withdrawals') fetchAdminWithdrawals();
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    adminView === k ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-gray-500 border border-white/[0.06] hover:text-gray-300'
                  }`}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {adminLoading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>}

            {/* ─── STATS ─── */}
            {adminView === 'stats' && adminStats && !adminLoading && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Total GoGivers" value={adminStats.givers?.total || 0} sub={`${adminStats.givers?.active || 0} active · ${adminStats.givers?.dormant || 0} dormant`} accent="purple" />
                  <StatCard label="Total Referrals" value={adminStats.submissions?.total || 0} sub={`${adminStats.submissions?.this_week || 0} this week`} accent="blue" />
                  <StatCard label="Converted" value={adminStats.submissions?.converted || 0} sub={`${adminStats.submissions?.active || 0} in progress`} accent="emerald" />
                  <StatCard label="Commission Paid" value={`RM${(adminStats.submissions?.total_commission_paid || 0).toFixed(0)}`} sub={`RM${(adminStats.givers?.total_wallet || 0).toFixed(0)} in wallets`} accent="amber" />
                </div>
                {adminStats.submissions?.failed > 0 && (
                  <div className="bg-red-500/10 rounded-xl px-4 py-2 border border-red-500/15 text-red-400 text-xs">
                    ⚠️ {adminStats.submissions.failed} failed referrals · {adminStats.submissions.lost || 0} lost
                  </div>
                )}
                {adminStats.pending_withdrawals > 0 && (
                  <button onClick={() => { setAdminView('withdrawals'); fetchAdminWithdrawals(); }}
                    className="w-full bg-amber-500/10 rounded-xl px-4 py-3 border border-amber-500/15 text-amber-400 text-sm font-medium text-left">
                    🏦 {adminStats.pending_withdrawals} pending withdrawal{adminStats.pending_withdrawals > 1 ? 's' : ''} → Review
                  </button>
                )}
                <div>
                  <h3 className="text-gray-500 text-xs font-medium mb-2">Top Performers (This Month)</h3>
                  <div className="space-y-1.5">
                    {(adminStats.top_performers || []).map((p: any, i: number) => (
                      <div key={p.id} onClick={() => fetchGiverDetail(p.id)}
                        className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.04] cursor-pointer hover:border-amber-500/20 transition-colors">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-gray-500'}`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{p.name || p.phone}</p>
                          <p className="text-gray-600 text-[10px]">{p.referrals} referrals · {p.converted} converted</p>
                        </div>
                        <span className="text-emerald-400 text-sm font-bold">RM{p.earned}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── GIVERS LIST ─── */}
            {adminView === 'givers' && !adminLoading && (
              <div className="space-y-4">
                <input value={giverSearch} onChange={e => { setGiverSearch(e.target.value); fetchAdminGivers(e.target.value); }}
                  placeholder="Search name, phone, or code..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-amber-500/50 focus:outline-none text-sm" />
                {adminGivers && (
                  <>
                    <p className="text-gray-600 text-xs">{adminGivers.total} gogivers</p>
                    <div className="space-y-2">
                      {(adminGivers.givers || []).map((g: any) => (
                        <div key={g.id} onClick={() => fetchGiverDetail(g.id)}
                          className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.04] cursor-pointer hover:border-amber-500/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-white text-sm font-medium">{g.name || 'Unnamed'}</p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${g.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : g.status === 'dormant' ? 'bg-gray-500/15 text-gray-400' : 'bg-red-500/15 text-red-400'}`}>{g.status}</span>
                                {g.admin_level && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold">{g.admin_level.toUpperCase()}</span>}
                              </div>
                              <p className="text-gray-600 text-[10px] font-mono">{g.phone} · {g.referrer_code}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-emerald-400 text-sm font-bold">RM{parseFloat(g.wallet_balance || 0).toFixed(0)}</p>
                              <p className="text-gray-600 text-[10px]">{g.total_referrals} refs · {g.converted} conv</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─── GIVER DETAIL ─── */}
            {adminView === 'giver_detail' && giverDetail && !adminLoading && (
              <div className="space-y-4">
                <button onClick={() => { setAdminView('givers'); fetchAdminGivers(giverSearch); }}
                  className="text-gray-500 text-xs hover:text-white transition-colors">← Back to list</button>

                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white text-lg font-bold">{giverDetail.giver.name || 'Unnamed'}</h3>
                      <p className="text-gray-500 text-xs font-mono">{giverDetail.giver.phone} · {giverDetail.giver.referrer_code}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${giverDetail.giver.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>{giverDetail.giver.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <MiniStat label="Wallet" value={`RM${parseFloat(giverDetail.giver.wallet_balance || 0).toFixed(0)}`} accent="emerald" />
                    <MiniStat label="Earned" value={`RM${parseFloat(giverDetail.giver.total_points || 0).toFixed(0)}`} />
                    <MiniStat label="Withdrawn" value={`RM${parseFloat(giverDetail.giver.total_withdrawn || 0).toFixed(0)}`} />
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {giverDetail.giver.status === 'active' && (
                      <button onClick={() => doGiverAction(giverDetail.giver.id, 'suspend')} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">Suspend</button>
                    )}
                    {giverDetail.giver.status === 'suspended' && (
                      <button onClick={() => doGiverAction(giverDetail.giver.id, 'activate')} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/20 transition-colors">Activate</button>
                    )}
                    {isSuperuser && !giverDetail.giver.metadata?.admin_level && (
                      <button onClick={() => doGiverAction(giverDetail.giver.id, 'set_admin')} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs hover:bg-amber-500/20 transition-colors">Make Admin</button>
                    )}
                    {isSuperuser && giverDetail.giver.metadata?.admin_level && (
                      <button onClick={() => doGiverAction(giverDetail.giver.id, 'remove_admin')} className="px-3 py-1.5 bg-gray-500/10 text-gray-400 rounded-lg text-xs hover:bg-gray-500/20 transition-colors">Remove Admin</button>
                    )}
                  </div>
                </div>

                {/* Upline / Downline */}
                {giverDetail.upline && (
                  <div className="bg-purple-500/5 rounded-xl px-4 py-3 border border-purple-500/10">
                    <p className="text-purple-400 text-[10px] font-medium mb-1">UPLINE</p>
                    <p className="text-white text-sm">{giverDetail.upline.name} <span className="text-gray-600 text-[10px] font-mono">{giverDetail.upline.phone}</span></p>
                  </div>
                )}
                {giverDetail.downline?.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-2">Downline ({giverDetail.downline.length})</p>
                    <div className="space-y-1.5">
                      {giverDetail.downline.map((d: any) => (
                        <div key={d.id} onClick={() => fetchGiverDetail(d.id)}
                          className="flex items-center justify-between bg-white/[0.02] rounded-xl px-3 py-2 border border-white/[0.04] cursor-pointer hover:border-purple-500/20 transition-colors">
                          <div>
                            <p className="text-white text-sm">{d.name || d.phone}</p>
                            <span className={`text-[9px] ${d.status === 'active' ? 'text-emerald-400' : 'text-gray-500'}`}>{d.status}</span>
                          </div>
                          <span className="text-gray-400 text-xs">RM{parseFloat(d.wallet_balance || 0).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submissions */}
                <div>
                  <p className="text-gray-500 text-xs font-medium mb-2">Submissions ({giverDetail.submissions?.length || 0})</p>
                  <div className="space-y-2">
                    {(giverDetail.submissions || []).map((s: any) => (
                      <ReferralCard key={s.id} sub={s} expanded={expandedSub === s.id}
                        onToggle={() => setExpandedSub(expandedSub === s.id ? null : s.id)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── LIVE FEED ─── */}
            {adminView === 'feed' && !adminLoading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Live Referral Feed</h3>
                  <button onClick={fetchAdminFeed} className="text-amber-400 text-xs hover:text-amber-300">↻ Refresh</button>
                </div>
                {adminFeed.length === 0 ? <EmptyState text="No referrals yet" /> : (
                  <div className="space-y-2">
                    {adminFeed.map((s: any) => (
                      <div key={s.id} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.04]">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-xs font-medium">{s.gogiver_name || s.gogiver_phone}</span>
                            <span className="text-gray-700">→</span>
                            <span className="text-white text-xs">{s.customer_name || s.customer_phone}</span>
                          </div>
                          <StatusBadge sub={s} />
                        </div>
                        <p className="text-gray-600 text-[10px]">{s.product_name} · {new Date(s.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── PRODUCTS MANAGEMENT ─── */}
            {adminView === 'products_mgmt' && !adminLoading && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Products & Rates</h3>
                  <button onClick={() => openProductForm()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-colors">
                    + Add Product
                  </button>
                </div>
                {adminProducts.length === 0 ? <EmptyState text="No products yet" /> : (
                  <div className="space-y-3">
                    {adminProducts.map((p: any) => (
                      <div key={p.id} className={`bg-white/[0.03] rounded-2xl border transition-colors ${p.status === 'active' ? 'border-white/[0.06]' : 'border-red-500/10 opacity-60'}`}>
                        <div className="px-4 py-3.5">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-white font-semibold text-sm">{p.name}</h4>
                                {p.category && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{p.category}</span>}
                                {p.status !== 'active' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">{p.status}</span>}
                              </div>
                              {p.description && <p className="text-gray-500 text-xs mt-0.5 truncate">{p.description}</p>}
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0 ml-3">
                              <button onClick={() => openProductForm(p)} className="px-2 py-1 bg-white/5 text-gray-400 rounded-lg text-[10px] hover:bg-white/10 hover:text-white transition-colors">Edit</button>
                              {isSuperuser && p.status === 'active' && (
                                <button onClick={() => deleteProduct(p.id)} className="px-2 py-1 bg-red-500/5 text-red-400/60 rounded-lg text-[10px] hover:bg-red-500/10 hover:text-red-400 transition-colors">×</button>
                              )}
                            </div>
                          </div>

                          {/* Commission rates */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-emerald-500/5 rounded-lg px-2.5 py-1.5">
                              <p className="text-[9px] text-gray-500">Giver</p>
                              <p className="text-emerald-400 text-sm font-bold">RM{p.gg_giver_reward || 0}</p>
                            </div>
                            <div className="bg-blue-500/5 rounded-lg px-2.5 py-1.5">
                              <p className="text-[9px] text-gray-500">Buyer</p>
                              <p className="text-blue-400 text-sm font-bold">RM{p.gg_buyer_reward || 0}</p>
                            </div>
                            <div className="bg-amber-500/5 rounded-lg px-2.5 py-1.5">
                              <p className="text-[9px] text-gray-500">Upline</p>
                              <p className="text-amber-400 text-sm font-bold">{Math.round((p.gg_upline_pct || 0) * 100)}%</p>
                            </div>
                          </div>

                          {/* Bot mappings */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(p.bot_mappings || []).map((bm: any, i: number) => (
                              <div key={i} className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                                <span className="text-white text-[10px]">{bm.bot_name}</span>
                                <span className={`text-[8px] px-1 py-0.5 rounded ${bm.submission_type === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>{bm.submission_type}</span>
                                <button onClick={() => unmapBot(p.id, bm.bot_id)} className="text-gray-600 hover:text-red-400 text-[10px] ml-0.5 transition-colors">×</button>
                              </div>
                            ))}
                            {adminBots.length > 0 && (
                              <select onChange={e => { if (e.target.value) { mapBot(p.id, parseInt(e.target.value)); e.target.value = ''; } }}
                                className="bg-white/5 border border-dashed border-white/10 rounded-lg px-2 py-1 text-[10px] text-gray-500 focus:outline-none cursor-pointer">
                                <option value="">+ Bot</option>
                                {adminBots.filter(b => !(p.bot_mappings || []).some((bm: any) => bm.bot_id === b.id))
                                  .map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── PRODUCT EDIT / CREATE ─── */}
            {adminView === 'product_edit' && editingProduct && !adminLoading && (
              <div className="space-y-4">
                <button onClick={() => { setAdminView('products_mgmt'); setEditingProduct(null); fetchAdminProducts(); }}
                  className="text-gray-500 text-xs hover:text-white transition-colors">← Back to products</button>

                <h3 className="text-white font-semibold">{editingProduct.id ? 'Edit Product' : 'New Product'}</h3>

                <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5 space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Product Name *</label>
                    <input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
                      placeholder="e.g. Unifi Home 300Mbps"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-amber-500/50 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium block mb-1.5">Description</label>
                    <input value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}
                      placeholder="Short description"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-amber-500/50 focus:outline-none text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-400 text-xs font-medium block mb-1.5">Category</label>
                      <input value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}
                        placeholder="e.g. broadband, mobile"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-amber-500/50 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs font-medium block mb-1.5">Status</label>
                      <select value={productForm.status} onChange={e => setProductForm({...productForm, status: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-500/50 focus:outline-none text-sm appearance-none">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-4">
                    <p className="text-amber-400 text-xs font-medium mb-3">💰 GoGive Commission Rates</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-gray-400 text-[10px] block mb-1">Giver RM</label>
                        <input type="number" step="any" value={productForm.gg_giver_reward} onChange={e => setProductForm({...productForm, gg_giver_reward: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none text-sm" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-[10px] block mb-1">Buyer RM</label>
                        <input type="number" step="any" value={productForm.gg_buyer_reward} onChange={e => setProductForm({...productForm, gg_buyer_reward: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-blue-400 font-bold focus:ring-2 focus:ring-blue-500/50 focus:outline-none text-sm" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-[10px] block mb-1">Upline %</label>
                        <input type="number" step="0.01" value={Math.round((productForm.gg_upline_pct || 0) * 100)} onChange={e => setProductForm({...productForm, gg_upline_pct: (parseFloat(e.target.value) || 0) / 100})}
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-amber-400 font-bold focus:ring-2 focus:ring-amber-500/50 focus:outline-none text-sm" />
                      </div>
                    </div>
                    <div className="mt-2 bg-white/[0.02] rounded-xl px-3 py-2 border border-white/[0.04]">
                      <p className="text-gray-500 text-[10px]">Per completion: Giver RM{productForm.gg_giver_reward} + Buyer RM{productForm.gg_buyer_reward} + Upline RM{(productForm.gg_giver_reward * productForm.gg_upline_pct).toFixed(0)} = <span className="text-white font-bold">RM{(productForm.gg_giver_reward + productForm.gg_buyer_reward + productForm.gg_giver_reward * productForm.gg_upline_pct).toFixed(0)} total</span></p>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-4">
                    <p className="text-gray-400 text-xs font-medium mb-3">Partner Commission</p>
                    <div>
                      <label className="text-gray-400 text-[10px] block mb-1">Points per completion</label>
                      <input type="number" value={productForm.commission_points} onChange={e => setProductForm({...productForm, commission_points: parseInt(e.target.value) || 0})}
                        className="w-24 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-500/50 focus:outline-none text-sm" />
                    </div>
                  </div>

                  {!editingProduct.id && adminBots.length > 0 && (
                    <div className="border-t border-white/[0.06] pt-4">
                      <p className="text-gray-400 text-xs font-medium mb-3">Map to Bot (optional)</p>
                      <select value={productForm.bot_id} onChange={e => setProductForm({...productForm, bot_id: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-500/50 focus:outline-none text-sm appearance-none">
                        <option value="">No bot mapping</option>
                        {adminBots.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}

                  {productMsg && (
                    <div className={`rounded-xl px-4 py-3 text-sm ${productMsg.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {productMsg.success || productMsg.error}
                    </div>
                  )}

                  <button onClick={saveProduct} disabled={productSaving || !productForm.name.trim()}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-semibold transition-all disabled:opacity-40 active:scale-[0.98]">
                    {productSaving ? <Spinner /> : editingProduct.id ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </div>
            )}

            {/* ─── WITHDRAWALS (superuser) ─── */}
            {adminView === 'withdrawals' && isSuperuser && !adminLoading && (
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Pending Withdrawals</h3>
                {adminWithdrawals.length === 0 ? <EmptyState text="No pending withdrawals" /> : (
                  <div className="space-y-2">
                    {adminWithdrawals.map((w: any) => (
                      <div key={w.id} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-white text-sm font-medium">{w.name}</p>
                            <p className="text-gray-600 text-[10px] font-mono">{w.phone} · Balance: RM{parseFloat(w.wallet_balance || 0).toFixed(2)}</p>
                          </div>
                          <p className="text-amber-400 text-lg font-bold">RM{parseFloat(w.amount).toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => approveWithdrawal(w.id)} className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">✓ Approve</button>
                          <button onClick={() => rejectWithdrawal(w.id)} className="flex-1 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors">✕ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ═══ SHARED COMPONENTS ═══

function Spinner() {
  return <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="bg-white/[0.02] rounded-2xl p-8 text-center border border-white/[0.04]"><p className="text-gray-600 text-sm">{text}</p></div>;
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`text-[10px] px-2.5 py-1 rounded-full bg-${color}-500/10 text-${color}-400 border border-${color}-500/10`}>{text}</span>;
}

function MiniStat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  const c = accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : accent === 'purple' ? 'bg-purple-500/10 text-purple-400' : accent === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-white';
  return <div className={`${c} rounded-xl p-2.5 text-center`}><p className="text-lg font-bold">{value}</p><p className="text-[10px] opacity-60">{label}</p></div>;
}

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub: string; accent: string }) {
  const c = accent === 'emerald' ? 'border-emerald-500/15' : accent === 'purple' ? 'border-purple-500/15' : accent === 'amber' ? 'border-amber-500/15' : 'border-blue-500/15';
  const tc = accent === 'emerald' ? 'text-emerald-400' : accent === 'purple' ? 'text-purple-400' : accent === 'amber' ? 'text-amber-400' : 'text-blue-400';
  return (
    <div className={`bg-white/[0.03] rounded-2xl p-4 border ${c}`}>
      <p className="text-gray-500 text-[10px] font-medium mb-1">{label}</p>
      <p className={`${tc} text-2xl font-bold`}>{value}</p>
      <p className="text-gray-600 text-[10px] mt-0.5">{sub}</p>
    </div>
  );
}

function StatusBadge({ sub }: { sub: any }) {
  const status = sub.live_status || sub.status || 'pending';
  const conf = STATUS_CONF[status] || STATUS_CONF.pending;
  const cat = sub.stage_category;
  if (cat) {
    const s = CATEGORY_STYLE[cat] || CATEGORY_STYLE.PENDING;
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{sub.stage_label || cat}</span>;
  }
  return <span className={`text-[10px] ${conf.color}`}>{conf.emoji} {conf.label}</span>;
}

// ═══ REFERRAL CARD ═══
function ReferralCard({ sub, expanded, onToggle }: { sub: any; expanded: boolean; onToggle: () => void }) {
  const status = sub.live_status || sub.status || 'pending';
  const conf = STATUS_CONF[status] || STATUS_CONF.pending;
  const isTerminal = ['cancelled', 'dropped', 'failed', 'inject_failed'].includes(status);
  const isComplete = status === 'completed';

  return (
    <div onClick={onToggle}
      className={`bg-white/[0.03] rounded-2xl border transition-all cursor-pointer ${expanded ? 'border-purple-500/20 shadow-lg shadow-purple-900/10' : 'border-white/[0.04] hover:border-white/[0.08]'}`}>
      <div className="px-4 py-3.5 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm truncate">{sub.customer_name || 'Customer'}</p>
            {sub.product_name && <span className="text-gray-600 text-[10px] truncate">{sub.product_name}</span>}
          </div>
          <p className="text-gray-600 text-[10px] mt-0.5">{new Date(sub.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</p>
        </div>
        <StatusBadge sub={sub} />
      </div>

      {!expanded && sub.stage_journey?.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-0.5">
          {sub.stage_journey.map((step: any, i: number) => (
            <div key={step.key} className="flex items-center gap-0.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${step.is_current ? 'ring-1 ring-purple-400/50 text-white' : step.is_done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-700'}`}
                style={step.is_current ? { backgroundColor: step.color + '35' } : {}}>
                {step.is_done ? '✓' : step.is_current ? '●' : '○'}
              </div>
              {i < sub.stage_journey.length - 1 && <div className={`w-2 h-0.5 rounded-full ${step.is_done ? 'bg-emerald-500/40' : 'bg-white/5'}`} />}
            </div>
          ))}
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-3">
          {sub.commission_amount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-xs font-bold">💰 RM{sub.commission_amount}</span>
              <span className="text-gray-600 text-[10px]">{isComplete ? 'earned' : 'pending'}</span>
            </div>
          )}
          {sub.contact_number && <p className="text-xs"><span className="text-gray-500">Phone: </span><span className="text-gray-300 font-mono">{sub.contact_number}</span></p>}
          {sub.package && <p className="text-xs"><span className="text-gray-500">Package: </span><span className="text-gray-300">{sub.package}</span></p>}
          {sub.stage_journey?.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] font-medium mb-2">Progress</p>
              <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
                {sub.stage_journey.map((stage: any, i: number) => (
                  <div key={stage.key} className="flex items-center gap-0.5 flex-shrink-0">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${stage.is_current ? 'ring-2 ring-offset-1 ring-offset-[#0C0A1D] scale-110 text-white' : stage.is_done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-600'}`}
                        style={stage.is_current ? { backgroundColor: stage.color + '40', boxShadow: `0 0 12px ${stage.color}30` } : {}}>
                        {stage.is_done ? '✓' : stage.is_current ? '●' : '○'}
                      </div>
                      <span className={`text-[7px] max-w-[46px] text-center leading-tight truncate ${stage.is_current ? 'text-white font-semibold' : stage.is_done ? 'text-emerald-400/60' : 'text-gray-600'}`}>{stage.label}</span>
                    </div>
                    {i < sub.stage_journey.length - 1 && <div className={`w-2.5 h-0.5 flex-shrink-0 rounded-full ${stage.is_done ? 'bg-emerald-500/50' : 'bg-white/10'}`} />}
                  </div>
                ))}
              </div>
            </div>
          )}
          {sub.order_number && <p className="text-gray-600 text-[10px] font-mono">Order: {sub.order_number}</p>}
        </div>
      )}
    </div>
  );
}
