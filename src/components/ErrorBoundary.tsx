import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  errorContent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.errorContent) {
        return this.props.errorContent;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Something went wrong
              </h2>
              <p className="text-muted-foreground">
                An unexpected error occurred. Please try again or return to the home page.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-left overflow-auto max-h-40">
                <p className="text-sm font-mono text-red-400">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="gold">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for easier usage with hooks
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  name?: string;
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  name?: string
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary
        onError={(error) => {
          console.error(`Error in ${name || "Component"}:`, error);
        }}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Section-level error boundary with minimal UI
export function SectionErrorBoundary({ children, name = "Section" }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      errorContent={
        <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20 text-center">
          <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Failed to load {name}. Please refresh the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
