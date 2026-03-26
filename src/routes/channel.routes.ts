import type { FastifyInstance } from 'fastify';
import type { ChannelManager } from '../services/channel-manager.js';
import type { MessageRouter } from '../services/message-router.js';
import type { ChannelType, OutboundMessage, ApprovalCard, ChannelUser } from '../types.js';

export function registerChannelRoutes(
  app: FastifyInstance,
  channelManager: ChannelManager,
  messageRouter: MessageRouter,
): void {
  // POST /api/v1/channels/:channelType/webhook
  app.post<{
    Params: { channelType: string };
  }>('/api/v1/channels/:channelType/webhook', async (request, reply) => {
    const { channelType } = request.params;
    const adapter = channelManager.getAdapter(channelType as ChannelType);
    if (!adapter) {
      return reply.status(400).send({ error: `Unknown channel type: ${channelType}` });
    }
    const normalized = await channelManager.normalizeInbound({
      channelType: channelType as ChannelType,
      headers: request.headers as Record<string, string>,
      body: request.body,
    });
    const route = messageRouter.routeMessage(normalized);
    return reply.status(200).send({ message: normalized, route });
  });

  // POST /api/v1/channels/:channelType/send
  app.post<{
    Params: { channelType: ChannelType };
    Body: { channelId: string; message: OutboundMessage; threadId?: string };
  }>('/api/v1/channels/:channelType/send', async (request, reply) => {
    const { channelType } = request.params;
    const { channelId, message, threadId } = request.body as {
      channelId: string;
      message: OutboundMessage;
      threadId?: string;
    };
    const result = await channelManager.sendOutbound(
      { channelType, channelId, threadId },
      message,
    );
    return reply.status(200).send(result);
  });

  // POST /api/v1/channels/:channelType/approval
  app.post<{
    Params: { channelType: ChannelType };
    Body: { channelId: string; card: ApprovalCard };
  }>('/api/v1/channels/:channelType/approval', async (request, reply) => {
    const { channelType } = request.params;
    const { channelId, card } = request.body as { channelId: string; card: ApprovalCard };
    const result = await channelManager.sendApprovalCard({ channelType, channelId }, card);
    return reply.status(200).send(result);
  });

  // GET /api/v1/channel-bindings
  app.get<{
    Querystring: { workspaceId?: string };
  }>('/api/v1/channel-bindings', async (request, reply) => {
    const { workspaceId } = request.query as { workspaceId?: string };
    const bindings = channelManager.listBindings(workspaceId);
    return reply.status(200).send(bindings);
  });

  // POST /api/v1/channel-bindings
  app.post('/api/v1/channel-bindings', async (request, reply) => {
    const body = request.body as {
      channelType: ChannelType;
      channelId: string;
      workspaceId: string;
      config: Record<string, unknown>;
    };
    const binding = channelManager.createBinding(body);
    return reply.status(201).send(binding);
  });

  // DELETE /api/v1/channel-bindings/:bindingId
  app.delete<{
    Params: { bindingId: string };
  }>('/api/v1/channel-bindings/:bindingId', async (request, reply) => {
    const { bindingId } = request.params;
    const deleted = channelManager.deleteBinding(bindingId);
    if (!deleted) {
      return reply.status(404).send({ error: 'Binding not found' });
    }
    return reply.status(204).send();
  });

  // GET /api/v1/identity-mappings
  app.get('/api/v1/identity-mappings', async (_request, reply) => {
    const mappings = channelManager.listIdentityMappings();
    return reply.status(200).send(mappings);
  });

  // POST /api/v1/identity-mappings
  app.post('/api/v1/identity-mappings', async (request, reply) => {
    const body = request.body as {
      channelType: ChannelType;
      channelUserId: string;
      uruleUserId: string;
    };
    const mapping = channelManager.createIdentityMapping(body);
    return reply.status(201).send(mapping);
  });

  // DELETE /api/v1/identity-mappings/:mappingId
  app.delete<{
    Params: { mappingId: string };
  }>('/api/v1/identity-mappings/:mappingId', async (request, reply) => {
    const { mappingId } = request.params;
    const deleted = channelManager.deleteIdentityMapping(mappingId);
    if (!deleted) {
      return reply.status(404).send({ error: 'Identity mapping not found' });
    }
    return reply.status(204).send();
  });

  // POST /api/v1/identity-mappings/lookup
  app.post('/api/v1/identity-mappings/lookup', async (request, reply) => {
    const user = request.body as ChannelUser;
    const identity = await channelManager.lookupIdentity(user);
    if (!identity) {
      return reply.status(404).send({ error: 'Identity not found' });
    }
    return reply.status(200).send(identity);
  });
}
