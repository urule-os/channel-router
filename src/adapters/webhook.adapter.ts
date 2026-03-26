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

interface WebhookPayload {
  channelId: string;
  senderId: string;
  senderName: string;
  text: string;
}

export class GenericWebhookAdapter implements ChannelAdapter {
  readonly channelType = 'webhook' as const;

  async receiveWebhook(req: InboundWebhook): Promise<NormalizedMessage> {
    const payload = req.body as WebhookPayload;

    return {
      id: ulid(),
      channelType: 'webhook',
      channelId: payload.channelId,
      senderId: payload.senderId,
      senderName: payload.senderName,
      text: payload.text,
      attachments: [],
      timestamp: new Date().toISOString(),
    };
  }

  async sendMessage(ref: ChannelRef, msg: OutboundMessage): Promise<DeliveryResult> {
    // Generic webhook: always succeeds (fire-and-forget)
    return {
      success: true,
      messageId: ulid(),
    };
  }

  async sendApprovalCard(ref: ChannelRef, card: ApprovalCard): Promise<DeliveryResult> {
    return {
      success: true,
      messageId: ulid(),
    };
  }

  async mapIdentity(_user: ChannelUser): Promise<UruleIdentity | null> {
    return null;
  }
}
