// pages/index.js
export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'sans-serif',
      backgroundColor: '#f0f9ff',
      color: '#0369a1'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>🎉 Hello World!</h1>
      <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
        This is a <strong>Pages Router</strong> Next.js app.
      </p>
      <p style={{ marginTop: '0.5rem' }}>
        ✅ If you see this, it works locally.
      </p>
    </div>
  );
}