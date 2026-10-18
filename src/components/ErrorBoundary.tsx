import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Top-level safety net: a render error anywhere below shows this fallback
// instead of unmounting the whole app to a blank white page.
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Render error caught by ErrorBoundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-secondary pb-[60px] md:pb-0">
          <div className="w-full max-w-sm mx-4">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="font-heading text-xl font-bold">Something went wrong</h1>
                <p className="text-sm text-muted-foreground">
                  This page hit an unexpected error. Reloading usually fixes it.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full h-11 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  Reload Page
                </button>
                <a
                  href="/"
                  className="block w-full h-11 leading-[2.75rem] rounded-md border border-border font-semibold hover:bg-muted transition-colors"
                >
                  Go to Homepage
                </a>
              </div>
              <p className="text-xs text-muted-foreground">Wrenchli. Mobility for All.</p>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
