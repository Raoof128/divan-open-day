import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public override state: ErrorBoundaryState = { failed: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  public override componentDidCatch(): void {
    // Intentionally do not log runtime details: browser paths and content must stay local.
  }

  public override render(): ReactNode {
    if (this.state.failed) {
      return (
        <main id="main-content">
          <section className="scene" role="alert">
            <h1 tabIndex={-1}>The experience could not continue.</h1>
            <p>
              Try reloading the page, or ask us at the Persian Society stall.
            </p>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
