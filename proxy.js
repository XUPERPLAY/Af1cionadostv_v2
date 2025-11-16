// api/proxy.js
const fetch = require('node-fetch').default;
const { URL } = require('url');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    res.status(400).send('Falta parámetro url');
    return;
  }

  try {
    const targetUrl = decodeURIComponent(url);
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://' + req.headers.host + '/',
        'Origin': 'https://' + req.headers.host
      }
    });

    if (!response.ok) {
      res.status(response.status).send('Error en el servidor remoto');
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-cache');

    // Reescribe M3U8: todos los segmentos pasan por /api/proxy
    if (contentType.includes('application/vnd.apple.mpegurl') || targetUrl.endsWith('.m3u8')) {
      let body = await response.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/'));

      body = body.replace(/((?:https?:\/\/|\/)[^\s"]+\.ts[^\s"]*)/gi, (match) => {
        const absolute = match.startsWith('http') ? match : new URL(match, baseUrl).href;
        return `/api/proxy?url=${encodeURIComponent(absolute)}`;
      });

      // Reescribe también líneas con #EXT-X-STREAM-INF (master playlist)
      body = body.replace(/((?:https?:\/\/|\/)[^\s"]+\.m3u8[^\s"]*)/gi, (match) => {
        const absolute = match.startsWith('http') ? match : new URL(match, baseUrl).href;
        return `/api/proxy?url=${encodeURIComponent(absolute)}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(body);
    } 
    // Para segmentos .ts, .aac, etc.
    else if (targetUrl.includes('.ts') || targetUrl.includes('.aac') || targetUrl.includes('.mp4')) {
      res.setHeader('Content-Type', contentType || 'video/mp2t');
      response.body.pipe(res);
    } 
    // Otros archivos (imágenes, etc.)
    else {
      res.setHeader('Content-Type', contentType);
      response.body.pipe(res);
    }
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Error interno del proxy');
  }
};
