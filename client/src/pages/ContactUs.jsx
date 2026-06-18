import React, { useState } from 'react';
import api from '../services/api';
import PublicHeader from '../components/PublicHeader';
import '../styles/LoginPage.css';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post('/contact/submit', formData);
      
      if (response.data.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '' });
        // Hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ihecvs-homepage" style={{ minHeight: '100vh', backgroundColor: '#eef3f9' }}>
      <PublicHeader active="contact" />

      {/* Main Content */}
      <div
        style={{
          width: '100%',
          maxWidth: '1360px',
          margin: '18px auto 0',
          padding: '0 18px 40px',
          boxSizing: 'border-box'
        }}
      >
        <div
          className="d-flex align-items-stretch"
          style={{
            gap: '1.5rem',
            flexWrap: 'nowrap'
          }}
        >
          {/* Our Location Section */}
          <div style={{ flex: '1 1 0' }}>
            <div
              className="card shadow-sm border-0 h-100 overflow-hidden"
              style={{ borderRadius: '18px', backgroundColor: '#fff' }}
            >
              <div
                className="card-header text-white py-2"
                style={{
                  backgroundColor: '#7f0c14',
                  borderTopLeftRadius: '18px',
                  borderTopRightRadius: '18px'
                }}
              >
                <h4 className="mb-0" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Our Location</h4>
              </div>
              <div className="card-body p-3 p-lg-4">
                <div className="mb-3">
                  <p className="mb-2 text-center">
                    <strong>No.60 Dr. Sani Yakasai Street</strong>
                  </p>
                  <p className="mb-2 text-center">Tal'udu G/Kaya, Gwale LGA</p>
                  <p className="mb-3 text-center">Kano State</p>
                </div>

                <div className="mb-3 text-center">
                  <div className="mb-2">
                    <i className="bi bi-envelope-fill text-primary me-2"></i>
                    <a href="mailto:info@imamhafsin.com.ng" className="text-decoration-none">
                      info@imamhafsin.com.ng
                    </a>
                  </div>
                  <div>
                    <i className="bi bi-telephone-fill text-primary me-2"></i>
                    <a href="tel:08142458654" className="text-decoration-none">
                      08142458654
                    </a>
                  </div>
                </div>

                {/* Google Map */}
                <div className="mt-2">
                  <div style={{ position: 'relative', paddingBottom: '56%', height: 0, overflow: 'hidden' }}>
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.8!2d8.5167!3d12.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x11ae81de6f87f5d1%3A0x1!2sDr%20Sani%20Yakasai%20St%2C%20Kofar%20Ruwa%2C%20Kano!5e0!3m2!1sen!2sng!4v1234567890"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 0,
                        borderRadius: '8px'
                      }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Our Location Map"
                    ></iframe>
                  </div>
                  <div className="text-center mt-1">
                    <small className="text-muted">
                      <a 
                        href="https://www.google.com/maps/search/Dr+Sani+Yakasai+Street,+Gwale+LGA,+Kano/@12.0,8.5167,15z" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                      >
                        View larger map
                      </a>
                      {' | '}
                      <a 
                        href="https://www.google.com/maps/dir/?api=1&destination=Dr+Sani+Yakasai+Street,+Gwale+LGA,+Kano,+Nigeria" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                      >
                        Directions
                      </a>
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Get in Touch Form Section */}
          <div style={{ flex: '1 1 0' }}>
            <div
              className="card shadow-sm border-0 h-100 overflow-hidden"
              style={{ borderRadius: '18px', backgroundColor: '#fff' }}
            >
              <div
                className="card-header text-white py-2"
                style={{
                  backgroundColor: '#7f0c14',
                  borderTopLeftRadius: '18px',
                  borderTopRightRadius: '18px'
                }}
              >
                <h4 className="mb-0" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Get in Touch</h4>
              </div>
              <div className="card-body p-3 p-lg-4">
                {success && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <strong>Success!</strong> Thank you for contacting us! We will get back to you soon.
                    <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
                  </div>
                )}
                
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>Error!</strong> {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label fw-semibold">
                      Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Full Name"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your Email"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="message" className="form-label fw-semibold">
                      Message
                    </label>
                    <textarea
                      className="form-control"
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Your Message"
                      required
                      disabled={loading}
                      style={{ resize: 'vertical' }}
                    ></textarea>
                  </div>

                  <div className="d-flex justify-content-end mt-3">
                    <button 
                      type="submit" 
                      className="btn btn-success px-5 py-2 fw-semibold"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Submitting...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
