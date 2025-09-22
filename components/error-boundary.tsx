'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * Error boundary component to catch and handle React errors gracefully.
 * @param children - Child components to wrap
 * @param fallback - Custom fallback component
 * @param onError - Error callback function
 * @returns JSX element with error boundary protection
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  const { t } = useLanguage()

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {t('errorTitle') || 'Something went wrong'}
        </CardTitle>
        <CardDescription>
          {t('errorDescription') || 'An unexpected error occurred. Please try refreshing the page.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              {t('errorDetails') || 'Error details'}
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
        <div className="flex gap-2">
          <Button onClick={resetError} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('tryAgain') || 'Try Again'}
          </Button>
          <Button onClick={() => window.location.reload()} className="flex-1">
            {t('refreshPage') || 'Refresh Page'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Hook for handling async errors in components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error caught:', error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      // Log error to external service in production
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send error to logging service
        console.error('Production error:', error)
      }
    }
  }, [error])

  return { error, handleError, resetError }
}

/**
 * Higher-order component for adding error handling to any component
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Loading fallback component for suspense boundaries
 */
export function LoadingFallback({ message }: { message?: string }) {
  const { t } = useLanguage()

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardContent className="flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {message || t('loading') || 'Loading...'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty state component for when data is not available
 */
export function EmptyState({
  title,
  description,
  action
}: {
  title?: string
  description?: string
  action?: React.ReactNode
}) {
  const { t } = useLanguage()

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardContent className="text-center p-6">
        <div className="space-y-4">
          <div className="text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
            <h3 className="font-medium">
              {title || t('noData') || 'No data available'}
            </h3>
            <p className="text-sm mt-1">
              {description || t('noDataDescription') || 'There is no data to display at the moment.'}
            </p>
          </div>
          {action && <div className="pt-2">{action}</div>}
        </div>
      </CardContent>
    </Card>
  )
}