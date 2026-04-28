import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/contact/messages', { params });
      
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch messages');
      if (err.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/contact/messages/${id}/status`, { status });
      fetchMessages();
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await api.delete(`/contact/messages/${id}`);
      fetchMessages();
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      unread: 'bg-warning',
      read: 'bg-info',
      replied: 'bg-success'
    };
    return badges[status] || 'bg-secondary';
  };

  return (
    <>
      <Navbar />
      <div className="d-flex" style={{ minHeight: '100vh', paddingTop: '60px' }}>
        <Sidebar />
        <div className="content-wrapper flex-grow-1 p-3 p-md-4" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="container-fluid">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 gap-2">
              <h2 className="h4 h3-md fw-bold mb-2 mb-md-0">Contact Messages</h2>
              <div className="btn-group btn-group-sm w-100 w-md-auto" role="group">
                <button
                  className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`btn ${filter === 'unread' ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </button>
                <button
                  className={`btn ${filter === 'read' ? 'btn-info' : 'btn-outline-info'}`}
                  onClick={() => setFilter('read')}
                >
                  Read
                </button>
                <button
                  className={`btn ${filter === 'replied' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setFilter('replied')}
                >
                  Replied
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <div className="row g-3">
              {/* Messages List */}
              <div className="col-12 col-lg-5 mb-3 mb-lg-0">
                <div className="card shadow-sm">
                  <div className="card-body p-0">
                    {loading ? (
                      <div className="text-center p-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center p-4 text-muted">
                        No messages found
                      </div>
                    ) : (
                      <div className="list-group list-group-flush" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`list-group-item list-group-item-action ${
                              selectedMessage?.id === message.id ? 'active' : ''
                            }`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedMessage(message);
                              if (message.status === 'unread') {
                                updateStatus(message.id, 'read');
                              }
                            }}
                          >
                            <div className="d-flex w-100 justify-content-between">
                              <h6 className="mb-1 fw-bold">{message.name}</h6>
                              <span className={`badge ${getStatusBadge(message.status)}`}>
                                {message.status}
                              </span>
                            </div>
                            <p className="mb-1 small text-truncate">{message.email}</p>
                            <small className="text-muted">{formatDate(message.created_at)}</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Detail */}
              <div className="col-12 col-lg-7">
                {selectedMessage ? (
                  <div className="card shadow-sm">
                    <div className="card-header bg-white">
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                        <h5 className="mb-0">Message Details</h5>
                        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              className={`btn ${selectedMessage.status === 'unread' ? 'btn-warning' : 'btn-outline-warning'}`}
                              onClick={() => updateStatus(selectedMessage.id, 'unread')}
                            >
                              Unread
                            </button>
                            <button
                              className={`btn ${selectedMessage.status === 'read' ? 'btn-info' : 'btn-outline-info'}`}
                              onClick={() => updateStatus(selectedMessage.id, 'read')}
                            >
                              Read
                            </button>
                            <button
                              className={`btn ${selectedMessage.status === 'replied' ? 'btn-success' : 'btn-outline-success'}`}
                              onClick={() => updateStatus(selectedMessage.id, 'replied')}
                            >
                              Replied
                            </button>
                          </div>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => deleteMessage(selectedMessage.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label fw-bold">From:</label>
                        <p className="mb-0">{selectedMessage.name}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Email:</label>
                        <p className="mb-0">
                          <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
                        </p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Date:</label>
                        <p className="mb-0">{formatDate(selectedMessage.created_at)}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Status:</label>
                        <p className="mb-0">
                          <span className={`badge ${getStatusBadge(selectedMessage.status)}`}>
                            {selectedMessage.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="form-label fw-bold">Message:</label>
                        <div className="p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {selectedMessage.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card shadow-sm">
                    <div className="card-body text-center text-muted p-4 p-md-5">
                      <i className="bi bi-envelope" style={{ fontSize: '3rem' }}></i>
                      <p className="mt-3">Select a message to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
