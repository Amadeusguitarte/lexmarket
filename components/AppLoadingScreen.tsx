'use client';

export default function AppLoadingScreen({ message = 'Abriendo tu espacio…' }: { message?: string }) {
  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fbf8f3',
        padding: 24,
        position: 'fixed',
        inset: 0,
        zIndex: 9999
      }}
      role="status"
      aria-live="polite"
    >
      <div 
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          maxWidth: 360,
          animation: 'appLoadingFadeIn 0.25s ease-out'
        }}
      >
        {/* Brand Logo */}
        <span className="brand" style={{ fontSize: 32, letterSpacing: '-1.5px', color: '#2c2526' }}>
          Match<span style={{ fontWeight: 430 }}>Jurídico</span>
          <span className="brand-dot" style={{ color: '#6b2d3e', fontWeight: 800 }}>.</span>
        </span>

        {/* Elegant circular spinner */}
        <div 
          style={{
            position: 'relative',
            width: 46,
            height: 46,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 6
          }}
        >
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2.5px solid #ebdcd5',
              borderTopColor: '#6b2d3e',
              animation: 'appLoadingSpin 0.85s linear infinite'
            }} 
          />
          <div 
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#6b2d3e',
              opacity: 0.85
            }} 
          />
        </div>

        <p 
          style={{
            color: '#736968',
            fontSize: 13,
            fontWeight: 500,
            margin: 0,
            letterSpacing: '0.01em'
          }}
        >
          {message}
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes appLoadingSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes appLoadingFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }} />
    </div>
  );
}
