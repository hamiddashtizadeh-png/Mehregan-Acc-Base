export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  init = init || {};
  const headers = new Headers(init.headers || {});

  const token = localStorage.getItem('mehregan_session_token');
  if (token) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('X-Session-Token')) {
      headers.set('X-Session-Token', token);
    }
  }

  const csrfToken = localStorage.getItem('mehregan_csrf_token');
  if (csrfToken && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  init.headers = headers;

  const response = await window.fetch(input, init);

  if (
    response.status === 401 &&
    url.startsWith('/api/') &&
    !url.includes('/api/auth/login') &&
    !url.includes('/api/foundation/overview')
  ) {
    localStorage.removeItem('mehregan_session_token');
    window.dispatchEvent(new CustomEvent('mehregan:unauthenticated'));
  }

  return response;
}

export function suppressHarmlessDevErrors(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (event.reason.message?.includes('WebSocket') ||
        event.reason.stack?.includes('@vite/client') ||
        event.reason.message?.includes('closed without opened'))
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('WebSocket') ||
      event.message?.includes('closed without opened')
    ) {
      event.preventDefault();
    }
  });
}

export function setupFetchInterceptor(): void {
  suppressHarmlessDevErrors();

  try {
    const originalFetch = window.fetch;
    if (!originalFetch) return;

    const customFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (typeof url === 'string' && url.startsWith('/api/')) {
        init = init || {};
        const headers = new Headers(init.headers || {});

        const token = localStorage.getItem('mehregan_session_token');
        if (token) {
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          if (!headers.has('X-Session-Token')) {
            headers.set('X-Session-Token', token);
          }
        }

        const csrfToken = localStorage.getItem('mehregan_csrf_token');
        if (csrfToken && !headers.has('X-CSRF-Token')) {
          headers.set('X-CSRF-Token', csrfToken);
        }

        init.headers = headers;
      }

      const response = await originalFetch.call(window, input, init);

      if (
        response.status === 401 &&
        typeof url === 'string' &&
        url.startsWith('/api/') &&
        !url.includes('/api/auth/login') &&
        !url.includes('/api/foundation/overview')
      ) {
        localStorage.removeItem('mehregan_session_token');
        window.dispatchEvent(new CustomEvent('mehregan:unauthenticated'));
      }

      return response;
    };

    // Safely attempt to override window.fetch without throwing if getter-only
    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
      });
    } catch {
      try {
        Object.defineProperty(Window.prototype, 'fetch', {
          value: customFetch,
          writable: true,
          configurable: true,
        });
      } catch {
        console.warn('[Mehregan] window.fetch is read-only in this environment.');
      }
    }
  } catch (err) {
    console.warn('[Mehregan] Could not setup fetch interceptor:', err);
  }
}
