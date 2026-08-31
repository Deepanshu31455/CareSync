// TrustAndLegal.jsx
// Renders the Trust & Legal page for CareSync.
// All copy lives in trustAndLegalData.js — this file only handles layout.

import React, { useState } from "react";
import { trustLegalData } from "../data/trustAndLegal";

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7.25" stroke="#2F6F5E" strokeWidth="1.2" />
    <path d="M5 8.2L7 10.2L11.2 5.8" stroke="#2F6F5E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7.25" stroke="#B9553F" strokeWidth="1.2" />
    <path d="M5 8H11" stroke="#B9553F" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const roleAccent = {
  Patient: "#2F6F5E",
  Doctor: "#10203F",
  Receptionist: "#A9772F",
};

export default function TrustAndLegal() {
  const { hero, principles, roleAccess, security, compliance, legalDocuments, faqs, contact } =
    trustLegalData;

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="tl-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .tl-page {
          --ink: #10203F;
          --teal: #2F6F5E;
          --cream: #F6F3EC;
          --white: #FFFFFF;
          --muted: #5B6472;
          --line: #E3DFD3;
          --rust: #B9553F;
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--cream);
          color: var(--ink);
          line-height: 1.5;
        }
        .tl-page * { box-sizing: border-box; }
        .tl-shell { max-width: 1080px; margin: 0 auto; padding: 0 32px; }
        .tl-mono {
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 12px;
        }
        h1, h2, h3 { font-family: 'Fraunces', serif; font-weight: 500; margin: 0; }

        /* Breadcrumb */
        .tl-crumb {
          padding: 28px 0 0;
          color: var(--muted);
          font-size: 14px;
        }
        .tl-crumb span { color: var(--ink); font-weight: 500; }

        /* Hero */
        .tl-hero {
          padding: 40px 0 64px;
          border-bottom: 1px solid var(--line);
          position: relative;
        }
        .tl-eyebrow { color: var(--teal); margin-bottom: 18px; display: flex; align-items: center; gap: 10px; }
        .tl-eyebrow::before { content: ""; width: 22px; height: 1px; background: var(--teal); display: inline-block; }
        .tl-hero h1 {
          font-size: clamp(32px, 4.5vw, 50px);
          line-height: 1.08;
          max-width: 720px;
          letter-spacing: -0.01em;
        }
        .tl-hero p {
          margin-top: 20px;
          max-width: 560px;
          color: var(--muted);
          font-size: 17px;
        }
        .tl-seal {
          position: absolute;
          right: 32px;
          top: 36px;
          width: 92px;
          height: 92px;
          border-radius: 50%;
          border: 1px dashed var(--teal);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          transform: rotate(-8deg);
        }
        .tl-seal-inner {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--teal);
          line-height: 1.3;
        }

        /* Principles grid */
        .tl-principles {
          padding: 56px 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
        }
        .tl-principle {
          background: var(--white);
          padding: 28px 24px;
        }
        .tl-principle .tl-mono { color: var(--rust); margin-bottom: 14px; display: block; }
        .tl-principle h3 { font-size: 18px; margin-bottom: 10px; }
        .tl-principle p { color: var(--muted); font-size: 14px; margin: 0; }

        /* Section heading pattern */
        .tl-section { padding: 64px 0; border-top: 1px solid var(--line); }
        .tl-section-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; flex-wrap: wrap; gap: 12px; }
        .tl-section-head h2 { font-size: 30px; }
        .tl-section-head .tl-mono { color: var(--muted); }

        /* Security checklist */
        .tl-security-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px 40px;
        }
        .tl-check-row { display: flex; gap: 12px; align-items: flex-start; }
        .tl-check-row svg { margin-top: 3px; flex-shrink: 0; }
        .tl-check-row h3 { font-size: 15.5px; font-family: 'Inter'; font-weight: 600; margin-bottom: 4px; }
        .tl-check-row p { margin: 0; color: var(--muted); font-size: 14px; }

        /* Role access badges */
        .tl-roles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .tl-role-card {
          background: var(--white);
          border: 1px solid var(--line);
          border-top: 3px solid var(--accent, var(--teal));
          padding: 26px 24px;
        }
        .tl-role-card h3 { font-size: 20px; margin-bottom: 6px; }
        .tl-role-card .tl-role-summary { color: var(--muted); font-size: 13.5px; margin-bottom: 20px; }
        .tl-role-list-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; display: block; }
        .tl-role-list { list-style: none; padding: 0; margin: 0 0 22px; }
        .tl-role-list li { display: flex; gap: 8px; font-size: 13.5px; padding: 5px 0; align-items: flex-start; }
        .tl-role-list li span:last-child { flex: 1; }

        /* Compliance band */
        .tl-compliance {
          background: var(--ink);
          color: var(--white);
          padding: 64px 0;
        }
        .tl-compliance .tl-eyebrow { color: #8FB6A9; }
        .tl-compliance .tl-eyebrow::before { background: #8FB6A9; }
        .tl-compliance h2 { color: var(--white); font-size: 30px; max-width: 480px; }
        .tl-compliance-intro { color: #C7CCD6; max-width: 480px; margin-top: 14px; font-size: 15px; }
        .tl-compliance-grid {
          margin-top: 40px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .tl-compliance-item { border-top: 1px solid rgba(255,255,255,0.18); padding-top: 16px; }
        .tl-compliance-item h3 { font-family: 'Inter'; font-weight: 600; font-size: 15px; margin-bottom: 8px; }
        .tl-compliance-item p { color: #B7BEC9; font-size: 13.5px; margin: 0; }

        /* Legal documents — numbered clause list */
        .tl-doc-list { border-top: 1px solid var(--line); }
        .tl-doc-row {
          display: grid;
          grid-template-columns: 64px 1fr auto;
          gap: 20px;
          align-items: center;
          padding: 22px 0;
          border-bottom: 1px solid var(--line);
          text-decoration: none;
          color: inherit;
        }
        .tl-doc-num { font-family: 'IBM Plex Mono', monospace; color: var(--rust); font-size: 14px; }
        .tl-doc-title { font-family: 'Fraunces', serif; font-size: 19px; margin-bottom: 4px; }
        .tl-doc-desc { color: var(--muted); font-size: 13.5px; }
        .tl-doc-meta { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--muted); text-align: right; white-space: nowrap; }
        .tl-doc-arrow { display: inline-block; margin-left: 6px; transition: transform 0.15s ease; }
        .tl-doc-row:hover .tl-doc-arrow { transform: translateX(3px); }

        /* FAQ */
        .tl-faq-item { border-bottom: 1px solid var(--line); }
        .tl-faq-btn {
          width: 100%;
          background: none;
          border: none;
          text-align: left;
          padding: 20px 0;
          font-family: 'Fraunces', serif;
          font-size: 17px;
          color: var(--ink);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }
        .tl-faq-plus { font-family: 'IBM Plex Mono', monospace; font-size: 18px; color: var(--teal); }
        .tl-faq-answer { max-width: 640px; color: var(--muted); font-size: 14.5px; padding-bottom: 20px; margin: 0; }

        /* Contact CTA */
        .tl-contact {
          padding: 64px 0 80px;
          text-align: center;
        }
        .tl-contact h2 { font-size: 28px; margin-bottom: 10px; }
        .tl-contact p { color: var(--muted); max-width: 420px; margin: 0 auto 26px; }
        .tl-contact-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .tl-btn {
          font-family: 'Inter'; font-size: 14px; font-weight: 500;
          padding: 12px 22px; border-radius: 3px; text-decoration: none;
        }
        .tl-btn-primary { background: var(--ink); color: var(--white); }
        .tl-btn-secondary { border: 1px solid var(--line); color: var(--ink); }

        @media (max-width: 860px) {
          .tl-principles { grid-template-columns: 1fr 1fr; }
          .tl-security-grid { grid-template-columns: 1fr; }
          .tl-roles { grid-template-columns: 1fr; }
          .tl-compliance-grid { grid-template-columns: 1fr 1fr; }
          .tl-seal { display: none; }
        }
        @media (max-width: 540px) {
          .tl-principles { grid-template-columns: 1fr; }
          .tl-compliance-grid { grid-template-columns: 1fr; }
          .tl-doc-row { grid-template-columns: 40px 1fr; }
          .tl-doc-meta { grid-column: 2; text-align: left; }
        }
      `}</style>

      {/* Breadcrumb */}
      <div className="tl-shell tl-crumb">
        CareSync / <span>Trust &amp; Legal</span>
      </div>

      {/* Hero */}
      <section className="tl-hero">
        <div className="tl-shell">
          <div className="tl-eyebrow tl-mono">{hero.eyebrow}</div>
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>
          <div className="tl-seal">
            <div className="tl-seal-inner">Verified<br />Secure<br />Record</div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <div className="tl-shell">
        <div className="tl-principles">
          {principles.map((p) => (
            <div className="tl-principle" key={p.code}>
              <span className="tl-mono">{p.code}</span>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <section className="tl-section">
        <div className="tl-shell">
          <div className="tl-section-head">
            <h2>{security.heading}</h2>
            <span className="tl-mono">Infrastructure</span>
          </div>
          <div className="tl-security-grid">
            {security.items.map((item) => (
              <div className="tl-check-row" key={item.title}>
                <CheckIcon />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role access */}
      <section className="tl-section">
        <div className="tl-shell">
          <div className="tl-section-head">
            <h2>What each login can see</h2>
            <span className="tl-mono">Role-based access</span>
          </div>
          <div className="tl-roles">
            {roleAccess.map((r) => (
              <div
                className="tl-role-card"
                key={r.role}
                style={{ "--accent": roleAccent[r.role] }}
              >
                <h3>{r.role}</h3>
                <p className="tl-role-summary">{r.summary}</p>

                <span className="tl-role-list-label">Can see</span>
                <ul className="tl-role-list">
                  {r.canSee.map((item) => (
                    <li key={item}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <span className="tl-role-list-label">Cannot see</span>
                <ul className="tl-role-list">
                  {r.cannotSee.map((item) => (
                    <li key={item}>
                      <DashIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="tl-compliance">
        <div className="tl-shell">
          <div className="tl-eyebrow tl-mono">Regulatory alignment</div>
          <h2>{compliance.heading}</h2>
          <p className="tl-compliance-intro">{compliance.intro}</p>
          <div className="tl-compliance-grid">
            {compliance.items.map((item) => (
              <div className="tl-compliance-item" key={item.name}>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal documents */}
      <section className="tl-section">
        <div className="tl-shell">
          <div className="tl-section-head">
            <h2>Policies &amp; documents</h2>
            <span className="tl-mono">{legalDocuments.length} documents</span>
          </div>
          <div className="tl-doc-list">
            {legalDocuments.map((doc, i) => (
              <a className="tl-doc-row" href={doc.href} key={doc.title}>
                <span className="tl-doc-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="tl-doc-title">
                    {doc.title}
                    <span className="tl-doc-arrow">→</span>
                  </div>
                  <div className="tl-doc-desc">{doc.description}</div>
                </div>
                <span className="tl-doc-meta">{doc.updated}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="tl-section">
        <div className="tl-shell">
          <div className="tl-section-head">
            <h2>Common questions</h2>
            <span className="tl-mono">Trust FAQ</span>
          </div>
          <div>
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div className="tl-faq-item" key={faq.question}>
                  <button
                    className="tl-faq-btn"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    {faq.question}
                    <span className="tl-faq-plus">{isOpen ? "–" : "+"}</span>
                  </button>
                  {isOpen && <p className="tl-faq-answer">{faq.answer}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="tl-contact">
        <div className="tl-shell">
          <h2>{contact.heading}</h2>
          <p>{contact.description}</p>
          <div className="tl-contact-actions">
            <a className="tl-btn tl-btn-primary" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
            <a className="tl-btn tl-btn-secondary" href={`tel:${contact.phone.replace(/\s+/g, "")}`}>
              {contact.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
