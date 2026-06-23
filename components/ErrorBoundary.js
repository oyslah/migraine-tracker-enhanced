import * as React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console for debugging purposes.
    // In a production app, you might send this to an error reporting service.
    console.error("Uncaught error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render the custom fallback UI if an error has occurred.
      return this.props.fallback;
    }

    // A component must not return undefined from render.
    // If no children are provided, return null instead.
    return this.props.children ?? null;
  }
}

export default ErrorBoundary;
