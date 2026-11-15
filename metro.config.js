const path = require('path');
const https = require('https');
const { URL } = require('url');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const WEB_NATIVE_STUBS = new Set([
  'sp-react-native-in-app-updates',
  'react-native-google-mobile-ads',
  'react-native-iap',
  'react-native-android-widget',
]);

const stubPath = path.resolve(__dirname, 'web-shims/native-stubs.js');
const prevResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_NATIVE_STUBS.has(moduleName)) {
    return { type: 'sourceFile', filePath: stubPath };
  }
  if (prevResolveRequest) {
    return prevResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

const PROXY_ROUTES = [
  { prefix: '/__cf_api', target: 'https://api.cloudflare.com/client/v4' },
  { prefix: '/__cf_oauth', target: 'https://dash.cloudflare.com/oauth2' },
];

function proxyToCloudflare(req, res, route) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-Auth-Email,X-Auth-Key,Accept',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  const suffix = req.url.slice(route.prefix.length) || '/';
  const targetUrl = new URL(route.target + (suffix.startsWith('/') ? suffix : '/' + suffix));
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.origin;
  delete headers.referer;
  delete headers.connection;
  delete headers['accept-encoding'];
  delete headers.cookie;
  headers.host = targetUrl.host;

  const proxyReq = https.request(
    targetUrl,
    {
      method: req.method,
      headers,
    },
    (proxyRes) => {
      const outHeaders = { ...proxyRes.headers };
      delete outHeaders['set-cookie'];
      delete outHeaders['content-security-policy'];
      delete outHeaders['x-frame-options'];
      delete outHeaders['strict-transport-security'];
      delete outHeaders['transfer-encoding'];
      delete outHeaders.connection;
      res.writeHead(proxyRes.statusCode || 500, outHeaders);
      proxyRes.pipe(res);
    }
  );

  proxyReq.setTimeout(30000, () => {
    proxyReq.destroy(new Error('Cloudflare upstream request timed out'));
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          errors: [{ code: 0, message: err.message || 'Upstream proxy error' }],
          messages: [],
          result: null,
        })
      );
    } else if (!res.writableEnded) {
      res.end();
    }
  });

  req.on('aborted', () => proxyReq.destroy());
  req.pipe(proxyReq);
}

config.server = config.server || {};
const prevEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (metroMiddleware, metroServer) => {
  const baseMiddleware = prevEnhanceMiddleware
    ? prevEnhanceMiddleware(metroMiddleware, metroServer)
    : metroMiddleware;

  return (req, res, next) => {
    const url = req.url || '';
    const route = PROXY_ROUTES.find(
      (r) => url === r.prefix || url.startsWith(`${r.prefix}/`) || url.startsWith(`${r.prefix}?`)
    );
    if (route) {
      return proxyToCloudflare(req, res, route);
    }
    return baseMiddleware(req, res, next);
  };
};

module.exports = config;
