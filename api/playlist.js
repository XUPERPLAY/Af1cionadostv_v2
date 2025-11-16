module.exports = async (req, res) => {
  try {
    // Fuentes limitadas para pruebas (descomenta más cuando funcione)
    const allSources = [
      // Países (solo 4 iniciales)
      { name: 'México', url: 'https://iptv-org.github.io/iptv/countries/mx.m3u', group: 'México' },
      { name: 'USA', url: 'https://iptv-org.github.io/iptv/countries/us.m3u', group: 'USA' },
      { name: 'Argentina', url: 'https://iptv-org.github.io/iptv/countries/ar.m3u', group: 'Argentina' },
      { name: 'Brasil', url: 'https://iptv-org.github.io/iptv/countries/br.m3u', group: 'Brasil' },
      // Categorías clave + A1X
      { name: 'Sports', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', group: 'Sports' },
      { name: 'Movies', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', group: 'Movies' },
      { name: 'News', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', group: 'News' },
      { name: 'A1X', url: 'https://raw.githubusercontent.com/a1xmedia/m3u/main/a1x.m3u', group: 'A1X' },
      // Descomenta para más (agrega una por una)
      // { name: 'TDT Channels', url: 'https://api.allorigins.win/raw?url=https://www.tdtchannels.com/lists/tv.json', group: 'TDT' },
      // { name: 'Makanada', url: 'https://gist.githubusercontent.com/killermina/f85b5faace03d9d0eedd80328ea40ab5/raw/87005309ce21412193fbd3b432bb1b29fdf37b87/makanada.json', group: 'Makanada' },
      // ... resto
    ];

    // Fetch paralelo con timeout (5s por fuente)
    const fetchPromises = allSources.map(async (source) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(source.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        let data;
        if (source.url.endsWith('.json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = parseM3U(text);
        }
        const channels = Array.isArray(data) ? data : [];
        return channels.slice(0, 200).map(ch => ({ ...ch, group: source.group })).filter(ch => ch.url && ch.url !== 'No disponible');
      } catch (err) {
        console.error(`Error en ${source.name}:`, err.message);
        return [];
      }
    });

    const allChannelArrays = await Promise.all(fetchPromises);
    const allChannels = allChannelArrays.flat();

    // Generar M3U
    let m3uContent = '#EXTM3U\n';
    allChannels.forEach(ch => {
      const logoAttr = ch.logo ? ` tvg-logo="${ch.logo}"` : '';
      m3uContent += `#EXTINF:-1 tvg-name="${ch.name}" group-title="${ch.group}"${logoAttr},${ch.name}\n`;
      m3uContent += `${ch.url}\n`;
    });

    // Headers para FORZAR descarga (no reproducción)
    res.setHeader('Content-Type', 'text/plain'); // Cambiado para evitar media play
    res.setHeader('Content-Disposition', 'attachment; filename="playlist.m3u"');
    res.setHeader('Content-Length', Buffer.byteLength(m3uContent, 'utf8'));
    res.setHeader('Cache-Control', 'public, max-age=600'); // Cache 10min

    res.status(200).send(m3uContent);
  } catch (error) {
    console.error('Error general:', error);
    const errorM3U = '#EXTM3U\n#EXTINF:-1 group-title="Error",Error al generar playlist\nhttp://example.com/error';
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="error.m3u"');
    res.status(500).send(errorM3U);
  }
};

// Función parseM3U (igual que antes)
function parseM3U(content) {
  const channels = [];
  const lines = content.split('\n');
  let infoLine = null;
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      infoLine = line;
    } else if (line && !line.startsWith('#')) {
      if (infoLine) {
        const channel = parseInfoLine(infoLine, line);
        channels.push(channel);
      }
      infoLine = null;
    }
  }
  return channels;
}

function parseInfoLine(infoLine, url) {
  const channel = { url };
  const match = infoLine.match(/#EXTINF:[-0-9.]+(.*),(.*)/);
  if (match) {
    const attrs = match[1].trim();
    channel.name = match[2].trim();
    const attrPairs = attrs.match(/([a-z\-]+)="([^"]*)"/g) || [];
    attrPairs.forEach(pair => {
      const [key, value] = pair.split('=');
      const cleanKey = key.trim().toLowerCase();
      const cleanValue = value.replace(/"/g, '').trim();
      if (cleanKey === 'tvg-logo' || cleanKey === 'logo') {
        channel.logo = cleanValue;
      } else if (cleanKey === 'tvg-name') {
        channel.name = cleanValue;
      }
    });
  } else {
    channel.name = 'Unknown';
  }
  if (!channel.logo) channel.logo = 'https://i.postimg.cc/L4xpnNy5/logo11-3-19385.png';
  return channel;
}
