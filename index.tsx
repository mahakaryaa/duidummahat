
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error) {
    console.error('Root render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(124,155,147,0.2)', borderRadius: 16, padding: 20, maxWidth: 640 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7C9B93' }}>Render Error</p>
            <p style={{ margin: '10px 0 0', fontWeight: 700, color: '#4A5568' }}>{this.state.message}</p>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#718096' }}>Buka DevTools Console untuk detail error.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
