const sentryDsn = import.meta.env.VITE_SENTRY_DSN?.trim()
const monitoringEnabled = import.meta.env.PROD && Boolean(sentryDsn)
let sentryClientPromise

function stripQuery(value) {
  if (typeof value !== 'string') return value
  try {
    const url = new URL(value, window.location.origin)
    return `${url.origin}${url.pathname}`
  } catch {
    return value.split('?')[0]
  }
}

function loadSentry() {
  if (!monitoringEnabled) return Promise.resolve(null)
  if (!sentryClientPromise) {
    sentryClientPromise = import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: sentryDsn,
        enabled: true,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION || undefined,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        maxBreadcrumbs: 30,
        beforeBreadcrumb(breadcrumb) {
          if (breadcrumb.data?.url) {
            return { ...breadcrumb, data: { ...breadcrumb.data, url: stripQuery(breadcrumb.data.url) } }
          }
          return breadcrumb
        },
        beforeSend(event) {
          const request = event.request
            ? {
                ...event.request,
                url: stripQuery(event.request.url),
                cookies: undefined,
                data: undefined,
                headers: undefined,
                query_string: undefined,
              }
            : undefined
          return { ...event, user: undefined, request }
        },
      })
      return Sentry
    })
  }
  return sentryClientPromise
}

export function initializeMonitoring() {
  void loadSentry()
}

export function captureOperationalError(error, operation, context = {}) {
  if (!monitoringEnabled || !error) return
  void loadSentry().then((Sentry) => {
    Sentry.withScope((scope) => {
      scope.setTag('operation', operation)
      Object.entries(context).forEach(([key, value]) => {
        if (['string', 'number', 'boolean'].includes(typeof value)) scope.setExtra(key, value)
      })
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)))
    })
  })
}

export function captureRenderError(error, componentStack) {
  if (!monitoringEnabled || !error) return
  void loadSentry().then((Sentry) => {
    Sentry.withScope((scope) => {
      scope.setTag('operation', 'react_render')
      if (componentStack) scope.setExtra('componentStack', componentStack)
      Sentry.captureException(error)
    })
  })
}
