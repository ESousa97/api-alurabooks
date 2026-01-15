const request = require('supertest');
const server = require('../src/server');

describe('Public endpoints', () => {
  it('GET /public/lancamentos should return a list', async () => {
    const response = await request(server).get('/public/lancamentos');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('GET /public/mais-vendidos should return a list', async () => {
    const response = await request(server).get('/public/mais-vendidos');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});
