import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    // Filter out extension-related errors
    if (error.message.includes('chrome-extension://') || 
        error.message.includes('Could not establish connection') ||
        error.message.includes('Receiving end does not exist')) {
      console.warn('Extension error caught and ignored:', error.message);
      return { hasError: false };
    }
    
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out extension-related errors
    if (error.message.includes('chrome-extension://') || 
        error.message.includes('Could not establish connection') ||
        error.message.includes('Receiving end does not exist')) {
      console.warn('Extension error caught and ignored:', error.message);
      return;
    }
    
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Terjadi Kesalahan
                </h3>
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Aplikasi mengalami kesalahan yang tidak terduga. Silakan refresh halaman untuk mencoba lagi.
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Refresh Halaman
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
