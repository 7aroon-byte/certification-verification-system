import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

export default function StudentLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/student-logs', { params: { limit: 300 } });
      setLogs(res?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load student logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="content-wrapper" style={{ marginTop: '60px', padding: '30px', backgroundColor: '#fff', minHeight: 'calc(100vh - 60px)' }}>
        <h2 className="text-2xl fw-bold mb-4">Student Logs</h2>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="bg-white rounded-4 shadow-lg overflow-hidden" style={{ borderRadius: '16px' }}>
          <div className="fw-semibold d-flex justify-content-between align-items-center" style={{ background: '#d9dee5', borderBottom: '2px solid #c3cad4', padding: '0.75rem 1rem' }}>
            <span>Student Login/Logout</span>
            <button className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center" onClick={loadLogs} aria-label="Refresh" title="Refresh" style={{ width: '34px', height: '34px', color: '#6c757d', borderColor: '#adb5bd' }}>
              <i className="bi bi-arrow-repeat"></i>
            </button>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="text-center py-4"><div className="spinner-border" role="status" /></div>
            ) : logs.length === 0 ? (
              <div className="p-4 text-muted">No student logs found</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table table-striped mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Email</th>
                      <th>Login</th>
                      <th>Logout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((row, index) => (
                      <tr key={row.id}>
                        <td>{index + 1}</td>
                        <td>{row.email || '-'}</td>
                        <td>{row.login ? new Date(row.login).toLocaleString() : '-'}</td>
                        <td>{row.logout ? new Date(row.logout).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
