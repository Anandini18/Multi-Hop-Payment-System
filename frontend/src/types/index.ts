export interface Account {
  vpa: string;
  holderName: string;
  balance: number;
  version: number;
}

export interface Transaction {
  id: number;
  packetHash: string;
  senderVpa: string;
  receiverVpa: string;
  amount: number;
  signedAt: string; // ISO timestamp
  settledAt: string; // ISO timestamp
  bridgeNodeId: string;
  hopCount: number;
  status: 'SETTLED' | 'REJECTED';
}

export interface MeshDevice {
  deviceId: string;
  hasInternet: boolean;
  packetCount: number;
  packetIds: string[];
}

export interface MeshState {
  devices: MeshDevice[];
  idempotencyCacheSize: number;
}

export interface GossipResult {
  transfers: number;
  deviceCounts: Record<string, number>;
}

export interface BridgeUploadResult {
  bridgeNode: string;
  packetId: string; // 8-char truncated
  outcome: 'SETTLED' | 'DUPLICATE_DROPPED' | 'INVALID';
  reason: string;
  transactionId: number | -1;
}

export interface FlushResult {
  uploadsAttempted: number;
  results: BridgeUploadResult[];
}

export interface ServerKeyInfo {
  publicKey: string;
  algorithm: string;
  hybridScheme: string;
}

export interface DemoSendRequest {
  senderVpa: string;
  receiverVpa: string;
  amount: number;
  pin: string;
  ttl?: number;
  startDevice?: string;
}

export interface DemoSendResponse {
  packetId: string;
  ciphertextPreview: string;
  ttl: number;
  injectedAt: string;
}
