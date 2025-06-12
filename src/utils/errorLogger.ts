
interface ErrorLogData {
  error: Error | string;
  context?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

class ErrorLogger {
  private static instance: ErrorLogger;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  logError({ error, context = 'Unknown', userId, additionalData }: ErrorLogData) {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    const logEntry = {
      timestamp,
      context,
      error: errorMessage,
      stack,
      userId,
      additionalData,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console for development
    console.error(`[${timestamp}] ${context}:`, logEntry);

    // In production, you could send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    }
  }

  logAPIError(endpoint: string, error: any, requestData?: any) {
    this.logError({
      error,
      context: `API_CALL: ${endpoint}`,
      additionalData: {
        endpoint,
        requestData,
        responseError: error?.message || error
      }
    });
  }

  logSupabaseError(operation: string, error: any, table?: string) {
    this.logError({
      error,
      context: `SUPABASE: ${operation}`,
      additionalData: {
        operation,
        table,
        supabaseError: error
      }
    });
  }

  private async sendToLoggingService(logEntry: any) {
    try {
      // This could be Sentry, LogRocket, or your own logging endpoint
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (err) {
      console.error('Failed to send error to logging service:', err);
    }
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Global error handler
window.addEventListener('error', (event) => {
  errorLogger.logError({
    error: event.error || event.message,
    context: 'GLOBAL_ERROR',
    additionalData: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorLogger.logError({
    error: event.reason,
    context: 'UNHANDLED_PROMISE_REJECTION'
  });
});
