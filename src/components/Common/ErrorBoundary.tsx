import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', margin: '1rem' }}>
                    <h2 style={{ color: 'var(--danger)' }}>Algo ha salido mal</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>La aplicación ha encontrado un error inesperado.</p>
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                        onClick={() => window.location.reload()}
                    >
                        Recargar Aplicación
                    </button>
                    {this.state.error && (
                        <pre style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'left', overflow: 'auto' }}>
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
