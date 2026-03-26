import { ulid } from 'ulid';
import type {
  ChannelAdapter,
  ChannelRef,
  ChannelUser,
  InboundWebhook,
  NormalizedMessage,
  OutboundMessage,
  DeliveryResult,
  ApprovalCard,
  UruleIdentity,
} from '../types.js';

interface SlackEvent {
  type: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
}

interface SlackPayload {
  event: SlackEvent;
}

export class SlackAdapter implements ChannelAdapter {
  readonly channelType = 'slack' as const;

  async receiveWebhook(req: InboundWebhook): Promise<NormalizedMessage> {
    const payload = req.body as SlackPayload;
    const event = payload.event;

    return {
      id: ulid(),
      channelType: 'slack',
      channelId: event.channel,
      senderId: event.user,
      senderName: event.user,
      text: event.text,
      attachments: [],
      timestamp: new Date(parseFloat(event.ts) * 1000).toISOString(),
      metadata: { slackEventType: event.type },
    };
  }

  async sendMessage(ref: ChannelRef, msg: OutboundMessage): Promise<DeliveryResult> {
    // In production, this would call the Slack API
    return {
      success: true,
      messageId: Date.now().toString(),
    };
  }

  async sendApprovalCard(ref: ChannelRef, card: ApprovalCard): Promise<DeliveryResult> {
    // In production, this would send a Slack Block Kit message
    return {
      success: true,
      messageId: Date.now().toString(),
    };
  }

  async mapIdentity(_user: ChannelUser): Promise<UruleIdentity | null> {
    // Would need real Slack API to resolve identity
    return null;
  }
}
