const fetch = require('node-fetch'); // Vercel lo incluye por defecto

module.exports = async (req, res) => {
  try {
    // Fuentes de países (como en tu HTML)
    const countrySources = [
      { name: 'Andorra', url: 'https://iptv-org.github.io/iptv/countries/ad.m3u' },
      { name: 'United Arab Emirates', url: 'https://iptv-org.github.io/iptv/countries/ae.m3u' },
      { name: 'México', url: 'https://iptv-org.github.io/iptv/countries/mx.m3u' },
      { name: 'USA', url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
      { name: 'Argentina', url: 'https://iptv-org.github.io/iptv/countries/ar.m3u' },
      { name: 'Reino Unido', url: 'https://iptv-org.github.io/iptv/countries/gb.m3u' },
      { name: 'Francia', url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
      { name: 'Brasil', url: 'https://iptv-org.github.io/iptv/countries/br.m3u' }
    ];

    // Fuentes de categorías (incluyendo A1X, etc.)
    const categorySources = [
      { name: 'Animation', url: 'https://iptv-org.github.io/iptv/categories/animation.m3u', group: 'Animation' },
      { name: 'Auto', url: 'https://iptv-org.github.io/iptv/categories/auto.m3u', group: 'Auto' },
      { name: 'Business', url: 'https://iptv-org.github.io/iptv/categories/business.m3u', group: 'Business' },
      { name: 'Classic', url: 'https://iptv-org.github.io/iptv/categories/classic.m3u', group: 'Classic' },
      { name: 'Comedy', url: 'https://iptv-org.github.io/iptv/categories/comedy.m3u', group: 'Comedy' },
      { name: 'Cooking', url: 'https://iptv-org.github.io/iptv/categories/cooking.m3u', group: 'Cooking' },
      { name: 'Culture', url: 'https://iptv-org.github.io/iptv/categories/culture.m3u', group: 'Culture' },
      { name: 'Documentary', url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u', group: 'Documentary' },
      { name: 'Education', url: 'https://iptv-org.github.io/iptv/categories/education.m3u', group: 'Education' },
      { name: 'Entertainment', url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u', group: 'Entertainment' },
      { name: 'Family', url: 'https://iptv-org.github.io/iptv/categories/family.m3u', group: 'Family' },
      { name: 'General', url: 'https://iptv-org.github.io/iptv/categories/general.m3u', group: 'General' },
      { name: 'Kids', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u', group: 'Kids' },
      { name: 'Legislative', url: 'https://iptv-org.github.io/iptv/categories/legislative.m3u', group: 'Legislative' },
      { name: 'Lifestyle', url: 'https://iptv-org.github.io/iptv/categories/lifestyle.m3u', group: 'Lifestyle' },
      { name: 'Movies', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', group: 'Movies' },
      { name: 'Music', url: 'https://iptv-org.github.io/iptv/categories/music.m3u', group: 'Music' },
      { name: 'News', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', group: 'News' },
      { name: 'Outdoor', url: 'https://iptv-org.github.io/iptv/categories/outdoor.m3u', group: 'Outdoor' },
      { name: 'Public', url: 'https://iptv-org.github.io/iptv/categories/public.m3u', group: 'Public' },
      { name: 'Relax', url: 'https://iptv-org.github.io/iptv/categories/relax.m3u', group: 'Relax' },
      { name: 'Religious', url: 'https://iptv-org.github.io/iptv/categories/religious.m3u', group: 'Religious' },
      { name: 'Science', url: 'https://iptv-org.github.io/iptv/categories/science.m3u', group: 'Science' },
      { name: 'Series', url: 'https://iptv-org.github.io/iptv/categories/series.m3u', group: 'Series' },
      { name: 'Shop', url: 'https://iptv-org.github.io/iptv/categories/shop.m3u', group: 'Shop' },
      { name: 'Show', url: 'https://iptv-org.github.io/iptv/categories/show.m3u', group: 'Show' },
      { name: 'Sports', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', group: 'Sports' },
      { name: 'Travel', url: 'https://iptv-org.github.io/iptv/categories/travel.m3u', group: 'Travel' },
      { name: 'Weather', url: 'https://iptv-org.github.io/iptv/categories/weather.m3u', group: 'Weather' },
      { name: 'TDT Channels', url: 'https://api.allorigins.win/raw?url=https://www.tdtchannels.com/lists/tv.json', group: 'TDT' },
      { name: 'Makanada', url: 'https://gist.githubusercontent.com/killermina/f85b5faace03d9d0eedd80328ea40ab5/raw/87005309ce21412193fbd3b432bb1b29fdf37b87/makanada.json', group: 'Makanada' },
      { name: 'A1X', url: 'https://raw.githubusercontent.com/a1xmedia/m3u/main/a1x.m3u', group: 'A1X' }
    ];

    // Fuentes principales + categorías
    const allSources = [...countrySources.map(s => ({ ...s, group: s.name })), ...categorySources];

    // Fetch y parse de todas las fuentes
    const allChannels = [];
    for (const source of allSources) {
      try {
        const response = await fetch(source.url);
        let data;
        if (source.url.endsWith('.json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = parseM3U(text);
        }
        // Ajustar canales con grupo
        const channels = Array.isArray(data) ? data : [];
        channels.forEach(ch => {
          ch.group = source.group || 'General';
          if (!ch.url || ch.url === 'No disponible') return; // Filtrar inválidos
          allChannels.push(ch);
        });
      } catch (err) {
        console.error(`Error fetching ${source.name}:`, err);
      }
    }

    // Generar M3U
    let m3uContent = '#EXTM3U\n';
    allChannels.forEach(ch => {
      const logoAttr = ch.logo ? ` tvg-logo="${ch.logo}"` : '';
      m3uContent += `#EXTINF:-1${logoAttr},tvg-name="${ch.name}" group-title="${ch.group}",${ch.name}\n`;
      m3uContent += `${ch.url}\n`;
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Content-Disposition', 'attachment; filename=playlist.m3u');
    res.status(200).send(m3uContent);
  } catch (error) {
    res.status(500).send('#EXTM3U\n#EXTINF:-1,Error al generar playlist\nhttp://error.example.com');
  }
};

// Función parseM3U (igual que en tu HTML)
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
