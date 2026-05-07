const https = require('https');
https.request('https://drama.sansekai.my.id/api/pinedrama/trending', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost.com'
  }
}, (res) => {
  console.log(res.headers);
}).end();