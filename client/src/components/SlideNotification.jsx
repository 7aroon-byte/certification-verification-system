import React, { useEffect } from 'react';

export default function SlideNotification({ notification, onClose, top = '78px' }) {
  useEffect(() => {
    if (!notification?.visible) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [notification?.visible, notification?.text, onClose]);

  return (
    <div style={{ position: 'fixed', right: '16px', top, zIndex: 3000, pointerEvents: 'none' }}>
      <div
        style={{
          minWidth: '320px',
          maxWidth: '480px',
          background: notification?.type === 'success' ? '#ecfdf3' : '#fef2f2',
          border: notification?.type === 'success' ? '1px solid #86efac' : '1px solid #fca5a5',
          borderLeft: notification?.type === 'success' ? '5px solid #22c55e' : '5px solid #ef4444',
          color: notification?.type === 'success' ? '#166534' : '#991b1b',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.14)',
          borderRadius: '10px',
          padding: '12px 14px',
          transform: notification?.visible ? 'translateX(0)' : 'translateX(120%)',
          opacity: notification?.visible ? 1 : 0,
          transition: 'transform 0.35s ease, opacity 0.35s ease',
          fontWeight: 600,
          fontSize: '0.92rem'
        }}
      >
        {notification?.text}
      </div>
    </div>
  );
}
