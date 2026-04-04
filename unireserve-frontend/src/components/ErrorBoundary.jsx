import React from 'react';
import { HiExclamationCircle, HiRefresh } from 'react-icons/hi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unireserve Component Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-md w-full glass p-8 rounded-3xl border-rose-500/20 text-center">
            <div className="h-20 w-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiExclamationCircle className="h-10 w-10 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Something went wrong</h2>
            <p className="text-text-muted mb-8 text-sm">
              The application encountered an unexpected rendering error. This is usually caused by temporary data mismatch.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all"
            >
              <HiRefresh className="h-5 w-5" />
              Refresh Application
            </button>
            {import.meta.env.DEV && (
              <pre className="mt-8 p-4 bg-slate-900 rounded-xl text-[10px] text-rose-400 text-left overflow-auto max-h-40">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
