'use client';

// Last-resort boundary for errors thrown in the root layout itself.
// It replaces the whole document, so it must render its own <html>/<body>.
// Styles are inlined to stay self-contained (the app stylesheet may not apply).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
          backgroundColor: '#FAFAF7',
          color: '#14120F',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '12px' }}>
          Something went wrong
        </h1>
        <p style={{ color: '#6B6560', fontSize: '0.9rem', maxWidth: '28rem', marginBottom: '28px', lineHeight: 1.7 }}>
          The application ran into a critical error. Please try reloading the page.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '12px 32px',
            fontSize: '0.76rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            backgroundColor: '#14120F',
            color: '#FAFAF7',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
