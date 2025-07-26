const request = require('supertest');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { app } = require('../webpanel/server');

// Mock the dependencies
jest.mock('../utils/jsondb', () => ({
  readUser: jest.fn(),
  writeUser: jest.fn(),
  searchMetadata: jest.fn(),
}));

// Mock passport user
app.use((req, res, next) => {
  req.user = {
    id: '12345',
    username: 'testuser',
    guilds: [{ id: '1', name: 'Test Guild', permissions: 0x8 }],
  };
  next();
});


describe('Web Panel Routes', () => {
  it('should render the index page', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
  });

  it('should render the guild config page', async () => {
    const res = await request(app).get('/guild/1/config');
    expect(res.statusCode).toEqual(200);
  });

  it('should render the guild utils page', async () => {
    const res = await request(app).get('/guild/1/utils');
    expect(res.statusCode).toEqual(200);
  });

  it('should handle guild config submission', async () => {
    const res = await request(app)
      .post('/guild/1/config')
      .send({
        prefix: '!',
        logChannel: '123',
      });
    expect(res.statusCode).toEqual(302); // Redirect
  });

  it('should handle welcome message submission', async () => {
    const res = await request(app)
      .post('/guild/1/utils/welcome')
      .send({
        welcomeChannel: '123',
        welcomeMessage: 'Hello!',
      });
    expect(res.statusCode).toEqual(302); // Redirect
  });

  it('should handle autorole submission', async () => {
    const res = await request(app)
      .post('/guild/1/utils/autorole')
      .send({
        autorole: '456',
      });
    expect(res.statusCode).toEqual(302); // Redirect
  });
});
