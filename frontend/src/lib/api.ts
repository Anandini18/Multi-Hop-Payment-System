import axios from 'axios';
import {
  Account,
  Transaction,
  MeshState,
  GossipResult,
  FlushResult,
  ServerKeyInfo,
  DemoSendRequest,
  DemoSendResponse,
} from '../types';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

export const meshApi = {
  // Key management
  getServerKey: async (): Promise<ServerKeyInfo> => {
    const res = await api.get<ServerKeyInfo>('/api/server-key');
    return res.data;
  },

  // Accounts & Transactions
  getAccounts: async (): Promise<Account[]> => {
    const res = await api.get<Account[]>('/api/accounts');
    return res.data;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const res = await api.get<Transaction[]>('/api/transactions');
    return res.data;
  },

  // Mesh simulation controls
  getMeshState: async (): Promise<MeshState> => {
    const res = await api.get<MeshState>('/api/mesh/state');
    return res.data;
  },

  sendDemoPayment: async (data: DemoSendRequest): Promise<DemoSendResponse> => {
    const res = await api.post<DemoSendResponse>('/api/demo/send', data);
    return res.data;
  },

  runGossipRound: async (): Promise<GossipResult> => {
    const res = await api.post<GossipResult>('/api/mesh/gossip');
    return res.data;
  },

  flushBridges: async (): Promise<FlushResult> => {
    const res = await api.post<FlushResult>('/api/mesh/flush');
    return res.data;
  },

  resetMesh: async (): Promise<{ status: string }> => {
    const res = await api.post<{ status: string }>('/api/mesh/reset');
    return res.data;
  },
};
