import React from 'react'
import PublicHeader from '../components/PublicHeader'
import '../styles/Homepage.css'

export default function Homepage() {
  return (
    <div className="ihecvs-homepage">
      <PublicHeader active="home" />

      <div className="brand-strip">
          <div className="brand-line">
            <span className="brand-welcome">WELCOME TO IHECVS</span>
            <span className="brand-tagline">learning prior to success</span>
          </div>
      </div>

      <section className="showcase" aria-label="IHECVS introduction">
        <section className="showcase-left" aria-label="Graduation visual">
          <img className="showcase-image" src="/graduate.png" alt="Graduation cap and certificate" />
        </section>

        <section className="showcase-right" aria-label="IHECVS hero text">
          <h1 className="showcase-abbr">IHECVS</h1>
          <h2 className="showcase-name">Imamu Hafsin</h2>
          <h2 className="showcase-sub">E-Certificate Verification System</h2>
        </section>
      </section>

      <main className="page">
        <section className="content">
          <h2>e-Certificate and Graduate Registry</h2>
          <div className="underline" aria-hidden="true"></div>

          <p>
            The Imamu Hafsin e-Certificate Verification System (IHECVS) is a secure digital platform developed to manage,
            issue, and verify academic certificates electronically. The system enhances the integrity, accessibility, and
            authenticity of certificates issued by Imamu Hafsin.
          </p>

          <p>
            IHECVS provides digitally generated certificates embedded with secure verification features including QR codes,
            unique verification codes, and blockchain transaction references. These security mechanisms ensure that every
            certificate issued through the system is authentic and tamper-proof.
          </p>

          <p>
            Unlike traditional paper-based certificates, which require manual verification through the institution, digital
            certificates issued through IHECVS can be verified instantly online from anywhere in the world.
          </p>

          <div className="important-notes">
            <h2>Important Notes</h2>
            <div className="underline" aria-hidden="true"></div>
            <ul>
              <li>Certificates are only issued to students who have fulfilled all academic and administrative requirements.</li>
              <li>Students with outstanding obligations may experience delays in certificate release.</li>
              <li>Digital certificates are considered official institutional documents.</li>
            </ul>
          </div>

          <section className="feature-band" aria-label="IHECVS features">
            <div className="feature-card">
              <div className="feature-icon feature-icon-blue" aria-hidden="true">🎓</div>
              <h3>Secure Records</h3>
              <p>Academic data is protected with login controls, session expiry, and role-based access.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-navy" aria-hidden="true">⚙️</div>
              <h3>Fast Verification</h3>
              <p>Certificates can be verified instantly with a code, PDF hash, or blockchain-backed record.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-red" aria-hidden="true">✔</div>
              <h3>Trusted Issuance</h3>
              <p>Every issued certificate carries integrity checks that help prevent tampering and fraud.</p>
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}
