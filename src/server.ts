import Fastify, { type FastifyInstance } from 'fastify';
import { ChannelManager } from './services/channel-manager.js';
import { MessageRouter } from './services/message-router.js';
import { SlackAdapter } from './adapters/slack.adapter.js';
import { TelegramAdapter } from './adapters/telegram.adapter.js';
import { GenericWebhookAdapter } from './adapters/webhook.adapter.js';
import { registerChannelRoutes } from './routes/channel.routes.js';

export interface BuildServerOptions {
  logger?: boolean;
}

export function buildServer(opts: BuildServerOptions = {}): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? false });

  // Initialize services
  const channelManager = new ChannelManager();
  const messageRouter = new MessageRouter(channelManager);

  // Register default adapters
  channelManager.registerAdapter(new SlackAdapter());
  channelManager.registerAdapter(new TelegramAdapter());
  channelManager.registerAdapter(new GenericWebhookAdapter());

  // Health check
  app.get('/healthz', async () => ({ status: 'ok', service: 'urule-channel-router' }));

  // Register routes
  registerChannelRoutes(app, channelManager, messageRouter);

  return app;
}
