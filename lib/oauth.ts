import { browserDB } from './browser';

export interface OAuthPopupOptions {
  intendedRole?: string;
  pendingCase?: any;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Opens a centered popup window for Google OAuth login.
 * Keeps the main page visible and active behind the popup, avoiding full-page navigation.
 */
export function openGoogleOAuthPopup(options?: OAuthPopupOptions): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

    const width = 500;
    const height = 640;

    const screenWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;

    const left = Math.max(0, Math.floor(screenWidth / 2 - width / 2 + dualScreenLeft));
    const top = Math.max(0, Math.floor(screenHeight / 2 - height / 2 + dualScreenTop));

    // Open popup immediately during click event to satisfy browser popup blockers
    const popup = window.open(
      'about:blank',
      'matchjuridico_oauth_popup',
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      const err = new Error('No se pudo abrir la ventana de Google. Por favor permite las ventanas emergentes en tu navegador.');
      options?.onError?.(err);
      reject(err);
      return;
    }

    // Set initial calm loading screen
    try {
      popup.document.write(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="utf-8">
            <title>Conectando con Google... - MatchJurídico</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #faf8f5;
                color: #2c2526;
                padding: 20px;
                box-sizing: border-box;
              }
              .card {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                padding: 32px 24px;
                text-align: center;
                background: #ffffff;
                border: 1px solid #ebdcd5;
                border-radius: 18px;
                box-shadow: 0 10px 30px rgba(107, 45, 62, 0.06);
                max-width: 320px;
                width: 100%;
              }
              .spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #ebdcd5;
                border-top-color: #6b2d3e;
                border-radius: 50%;
                animation: spin 0.75s linear infinite;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              h3 { font-size: 16px; margin: 0; font-weight: 600; color: #2c2526; }
              p { font-size: 13px; margin: 0; color: #736968; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="spinner"></div>
              <h3>Conectando con Google...</h3>
              <p>Espera un momento mientras cargamos la verificación de tu cuenta.</p>
            </div>
          </body>
        </html>
      `);
    } catch {}

    const db = browserDB();
    if (!db) {
      try { popup.close(); } catch {}
      const err = new Error('Servicio de autenticación no disponible en este momento.');
      options?.onError?.(err);
      reject(err);
      return;
    }

    if (options?.intendedRole) {
      try { localStorage.setItem('lexmarket.intendedRole', options.intendedRole); } catch {}
    }
    if (options?.pendingCase) {
      try { localStorage.setItem('lexmarket.pendingCase', JSON.stringify(options.pendingCase)); } catch {}
    }

    const redirectOrigin = window.location.hostname !== 'localhost'
      ? 'https://matchjuridico.com'
      : window.location.origin;

    let resolved = false;

    const cleanup = () => {
      window.removeEventListener('message', messageListener);
      clearInterval(checkTimer);
    };

    const finishSuccess = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      try { popup.close(); } catch {}
      options?.onSuccess?.();
      resolve(true);
    };

    const finishError = (err: Error) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      try { popup.close(); } catch {}
      options?.onError?.(err);
      reject(err);
    };

    const messageListener = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === 'lexmarket_oauth_success') {
        finishSuccess();
      }
    };
    window.addEventListener('message', messageListener);

    // Poll for popup closure and session detection
    const checkTimer = setInterval(async () => {
      try {
        const { data } = await db.auth.getSession();
        if (data?.session) {
          finishSuccess();
          return;
        }
      } catch {}

      if (popup.closed) {
        setTimeout(async () => {
          if (resolved) return;
          try {
            const { data } = await db.auth.getSession();
            if (data?.session) {
              finishSuccess();
            } else {
              finishError(new Error('Inicio de sesión cancelado.'));
            }
          } catch {
            finishError(new Error('Inicio de sesión cancelado.'));
          }
        }, 500);
      }
    }, 450);

    // Call Supabase with skipBrowserRedirect: true
    db.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectOrigin,
        skipBrowserRedirect: true,
      }
    }).then(({ data, error }) => {
      if (error || !data?.url) {
        finishError(error || new Error('No se pudo conectar con Google.'));
        return;
      }
      try {
        popup.location.href = data.url;
      } catch {
        finishError(new Error('No se pudo redirigir la ventana de Google.'));
      }
    }).catch(err => {
      finishError(err instanceof Error ? err : new Error(String(err)));
    });
  });
}

export interface LinkedInOAuthPopupOptions {
  onSuccess?: (profile: any) => void;
  onError?: (err: Error) => void;
}

/**
 * Opens a centered popup window for LinkedIn profile connection / OAuth.
 * Avoids full-page navigation and returns the imported profile via postMessage.
 */
export function openLinkedInOAuthPopup(options?: LinkedInOAuthPopupOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

    const width = 560;
    const height = 680;

    const screenWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;

    const left = Math.max(0, Math.floor(screenWidth / 2 - width / 2 + dualScreenLeft));
    const top = Math.max(0, Math.floor(screenHeight / 2 - height / 2 + dualScreenTop));

    // Open popup immediately during user interaction to avoid browser popup blockers
    const popup = window.open(
      '/api/linkedin/auth',
      'matchjuridico_linkedin_popup',
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      const err = new Error('No se pudo abrir la ventana de LinkedIn. Por favor permite las ventanas emergentes en tu navegador.');
      options?.onError?.(err);
      reject(err);
      return;
    }

    let resolved = false;

    const cleanup = () => {
      window.removeEventListener('message', messageListener);
      clearInterval(checkTimer);
    };

    const finishSuccess = (profile: any) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      try { popup.close(); } catch {}
      options?.onSuccess?.(profile);
      resolve(profile);
    };

    const finishError = (err: Error) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      try { popup.close(); } catch {}
      options?.onError?.(err);
      reject(err);
    };

    const messageListener = (e: MessageEvent) => {
      if (e.data?.type === 'linkedin_sync_success' && e.data?.profile) {
        finishSuccess(e.data.profile);
      } else if (e.data?.type === 'linkedin_sync_error') {
        finishError(new Error(e.data.error || 'Error al conectar con LinkedIn.'));
      }
    };
    window.addEventListener('message', messageListener);

    const checkTimer = setInterval(() => {
      if (popup.closed) {
        setTimeout(() => {
          if (resolved) return;
          finishError(new Error('Conexión con LinkedIn cancelada o ventana cerrada.'));
        }, 600);
      }
    }, 600);
  });
}
