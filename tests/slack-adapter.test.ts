import { describe, it, expect } from 'vitest';
import { SlackAdapter } from '../src/adapters/slack.adapter.js';
import type { InboundWebhook, ChannelRef, ChannelUser, ApprovalCard } from '../src/types.js';

describe('SlackAdapter', () => {
  it('normalizes Slack event payload correctly', async () => {
    const adapter = new SlackAdapter();
    const webhook: InboundWebhook = {
      channelType: 'slack',
      headers: {},
      body: {
        event: {
          type: 'message',
          channel: 'C12345',
          user: 'U67890',
          text: 'Hello from Slack!',
          ts: '1234567890.123456',
        },
      },
    };

    const msg = await adapter.receiveWebhook(webhook);

    expect(msg.channelType).toBe('slack');
    expect(msg.channelId).toBe('C12345');
    expect(msg.senderId).toBe('U67890');
    expect(msg.senderName).toBe('U67890');
    expect(msg.text).toBe('Hello from Slack!');
    expect(msg.attachments).toEqual([]);
    expect(msg.id).toBeTruthy();
    expect(msg.metadata?.slackEventType).toBe('message');
  });

  it('sendMessage returns success', async () => {
    const adapter = new SlackAdapter();
    const ref: ChannelRef = { channelType: 'slack', channelId: 'C12345' };
    const result = await adapter.sendMessage(ref, { text: 'Hello!' });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeTruthy();
  });

  it('sendApprovalCard returns success', async () => {
    const adapter = new SlackAdapter();
    const ref: ChannelRef = { channelType: 'slack', channelId: 'C12345' };
    const card: ApprovalCard = {
      approvalId: 'apr-1',
      title: 'Deploy approval',
      description: 'Please approve the deployment',
      requester: 'alice',
      actions: [
        { label: 'Approve', value: 'approve', style: 'primary' },
        { label: 'Reject', value: 'reject', style: 'danger' },
      ],
      urgency: 'high',
    };
    const result = await adapter.sendApprovalCard(ref, card);

    expect(result.success).toBe(true);
    expect(result.messageId).toBeTruthy();
  });

  it('mapIdentity returns null', async () => {
    const adapter = new SlackAdapter();
    const channelUser: ChannelUser = {
      channelType: 'slack',
      channelUserId: 'U67890',
      displayName: 'Alice',
    };

    const identity = await adapter.mapIdentity(channelUser);
    expect(identity).toBeNull();
  });
});
