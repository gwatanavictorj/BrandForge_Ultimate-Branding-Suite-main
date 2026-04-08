import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './UI';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isQuotaError = false;

      try {
        const errorData = JSON.parse(this.state.error?.message || '{}');
        if (errorData.error === 'Quota exceeded.') {
          isQuotaError = true;
          errorMessage = "Firestore usage quota exceeded. This usually resets every 24 hours. Please try again tomorrow.";
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {isQuotaError ? "Quota Limit Reached" : "Something went wrong"}
              </h2>
              <p className="text-slate-500 leading-relaxed">
                {errorMessage}
              </p>
              {isQuotaError && (
                <div className="text-xs text-slate-400 mt-4 space-y-2 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-500 uppercase tracking-wider">What happened?</p>
                  <p>The application has reached its daily free tier limits for Firestore. These quotas reset every 24 hours.</p>
                  <p>Detailed quota information can be found under the <strong>Spark plan</strong> column in the <strong>Enterprise edition</strong> section of the <a href="https://firebase.google.com/pricing#cloud-firestore" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Firebase Pricing page</a>.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
              <Button onClick={this.handleReset} size="md" className="w-full">
                <RefreshCcw className="w-4 h-4 mr-2" /> Retry Application
              </Button>
              <Button variant="secondary" onClick={this.handleGoHome} size="md" className="w-full">
                <Home className="w-4 h-4 mr-2" /> Back to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
