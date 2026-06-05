import React from 'react'
import { Link } from 'react-router-dom'

export default function PublicHeader({ active = 'home' }) {
  return (
    <header className="site-header" aria-label="Top navigation">
      <div className="top-strip">
        <div className="top-strip-inner">
          <div className="top-contact">
            <img className="top-logo" src="/logo.png" alt="IHECVS logo" />
            <div className="top-brand-copy">
              <strong className="top-brand-abbr">IHECVS</strong>
              <span className="top-brand-full">Imamu Hafsin e-Certificate Verification System</span>
            </div>
          </div>
          <div className="top-nav-links" aria-label="Primary links">
            <Link className={active === 'home' ? 'active' : ''} to="/">HOME</Link>
            <Link className={active === 'verify' ? 'active' : ''} to="/verify">VERIFICATION</Link>
            <Link id="top-enquiry-link" className={active === 'contact' ? 'active' : ''} to="/contact">ENQUIRY</Link>
            <Link className={active === 'signin' ? 'active' : ''} to="/student/login">SIGN IN</Link>
          </div>
        </div>
      </div>
    </header>
  )
}