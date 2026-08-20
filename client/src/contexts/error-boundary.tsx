import React from "react";
import { PiWarning } from "react-icons/pi";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error.message);
    console.error("Component stack:", errorInfo.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-xl border p-8 text-center shadow-sm border-gray-200 dark:border-gray-800">
            <div className="flex justify-center mb-4 text-4xl">
              <PiWarning />
            </div>

            <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">Something went wrong</h1>

            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {import.meta.env.DEV
                ? this.state.error?.message || "An unexpected error occurred."
                : "An unexpected error occurred. Please try reloading the page."}
            </p>

            <button
              onClick={this.handleReload}
              className="cursor-pointer rounded px-5 py-2.5 text-sm font-medium transition focus:outline-none bg-gray-900 dark:bg-gray-100 hover:bg-gray-700 dark:hover:bg-gray-200 text-white dark:text-gray-900"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
