import React from 'react'

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <span>IHECVS © {new Date().getFullYear()}. All rights reserved.</span>
      </div>
    </footer>
  )
}
