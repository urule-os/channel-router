import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

describe('Channel Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST webhook returns normalized message', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/channels/slack/webhook',
      payload: {
        event: {
          type: 'message',
          channel: 'C111',
          user: 'U222',
          text: 'Hello via route',
          ts: '111.222',
        },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.message.channelType).toBe('slack');
    expect(body.message.text).toBe('Hello via route');
    expect(body.message.id).toBeTruthy();
    expect(body.route).toBeNull(); // no binding yet
  });

  it('POST send returns delivery result', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/channels/slack/send',
      payload: {
        channelId: 'C111',
        message: { text: 'Outbound message' },
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
    expect(res.json().messageId).toBeTruthy();
  });

  it('binding CRUD via HTTP', async () => {
    // Create
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/channel-bindings',
      payload: {
        channelType: 'slack',
        channelId: 'C222',
        workspaceId: 'ws-test',
        config: { foo: 'bar' },
      },
    });
    expect(createRes.statusCode).toBe(201);
    const binding = createRes.json();
    expect(binding.channelType).toBe('slack');
    expect(binding.workspaceId).toBe('ws-test');

    // List
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/channel-bindings',
    });
    expect(listRes.statusCode).toBe(200);
    const bindings = listRes.json();
    expect(bindings.length).toBeGreaterThanOrEqual(1);

    // Delete
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/channel-bindings/${binding.id}`,
    });
    expect(deleteRes.statusCode).toBe(204);

    // Delete non-existent
    const deleteAgain = await app.inject({
      method: 'DELETE',
      url: `/api/v1/channel-bindings/${binding.id}`,
    });
    expect(deleteAgain.statusCode).toBe(404);
  });

  it('POST /api/v1/channel-bindings with missing channelType returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/channel-bindings',
      payload: {
        channelId: 'C222',
        workspaceId: 'ws-test',
        config: { foo: 'bar' },
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Validation failed');
  });

  it('POST /api/v1/channel-bindings with missing workspaceId returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/channel-bindings',
      payload: {
        channelType: 'slack',
        channelId: 'C222',
        config: { foo: 'bar' },
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Validation failed');
  });

  it('POST /api/v1/identity-mappings with missing fields returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/identity-mappings',
      payload: {
        channelType: 'slack',
        // missing channelUserId and uruleUserId
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Validation failed');
  });

  it('identity mapping CRUD via HTTP', async () => {
    // Create
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/identity-mappings',
      payload: {
        channelType: 'slack',
        channelUserId: 'U333',
        uruleUserId: 'urule-u-1',
      },
    });
    expect(createRes.statusCode).toBe(201);
    const mapping = createRes.json();
    expect(mapping.channelUserId).toBe('U333');

    // List
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/identity-mappings',
    });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().length).toBeGreaterThanOrEqual(1);

    // Lookup
    const lookupRes = await app.inject({
      method: 'POST',
      url: '/api/v1/identity-mappings/lookup',
      payload: {
        channelType: 'slack',
        channelUserId: 'U333',
      },
    });
    expect(lookupRes.statusCode).toBe(200);
    expect(lookupRes.json().userId).toBe('urule-u-1');

    // Delete
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/identity-mappings/${mapping.id}`,
    });
    expect(deleteRes.statusCode).toBe(204);
  });
});
