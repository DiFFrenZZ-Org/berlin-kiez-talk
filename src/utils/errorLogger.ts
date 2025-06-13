/* ------------------------------------------------------------------ */
/*  Error-logging utility                                             */
/* ------------------------------------------------------------------ */
type UnknownRecord = Record<string, unknown>;

export interface ErrorLogData {
  error: unknown;            // use unknown; narrow later
  context?: string;
  userId?: string;
  additionalData?: UnknownRecord;
}

interface LogEntry extends Required<Omit<ErrorLogData, "error">> {
  error: string;             // serialised message
  stack?: string;
  userAgent: string;
  url: string;
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  Narrowing helper                                                  */
/* ------------------------------------------------------------------ */
function isError(e: unknown): e is Error {
  return e instanceof Error;
}

/* ------------------------------------------------------------------ */
/*  Singleton logger                                                  */
/* ------------------------------------------------------------------ */
class ErrorLogger {
  private static instance: ErrorLogger;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) ErrorLogger.instance = new ErrorLogger();
    return ErrorLogger.instance;
  }

  /* ---------------- public API ------------------------------------ */
  logError({ error, context = "Unknown", userId, additionalData }: ErrorLogData) {
    const timestamp = new Date().toISOString();
    const msg   = isError(error) ? error.message : String(error);
    const stack = isError(error) ? error.stack   : undefined;

    const entry: LogEntry = {
      timestamp,
      context,
      error: msg,
      stack,
      userId: userId ?? "anonymous",
      additionalData: additionalData ?? {},
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    /* Development console ------------------------------------------ */
    console.error(`[${timestamp}] ${context}:`, entry);

    /* Production sink ---------------------------------------------- */
    if (import.meta.env.PROD) void this.sendToLoggingService(entry);
  }

  logAPIError(endpoint: string, error: unknown, requestData?: UnknownRecord) {
    this.logError({
      error,
      context: `API_CALL: ${endpoint}`,
      additionalData: { endpoint, requestData, responseError: error },
    });
  }

  logSupabaseError(operation: string, error: unknown, table?: string) {
    this.logError({
      error,
      context: `SUPABASE: ${operation}`,
      additionalData: { operation, table, supabaseError: error },
    });
  }

  /* ---------------- private helpers ------------------------------ */
  private async sendToLoggingService(entry: LogEntry) {
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch (err) {
      console.error("Failed to send error to logging service:", err);
    }
  }
}

export const errorLogger = ErrorLogger.getInstance();

/* ------------------------------------------------------------------ */
/*  Global handlers                                                   */
/* ------------------------------------------------------------------ */
window.addEventListener("error", (evt) => {
  errorLogger.logError({
    error: evt.error ?? evt.message,
    context: "GLOBAL_ERROR",
    additionalData: {
      filename: evt.filename,
      lineno: evt.lineno,
      colno: evt.colno,
    },
  });
});

window.addEventListener("unhandledrejection", (evt) => {
  errorLogger.logError({
    error: evt.reason,
    context: "UNHANDLED_PROMISE_REJECTION",
  });
});
