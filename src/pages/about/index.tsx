import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/routes';

const aboutStyles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display:ital@0;1&display=swap');

.kl-about {
  --indigo: #5B6ABF;
  --indigo-light: #EEEFF7;
  --indigo-dark: #454F94;
  --coral: #E85B5B;
  --coral-light: #FDF0F0;
  --green: #34A853;
  --green-light: #EAF5ED;
  --bg: #F8F8FA;
  --surface: #FFFFFF;
  --white: #FFFFFF;
  --charcoal: #2C2C2A;
  --text: #3D3D3A;
  --text-muted: #73726C;
  --border: #E5E5EA;

  font-family: 'DM Sans', sans-serif;
  color: var(--text);
  background: var(--surface);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  position: relative;
}

.kl-about, .kl-about *, .kl-about *::before, .kl-about *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* DARK MODE — follows the app's .dark class on <html> */
.dark .kl-about {
  --indigo-light: #232645;
  --indigo-dark: #aab4ef;
  --coral-light: #3a2222;
  --green-light: #1b2a20;
  --bg: #131316;
  --surface: #1c1c20;
  --charcoal: #f3f3f1;
  --text: #d6d6d2;
  --text-muted: #9a9a93;
  --border: #303036;
}

/* CTA stays a dark band in both themes, so its --charcoal background
   must not flip to the light heading color in dark mode. */
.dark .kl-about .cta {
  background: #0f0f12;
  border-top: 1px solid var(--border);
}

/* BACK BUTTON */
.kl-about .back-btn {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  color: var(--indigo);
  border: 1px solid var(--border);
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  padding: 8px 16px 8px 14px;
  border-radius: 100px;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
}

.kl-about .back-btn:hover {
  background: var(--indigo-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(91, 106, 191, 0.15);
}

.kl-about .back-btn svg {
  width: 16px;
  height: 16px;
}

/* HERO */
.kl-about .hero {
  background: var(--bg);
  padding: 100px 24px 80px;
  text-align: center;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
}

.kl-about .hero::before {
  content: '';
  position: absolute;
  top: -200px;
  right: -200px;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: rgba(91, 106, 191, 0.05);
}

.kl-about .hero::after {
  content: '';
  position: absolute;
  bottom: -150px;
  left: -150px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(232, 91, 91, 0.04);
}

.kl-about .hero-inner {
  max-width: 680px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.kl-about .hero-badge {
  display: inline-block;
  background: var(--indigo-light);
  color: var(--indigo);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 16px;
  border-radius: 100px;
  margin-bottom: 28px;
}

.kl-about .hero h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 52px;
  line-height: 1.15;
  color: var(--charcoal);
  margin-bottom: 20px;
  font-weight: 400;
}

.kl-about .hero h1 em {
  color: var(--indigo);
  font-style: italic;
}

.kl-about .hero p {
  font-size: 19px;
  color: var(--text-muted);
  max-width: 520px;
  margin: 0 auto;
}

/* SECTIONS */
.kl-about .section {
  padding: 80px 24px;
  max-width: 800px;
  margin: 0 auto;
}

.kl-about .section-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--indigo);
  margin-bottom: 12px;
}

.kl-about .section h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 36px;
  color: var(--charcoal);
  margin-bottom: 16px;
  font-weight: 400;
  line-height: 1.2;
}

.kl-about .section p {
  font-size: 17px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

/* HOW IT WORKS */
.kl-about .how-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 40px 0;
}

.kl-about .how-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 36px 28px;
  border: 1px solid var(--border);
}

.kl-about .how-card .icon {
  font-size: 36px;
  margin-bottom: 16px;
  display: block;
}

.kl-about .how-card h3 {
  font-family: 'DM Serif Display', serif;
  font-size: 22px;
  color: var(--charcoal);
  margin-bottom: 8px;
  font-weight: 400;
}

.kl-about .how-card p {
  font-size: 15px;
  color: var(--text-muted);
  margin: 0;
}

.kl-about .how-card .type-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 4px;
  margin-bottom: 14px;
}

