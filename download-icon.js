const https = require('https');
const fs = require('fs');

const url = 'https://i.postimg.cc/QCpmNJdd/file-00000000618072078a87ca5e6cac720d.png';

https.get(url, (res) => {
  const path1 = 'public/icon-192x192.png';
  const path2 = 'public/icon-512x512.png';
  
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(path1, buffer);
    fs.writeFileSync(path2, buffer);
    console.log('Images downloaded successfully!');
  });
}).on('error', (err) => {
  console.error('Error downloading:', err.message);
});
