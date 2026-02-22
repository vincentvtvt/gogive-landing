// FILE: app/gogiver/dashboard/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
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
  rejected:      { label: 'Rejected',       emoji: '⚠️', color: 'text-orange-400' },
  dropped:       { label: 'Not Interested', emoji: '👋', color: 'text-gray-500' },
  no_response:   { label: 'No Response',    emoji: '😶', color: 'text-gray-500' },
  failed:        { label: 'Failed',         emoji: '❌', color: 'text-red-400' },
  inject_failed: { label: 'Contact Failed', emoji: '⚠️', color: 'text-red-400' },
};

const CATEGORY_STYLE: Record<string, { bg: string; text: string; glow: string }> = {
  NEW:        { bg: 'bg-blue-500/15',   text: 'text-blue-400',    glow: 'shadow-blue-500/20' },
  PENDING:    { bg: 'bg-yellow-500/15', text: 'text-yellow-400',  glow: 'shadow-yellow-500/20' },
  PROCESSING: { bg: 'bg-purple-500/15', text: 'text-purple-400',  glow: 'shadow-purple-500/20' },
  COMPLETE:   { bg: 'bg-emerald-500/15',text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
};

// ═══ MAIN COMPONENT ═══
export default function GoGiverDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'home' | 'refer' | 'products' | 'wallet'>('home');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

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

  const fetchDashboard = async () => {
    try {
      const r = await fetch(`${API}/dashboard`);
      if (r.status === 401) { router.replace('/gogiver'); return; }
      const d = await r.json();
      setData(d);
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
      if (r.ok) { const d = await r.json(); setWalletData(d); }
    } catch {}
  };

  useEffect(() => { fetchDashboard(); fetchProducts(); }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

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

        channel.bind('stage-update', (event: any) => {
          setData((prev: any) => {
            if (!prev) return prev;
            const updateSub = (sub: any) => {
              if (sub.order_id !== event.order_id && sub.order_number !== event.order_number) return sub;
              const newJourney = sub.stage_journey?.map((step: any, idx: number) => {
                const targetIdx = sub.stage_journey.findIndex((s: any) => s.key === event.to_stage);
                return { ...step, is_current: step.key === event.to_stage, is_done: targetIdx >= 0 && idx < targetIdx, is_future: targetIdx >= 0 && idx > targetIdx };
              });
              return { ...sub, stage_label: event.stage_label, stage_category: event.stage_category, live_status: event.stage_category === 'COMPLETE' ? 'completed' : sub.live_status, stage_journey: newJourney };
            };
            return { ...prev, recent: prev.recent?.map(updateSub) };
          });
        });
      } catch {}
    };
    init();
    return () => { channel?.unbind_all(); if (pusher && data?.gogiver?.id) pusher.unsubscribe(`referrer-${data.gogiver.id}`); };
  }, [data?.gogiver?.id]);

  const handleRefer = async () => {
    if (!referPhone.trim() || !referProduct) return;
    setReferring(true); setReferResult(null);
    try {
      const r = await fetch(`${API}/refer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: referPhone,
          name: referName || undefined,
          product_id: parseInt(referProduct),
          note: referNote || undefined,
        }),
      });
      const d = await r.json();
      if (r.ok) {
        setReferResult({ success: true, ...d });
        setReferPhone(''); setReferName(''); setReferProduct(''); setReferNote('');
        fetchDashboard();
      } else {
        setReferResult({ error: d.error || 'Submission failed' });
      }
    } catch { setReferResult({ error: 'Connection failed' }); }
    finally { setReferring(false); }
  };

  const logout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST' });
    router.replace('/gogiver');
  };

  if (loading && !data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
  if (!data) return null;

  const gogiver = data.gogiver || {};
  const wallet = data.wallet || {};
  const stats = data.stats || {};
  const recent = data.recent || [];

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
              <p className="text-white font-semibold text-sm">{gogiver.name || 'GoGiver'}</p>
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
          {([
            ['home', '🏠', 'Home'],
            ['refer', '🎁', 'Refer'],
            ['products', '📦', 'Products'],
            ['wallet', '💰', 'Wallet'],
          ] as const).map(([k, icon, label]) => (
            <button key={k}
              onClick={() => { setTab(k as any); if (k === 'wallet') fetchWallet(); }}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-all ${
                tab === k ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-600 hover:text-gray-400'
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

            {/* Wallet card */}
            <div className="bg-gradient-to-br from-purple-600/20 via-purple-900/10 to-emerald-900/10 rounded-2xl p-5 border border-purple-500/15">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Your Wallet</p>
                  <p className="text-3xl font-bold text-white">
                    RM {(wallet.active_balance || 0).toFixed(2)}
                  </p>
                  <p className="text-emerald-400 text-xs mt-0.5">Available to withdraw</p>
                </div>
                <div className="text-right">
                  {(wallet.dormant_balance || 0) > 0 && (
                    <div>
                      <p className="text-gray-500 text-[10px]">Dormant</p>
                      <p className="text-gray-400 text-sm font-semibold">RM {wallet.dormant_balance?.toFixed(2)}</p>
                      <p className="text-gray-600 text-[9px]">Unlocks when buyer completes</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Referrals" value={stats.total || 0} />
                <MiniStat label="Active" value={stats.active || 0} accent="purple" />
                <MiniStat label="Completed" value={stats.completed || 0} accent="emerald" />
              </div>
            </div>

            {/* Quick refer CTA */}
            <button
              onClick={() => setTab('refer')}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-2xl font-semibold transition-all active:scale-[0.98] shadow-lg shadow-purple-600/15 flex items-center justify-center gap-2 text-base"
            >
              <span className="text-xl">🎁</span>
              Refer Someone Now
            </button>

            {/* Recent Referrals */}
            <div>
              <h3 className="text-gray-500 text-xs font-medium mb-3">Recent Referrals</h3>
              {recent.length === 0 ? (
                <div className="bg-white/[0.02] rounded-2xl p-8 text-center border border-white/[0.04]">
                  <p className="text-3xl mb-2">🎯</p>
                  <p className="text-gray-400 text-sm">No referrals yet</p>
                  <p className="text-gray-600 text-xs mt-1">Share with a friend and start earning!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.map((sub: any) => (
                    <ReferralCard
                      key={sub.id}
                      sub={sub}
                      expanded={expandedSub === sub.id}
                      onToggle={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                    />
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
              {/* Product */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Service / Product *</label>
                <select
                  value={referProduct}
                  onChange={e => setReferProduct(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 focus:outline-none appearance-none"
                >
                  <option value="">Choose a service...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.gg_giver_reward ? ` — Earn RM${p.gg_giver_reward}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Their WhatsApp Number *</label>
                <input
                  value={referPhone}
                  onChange={e => setReferPhone(e.target.value)}
                  placeholder="012 345 6789"
                  type="tel"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:outline-none font-mono text-lg tracking-wider"
                />
              </div>

              {/* Name (optional) */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Their Name <span className="text-gray-600">(optional)</span></label>
                <input
                  value={referName}
                  onChange={e => setReferName(e.target.value)}
                  placeholder="Ahmad"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
                />
              </div>

              {/* Note (optional) */}
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-2">Any extra context <span className="text-gray-600">(optional)</span></label>
                <textarea
                  value={referNote}
                  onChange={e => setReferNote(e.target.value)}
                  placeholder="e.g. They're moving to a new house, need internet ASAP"
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:outline-none resize-none text-sm"
                />
              </div>

              {/* Result */}
              {referResult && (
                <div className={`rounded-xl px-4 py-3 text-sm ${referResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {referResult.success ? (
                    <>✅ Referral submitted! Our AI is contacting them now.</>
                  ) : (
                    <>{referResult.error}</>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleRefer}
                disabled={referring || !referPhone.trim() || !referProduct}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-600/15 active:scale-[0.98]"
              >
                {referring ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : '🎁 Submit Referral'}
              </button>
            </div>

            {/* How it works */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] p-5">
              <p className="text-gray-400 text-xs font-medium mb-3">How It Works</p>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'You share their number', desc: 'Just tell us who might be interested' },
                  { step: '2', title: 'AI reaches out via WhatsApp', desc: 'Natural conversation, not spam' },
                  { step: '3', title: 'They sign up', desc: 'AI handles everything — forms, docs, follow-up' },
                  { step: '4', title: 'You both earn', desc: 'Commission hits your wallet automatically' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-500/15 text-purple-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{s.title}</p>
                      <p className="text-gray-500 text-xs">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ PRODUCTS TAB ═══════ */}
        {tab === 'products' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold mb-1">Products & Rates</h2>
              <p className="text-gray-400 text-sm">See what you can earn per successful referral.</p>
            </div>

            {products.length === 0 ? (
              <div className="bg-white/[0.02] rounded-2xl p-8 text-center border border-white/[0.04]">
                <p className="text-gray-500">No products available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((p: any) => (
                  <div key={p.id} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5 hover:border-purple-500/20 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">{p.name}</h3>
                        {p.description && <p className="text-gray-500 text-xs mt-0.5">{p.description}</p>}
                        {p.category && <span className="text-purple-400/50 text-[10px] font-mono">{p.category}</span>}
                      </div>
                      {p.gg_giver_reward && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-emerald-400 text-lg font-bold">RM{p.gg_giver_reward}</p>
                          <p className="text-gray-600 text-[10px]">your commission</p>
                        </div>
                      )}
                    </div>

                    {(p.gg_buyer_reward || p.gg_giver_reward) && (
                      <div className="flex gap-2">
                        {p.gg_buyer_reward && (
                          <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/10">
                            Buyer gets RM{p.gg_buyer_reward}
                          </span>
                        )}
                        {p.gg_giver_reward && (
                          <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                            You earn RM{p.gg_giver_reward}
                          </span>
                        )}
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
            <div>
              <h2 className="text-xl font-bold mb-1">Wallet</h2>
              <p className="text-gray-400 text-sm">Your earnings and withdrawal history.</p>
            </div>

            {/* Balance cards */}
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

            {/* Withdrawal button */}
            <button
              disabled={(wallet.active_balance || 0) < 50}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/15 active:scale-[0.98]"
            >
              {(wallet.active_balance || 0) < 50 ? `Min RM50 to withdraw (RM${(50 - (wallet.active_balance || 0)).toFixed(2)} more)` : 'Request Withdrawal'}
            </button>

            {/* Transaction history */}
            <div>
              <p className="text-gray-500 text-xs font-medium mb-3">Recent Transactions</p>
              {(walletData?.transactions || []).length === 0 ? (
                <div className="bg-white/[0.02] rounded-xl p-6 text-center border border-white/[0.04]">
                  <p className="text-gray-600 text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(walletData?.transactions || []).map((tx: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.04]">
                      <div>
                        <p className="text-white text-sm">{tx.description}</p>
                        <p className="text-gray-600 text-[10px]">{new Date(tx.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}RM{Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="bg-purple-500/5 rounded-2xl p-4 border border-purple-500/10">
              <p className="text-purple-300 text-xs font-medium mb-2">How Earnings Work</p>
              <div className="space-y-2 text-gray-400 text-xs leading-relaxed">
                <p><span className="text-emerald-400">Active balance</span> — money you can withdraw anytime. Earned when the person you referred completes their sign-up.</p>
                <p><span className="text-gray-300">Dormant balance</span> — reserved when your referral starts the process. Moves to active once they complete. If they cancel, the dormant amount is removed.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══ MINI STAT ═══
function MiniStat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const colors = accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : accent === 'purple' ? 'bg-purple-500/10 text-purple-400' : 'bg-white/5 text-white';
  return (
    <div className={`${colors} rounded-xl p-2.5 text-center`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] opacity-60">{label}</p>
    </div>
  );
}

// ═══ REFERRAL CARD ═══
function ReferralCard({ sub, expanded, onToggle }: { sub: any; expanded: boolean; onToggle: () => void }) {
  const status = sub.live_status || sub.status || 'pending';
  const conf = STATUS_CONF[status] || STATUS_CONF.pending;
  const isTerminal = ['cancelled', 'rejected', 'dropped', 'no_response', 'failed', 'inject_failed'].includes(status);
  const isComplete = status === 'completed';

  return (
    <div
      onClick={onToggle}
      className={`bg-white/[0.03] rounded-2xl border transition-all cursor-pointer ${
        expanded ? 'border-purple-500/20 shadow-lg shadow-purple-900/10' : 'border-white/[0.04] hover:border-white/[0.08]'
      }`}
    >
      {/* Header row */}
      <div className="px-4 py-3.5 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm truncate">{sub.customer_name || 'Customer'}</p>
            {sub.product_name && <span className="text-gray-600 text-[10px] truncate">{sub.product_name}</span>}
          </div>
          <p className="text-gray-600 text-[10px] mt-0.5">
            {new Date(sub.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
            {sub.submission_type === 'lead' ? ' · Lead' : ' · Sale'}
          </p>
        </div>

        {/* Status badge */}
        {sub.stage_category ? (
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${CATEGORY_STYLE[sub.stage_category]?.bg || 'bg-gray-500/15'} ${CATEGORY_STYLE[sub.stage_category]?.text || 'text-gray-400'}`}>
            {sub.stage_label || sub.stage_category}
          </span>
        ) : (
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
            isComplete ? 'bg-emerald-500/15 text-emerald-400' :
            isTerminal ? 'bg-red-500/10 text-red-400' :
            'bg-purple-500/10 text-purple-400'
          }`}>
            {conf.emoji} {conf.label}
          </span>
        )}
      </div>

      {/* Mini pipeline */}
      {!expanded && sub.stage_journey && sub.stage_journey.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-0.5">
          {sub.stage_journey.map((step: any, i: number) => (
            <div key={step.key} className="flex items-center gap-0.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all ${
                step.is_current ? 'ring-1 ring-purple-400/50 text-white' : step.is_done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-700'
              }`}
                style={step.is_current ? { backgroundColor: step.color + '35' } : {}}
              >
                {step.is_done ? '✓' : step.is_current ? '●' : '○'}
              </div>
              {i < sub.stage_journey.length - 1 && (
                <div className={`w-2 h-0.5 rounded-full ${step.is_done ? 'bg-emerald-500/40' : 'bg-white/5'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-3">
          {/* Commission info */}
          {sub.commission_amount && (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-xs font-bold">💰 RM{sub.commission_amount}</span>
              <span className="text-gray-600 text-[10px]">
                {isComplete ? 'earned' : 'pending completion'}
              </span>
            </div>
          )}

          {/* Details */}
          {sub.contact_number && (
            <div className="text-xs">
              <span className="text-gray-500">Phone: </span>
              <span className="text-gray-300 font-mono">{sub.contact_number}</span>
            </div>
          )}
          {sub.package && (
            <div className="text-xs">
              <span className="text-gray-500">Package: </span>
              <span className="text-gray-300">{sub.package}</span>
            </div>
          )}

          {/* Full CRM pipeline */}
          {sub.stage_journey && sub.stage_journey.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] font-medium mb-2">Progress</p>
              <StagePipeline journey={sub.stage_journey} />
            </div>
          )}

          {/* Order number */}
          {sub.order_number && (
            <p className="text-gray-600 text-[10px] font-mono">Order: {sub.order_number}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ STAGE PIPELINE ═══
function StagePipeline({ journey }: { journey: any[] }) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-1 -mx-1 px-1">
      {journey.map((stage: any, i: number) => (
        <div key={stage.key} className="flex items-center gap-0.5 flex-shrink-0">
          <div className="flex flex-col items-center gap-0.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                ${stage.is_current
                  ? 'ring-2 ring-offset-1 ring-offset-[#0C0A1D] scale-110 text-white'
                  : stage.is_done
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-gray-600'
                }`}
              style={stage.is_current ? { backgroundColor: stage.color + '40', boxShadow: `0 0 12px ${stage.color}30` } : {}}
            >
              {stage.is_done ? '✓' : stage.is_current ? '●' : '○'}
            </div>
            <span className={`text-[7px] max-w-[46px] text-center leading-tight truncate
              ${stage.is_current ? 'text-white font-semibold' : stage.is_done ? 'text-emerald-400/60' : 'text-gray-600'}`}>
              {stage.label}
            </span>
          </div>
          {i < journey.length - 1 && (
            <div className={`w-2.5 h-0.5 flex-shrink-0 rounded-full ${stage.is_done ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
