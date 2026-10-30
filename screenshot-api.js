const https = require('https');
const fs = require('fs');

// Try using ApiFlash (free screenshot API)
const options = {
  hostname: 'api.apiflash.com',
  path: '/v1/urltoimage?access_key=free&url=https://starlit-maamoul-d06e25.netlify.app&format=png&full_page=true',
  method: 'GET'
};

console.log('Requesting screenshot from ApiFlash...');

https.get(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  if (res.statusCode === 200) {
    const file = fs.createWriteStream('screenshot-api.png');
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('✓ Screenshot saved: screenshot-api.png');
    });
  } else {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', data);
    });
  }
}).on('error', (err) => {
  console.error('Error:', err.message);
});
