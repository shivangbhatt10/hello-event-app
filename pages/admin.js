// pages/admin.js
export default function Admin() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'sans-serif',
      backgroundColor: '#f0fdf4',
      color: '#065f46'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>🛠️ Admin Dashboard</h1>
      <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
        This is the <strong>/admin</strong> page.
      </p>
      <p style={{ marginTop: '0.5rem' }}>
        ✅ If you see this, routing works!
      </p>
    </div>
  );
}