// FILE: app/gogiver/page.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = '/api/gogiver';

export default function GoGiverLogin() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Check existing session
  useEffect(() => {
    fetch(`${API}/dashboard`).then(r => {
      if (r.ok) router.replace('/gogiver/dashboard');
    }).catch(() => {});
  }, []);

  const normalizePhone = (p: string) => {
    let n = p.replace(/[\s\-\(\)]/g, '');
    if (n.startsWith('0')) n = '+60' + n.slice(1);
    if (n.startsWith('60')) n = '+' + n;
    if (!n.startsWith('+')) n = '+60' + n;
    return n;
  };

  const sendOtp = async () => {
    if (!phone.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/auth/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone) }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to send OTP'); return; }
      setStep('otp');
      setCooldown(60);
      // Auto-focus first OTP input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async (code: string) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone), otp: code }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Invalid OTP'); setOtp(['','','','','','']); inputRefs.current[0]?.focus(); return; }
      router.replace('/gogiver/dashboard');
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    const code = newOtp.join('');
    if (code.length === 6) verifyOtp(code);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      verifyOtp(pasted);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Logo + Brand */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-xl font-black text-white">G</span>
          </div>
          <span className="text-3xl font-bold tracking-tight">
            Go<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">Give</span>
          </span>
        </div>
        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
          Refer friends to great services. Earn when they sign up.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.06] p-7 shadow-2xl shadow-purple-900/10">

          {step === 'phone' ? (
            <>
              <h2 className="text-lg font-semibold mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your WhatsApp number to continue</p>

              <label className="text-gray-400 text-xs font-medium block mb-2">Phone Number</label>
              <div className="flex gap-2 mb-5">
                <span className="flex items-center px-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm font-mono">+60</span>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="12 345 6789"
                  className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all text-lg font-mono tracking-wider"
                  type="tel"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                />
              </div>

              {error && <p className="text-red-400 text-xs mb-4 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

              <button
                onClick={sendOtp}
                disabled={loading || !phone.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : 'Send OTP'}
              </button>

              <p className="text-center text-gray-600 text-xs mt-5">
                Not a GoGiver yet?{' '}
                <a href="/" className="text-purple-400 hover:text-purple-300 transition-colors">Join now</a>
              </p>
            </>
          ) : (
            <>
              <button onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }}
                className="text-gray-500 hover:text-white text-xs mb-4 flex items-center gap-1 transition-colors">
                ← Change number
              </button>

              <h2 className="text-lg font-semibold mb-1">Verify OTP</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter the 6-digit code sent to <span className="text-purple-300 font-mono">{normalizePhone(phone)}</span>
              </p>

              {/* OTP inputs */}
              <div className="flex gap-2.5 justify-center mb-5" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {error && <p className="text-red-400 text-xs mb-4 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

              {loading && (
                <div className="flex items-center justify-center gap-2 text-purple-300 text-sm mb-4">
                  <span className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                  Verifying...
                </div>
              )}

              <button
                onClick={sendOtp}
                disabled={cooldown > 0 || loading}
                className="w-full py-2.5 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl transition-all disabled:opacity-40"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </button>
            </>
          )}
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-4 mt-6 text-gray-600 text-[10px]">
          <span className="flex items-center gap-1">🔒 Encrypted</span>
          <span>•</span>
          <span>Powered by GoGive.ai</span>
        </div>
      </div>
    </div>
  );
}
