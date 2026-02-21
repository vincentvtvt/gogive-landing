'use client';

import { useEffect, useCallback } from 'react';

// Gradient fallbacks for broken images
const gradients: Record<string, string> = {
  blue: 'linear-gradient(135deg, #DBEAFE 0%, #93B4FD 100%)',
  green: 'linear-gradient(135deg, #D1FAE5 0%, #6EE7A0 100%)',
  warm: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
  gray: 'linear-gradient(135deg, #F3F4F6 0%, #D1D5DB 100%)',
};

function ImgFallback({ src, alt, className, fallback = 'gray' }: {
  src: string; alt: string; className?: string; fallback?: keyof typeof gradients;
}) {
  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.background = gradients[fallback];
    img.style.objectFit = 'contain';
    img.src = 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="none" width="400" height="300"/></svg>`
    );
  }, [fallback]);

  return <img className={className} src={src} alt={alt} onError={handleError} />;
}

export default function Home() {
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('v'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.rv').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* NAV */}
      <nav>
        <a className="logo" href="#">
          <span className="go">Go</span><span className="give">Give</span>
        </a>
        <div className="nav-r">
          <a className="nav-a" href="#how">How It Works</a>
          <a className="nav-a" href="#products">Products</a>
          <a className="nav-a" href="#earn">Earn</a>
          <a className="nav-join" href="#join">Join Free</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-top">
          <div className="hero-text rv">
            <h1>AI <span className="go">goes.</span><br />You <span className="give">give.</span><br />Both earn.</h1>
            <p className="hero-p">You have the connections. AI has the sales skills. Together, you close deals on WhatsApp — and everyone gets paid.</p>
            <div className="join-box" id="join">
              <label>Join instantly — it&apos;s free</label>
              <div className="join-row">
                <input type="tel" placeholder="+60 12 345 6789" />
                <button className="join-btn">Join Now</button>
              </div>
              <div className="join-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                We&apos;ll send you a WhatsApp to get started. No app download needed.
              </div>
            </div>
          </div>

          <div className="hero-visual rv">
            <ImgFallback className="hero-img main" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=750&fit=crop&crop=faces" alt="Young woman smiling" fallback="warm" />
            <ImgFallback className="hero-img side" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=faces" alt="Man smiling" fallback="blue" />
            <div className="hero-badge b1">
              <div className="badge-dot" style={{ background: 'var(--go)' }}>🤖</div>
              <div>
                <div className="badge-sub">AI just closed</div>
                <div style={{ fontWeight: 700 }}>Unifi Home signup</div>
              </div>
            </div>
            <div className="hero-badge b2">
              <div className="badge-dot" style={{ background: 'var(--give)' }}>💰</div>
              <div>
                <div className="badge-sub">You earned</div>
                <div style={{ fontWeight: 700, color: 'var(--give)' }}>+RM 20.00</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-stats rv">
          <div className="stat-item"><div className="stat-val blue">2,400+</div><div className="stat-label">Active referrers</div></div>
          <div className="stat-item"><div className="stat-val green">RM 890K</div><div className="stat-label">Earned by community</div></div>
          <div className="stat-item"><div className="stat-val">94%</div><div className="stat-label">AI conversation success</div></div>
          <div className="stat-item"><div className="stat-val">12 sec</div><div className="stat-label">Average time to refer</div></div>
        </div>
      </section>

      {/* DUALITY */}
      <section className="duality">
        <div className="section-header rv">
          <h2>Two forces.<br />One platform.</h2>
          <p>GoGive combines AI automation with human connection — so anyone can earn from their network without being a salesperson.</p>
        </div>

        <div className="dual-grid">
          <div className="dual-card go-card rv">
            <ImgFallback className="dual-img" src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop" alt="AI technology" fallback="blue" />
            <div className="dual-tag">⚡ Go — powered by AI</div>
            <h3>The machine that<br />never sleeps</h3>
            <p>Your personal AI agent handles the entire sales conversation — pitching, answering questions, following up, and closing.</p>
            <div className="dual-features">
              <div className="df-item"><div className="df-icon">🗣️</div> Speaks BM, English &amp; Chinese naturally</div>
              <div className="df-item"><div className="df-icon">🔄</div> Smart follow-ups at the right time</div>
              <div className="df-item"><div className="df-icon">📱</div> Works 24/7 on WhatsApp</div>
            </div>
          </div>

          <div className="dual-card give-card rv">
            <ImgFallback className="dual-img" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop&crop=faces" alt="Friends together" fallback="green" />
            <div className="dual-tag">💚 Give — powered by you</div>
            <h3>The human who<br />connects</h3>
            <p>You know who needs what. A friend looking for wifi? A neighbor wanting a water purifier? Just share their name — that&apos;s your superpower.</p>
            <div className="dual-features">
              <div className="df-item"><div className="df-icon">🤝</div> No selling, no scripts, no pressure</div>
              <div className="df-item"><div className="df-icon">🎁</div> Both you and your friend earn</div>
              <div className="df-item"><div className="df-icon">🏦</div> Withdraw anytime to your bank</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how">
        <div className="how-inner">
          <div className="how-header rv"><h2>As simple as texting a friend.</h2></div>
          <div className="how-steps">
            <div className="step-card rv">
              <ImgFallback className="step-img" src="https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=600&h=400&fit=crop" alt="Person sharing contact on phone" fallback="blue" />
              <div className="step-body">
                <div className="step-num">1</div>
                <h3>Share a contact</h3>
                <p>Know someone who needs internet, a purifier, or any GoGive product? Drop their name and number — takes 12 seconds.</p>
                <div className="step-tag">Your part is done here</div>
              </div>
            </div>
            <div className="step-card rv">
              <ImgFallback className="step-img" src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop" alt="AI chatbot handling conversation" fallback="blue" />
              <div className="step-body">
                <div className="step-num">2</div>
                <h3>AI handles the rest</h3>
                <p>Your AI agent reaches out on WhatsApp, chats naturally, answers questions, and guides them to purchase. All automated.</p>
                <div className="step-tag">100% automated by AI</div>
              </div>
            </div>
            <div className="step-card rv">
              <ImgFallback className="step-img" src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop" alt="Money earned from referral" fallback="green" />
              <div className="step-body">
                <div className="step-num">3</div>
                <h3>You both earn</h3>
                <p>Deal completes → you get commission points, they get buyer rewards. Real money, straight to your bank account.</p>
                <div className="step-tag">Both sides win</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="products-section" id="products">
        <div className="products-header rv">
          <h2>Earn on products<br />people actually want.</h2>
          <p>Higher-value products earn higher multipliers. New products added every month.</p>
        </div>
        <div className="prod-grid rv">
          {[
            { img: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=500&h=300&fit=crop', name: 'LG PuriCare', type: 'Water purifier', mult: '6×', earn: 'RM 60' },
            { img: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&h=300&fit=crop', name: 'Unifi Business', type: 'B2B fibre internet', mult: '4×', earn: 'RM 40' },
            { img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&h=300&fit=crop', name: 'Unifi Home', type: 'Home fibre internet', mult: '2×', earn: 'RM 20' },
            { img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=300&fit=crop', name: 'Unifi Mobile', type: 'Postpaid plan', mult: '1×', earn: 'RM 10' },
          ].map(p => (
            <div className="prod-item" key={p.name}>
              <ImgFallback className="prod-img" src={p.img} alt={p.name} fallback="blue" />
              <div className="prod-info">
                <div className="prod-name">{p.name}</div>
                <div className="prod-type">{p.type}</div>
                <div className="prod-row">
                  <div className="prod-mult">{p.mult} multiplier</div>
                  <div className="prod-earn">Up to {p.earn}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="proof-section">
        <div className="proof-inner">
          <div className="proof-grid">
            {[
              { img: 'https://i.pravatar.cc/100?img=25', name: 'Aisyah N.', role: 'Freelance designer, KL', text: '"I just tell my friends about Unifi when they complain about slow internet. AI handles everything else. Made RM 480 last month doing basically nothing."', earn: 'RM 480 earned last month' },
              { img: 'https://i.pravatar.cc/100?img=59', name: 'Wei Liang C.', role: 'Property agent, Penang', text: '"I\'m already talking to people all day. Now when someone mentions they need wifi or a purifier, I just drop their number into GoGive. The AI does the rest."', earn: 'RM 1,200 earned this quarter' },
              { img: 'https://i.pravatar.cc/100?img=32', name: 'Priya S.', role: 'Student, Johor', text: '"My parents\' friends all needed help setting up Unifi. I referred 8 of them and the AI closed 6. More than my part-time job pays in a week."', earn: 'RM 120 earned in first week' },
            ].map(t => (
              <div className="proof-card rv" key={t.name}>
                <div className="proof-top">
                  <ImgFallback className="proof-av" src={t.img} alt={t.name} fallback="warm" />
                  <div><div className="proof-name">{t.name}</div><div className="proof-role">{t.role}</div></div>
                </div>
                <div className="proof-text">{t.text}</div>
                <div className="proof-earn">💰 {t.earn}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GLOBAL */}
      <section className="global-section" id="earn">
        <div className="global-text rv">
          <h2>Starting here.<br />Going everywhere.</h2>
          <p>Different countries bring different products, different languages, different opportunities. Your network has no borders — and neither does GoGive.</p>
          <div className="flag-list">
            <div className="flag-item live">🇲🇾 Malaysia — Live</div>
            <div className="flag-item">🇸🇬 Singapore <span className="soon">Q3 &apos;26</span></div>
            <div className="flag-item">🇮🇩 Indonesia <span className="soon">Q4 &apos;26</span></div>
            <div className="flag-item">🇹🇭 Thailand <span className="soon">2027</span></div>
            <div className="flag-item">🇵🇭 Philippines <span className="soon">2027</span></div>
          </div>
        </div>
        <ImgFallback className="global-img rv" src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop" alt="Diverse group of people" fallback="warm" />
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="rv">The <span className="go">AI</span> is ready.<br />Are <span className="give">you</span>?</h2>
          <p className="rv">Join GoGive in 30 seconds. No downloads. No fees. Just your phone number and WhatsApp.</p>
          <div className="cta-join rv">
            <label style={{ fontSize: '13px', fontWeight: 700, textAlign: 'left' as const }}>Join GoGive — free forever</label>
            <div className="join-row">
              <input type="tel" placeholder="+60 your phone number" />
              <button className="join-btn">Join Free →</button>
            </div>
          </div>
          <div className="cta-trust rv">
            <span>✅ Free forever</span>
            <span>🔒 No selling required</span>
            <span>🏦 Withdraw anytime</span>
          </div>
          <div className="app-row rv">
            <a className="app-badge" href="#"><span style={{ fontSize: '20px' }}>🍎</span><div><small>Coming soon</small><strong>App Store</strong></div></a>
            <a className="app-badge" href="#"><span style={{ fontSize: '20px' }}>▶️</span><div><small>Coming soon</small><strong>Google Play</strong></div></a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-l">
          <span style={{ fontWeight: 800, fontSize: '16px' }}><span style={{ color: 'var(--go)' }}>Go</span><span style={{ color: 'var(--give)' }}>Give</span></span>
          &nbsp;© 2026
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
