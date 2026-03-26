import { ulid } from 'ulid';
import type {
  ChannelAdapter,
  ChannelBinding,
  ChannelRef,
  ChannelType,
  ChannelUser,
  ApprovalCard,
  DeliveryResult,
  IdentityMapping,
  InboundWebhook,
  NormalizedMessage,
  OutboundMessage,
  UruleIdentity,
} from '../types.js';

export class ChannelManager {
  private adapters: Map<ChannelType, ChannelAdapter> = new Map();
  private bindings: Map<string, ChannelBinding> = new Map();
  private identityMappings: Map<string, IdentityMapping> = new Map();

  registerAdapter(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.channelType, adapter);
  }

  getAdapter(type: ChannelType): ChannelAdapter | undefined {
    return this.adapters.get(type);
  }

  async normalizeInbound(webhook: InboundWebhook): Promise<NormalizedMessage> {
    const adapter = this.adapters.get(webhook.channelType);
    if (!adapter) {
      throw new Error(`No adapter registered for channel type: ${webhook.channelType}`);
    }
    return adapter.receiveWebhook(webhook);
  }

  async sendOutbound(ref: ChannelRef, msg: OutboundMessage): Promise<DeliveryResult> {
    const adapter = this.adapters.get(ref.channelType);
    if (!adapter) {
      return { success: false, error: `No adapter for channel type: ${ref.channelType}` };
    }
    return adapter.sendMessage(ref, msg);
  }

  async sendApprovalCard(ref: ChannelRef, card: ApprovalCard): Promise<DeliveryResult> {
    const adapter = this.adapters.get(ref.channelType);
    if (!adapter) {
      return { success: false, error: `No adapter for channel type: ${ref.channelType}` };
    }
    return adapter.sendApprovalCard(ref, card);
  }

  createBinding(params: Omit<ChannelBinding, 'id' | 'createdAt'>): ChannelBinding {
    const binding: ChannelBinding = {
      ...params,
      id: ulid(),
      createdAt: new Date().toISOString(),
    };
    this.bindings.set(binding.id, binding);
    return binding;
  }

  deleteBinding(id: string): boolean {
    return this.bindings.delete(id);
  }

  listBindings(workspaceId?: string): ChannelBinding[] {
    const all = Array.from(this.bindings.values());
    if (workspaceId) {
      return all.filter((b) => b.workspaceId === workspaceId);
    }
    return all;
  }

  getBinding(id: string): ChannelBinding | undefined {
    return this.bindings.get(id);
  }

  createIdentityMapping(params: Omit<IdentityMapping, 'id' | 'createdAt'>): IdentityMapping {
    const mapping: IdentityMapping = {
      ...params,
      id: ulid(),
      createdAt: new Date().toISOString(),
    };
    this.identityMappings.set(mapping.id, mapping);
    return mapping;
  }

  deleteIdentityMapping(id: string): boolean {
    return this.identityMappings.delete(id);
  }

  listIdentityMappings(): IdentityMapping[] {
    return Array.from(this.identityMappings.values());
  }

  async lookupIdentity(user: ChannelUser): Promise<UruleIdentity | null> {
    // First check identity mappings
    for (const mapping of this.identityMappings.values()) {
      if (
        mapping.channelType === user.channelType &&
        mapping.channelUserId === user.channelUserId
      ) {
        return {
          userId: mapping.uruleUserId,
          orgId: 'default',
          workspaceIds: [],
        };
      }
    }

    // Fall back to adapter
    const adapter = this.adapters.get(user.channelType);
    if (adapter) {
      return adapter.mapIdentity(user);
    }

    return null;
  }
}
