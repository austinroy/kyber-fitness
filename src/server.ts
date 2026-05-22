import './shim'
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import type { Register } from '@tanstack/react-router'
import type { RequestHandler } from '@tanstack/react-start/server'
import { createClerkHandler } from '@clerk/tanstack-start/server'

// Fetch validation keys
const pubKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;
const secKey = process.env.CLERK_SECRET_KEY;

const isClerkConfigured = !!(
  pubKey && 
  pubKey !== 'pk_test_placeholder' && 
  pubKey.trim() !== '' &&
  secKey && 
  secKey !== 'sk_test_placeholder' && 
  secKey.trim() !== ''
);

// We define a standard handler as fallback
const standardHandler = createStartHandler(defaultStreamHandler);
const clerkWrappedHandler = isClerkConfigured 
  ? createClerkHandler(createStartHandler)(defaultStreamHandler)
  : null;

export const fetch: RequestHandler<Register> = async (request, ...args) => {
  if (isClerkConfigured && clerkWrappedHandler) {
    return await clerkWrappedHandler(request, ...args);
  }

  // If Clerk is NOT configured, intercept document requests to serve a beautiful diagnostics page.
  // We allow static assets, js, css, etc., to load normally.
  const url = new URL(request.url);
  const isDocumentRequest = 
    !url.pathname.includes('.') && 
    !url.pathname.startsWith('/_server') && 
    !url.pathname.startsWith('/api');

  if (isDocumentRequest) {
    return new Response(
      `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Configuration Required — Kyber Fitness</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0">
  <style>
    :root {
      --background: #0a0a0a;
      --surface: #121212;
      --primary-container: #c3f400;
      --secondary-container: #00eefc;
      --text: #ffffff;
      --text-muted: #888888;
      --border: rgba(255, 255, 255, 0.05);
      --rounded-lg: 12px;
    }
    body {
      background-color: var(--background);
      color: var(--text);
      font-family: 'Lexend', ui-sans-serif, system-ui, sans-serif;
      margin: 0;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 48px);
      box-sizing: border-box;
    }
    .grid-glow {
      top: 33.333333%;
      left: 50%;
      width: 256px;
      height: 256px;
      background-color: rgba(195, 244, 0, 0.05);
      border-radius: 9999px;
      filter: blur(80px);
      pointer-events: none;
      position: absolute;
      transform: translate(-50%, -50%);
      z-index: 0;
    }
    .card {
      background-color: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--rounded-lg);
      padding: 40px;
      max-width: 580px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      position: relative;
      z-index: 10;
      box-sizing: border-box;
      backdrop-filter: blur(12px);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      background-color: rgba(195, 244, 0, 0.1);
      color: var(--primary-container);
      border: 1px solid rgba(195, 244, 0, 0.2);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 24px;
      gap: 6px;
    }
    h1 {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.03em;
      margin: 0 0 12px 0;
      text-transform: uppercase;
    }
    p {
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 28px 0;
    }
    .env-box {
      background-color: #050505;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 18px;
      text-align: left;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: var(--secondary-container);
      overflow-x: auto;
      margin-bottom: 28px;
      white-space: pre;
    }
    .steps {
      text-align: left;
      margin-bottom: 0;
      padding-left: 20px;
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.6;
    }
    .steps li {
      margin-bottom: 12px;
    }
    .steps strong {
      color: var(--text);
    }
  </style>
</head>
<body>
  <div class="grid-glow"></div>
  <div class="card">
    <div class="chip">
      <span class="material-symbols-outlined text-sm">wifi_off</span>
      <span>System Sync Offline</span>
    </div>
    <h1>Clerk Credentials Required</h1>
    <p>
      Kyber Fitness is running, but the Clerk Authentication credentials have not been configured in your environment. Add these keys to restore performance core sync.
    </p>
    
    <div class="env-box"># Define these variables in your Netlify Dashboard:
CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up</div>

    <ol class="steps">
      <li>Log in to your <strong>Netlify Dashboard</strong>.</li>
      <li>Go to your site, then navigate to <strong>Site configuration</strong> &gt; <strong>Environment variables</strong>.</li>
      <li>Add the environment variables listed in the cyan console block above.</li>
      <li>Navigate to the <strong>Deploys</strong> tab, click <strong>Trigger deploy</strong> &gt; <strong>Deploy site</strong> for changes to register.</li>
    </ol>
  </div>
</body>
</html>`,
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }

  return await standardHandler(request, ...args);
};

// Providing RequestHandler is required so that output types are resolved correctly
export type ServerEntry = { fetch: RequestHandler<Register> }

export function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(...args) {
      return await entry.fetch(...args)
    },
  }
}

export default createServerEntry({ fetch })
