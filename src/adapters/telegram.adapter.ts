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

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  from: { id: number; first_name: string };
  text: string;
  date: number;
}

interface TelegramUpdate {
  message: TelegramMessage;
}

export class TelegramAdapter implements ChannelAdapter {
  readonly channelType = 'telegram' as const;

  async receiveWebhook(req: InboundWebhook): Promise<NormalizedMessage> {
    const payload = req.body as TelegramUpdate;
    const msg = payload.message;

    return {
      id: ulid(),
      channelType: 'telegram',
      channelId: String(msg.chat.id),
      senderId: String(msg.from.id),
      senderName: msg.from.first_name,
      text: msg.text,
      attachments: [],
      timestamp: new Date(msg.date * 1000).toISOString(),
      metadata: { telegramMessageId: msg.message_id },
    };
  }

  async sendMessage(ref: ChannelRef, msg: OutboundMessage): Promise<DeliveryResult> {
    // In production, this would call the Telegram Bot API
    return {
      success: true,
      messageId: Date.now().toString(),
    };
  }

  async sendApprovalCard(ref: ChannelRef, card: ApprovalCard): Promise<DeliveryResult> {
    // In production, this would send an inline keyboard message
    return {
      success: true,
      messageId: Date.now().toString(),
    };
  }

  async mapIdentity(_user: ChannelUser): Promise<UruleIdentity | null> {
    // Would need real Telegram API to resolve identity
    return null;
  }
}
