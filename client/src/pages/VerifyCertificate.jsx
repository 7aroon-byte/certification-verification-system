import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { verifyCertificateByHash, verifyCertificatePublic } from '../services/api'
import SlideNotification from '../components/SlideNotification'
import '../styles/Homepage.css'
import '../styles/VerifyCertificate.css'

function useQuery() {
  const { search } = useLocation()
  return new URLSearchParams(search)
}

export default function VerifyCertificate() {
  const query = useQuery()
  const codeFromUrl = query.get('code') || ''
  const [code, setCode] = useState(codeFromUrl)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [state, setState] = useState({ loading: false, error: '', verified: false, data: null })
  const [notification, setNotification] = useState({ visible: false, type: 'error', text: '' })
  const uploadInputRef = useRef(null)

  useEffect(() => {
    setCode(codeFromUrl)
  }, [codeFromUrl])

  useEffect(() => {
    if (codeFromUrl) {
      handleVerifyByInput()
    }
  }, [codeFromUrl])

  async function sha256HexFromFile(file) {
    const arrayBuffer = await file.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', arrayBuffer)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  async function handleVerifyByInput() {
    const verificationInput = String(code || '').trim()
    if (!verificationInput) {
      setState({ loading: false, error: '', verified: false, data: null })
      setNotification({ visible: true, type: 'error', text: 'Please enter Full Name, Student ID, or Verification Code' })
      return
    }

    setState(s => ({ ...s, loading: true, error: '' }))
    try {
      const res = await verifyCertificatePublic(verificationInput)
      setState({ loading: false, error: '', verified: !!res.data?.verified, data: res.data?.data })
    } catch (err) {
      const errorText = err?.response?.data?.message || err?.message || 'Verification failed'
      setState({ loading: false, error: '', verified: false, data: null })
      setNotification({ visible: true, type: 'error', text: errorText })
    }
  }

  async function handleVerifyByPdf(file) {
    if (!file) return

    setState(s => ({ ...s, loading: true, error: '' }))
    try {
      const pdfHash = await sha256HexFromFile(file)
      const optionalCode = String(code || '').trim()
      const res = await verifyCertificateByHash({
        pdfHash,
        ...(optionalCode ? { code: optionalCode } : {})
      })

      const payload = res.data?.data || null
      const normalizedData = payload
        ? {
            ...payload,
            pdfHash: payload.storedPdfHash || payload.pdfHash || null
          }
        : null

      setState({
        loading: false,
        error: '',
        verified: !!res.data?.verified,
        data: normalizedData
      })
    } catch (err) {
      const errorText = err?.response?.data?.message || err?.message || 'PDF verification failed'
      setState({ loading: false, error: '', verified: false, data: null })
      setNotification({ visible: true, type: 'error', text: errorText })
    }
  }

  const d = state.data

  function formatDisplayDate(value) {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return String(value)
    return parsed.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  function formatYear(value) {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return String(parsed.getFullYear())
    const matched = String(value).match(/\b(19|20)\d{2}\b/)
    return matched ? matched[0] : 'N/A'
  }

  function getDisplayStatus() {
    const certStatus = String(d?.status || '').trim().toLowerCase()
    if (certStatus === 'revoked') {
      return { text: 'Revoked', className: 'verify-pill verify-pill-danger' }
    }
    if (state.verified) {
      return { text: 'Valid', className: 'verify-pill verify-pill-success' }
    }
    return { text: 'Not Valid', className: 'verify-pill verify-pill-danger' }
  }

  function handleUploadIconClick() {
    if (uploadInputRef.current) {
      uploadInputRef.current.value = ''
    }
    uploadInputRef.current?.click()
  }

  function handleClearUploadedPdf() {
    setUploadedFileName('')
    setCode('')
    if (uploadInputRef.current) {
      uploadInputRef.current.value = ''
    }
  }

  const displayStatus = getDisplayStatus()

  return (
    <div className="ihecvs-homepage verify-page">
      <SlideNotification
        notification={notification}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

      <header className="site-header" aria-label="Top navigation">
        <div className="top-strip">
          <div className="top-strip-inner">
            <div className="top-contact">
              <img className="top-logo" src="/logo.png" alt="IHECVS logo" />
              <strong>IHECVS</strong>
            </div>
            <div className="top-nav-links" aria-label="Primary links">
              <Link to="/">HOME</Link>
              <Link className="active" to="/verify">VERIFICATION</Link>
              <Link to="/contact">ENQUIRY/SUPPORT</Link>
              <Link to="/student/login">SIGN IN</Link>
            </div>
          </div>
        </div>

      </header>

      <main className="verify-page-shell">
        <div className="verify-container">
          <div className="verify-public-heading">
            <h2>PUBLIC VERIFICATION</h2>
            <p>Search to verify existing certificate</p>
          </div>

          <section className="verify-main-card">
            <div className="verify-main-section">
              <div className="verify-search-shell" role="search">
                <input
                  id="verification-code"
                  type="text"
                  value={uploadedFileName || code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleVerifyByInput()
                    }
                  }}
                  placeholder="Enter graduate’s Full Name, Student ID, Verification Code, or upload PDF"
                  className="verify-search-input"
                  disabled={Boolean(uploadedFileName)}
                />

                <button
                  type="button"
                  className="verify-upload-icon-btn"
                  onClick={uploadedFileName ? handleClearUploadedPdf : handleUploadIconClick}
                  aria-label={uploadedFileName ? 'Remove uploaded PDF' : 'Upload PDF'}
                  title={uploadedFileName ? 'Remove uploaded PDF' : 'Upload PDF'}
                >
                  {uploadedFileName ? (
                    <span aria-hidden="true" style={{ fontSize: '22px', lineHeight: 1 }}>×</span>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 9h2v6h10v-6h2v8H5v-8z" />
                    </svg>
                  )}
                </button>

                <button
                  className="verify-search-icon-btn"
                  onClick={handleVerifyByInput}
                  aria-label="Verify search"
                  disabled={state.loading || !String(code || '').trim()}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0A4.5 4.5 0 1 1 10 5a4.5 4.5 0 0 1-.5 9z" />
                  </svg>
                </button>
              </div>
              <input
                ref={uploadInputRef}
                type="file"
                accept="application/pdf"
                className="verify-hidden-upload"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  setUploadedFileName(file?.name || '')
                  setCode(file?.name || '')
                  if (file) {
                    await handleVerifyByPdf(file)
                  }
                }}
              />
            </div>
          </section>

          {state.loading && <div className="verify-note">Checking blockchain and records...</div>}

          {d && (
            <section className="verify-card">
              <div className={state.verified ? 'verify-record-banner verify-record-banner-success' : 'verify-record-banner verify-record-banner-neutral'}>
                <span className="verify-record-banner-dot" aria-hidden="true" />
                <span>{state.verified ? 'CERTIFICATE VERIFIED' : 'CERTIFICATE RECORD FOUND'}</span>
              </div>

              <h3 className="verify-section-title">Student Information</h3>
              <div className="verify-result-grid">
                <p><strong>Full Name:</strong> {d.studentName || 'N/A'}</p>
                <p><strong>Admission Number:</strong> {d.enrollmentNumber || 'N/A'}</p>
                <p><strong>Year Enrolled:</strong> {formatYear(d.startDate)}</p>
                <p><strong>Year Graduated:</strong> {formatYear(d.finishedDate)}</p>
              </div>

              <h4 className="verify-subsection-title">Certificate Information</h4>
              <div className="verify-result-grid">
                <p><strong>Qualification:</strong> {d.qualification || d.examType || 'Secondary School Leaving Certificate'}</p>
                <p><strong>Date Issued:</strong> {formatDisplayDate(d.dateIssued)}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={displayStatus.className}>
                    {displayStatus.text}
                  </span>
                </p>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  )
}
