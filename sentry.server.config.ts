// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Setting this option to true will send default PII data to Sentry.
  sendDefaultPii: false,

  // Adjust this value in production, or use tracesSampler for greater control
  // We recommend 100% in development, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable only in production
  enabled: process.env.NODE_ENV === 'production',

  // Spotlight is useful for local development
  // spotlight: process.env.NODE_ENV === 'development',
})
