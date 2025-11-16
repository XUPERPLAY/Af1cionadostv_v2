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
        'Referer': 'https://af1cionadostv-v2.vercel.app/',
        'Origin': 'https://af1cionadostv-v2.vercel.app'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-cache');

    if (contentType.includes('application/vnd.apple.mpegurl') || targetUrl.endsWith('.m3u8')) {
      let body = await response.text();
      // Reescribir URLs relativas y absolutas en .m3u8
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/'));
      body = body.replace(/(https?:\/\/[^#\s]+)|([^#\s"]+\.ts[^#\s"]*)/g, (match, p1, p2) => {
        if (p1) return `/api/proxy?url=${encodeURIComponent(p1)}`;
        if (p2) {
          const absolute = p2.startsWith('http') ? p2 : new URL(p2, baseUrl).href;
          return `/api/proxy?url=${encodeURIComponent(absolute)}`;
        }
        return match;
      });
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(body);
    } else {
      res.setHeader('Content-Type', contentType);
      response.body.pipe(res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en proxy');
  }
};
