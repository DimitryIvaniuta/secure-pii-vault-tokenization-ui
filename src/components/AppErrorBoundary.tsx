import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/**
 * Prevents a render crash in one screen from leaving operators with a blank page.
 * The fallback remains text-only and avoids printing sensitive request payloads.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI error', {
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error-screen" role="alert">
          <div className="section-card fatal-error-screen__card">
            <p className="eyebrow">Application error</p>
            <h1>Something went wrong in the console.</h1>
            <p className="muted">Refresh the page and sign in again. If the problem persists, review the browser console and deployment logs.</p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
