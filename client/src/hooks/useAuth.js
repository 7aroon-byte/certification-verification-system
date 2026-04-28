import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) return;
    if (role === 'admin' && window.location.pathname.startsWith('/admin')) return;
    if (role === 'student' && window.location.pathname.startsWith('/student')) return;
    if (role === 'admin') navigate('/admin/dashboard');
    if (role === 'student') navigate('/student/dashboard');
    
  }, [])
}
