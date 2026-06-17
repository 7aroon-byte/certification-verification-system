import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="app-footer ihecvs-footer">
      <div className="ihecvs-footer-inner">
        <section className="ihecvs-footer-about">
          <h3>About IHECVS</h3>
          <p>
            A secure certificate verification system for issuing, protecting, and validating academic records.
          </p>
        </section>

        <section className="ihecvs-footer-links" aria-label="Quick links">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/verify">Verification</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/student/login">Student Login</Link>
        </section>

        <section className="ihecvs-footer-contact">
          <h3>Contact</h3>
          <p>Email: fsktm@uthm.edu.my</p>
          <p>Phone: +607-453 7000</p>
        </section>
      </div>

      <div className="ihecvs-footer-bottom">
        <span>IHECVS © {new Date().getFullYear()}. All rights reserved.</span>
      </div>
    </footer>
  )
}
