import { describe, it, expect, beforeEach } from 'vitest';
import { ChannelManager } from '../src/services/channel-manager.js';
import { SlackAdapter } from '../src/adapters/slack.adapter.js';
import { TelegramAdapter } from '../src/adapters/telegram.adapter.js';
import type { InboundWebhook } from '../src/types.js';

describe('ChannelManager', () => {
  let manager: ChannelManager;
  let slackAdapter: SlackAdapter;

  beforeEach(() => {
    manager = new ChannelManager();
    slackAdapter = new SlackAdapter();
    manager.registerAdapter(slackAdapter);
    manager.registerAdapter(new TelegramAdapter());
  });

  it('registers and retrieves adapter', () => {
    expect(manager.getAdapter('slack')).toBe(slackAdapter);
    expect(manager.getAdapter('email')).toBeUndefined();
  });

  it('normalizeInbound routes to correct adapter', async () => {
    const webhook: InboundWebhook = {
      channelType: 'slack',
      headers: {},
      body: {
        event: {
          type: 'message',
          channel: 'C111',
          user: 'U222',
          text: 'Test message',
          ts: '12345',
        },
      },
    };

    const msg = await manager.normalizeInbound(webhook);
    expect(msg.channelType).toBe('slack');
    expect(msg.text).toBe('Test message');
  });

  it('throws for unknown channel type', async () => {
    const webhook: InboundWebhook = {
      channelType: 'email',
      headers: {},
      body: {},
    };

    await expect(manager.normalizeInbound(webhook)).rejects.toThrow(
      'No adapter registered for channel type: email',
    );
  });

  it('binding CRUD (create, list, delete)', () => {
    expect(manager.listBindings()).toHaveLength(0);

    const binding = manager.createBinding({
      channelType: 'slack',
      channelId: 'C111',
      workspaceId: 'ws-1',
      config: { notify: true },
    });
    expect(binding.id).toBeTruthy();
    expect(binding.channelType).toBe('slack');
    expect(binding.channelId).toBe('C111');
    expect(binding.workspaceId).toBe('ws-1');
    expect(binding.config.notify).toBe(true);
    expect(binding.createdAt).toBeTruthy();

    expect(manager.listBindings()).toHaveLength(1);
    expect(manager.getBinding(binding.id)).toBe(binding);

    const deleted = manager.deleteBinding(binding.id);
    expect(deleted).toBe(true);
    expect(manager.listBindings()).toHaveLength(0);

    const deletedAgain = manager.deleteBinding(binding.id);
    expect(deletedAgain).toBe(false);
  });

  it('identity mapping CRUD (create, list, delete)', () => {
    expect(manager.listIdentityMappings()).toHaveLength(0);

    const mapping = manager.createIdentityMapping({
      channelType: 'slack',
      channelUserId: 'U222',
      uruleUserId: 'urule-user-1',
    });
    expect(mapping.id).toBeTruthy();
    expect(mapping.channelType).toBe('slack');
    expect(mapping.channelUserId).toBe('U222');
    expect(mapping.uruleUserId).toBe('urule-user-1');
    expect(mapping.createdAt).toBeTruthy();

    expect(manager.listIdentityMappings()).toHaveLength(1);

    const deleted = manager.deleteIdentityMapping(mapping.id);
    expect(deleted).toBe(true);
    expect(manager.listIdentityMappings()).toHaveLength(0);
  });

  it('lookupIdentity finds mapping', async () => {
    manager.createIdentityMapping({
      channelType: 'slack',
      channelUserId: 'U999',
      uruleUserId: 'mapping-user',
    });

    const fromMapping = await manager.lookupIdentity({
      channelType: 'slack',
      channelUserId: 'U999',
    });
    expect(fromMapping).not.toBeNull();
    expect(fromMapping!.userId).toBe('mapping-user');

    // Unknown user everywhere
    const unknown = await manager.lookupIdentity({
      channelType: 'slack',
      channelUserId: 'UXXX',
    });
    expect(unknown).toBeNull();
  });
});
