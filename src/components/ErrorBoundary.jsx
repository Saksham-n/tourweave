import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    console.error('React ErrorBoundary caught:', error, info);
  }

  handleReset() {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', minHeight: '100vh', background: '#0d2f27',
          color: 'white', fontFamily: 'Inter, sans-serif', gap: '1rem', padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Something went wrong</h2>
          <p style={{ color: '#9ca3af', maxWidth: '480px', fontSize: '0.95rem', margin: 0 }}>
            {this.state.errorMessage}
          </p>
          <button
            onClick={() => this.handleReset()}
            style={{
              marginTop: '1rem', background: '#1b803a', color: 'white', border: 'none',
              padding: '0.8rem 2rem', borderRadius: '12px', fontSize: '1rem',
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
