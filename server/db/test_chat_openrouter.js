import http from 'node:http';

async function testChat() {
  console.log('🤖 Testing OpenRouter AI Chatbot Endpoint...\n');
  const payload = JSON.stringify({
    messages: [
      { role: 'user', content: 'Hi! What health schemes are available for migrant workers in Kerala?' },
    ],
  });

  const req = http.request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Payload:', JSON.parse(body));
      });
    }
  );

  req.on('error', console.error);
  req.write(payload);
  req.end();
}

testChat();
