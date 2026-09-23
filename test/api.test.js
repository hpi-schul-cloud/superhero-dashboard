const http = require('node:http');
const { expect } = require('chai');

const { api } = require('../api');

describe('api helper', () => {
  let server;
  let port;
  let requests;

  beforeEach(async () => {
    requests = [];

    server = http.createServer((req, res) => {
      const chunks = [];

      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        requests.push({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: Buffer.concat(chunks).toString(),
        });

        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true, data: [] }));
      });
    });

    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it('sends accept application/json for JSON admin GET requests', async () => {
    process.env.ADMIN_API_URL = `http://127.0.0.1:${port}/admin/api/`;
    const req = { cookies: {} };

    await api(req, { adminApi: true }).get('/deletion-batches');

    expect(requests).to.have.length(1);
    expect(requests[0].method).to.equal('GET');
    expect(requests[0].url).to.equal('/admin/api/v1/deletion-batches');
    expect(requests[0].headers.accept).to.equal('application/json');
    expect(requests[0].headers['x-api-key']).to.equal(
      'thisisasupersecureapikeythatisabsolutelysave'
    );
  });

  it('sends JSON headers and body for JSON admin POST requests', async () => {
    process.env.ADMIN_API_URL = `http://127.0.0.1:${port}/admin/api/`;
    const req = { cookies: {} };

    await api(req, { adminApi: true }).post('/deletion-batches', {
      json: { hello: 'world' },
    });

    expect(requests).to.have.length(1);
    expect(requests[0].method).to.equal('POST');
    expect(requests[0].headers.accept).to.equal('application/json');
    expect(requests[0].headers['content-type']).to.include('application/json');
    expect(requests[0].body).to.equal(JSON.stringify({ hello: 'world' }));
  });
});

