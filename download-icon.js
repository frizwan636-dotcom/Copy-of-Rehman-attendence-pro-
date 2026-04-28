const https = require('https');
const fs = require('fs');

const url192 = 'https://placehold.co/192x192/4f46e5/ffffff.png?text=ME';
const url512 = 'https://placehold.co/512x512/4f46e5/ffffff.png?text=ME';

https.get(url192, (res) => {
  const path = 'public/icon-192x192.png';
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    fs.writeFileSync(path, Buffer.concat(chunks));
    console.log('192x192 downloaded');
  });
});

https.get(url512, (res) => {
  const path = 'public/icon-512x512.png';
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    fs.writeFileSync(path, Buffer.concat(chunks));
    console.log('512x512 downloaded');
  });
});
