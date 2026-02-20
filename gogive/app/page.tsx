'use client';

import { useEffect } from 'react';

const TICKER_DATA = [
  { name: 'A', label: 'Aisyah earned from Unifi Home referral', amount: '+RM 20', time: '2m ago', bg: 'linear-gradient(135deg,#00C853,#69F0AE)' },
  { name: 'R', label: 'Ravi got buyer reward — LG PuriCare', amount: '+RM 36', time: '5m ago', bg: 'linear-gradient(135deg,#7C5CFC,#B388FF)' },
  { name: 'S', label: 'Sarah referred Unifi Business', amount: '+RM 40', time: '8m ago', bg: 'linear-gradient(135deg,#FF6B6B,#FF8A80)' },
  { name: 'D', label: 'Daniel hit Gold tier 🏆', amount: '+RM 1.20/pt', time: '12m ago', bg: 'linear-gradient(135deg,#FFB800,#FFD54F)' },
  { name: 'L', label: 'Li Mei withdrew to Maybank', amount: 'RM 380', time: '15m ago', bg: 'linear-gradient(135deg,#38BDF8,#7DD3FC)' },
];

const MARQUEE = ['REFER', 'EARN', 'ZERO EFFORT', 'AI POWERED', 'BOTH EARN', 'WITHDRAW ANYTIME', 'YOUR NETWORK = YOUR INCOME', 'NO SELLING NEEDED'];

