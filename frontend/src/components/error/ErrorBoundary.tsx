import React, { lazy, Suspense, type ReactNode } from "react";

const ErroBoundaryInnerTag = lazy(() => import("./ErrorBoundaryInner"));

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

//Pagina usata per catturare gli errori di renderizzazione
class ErrorBoundaryTag extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.debug(["Error caught by Error Boundary: ", error, info]);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Suspense fallback="">
          <ErroBoundaryInnerTag />
        </Suspense>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryTag;
