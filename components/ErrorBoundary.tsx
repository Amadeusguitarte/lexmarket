'use client';
import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: '24px',
            margin: '16px auto',
            maxWidth: '520px',
            background: '#fff9f9',
            border: '1px solid #fecaca',
            borderRadius: '16px',
            textAlign: 'center',
            color: '#7f1d1d',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 600 }}>
            {this.props.fallbackTitle || 'Ocurrió un problema temporal al cargar esta sección'}
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#991b1b', lineHeight: 1.5 }}>
            No te preocupes, tus datos están a salvo. Puedes intentar recargar esta vista para continuar.
          </p>
          <button
            type="button"
            className="button small"
            onClick={this.handleReset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <RefreshCw size={14} />
            <span>Reintentar</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
