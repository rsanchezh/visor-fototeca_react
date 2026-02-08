import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';


class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, fontFamily: 'sans-serif', background: '#0f172a', color: '#f1f5f9', minHeight: '100vh' }}>
          <h1>Error en la aplicación</h1>
          <pre style={{ background: '#1e293b', padding: 16, overflow: 'auto' }}>{this.state.error?.message}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<p style="padding:20px">No se encontró #root</p>';
} else {
  ReactDOM.createRoot(root).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
