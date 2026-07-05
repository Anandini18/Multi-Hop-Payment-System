'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface KnownPacket {
  packetId: string;
  senderVpa: string;
  receiverVpa: string;
  amount: number;
  pin: string;
  ciphertextPreview: string;
  ttl: number;
  createdAt: number;
}

export interface ClientTx {
  id: string; // duplicate id e.g. DUP-c8a2b3f1
  packetHash: string;
  senderVpa: string;
  receiverVpa: string;
  amount: number;
  signedAt: string;
  settledAt: string;
  bridgeNodeId: string;
  hopCount: number;
  status: 'SETTLED' | 'REJECTED' | 'DUPLICATE_DROPPED';
}

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface PacketRegistryContextType {
  knownPackets: Record<string, KnownPacket>;
  registerPacket: (packet: KnownPacket) => void;
  recentActivity: string[];
  addActivityLog: (log: string) => void;
  clearActivityLogs: () => void;
  showToast: (message: string, type: ToastType) => void;
  duplicateTransactions: ClientTx[];
  addDuplicateTransaction: (tx: ClientTx) => void;
}

const PacketRegistryContext = createContext<PacketRegistryContextType | undefined>(undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 3000,
      refetchOnWindowFocus: true,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [knownPackets, setKnownPackets] = useState<Record<string, KnownPacket>>({});
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [duplicateTransactions, setDuplicateTransactions] = useState<ClientTx[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('upi_mesh_known_packets');
    if (saved) {
      try {
        setKnownPackets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved packets', e);
      }
    }

    const savedLogs = localStorage.getItem('upi_mesh_activity_logs');
    if (savedLogs) {
      try {
        setRecentActivity(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Failed to parse saved logs', e);
      }
    } else {
      setRecentActivity([
        `[${new Date().toLocaleTimeString()}] System initialized. All virtual devices online.`,
        `[${new Date().toLocaleTimeString()}] 4 offline devices (Alice, Stranger 1-3) and 1 bridge device configured.`,
        `[${new Date().toLocaleTimeString()}] Connected to backend on http://localhost:8080.`
      ]);
    }

    const savedDupTxs = localStorage.getItem('upi_mesh_duplicate_transactions');
    if (savedDupTxs) {
      try {
        setDuplicateTransactions(JSON.parse(savedDupTxs));
      } catch (e) {
        console.error('Failed to parse saved duplicate transactions', e);
      }
    }
  }, []);

  const registerPacket = (packet: KnownPacket) => {
    setKnownPackets((prev) => {
      const updated = { ...prev, [packet.packetId]: packet };
      const truncatedId = packet.packetId.substring(0, 8);
      updated[truncatedId] = packet;
      localStorage.setItem('upi_mesh_known_packets', JSON.stringify(updated));
      return updated;
    });
  };

  const addActivityLog = (log: string) => {
    setRecentActivity((prev) => {
      const timeStr = new Date().toLocaleTimeString();
      const updated = [`[${timeStr}] ${log}`, ...prev].slice(0, 100);
      localStorage.setItem('upi_mesh_activity_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const addDuplicateTransaction = (tx: ClientTx) => {
    setDuplicateTransactions((prev) => {
      const updated = [tx, ...prev];
      localStorage.setItem('upi_mesh_duplicate_transactions', JSON.stringify(updated));
      return updated;
    });
  };

  const clearActivityLogs = () => {
    setRecentActivity([
      `[${new Date().toLocaleTimeString()}] System logs reset.`
    ]);
    localStorage.removeItem('upi_mesh_activity_logs');
    localStorage.removeItem('upi_mesh_known_packets');
    localStorage.removeItem('upi_mesh_duplicate_transactions');
    setKnownPackets({});
    setDuplicateTransactions([]);
  };

  const showToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PacketRegistryContext.Provider
        value={{
          knownPackets,
          registerPacket,
          recentActivity,
          addActivityLog,
          clearActivityLogs,
          showToast,
          duplicateTransactions,
          addDuplicateTransaction,
        }}
      >
        {children}

        {/* FLOATING TOASTER */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => {
              const borderColors = {
                success: 'border-emerald-500/30 bg-slate-900/90 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
                info: 'border-cyan-500/30 bg-slate-900/90 shadow-[0_0_15px_rgba(6,182,212,0.1)]',
                warning: 'border-amber-500/30 bg-slate-900/90 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
                error: 'border-rose-500/30 bg-slate-900/90 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
              };

              const textColors = {
                success: 'text-emerald-400',
                info: 'text-cyan-400',
                warning: 'text-amber-400',
                error: 'text-rose-400',
              };

              const Icons = {
                success: CheckCircle2,
                info: Info,
                warning: AlertTriangle,
                error: AlertTriangle,
              };

              const Icon = Icons[toast.type];

              return (
                <motion.div
                  key={toast.id}
                  layout
                  initial={{ opacity: 0, x: 50, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl ${borderColors[toast.type]}`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${textColors[toast.type]}`} />
                  <div className="flex-1 text-xs text-slate-300 font-medium leading-relaxed">
                    {toast.message}
                  </div>
                  <button
                    onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                    className="text-slate-500 hover:text-slate-300 rounded p-0.5 hover:bg-slate-800/50 shrink-0 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </PacketRegistryContext.Provider>
    </QueryClientProvider>
  );
}

export function usePacketRegistry() {
  const context = useContext(PacketRegistryContext);
  if (!context) {
    throw new Error('usePacketRegistry must be used within a Providers context');
  }
  return context;
}
