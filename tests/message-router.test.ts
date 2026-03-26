import { describe, it, expect, beforeEach } from 'vitest';
import { ChannelManager } from '../src/services/channel-manager.js';
import { MessageRouter } from '../src/services/message-router.js';
import type { NormalizedMessage } from '../src/types.js';

function makeMessage(overrides: Partial<NormalizedMessage> = {}): NormalizedMessage {
  return {
    id: 'msg-1',
    channelType: 'slack',
    channelId: 'C111',
    senderId: 'U222',
    senderName: 'Alice',
    text: 'Hello',
    attachments: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('MessageRouter', () => {
  let channelManager: ChannelManager;
  let router: MessageRouter;

  beforeEach(() => {
    channelManager = new ChannelManager();
    router = new MessageRouter(channelManager);
  });

  it('routes message to workspace via binding', () => {
    channelManager.createBinding({
      channelType: 'slack',
      channelId: 'C111',
      workspaceId: 'ws-main',
      config: {},
    });
    const msg = makeMessage();
    const result = router.routeMessage(msg);

    expect(result).not.toBeNull();
    expect(result!.workspaceId).toBe('ws-main');
  });

  it('returns null for unbound channel', () => {
    const msg = makeMessage({ channelId: 'C999' });
    const result = router.routeMessage(msg);

    expect(result).toBeNull();
  });
});
