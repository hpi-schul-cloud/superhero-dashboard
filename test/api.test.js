const http = require('node:http');
const { expect } = require('chai');
const { Writable } = require('node:stream');

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

  it('GET request with pipe() successfully streams response', async () => {
    process.env.BACKEND_URL = `http://127.0.0.1:${port}/api/`;
    const req = { cookies: { jwt: 'test-token' } };

    const destination = new Writable({
      write(chunk, encoding, callback) {
        callback();
      },
    });

    await new Promise((resolve, reject) => {
      api(req).get('/data').pipe(destination);
      destination.on('finish', resolve);
      destination.on('error', reject);
    });

    expect(requests).to.have.length(1);
    expect(requests[0].method).to.equal('GET');
  });

  it('GET request pipe() destroys destination on stream error', async () => {
    process.env.BACKEND_URL = `http://127.0.0.1:${port}/api/`;
    const req = { cookies: { jwt: 'test-token' } };

    // Create a server that emits data and then closes (simulating a stream error)
    server.close();
    server = http.createServer((req, res) => {
      res.setHeader('content-type', 'application/octet-stream');
      res.write('chunk1');
      res.destroy(); // Forcefully close the connection
    });

    await new Promise((resolve) => {
      server.listen(port, resolve);
    });

    const destination = new Writable({
      write(chunk, encoding, callback) {
        callback();
      },
    });

    let destroyError;
    destination.destroy = function (error) {
      destroyError = error;
      Writable.prototype.destroy.call(this, error);
    };

    await new Promise((resolve) => {
      api(req).get('/data').pipe(destination);
      destination.on('error', () => resolve());
      setTimeout(resolve, 500);
    });

    expect(destroyError).to.exist;
  });

  it('GET request with then() uses non-streaming fetch', async () => {
    process.env.BACKEND_URL = `http://127.0.0.1:${port}/api/`;
    const req = { cookies: { jwt: 'test-token' } };

    const result = await api(req).get('/data');

    expect(requests).to.have.length(1);
    expect(requests[0].method).to.equal('GET');
    expect(result).to.deep.equal({ ok: true, data: [] });
  });
});

