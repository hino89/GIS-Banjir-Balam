const http = require('http');
http.get('http://localhost:5000/api/cuaca/all-kelurahan', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body.substring(0, 1000)));
}).on('error', e => console.error(e));
