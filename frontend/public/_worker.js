export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Forward all /api/* requests to the Render backend
    if (url.pathname.startsWith('/api')) {
      const backendPath = url.pathname.replace(/^\/api/, '') || '/';
      const backendUrl = `https://sumisongs-api.onrender.com${backendPath}${url.search}`;

      const newHeaders = new Headers(request.headers);
      newHeaders.set('host', 'sumisongs-api.onrender.com');

      // Preserve Range, Authorization, Cookie headers
      const init = {
        method: request.method,
        headers: newHeaders,
        redirect: 'follow',
      };

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body;
      }

      return fetch(backendUrl, init);
    }

    // Serve static assets with SPA fallback for client-side routing
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status === 404 && !url.pathname.includes('.')) {
      const indexUrl = new URL('/', request.url);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return assetResponse;
  },
};