export default function Home() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* NAV */}
      <nav>
        <a className="nav-logo" href="#">
          <div className="nav-icon">G</div>
          <div className="nav-name">Go<em>Give</em></div>
        </a>
        <a className="nav-link" href="#how">How It Works</a>
        <a className="nav-link" href="#earn">Earnings</a>
        <a className="nav-link" href="#products">Products</a>
        <a className="nav-cta" href="#join">Get Early Access</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="hero-pill">
          <span className="pill-dot">🇲🇾</span>
          Now live in Malaysia · More countries coming 2026
        </div>

        <h1>Share a name.<br /><span className="green">AI closes the deal.</span><br />You both earn.</h1>

        <p className="hero-sub">Everyone has a network. Now it pays. GoGive gives you a personal AI sales agent — it talks to your contacts, handles the pitch, and closes deals while you go about your day.</p>

        <div className="hero-actions">
          <a className="btn btn-fill" href="#join">Start Earning Free →</a>
          <a className="btn btn-ghost" href="#how">See How It Works</a>
        </div>

        {/* Ticker */}
        <div className="ticker-wrap">
          <div className="ticker-label">Live Earnings Feed</div>
          <div className="ticker">
            <div className="ticker-inner">
              {[...TICKER_DATA, ...TICKER_DATA].map((t, i) => (
                <div className="tick" key={i}>
                  <div className="tick-left">
                    <div className="tick-avatar" style={{ background: t.bg }}>{t.name}</div>
                    {t.label}
                  </div>
                  <div className="tick-right">
                    <span className="tick-amount">{t.amount}</span>
                    <span className="tick-time">{t.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-section">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className={i % 2 === 1 ? 'hl' : ''}>{t}</span>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="reveal">
          <div className="section-eyebrow">How It Works</div>
          <div className="section-h">Three taps. Zero selling.<br />That&apos;s the whole job.</div>
          <div className="section-p">No product training. No scripts. No awkward sales pitch to your friends. Just connect people to products — AI does everything else.</div>
        </div>

        <div className="how-grid reveal-stagger">
          <div className="how-card">
            <div className="how-num">01</div>
            <div className="how-title">Drop a name & number</div>
            <div className="how-desc">Know someone who might want faster wifi? A water purifier? Just share their name and phone. Takes 12 seconds.</div>
            <div className="how-tag">💬 12 seconds avg</div>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <div className="how-title">AI handles everything</div>
            <div className="how-desc">Your personal AI agent reaches out on WhatsApp, chats naturally in BM/English/Chinese, answers questions, and closes the deal.</div>
            <div className="how-tag">🤖 Fully automated</div>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <div className="how-title">You both get paid</div>
            <div className="how-desc">When the deal completes — you earn commission, they earn buyer rewards. Withdraw to your bank anytime. No minimum lock-in.</div>
            <div className="how-tag">💰 Both earn</div>
          </div>
        </div>
      </section>

      {/* AI AGENT + PHONE */}
      <section className="ai-section">
        <div className="orb" style={{ width: 500, height: 500, top: -200, right: -100 }} />
        <div className="ai-inner">
          <div className="ai-content reveal">
            <div className="section-eyebrow">Your AI Employee</div>
            <div className="section-h">It sells so you don&apos;t have to.</div>
            <div className="section-p">Your AI agent works 24/7. It speaks your customer&apos;s language, handles objections, and never forgets to follow up.</div>

            <div className="ai-features">
              {[
                { icon: '🗣️', title: 'Speaks BM, English & Chinese', desc: 'Detects language automatically. Code-switches naturally like a real Malaysian.' },
                { icon: '🔄', title: 'Smart follow-ups', desc: 'No reply? AI follows up at the right time, right tone. No spamming.' },
                { icon: '📊', title: 'Track everything live', desc: 'Watch your AI work in real time. See conversations, status, and earnings update instantly.' },
              ].map((f, i) => (
                <div className="ai-feat" key={i}>
                  <div className="ai-feat-icon">{f.icon}</div>
                  <div>
                    <div className="ai-feat-title">{f.title}</div>
                    <div className="ai-feat-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="phone-wrap reveal">
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="wa-header">
                  <span className="wa-back">‹</span>
                  <div className="wa-av">G</div>
                  <div>
                    <div className="wa-name">GoGive AI</div>
                    <div className="wa-status">● online</div>
                  </div>
                </div>
                <div className="wa-body">
                  <div className="bubble ai">Hi Ahmad! 👋 Your friend Vincent mentioned you might be looking for home internet. Are you currently on Streamyx? <span className="time">10:42 AM</span></div>
                  <div className="bubble user">Ya la, very slow already. How much Unifi? <span className="time">10:43 AM</span></div>
                  <div className="bubble ai">Great question! Unifi Home 300Mbps is RM129/month — includes free router + installation. Want me to check coverage at your area? 😊 <span className="time">10:43 AM</span></div>
                  <div className="bubble user">Ok check 75200 <span className="time">10:44 AM</span></div>
                  <div className="bubble ai">✅ 75200 confirmed! Full coverage. I can register you now — just need your full name and IC. Takes 2 mins! <span className="time">10:44 AM</span></div>
                  <div className="bubble-notify">🎉 Deal closed — 4 messages<br /><strong>+RM 20.00</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTH EARN */}
      <section className="earn-section" id="earn">
        <div className="earn-inner">
          <div className="reveal">
            <div className="section-eyebrow">Two-Way Rewards</div>
            <div className="section-h">You earn. They earn.<br />Then they start referring too.</div>
            <div className="section-p">The only referral program where both sides win. And every buyer can become a referrer.</div>
          </div>

          <div className="earn-split">
            <div className="earn-card referrer reveal">
              <div className="earn-label">🔗 You — The Referrer</div>
              <div className="earn-h">Earn up to <span>RM 60</span> per referral</div>
              <div className="earn-desc">Just share a name. Your AI does the selling. You get paid when the order completes.</div>
              <div className="earn-rows">
                {[['AI contacts customer', '+3 pts'], ['Order confirmed', '+3 pts'], ['30-day completion', '+4 pts']].map(([l, v], i) => (
                  <div className="earn-row" key={i}><span className="earn-row-label">{l}</span><span className="earn-row-v">{v}</span></div>
                ))}
                <div className="earn-total-bar">
                  <span className="earn-total-label">Max per referral</span>
                  <span className="earn-total-v">10 pts</span>
                </div>
              </div>
            </div>

            <div className="earn-card buyer reveal">
              <div className="earn-label">🎁 Friend — The Buyer</div>
              <div className="earn-h">They earn up to <span>RM 36</span> in rewards</div>
              <div className="earn-desc">Your friend isn&apos;t just a customer — they earn rewards too. And once verified, they can start referring.</div>
              <div className="earn-rows">
                {[['Purchase completed', '+4 pts'], ['30-day loyalty bonus', '+2 pts']].map(([l, v], i) => (
                  <div className="earn-row" key={i}><span className="earn-row-label">{l}</span><span className="earn-row-v">{v}</span></div>
                ))}
                <div className="earn-total-bar">
                  <span className="earn-total-label">Max per purchase</span>
                  <span className="earn-total-v">6 pts</span>
                </div>
              </div>
              <div className="earn-note">
                ✨ <strong style={{ color: 'var(--violet)' }}>Viral loop:</strong> Every buyer can become a referrer. They verify, start sharing, and earn the full 10 pts per referral. Single-level only — not MLM.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="products-section" id="products">
        <div className="products-inner">
          <div className="reveal">
            <div className="section-eyebrow">Products</div>
            <div className="section-h">Higher-value products.<br />Bigger rewards.</div>
            <div className="section-p">Each product has a multiplier. Points × Multiplier = your payout.</div>
          </div>

          <div className="products-grid reveal-stagger">
            {[
              { emoji: '🫧', name: 'LG PuriCare', type: 'Water purifier', mult: '6×', earn: 'RM 60' },
              { emoji: '📡', name: 'Unifi Business', type: 'B2B fibre internet', mult: '4×', earn: 'RM 40' },
              { emoji: '🏠', name: 'Unifi Home', type: 'Home fibre internet', mult: '2×', earn: 'RM 20' },
              { emoji: '📱', name: 'Unifi Mobile', type: 'Postpaid plan', mult: '1×', earn: 'RM 10' },
            ].map((p, i) => (
              <div className="prod-card" key={i}>
                <span className="prod-emoji">{p.emoji}</span>
                <div className="prod-name">{p.name}</div>
                <div className="prod-type">{p.type}</div>
                <div className="prod-mult">{p.mult} multiplier</div>
                <div className="prod-earn">Earn up to <strong>{p.earn}</strong> per referral</div>
              </div>
            ))}
            <div className="prod-card coming">
              <span className="prod-emoji">✨</span>
              <div className="prod-name">More coming</div>
              <div className="prod-type">New products added monthly</div>
            </div>
          </div>
        </div>
      </section>

      {/* GLOBAL */}
      <section className="global-section reveal">
        <div className="section-eyebrow" style={{ textAlign: 'center' }}>Global Vision</div>
        <div className="section-h" style={{ margin: '0 auto', textAlign: 'center' }}>One app. Every country.<br />Infinite products.</div>
        <p className="vision-text">Starting in Malaysia. Different countries bring different products, different languages, different opportunities — all on GoGive.</p>

        <div className="flags">
          <div className="flag-chip live">🇲🇾 Malaysia — Live Now</div>
          {[
            ['🇸🇬', 'Singapore', "Q3 '26"], ['🇮🇩', 'Indonesia', "Q4 '26"],
            ['🇹🇭', 'Thailand', '2027'], ['🇵🇭', 'Philippines', '2027'], ['🇻🇳', 'Vietnam', '2027'],
          ].map(([flag, name, when], i) => (
            <div className="flag-chip soon" key={i}>{flag} {name} <span className="soon-dot">{when}</span></div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="join">
        <div className="cta-h reveal">Your network is worth more than you think. <span className="green">Start earning from it.</span></div>
        <p className="cta-p reveal">Join the GoGive community. Be first when we launch in your area.</p>

        <div className="cta-form reveal">
          <input type="tel" placeholder="+60 your phone number" />
          <button className="btn btn-fill">Join Waitlist →</button>
        </div>
        <p className="cta-note reveal">Free forever · No selling required · Withdraw anytime</p>

        <div className="app-badges reveal">
          <a className="app-badge" href="#">
            <span style={{ fontSize: 22 }}>🍎</span>
            <div>
              <span className="app-badge-label">Coming soon on</span>
              <span className="app-badge-name">App Store</span>
            </div>
          </a>
          <a className="app-badge" href="#">
            <span style={{ fontSize: 22 }}>▶️</span>
            <div>
              <span className="app-badge-label">Coming soon on</span>
              <span className="app-badge-name">Google Play</span>
            </div>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-left">
          <div className="nav-icon" style={{ width: 24, height: 24, fontSize: 13, borderRadius: 6 }}>G</div>
          © 2026 GoGive.ai
        </div>
        <div className="foot-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Support</a>
          <a href="#">Instagram</a>
          <a href="#">TikTok</a>
        </div>
      </footer>
    </>
  );
}
