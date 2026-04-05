import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/authPages.css';

const AuthLayout = ({
  eyebrow,
  title,
  description,
  quickLinks = [],
  highlights = [],
  cardEyebrow,
  cardTitle,
  cardDescription,
  children,
  footnote,
}) => {
  return (
    <div className="auth-page">
      <section className="auth-shell">
        <div className="auth-shell__story">
          <Link to="/login" className="auth-brand">
            <span className="auth-brand__mark">UR</span>
            <span className="auth-brand__copy">
              <strong>UniReserve</strong>
              <small>University facility booking</small>
            </span>
          </Link>

          <div className="auth-shell__eyebrow">{eyebrow}</div>
          <h1 className="auth-shell__title">{title}</h1>
          <p className="auth-shell__description">{description}</p>

          {quickLinks.length > 0 && (
            <div className="auth-shell__quick-links">
              {quickLinks.map((link, index) => (
                <Link
                  key={`${link.to}-${link.label}`}
                  to={link.to}
                  className={`auth-shell__quick-link${
                    link.variant === 'primary' || index === 0 ? ' auth-shell__quick-link--primary' : ''
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {highlights.length > 0 && (
            <div className="auth-shell__grid">
              {highlights.map((item) => (
                <article key={`${item.label}-${item.value}`} className="auth-shell__metric">
                  <p className="auth-shell__metric-label">{item.label}</p>
                  <h2 className="auth-shell__metric-value">{item.value}</h2>
                  <p className="auth-shell__metric-copy">{item.copy}</p>
                </article>
              ))}
            </div>
          )}

          {footnote && <p className="auth-shell__footnote">{footnote}</p>}
        </div>

        <div className="auth-shell__panel">
          <div className="auth-card">
            {cardEyebrow && <p className="auth-card__eyebrow">{cardEyebrow}</p>}
            <h2 className="auth-card__title">{cardTitle}</h2>
            {cardDescription && <p className="auth-card__description">{cardDescription}</p>}
            {children}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthLayout;
