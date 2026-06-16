import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-time errors anywhere in the component tree below it and
 * shows a friendly fallback instead of a blank white screen. Does not catch
 * errors in event handlers, async code, or server-side rendering — those
 * are handled by normal try/catch + toast.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled error in component tree:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-danger/10 mb-4">
              <AlertTriangle className="h-7 w-7 text-danger" />
            </div>
            <h1 className="text-lg font-semibold text-text-primary mb-2">Something went wrong</h1>
            <p className="text-sm text-text-muted mb-6">An unexpected error occurred while displaying this page. Your data is safe — reloading usually fixes this.</p>
            {this.state.error?.message && <p className="text-xs text-text-muted font-mono bg-card rounded-lg px-3 py-2 mb-6 break-all">{this.state.error.message}</p>}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={this.handleGoHome}>
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button onClick={this.handleReload}>
                <RotateCcw className="h-4 w-4" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