.kl-about .tag-request {
  background: var(--surface);
  color: var(--coral);
  border: 1.5px solid var(--coral);
}

.kl-about .tag-gift {
  background: var(--surface);
  color: var(--indigo);
  border: 1.5px solid var(--indigo);
}

/* STEPS */
.kl-about .kl-steps {
  margin: 48px 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.kl-about .kl-steps::before {
  content: '';
  position: absolute;
  left: 19px;
  top: 40px;
  bottom: 40px;
  width: 2px;
  background: var(--border);
}

.kl-about .kl-step {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 20px 0;
  position: relative;
  text-align: left;
}

.kl-about .kl-step-num {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--indigo);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.kl-about .kl-step-content h4 {
  font-size: 17px;
  font-weight: 700;
  color: var(--charcoal);
  margin-bottom: 4px;
}

.kl-about .kl-step-content p {
  font-size: 15px;
  color: var(--text-muted);
  margin: 0;
}

/* KUDOS SECTION */
.kl-about .kudos-section {
  background: var(--bg);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.kl-about .kudos-scenarios {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 40px 0 0;
}

.kl-about .scenario {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  background: var(--surface);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border);
}

.kl-about .scenario .emoji {
  font-size: 32px;
  flex-shrink: 0;
  line-height: 1;
}

.kl-about .scenario h4 {
  font-size: 16px;
  font-weight: 700;
  color: var(--charcoal);
  margin-bottom: 4px;
}

.kl-about .scenario p {
  font-size: 15px;
  color: var(--text-muted);
  margin: 0;
}

.kl-about .scenario .kudos-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 100px;
  margin-top: 8px;
}

.kl-about .k-low { background: var(--indigo-light); color: var(--indigo); }
.kl-about .k-med { background: var(--green-light); color: var(--green); }
.kl-about .k-high { background: var(--coral-light); color: var(--coral); }

/* VALUES */
.kl-about .values-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  margin-top: 40px;
}

.kl-about .value-card {
  text-align: center;
  padding: 32px 20px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
}

.kl-about .value-card .v-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 24px;
}

.kl-about .v-indigo { background: var(--indigo-light); }
.kl-about .v-coral { background: var(--coral-light); }
.kl-about .v-green { background: var(--green-light); }

.kl-about .value-card h4 {
  font-size: 16px;
  font-weight: 700;
  color: var(--charcoal);
  margin-bottom: 6px;
}

.kl-about .value-card p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

/* STATUS */
.kl-about .status-bar {
  display: flex;
  gap: 24px;
  margin-top: 40px;
}

.kl-about .status-card {
  flex: 1;
  padding: 28px 24px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.kl-about .status-card.now {
  background: var(--indigo-light);
  border-color: rgba(91, 106, 191, 0.2);
}

.kl-about .status-card.soon {
  background: var(--bg);
  border-color: var(--border);
}

.kl-about .status-card h4 {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}

.kl-about .status-card.now h4 { color: var(--indigo); }
.kl-about .status-card.soon h4 { color: var(--text-muted); }

.kl-about .status-card p, .kl-about .status-card li {
  font-size: 15px;
  color: var(--text);
  margin: 0;
}

.kl-about .status-card ul {
  list-style: none;
  padding: 0;
}

.kl-about .status-card ul li {
  padding: 4px 0;
  padding-left: 18px;
  position: relative;
}

.kl-about .status-card ul li::before {
  content: '\\2192';
  position: absolute;
  left: 0;
  color: var(--indigo);
  font-weight: 700;
}

/* CTA */
.kl-about .cta {
  background: var(--charcoal);
  padding: 80px 24px;
  text-align: center;
  color: var(--white);
}

.kl-about .cta h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 36px;
  font-weight: 400;
  margin-bottom: 12px;
  color: var(--white);
}

.kl-about .cta p {
  font-size: 17px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 32px;
}

.kl-about .cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.kl-about .btn {
  display: inline-block;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: pointer;
  border: none;
}

