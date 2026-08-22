import { Component, ErrorInfo, ReactNode } from 'react';
import './index.css';

interface Props {
  children: ReactNode;
  // Optional custom fallback UI defaults to the built-in error card
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Must be a class component React does not support function-based error boundaries.
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className='error-boundary'>
        <div className='error-boundary-card card'>
          <h1 className='error-boundary-title'>Something went wrong</h1>
          <p className='error-boundary-message text-muted'>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button className='btn btn-primary' onClick={this.reset} type='button'>
            Try again
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
