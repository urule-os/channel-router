import type { NormalizedMessage } from '../types.js';
import type { ChannelManager } from './channel-manager.js';

export class MessageRouter {
  constructor(private channelManager: ChannelManager) {}

  routeMessage(msg: NormalizedMessage): { workspaceId: string; agentId?: string } | null {
    const bindings = this.channelManager.listBindings();
    const binding = bindings.find(
      (b) => b.channelType === msg.channelType && b.channelId === msg.channelId
    );

    if (!binding) {
      return null;
    }

    const result: { workspaceId: string; agentId?: string } = { workspaceId: binding.workspaceId };
    if (binding.config && typeof binding.config === 'object' && 'agentId' in binding.config) {
      result.agentId = binding.config.agentId as string;
    }
    return result;
  }
}