.kl-about .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.kl-about .btn-primary {
  background: var(--indigo);
  color: var(--white);
}

.kl-about .btn-secondary {
  background: rgba(255,255,255,0.1);
  color: var(--white);
  border: 1px solid rgba(255,255,255,0.2);
}

.kl-about .btn-donate {
  background: var(--coral);
  color: var(--white);
}

.kl-about .cta-divider {
  width: 48px;
  height: 1px;
  background: rgba(255,255,255,0.15);
  margin: 32px auto;
}

.kl-about .cta-sub {
  font-size: 15px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 16px;
}

/* RESPONSIVE */
@media (max-width: 640px) {
  .kl-about .hero h1 { font-size: 36px; }
  .kl-about .hero { padding: 72px 20px 60px; }
  .kl-about .section { padding: 56px 20px; }
  .kl-about .section h2 { font-size: 28px; }
  .kl-about .how-grid { grid-template-columns: 1fr; }
  .kl-about .values-grid { grid-template-columns: 1fr; }
  .kl-about .status-bar { flex-direction: column; }
}
`;

const About: React.FC = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        }
        else {
            navigate(routes.home);
        }
    };

    return (
        <div className='kl-about'>
            <style dangerouslySetInnerHTML={{ __html: aboutStyles }} />

            <button
                type='button'
                className='back-btn'
                onClick={handleBack}
                aria-label='Go back'
            >
                <svg
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden='true'
                >
                    <path d='M19 12H5' />
                    <path d='M12 19l-7-7 7-7' />
                </svg>
                Back
            </button>

            {/* HERO */}
            <section className='hero'>
                <div className='hero-inner'>
                    <span className='hero-badge'>501(c)(3) Nonprofit</span>
                    <h1>
                        Earn points by <em>helping people</em>
                    </h1>
                    <p>
                        Kudos League is a platform where neighbors give and
                        receive help of any kind — and get recognized for
                        showing up for their community.
                    </p>
                </div>
            </section>

            {/* NO CATCH */}
            <section className='section'>
                <div className='section-label'>Wait, do I need to pay?</div>
                <h2>Absolutely not</h2>
                <p>
                    You don&apos;t pay with your money or your data. Kudos League
                    is a nonprofit. We cover our costs through generous donations
                    from people who believe communities should take care of each
                    other.
                </p>
                <p>No strings attached. Ever.</p>
            </section>

            {/* HOW IT WORKS */}
            <section className='section' style={{ paddingTop: 0 }}>
                <div className='section-label'>How it works</div>
                <h2>Two ways to participate</h2>

                <div className='how-grid'>
                    <div className='how-card'>
                        <span className='type-tag tag-request'>Request</span>
                        <h3>Request help</h3>
                        <p>
                            Need something? Post a request. It appears on the
                            homepage and people who can help will reach out to
                            you.
                        </p>
                    </div>
                    <div className='how-card'>
                        <span className='type-tag tag-gift'>Gift</span>
                        <h3>Gift help</h3>
                        <p>
                            Have something to give? Post it. People who need what
                            you&apos;re offering will contact you.
                        </p>
                    </div>
                </div>

                <div className='kl-steps'>
                    <div className='kl-step'>
                        <div className='kl-step-num'>1</div>
                        <div className='kl-step-content'>
                            <h4>Create your post</h4>
                            <p>
                                Choose Request or Gift, add details, set your
                                location.
                            </p>
                        </div>
                    </div>
                    <div className='kl-step'>
                        <div className='kl-step-num'>2</div>
                        <div className='kl-step-content'>
                            <h4>Get matched</h4>
                            <p>
                                Receive notifications from interested neighbors.
                                Chat to coordinate.
                            </p>
                        </div>
                    </div>
                    <div className='kl-step'>
                        <div className='kl-step-num'>3</div>
                        <div className='kl-step-content'>
                            <h4>Connect</h4>
                            <p>
                                Accept a handshake to share details and make it
                                happen.
                            </p>
                        </div>
                    </div>
                    <div className='kl-step'>
                        <div className='kl-step-num'>4</div>
                        <div className='kl-step-content'>
                            <h4>Say thanks with Kudos</h4>
                            <p>
                                After receiving help, award Kudos points to
                                recognize the person who showed up.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* KUDOS EXPLAINED */}
            <section className='section kudos-section'>
                <div className='section-label'>Kudos</div>
                <h2>How many should I give?</h2>
                <p>
                    Kudos reflect how much someone&apos;s help meant to you.
                    Think about the effort involved and how much it mattered.
                </p>
                <p>
                    Every Kudos has a story. Your profile shows where each one
                    came from — so your reputation speaks for itself.
                </p>

                <div className='kudos-scenarios'>
                    <div className='scenario'>
                        <div className='emoji'>🚰</div>
                        <div>
                            <h4>Small gesture</h4>
                            <p>
                                A stranger offers you water when you&apos;re not
                                thirsty. Nice, but not urgent.
                            </p>
                            <span className='kudos-tag k-low'>A few Kudos</span>
                        </div>
                    </div>
                    <div className='scenario'>
                        <div className='emoji'>💧</div>
                        <div>
                            <h4>Real help</h4>
                            <p>
                                A stranger gives you water when you&apos;re
                                thirsty and can&apos;t afford it. They made a
                                real difference.
                            </p>
                            <span className='kudos-tag k-med'>More Kudos</span>
                        </div>
                    </div>
                    <div className='scenario'>
                        <div className='emoji'>🏜️</div>
                        <div>
                            <h4>Above and beyond</h4>
                            <p>
                                You&apos;re stranded in the desert. Someone
                                crosses miles to bring you water, investing their
                                time and energy to help.
                            </p>
                            <span className='kudos-tag k-high'>
                                A lot of Kudos
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* VALUES */}
            <section className='section'>
                <div className='section-label'>Our values</div>
                <h2>How we think communities should work</h2>

                <div className='values-grid'>
                    <div className='value-card'>
                        <div className='v-icon v-indigo'>🤝</div>
                        <h4>Community driven</h4>
                        <p>
                            Kudos are our way of recognizing the people who make
                            their neighborhoods better.
                        </p>
                    </div>
                    <div className='value-card'>
                        <div className='v-icon v-green'>🔓</div>
                        <h4>Free and open source</h4>
                        <p>
                            Everything is better when it&apos;s free. We operate
                            with full transparency under an open source license.
                        </p>
                    </div>
                    <div className='value-card'>
                        <div className='v-icon v-coral'>🛡️</div>
                        <h4>No data selling</h4>
                        <p>
                            We don&apos;t sell your data. We don&apos;t run ads.
                            Donations keep the lights on.
                        </p>
                    </div>
                </div>
            </section>

            {/* STATUS */}
            <section className='section' style={{ paddingTop: 0 }}>
                <div className='section-label'>Where we are</div>
                <h2>Current status</h2>

                <div className='status-bar'>
                    <div className='status-card now'>
                        <h4>Right now</h4>
                        <p>
                            We&apos;re a small community with a growing group of
                            trusted early members. If you&apos;re here, it&apos;s
                            because we trust you.
                        </p>
                    </div>
                    <div className='status-card soon'>
                        <h4>Coming soon</h4>
                        <ul>
                            <li>Community voting and data analysis</li>
                            <li>Better post recommendations</li>
                            <li>Abuse prevention for unrealistic Kudos</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className='cta'>
                <h2>Ready to join?</h2>
                <p>Start earning Kudos by helping your neighbors.</p>
                <div className='cta-buttons'>
                    <Link to={routes.signUp} className='btn btn-primary'>
                        Join now
                    </Link>
                    <Link to={routes.login} className='btn btn-secondary'>
                        Log in
                    </Link>
                </div>
                <div className='cta-divider'></div>
                <p className='cta-sub'>
                    Help us keep Kudos League free for everyone.
                </p>
                <Link to={routes.donate} className='btn btn-donate'>
                    Donate
                </Link>
            </section>
        </div>
    );
};

export default About;
