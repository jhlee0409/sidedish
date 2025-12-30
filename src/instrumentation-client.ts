// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://70ec520c66b69ee24a9a14df9272c6a5@o4509743437119488.ingest.us.sentry.io/4510608743202816',

  // Setting this option to true will send default PII data to Sentry.
  // For more info, see:
  // https://docs.sentry.io/platforms/javascript/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  // Adjust this value in production, or use tracesSampler for greater control
  // We recommend 100% in development, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Enable Session Replay for error tracking
  // This sets the sample rate at 10% for general sessions.
  // If you want to sample all sessions, set this to 1.0 (100%)
  replaysSessionSampleRate: 0.1,

  // If you're not already sampling the entire session, change the sample rate to 100%
  // when sampling sessions where errors occur.
  replaysOnErrorSampleRate: 1.0,

  // Distributed tracing configuration
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/tracing/
  tracePropagationTargets: ['localhost', /^https:\/\/sidedish\.me\/api/],

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional SDK configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable only in production
  enabled: process.env.NODE_ENV === 'production',

  // Ignore common errors that are not actionable
  ignoreErrors: [
    // Browser extensions and ad blockers
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors
    'Failed to fetch',
    'Load failed',
    'NetworkError',
    // User-initiated navigation
    'AbortError',
    // Third-party scripts
    'Non-Error promise rejection captured',
  ],
})
