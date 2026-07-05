'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePacketRegistry } from './providers';
import { meshApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network,
  RefreshCw,
  Radio,
  Wifi,
  Trash2,
  Database,
  Server,
  Layers,
  Send,
  Lock,
  Terminal,
  Cpu,
  Key,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

// ==========================================
// PARTICLE MESH CANVAS COMPONENT
// ==========================================
function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    const particleCount = 35;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.lineWidth = 0.8;

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-50 z-0" />;
}

// ==========================================
// CUSTOM REACT FLOW NODE TYPES
// ==========================================
const FlowDeviceNode = ({ data }: any) => {
  const isBridge = data.hasInternet;
  const packetCount = data.packetCount || 0;
  const packetIds = data.packetIds || [];

  return (
    <div
      className={`px-4 py-3 rounded-xl border bg-slate-950/95 text-left min-w-[170px] shadow-lg transition-all duration-300 ${
        isBridge
          ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-cyan-500/5'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-1.5 h-1.5 bg-slate-700 border-none" />
      <Handle type="source" position={Position.Right} className="w-1.5 h-1.5 bg-slate-700 border-none" />

      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] text-slate-500 font-mono select-none">NODE</span>
        <Badge variant={isBridge ? 'success' : 'secondary'} className="py-0 px-1 text-[7px] font-bold">
          {isBridge ? '🌐 4G BRIDGE' : '🚫 OFFLINE'}
        </Badge>
      </div>

      <div className="text-[11px] font-extrabold text-slate-200">{data.label}</div>
      <div className="text-[9px] text-slate-500 font-semibold mt-1">
        Held: <span className={packetCount > 0 ? 'text-cyan-400 font-bold' : 'text-slate-600'}>{packetCount} pkt</span>
      </div>

      {packetIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {packetIds.map((pid: string) => (
            <span
              key={pid}
              className="text-[8px] font-mono bg-slate-900 px-1 py-0.5 rounded text-cyan-400 border border-slate-800"
            >
              {pid}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const FlowServerNode = ({ data }: any) => {
  return (
    <div className="px-5 py-3.5 rounded-xl border border-indigo-500/50 bg-slate-950/95 text-left min-w-[190px] shadow-[0_0_20px_rgba(99,102,241,0.2)]">
      <Handle type="target" position={Position.Left} className="w-1.5 h-1.5 bg-indigo-500 border-none" />

      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] text-slate-500 font-mono select-none">BANK SYSTEM</span>
        <Badge variant="cyan" className="py-0 px-1 text-[7px] font-bold">
          CENTRAL SERVER
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
          <Server className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <div className="text-[11px] font-extrabold text-slate-200">{data.label}</div>
          <div className="text-[8px] text-slate-500 font-mono">{process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}</div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[9px] space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">Idempotency Cache:</span>
          <span className="text-indigo-400 font-bold font-mono">{data.cacheSize || 0} keys</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Settled Ledger:</span>
          <span className="text-emerald-400 font-bold font-mono">{data.settledTx || 0} tx</span>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  customDevice: FlowDeviceNode,
  customServer: FlowServerNode,
};

// ==========================================
// GRAPH POSITION CONFIGS
// ==========================================
const initialNodes: Node[] = [
  { id: 'phone-alice', type: 'customDevice', position: { x: 30, y: 140 }, data: { label: 'phone-alice', hasInternet: false } },
  { id: 'phone-stranger1', type: 'customDevice', position: { x: 220, y: 50 }, data: { label: 'phone-stranger1', hasInternet: false } },
  { id: 'phone-stranger2', type: 'customDevice', position: { x: 220, y: 230 }, data: { label: 'phone-stranger2', hasInternet: false } },
  { id: 'phone-stranger3', type: 'customDevice', position: { x: 410, y: 140 }, data: { label: 'phone-stranger3', hasInternet: false } },
  { id: 'phone-bridge', type: 'customDevice', position: { x: 600, y: 140 }, data: { label: 'phone-bridge', hasInternet: true } },
  { id: 'backend', type: 'customServer', position: { x: 800, y: 130 }, data: { label: 'UPI Backend Server' } },
];

const initialEdges: Edge[] = [
  { id: 'e-alice-stranger1', source: 'phone-alice', target: 'phone-stranger1', style: { stroke: '#334155', strokeWidth: 1.5 }, animated: false },
  { id: 'e-alice-stranger2', source: 'phone-alice', target: 'phone-stranger2', style: { stroke: '#334155', strokeWidth: 1.5 }, animated: false },
  { id: 'e-stranger1-stranger3', source: 'phone-stranger1', target: 'phone-stranger3', style: { stroke: '#334155', strokeWidth: 1.5 }, animated: false },
  { id: 'e-stranger2-stranger3', source: 'phone-stranger2', target: 'phone-stranger3', style: { stroke: '#334155', strokeWidth: 1.5 }, animated: false },
  { id: 'e-stranger3-bridge', source: 'phone-stranger3', target: 'phone-bridge', style: { stroke: '#334155', strokeWidth: 1.5 }, animated: false },
  { id: 'e-bridge-backend', source: 'phone-bridge', target: 'backend', style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '4,4' }, animated: false },
];

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { registerPacket, recentActivity, addActivityLog, clearActivityLogs, showToast, knownPackets, addDuplicateTransaction } = usePacketRegistry();

  // Form states
  const [senderVpa, setSenderVpa] = useState('alice@demo');
  const [receiverVpa, setReceiverVpa] = useState('bob@demo');
  const [amount, setAmount] = useState('500');
  const [pin, setPin] = useState('1234');
  const [startDevice, setStartDevice] = useState('phone-alice');

  // Encryption overlay animations state
  const [cryptoOverlayOpen, setCryptoOverlayOpen] = useState(false);
  const [cryptoOverlayStep, setCryptoOverlayStep] = useState(0); // 0: JSON, 1: AES, 2: RSA, 3: Completed
  const [lastCreatedPacket, setLastCreatedPacket] = useState<any>(null);

  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // React Flow edge animations helper
  const [isGossipAnimating, setIsGossipAnimating] = useState(false);
  const [isFlushAnimating, setIsFlushAnimating] = useState(false);

  // Health Queries
  const { data: meshState, error, isSuccess } = useQuery({
    queryKey: ['meshState'],
    queryFn: meshApi.getMeshState,
    refetchInterval: 2000,
  });

  const isConnected = isSuccess && !error;

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: meshApi.getTransactions,
    refetchInterval: 2000,
  });

  // Keep React Flow nodes synchronized with the REST backend state
  useEffect(() => {
    if (!meshState) return;

    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.id === 'backend') {
          return {
            ...n,
            data: {
              ...n.data,
              cacheSize: meshState.idempotencyCacheSize,
              settledTx: transactions?.filter((t) => t.status === 'SETTLED')?.length || 0,
            },
          };
        }

        const apiDevice = meshState.devices?.find((d) => d.deviceId === n.id);
        return {
          ...n,
          data: {
            ...n.data,
            packetCount: apiDevice?.packetCount || 0,
            packetIds: apiDevice?.packetIds || [],
          },
        };
      })
    );
  }, [meshState, transactions, setNodes]);

  // Telemetry KPIs
  const activeDevicesCount = meshState?.devices?.length || 0;
  const packetsInMeshCount = meshState?.devices?.reduce((sum, d) => sum + d.packetCount, 0) || 0;
  const cacheSize = meshState?.idempotencyCacheSize || 0;
  const isBridgeConnected = meshState?.devices?.find((d) => d.deviceId === 'phone-bridge')?.hasInternet || false;

  // Actions
  // 1. INJECT
  const injectMutation = useMutation({
    mutationFn: meshApi.sendDemoPayment,
    onSuccess: (data) => {
      // Register full details in providers context registry
      registerPacket({
        packetId: data.packetId,
        senderVpa,
        receiverVpa,
        amount: parseFloat(amount),
        pin,
        ciphertextPreview: data.ciphertextPreview,
        ttl: data.ttl,
        createdAt: Date.now(),
      });

      setLastCreatedPacket(data);
      addActivityLog(
        `[INJECT] Packet ${data.packetId.substring(0, 8)} encrypted & injected at ${data.injectedAt} (TTL ${data.ttl})`
      );
      addActivityLog(`   Ciphertext: ${data.ciphertextPreview}`);

      queryClient.invalidateQueries({ queryKey: ['meshState'] });

      // Run Cryptography pipeline overlay animation
      setCryptoOverlayOpen(true);
      setCryptoOverlayStep(0);
      
      setTimeout(() => setCryptoOverlayStep(1), 1200); // AES
      setTimeout(() => setCryptoOverlayStep(2), 2400); // RSA
      setTimeout(() => {
        setCryptoOverlayStep(3);
        showToast(`Packet ${data.packetId.substring(0, 8)} injected into ${data.injectedAt}.`, 'success');
      }, 3600);
    },
    onError: (err: any) => {
      showToast(`Injection failed: ${err.message || 'Server error'}`, 'error');
    },
  });

  const handleInject = (e: React.FormEvent) => {
    e.preventDefault();

    if (senderVpa === receiverVpa) {
      showToast('Sender VPA cannot match Receiver VPA.', 'error');
      return;
    }
    if (parseFloat(amount) <= 0) {
      showToast('Amount must be positive.', 'error');
      return;
    }
    if (pin.length !== 4 || isNaN(Number(pin))) {
      showToast('UPI PIN must be 4 digits.', 'error');
      return;
    }

    injectMutation.mutate({
      senderVpa,
      receiverVpa,
      amount: parseFloat(amount),
      pin,
      ttl: 5,
      startDevice,
    });
  };

  // 2. GOSSIP
  const gossipMutation = useMutation({
    mutationFn: meshApi.runGossipRound,
    onSuccess: (data) => {
      addActivityLog(
        `[GOSSIP] Gossip completed: ${data.transfers} transfer(s) — Devices: ${JSON.stringify(data.deviceCounts)}`
      );
      showToast(`Gossip round finished: ${data.transfers} packet hops across mesh.`, 'info');
      queryClient.invalidateQueries({ queryKey: ['meshState'] });

      // Animate React Flow edges
      setIsGossipAnimating(true);
      setEdges((prevEdges) =>
        prevEdges.map((e) => {
          if (e.id !== 'e-bridge-backend') {
            return { ...e, animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } };
          }
          return e;
        })
      );

      setTimeout(() => {
        setIsGossipAnimating(false);
        setEdges((prevEdges) =>
          prevEdges.map((e) => {
            if (e.id !== 'e-bridge-backend') {
              return { ...e, animated: false, style: { stroke: '#334155', strokeWidth: 1.5 } };
            }
            return e;
          })
        );
      }, 1500);
    },
    onError: (err: any) => {
      showToast(`Gossip failed: ${err.message || 'Server error'}`, 'error');
    },
  });

  // 3. FLUSH
  const flushMutation = useMutation({
    mutationFn: meshApi.flushBridges,
    onSuccess: (data) => {
      addActivityLog(`[BRIDGE FLUSH] Bridge nodes connected to 4G. Attempted ${data.uploadsAttempted} uploads:`);
      data.results.forEach((res) => {
        const isSettle = res.outcome === 'SETTLED';
        const isDuplicate = res.outcome === 'DUPLICATE_DROPPED';

        let tag = '[REJECTED]';
        if (isSettle) tag = '[SETTLED]';
        if (isDuplicate) tag = '[DUPLICATE_DROPPED]';

        addActivityLog(`   ${tag} ${res.bridgeNode} packet ${res.packetId} ➔ ${res.outcome} ${res.reason ? `(${res.reason})` : ''}`);

        if (isSettle) {
          showToast(`Transaction settled! Bridge uploaded packet ${res.packetId}.`, 'success');
        } else if (isDuplicate) {
          showToast(`Duplicate packet ${res.packetId} rejected. Lock maintained.`, 'warning');
          
          // Register the duplicate drop event in the client-side ledger list
          const fullInfo = knownPackets[res.packetId] || Object.values(knownPackets).find((kp) => kp.packetId.startsWith(res.packetId));
          addDuplicateTransaction({
            id: `DUP-${res.packetId}-${Date.now()}`,
            packetHash: res.packetId,
            senderVpa: fullInfo?.senderVpa || 'alice@demo',
            receiverVpa: fullInfo?.receiverVpa || 'bob@demo',
            amount: fullInfo?.amount || 500,
            signedAt: new Date(fullInfo?.createdAt || Date.now() - 30000).toISOString(),
            settledAt: new Date().toISOString(),
            bridgeNodeId: res.bridgeNode || 'phone-bridge',
            hopCount: 2,
            status: 'DUPLICATE_DROPPED'
          });
        } else {
          showToast(`Packet ${res.packetId} rejected: ${res.reason || 'Invalid details'}.`, 'error');
        }
      });

      queryClient.invalidateQueries({ queryKey: ['meshState'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      // Animate bridge to backend server edge
      setIsFlushAnimating(true);
      setEdges((prevEdges) =>
        prevEdges.map((e) => {
          if (e.id === 'e-bridge-backend') {
            return { ...e, animated: true, style: { stroke: '#10b981', strokeWidth: 3, strokeDasharray: '4,4' } };
          }
          return e;
        })
      );

      setTimeout(() => {
        setIsFlushAnimating(false);
        setEdges((prevEdges) =>
          prevEdges.map((e) => {
            if (e.id === 'e-bridge-backend') {
              return { ...e, animated: false, style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '4,4' } };
            }
            return e;
          })
        );
      }, 2000);
    },
    onError: (err: any) => {
      showToast(`Bridge upload failed: ${err.message || 'Server error'}`, 'error');
    },
  });

  // 4. RESET
  const resetMutation = useMutation({
    mutationFn: meshApi.resetMesh,
    onSuccess: () => {
      clearActivityLogs();
      showToast('Mesh network simulation and server cache reset successfully.', 'error');
      queryClient.invalidateQueries({ queryKey: ['meshState'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedNode(null);
    },
    onError: (err: any) => {
      showToast(`System reset failed: ${err.message || 'Server error'}`, 'error');
    },
  });

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  // Format activity log with colors
  const getLogColorClass = (logLine: string) => {
    if (logLine.includes('[SETTLED]')) return 'text-emerald-400';
    if (logLine.includes('[DUPLICATE_DROPPED]')) return 'text-amber-400';
    if (logLine.includes('[REJECTED]') || logLine.includes('failed')) return 'text-rose-400 font-semibold';
    if (logLine.includes('[GOSSIP]')) return 'text-cyan-400';
    if (logLine.includes('[INJECT]')) return 'text-indigo-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col min-h-full pb-8">
      
      {/* TOP HERO SECTION */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 p-8 backdrop-blur-md shrink-0">
        <MeshBackground />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2.5 max-w-xl">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              📡 UPI Offline Mesh
            </h1>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              Mesh-routed deferred settlement using encrypted packet gossip and idempotent settlement.
              Simulate peer-to-peer bluetooth payments propagating across offline routers.
            </p>
          </div>

          {/* TELEMETRY HEALTH STATE BADGES */}
          <div className="flex flex-wrap gap-2.5 shrink-0 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 backdrop-blur-md">
            
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${
              isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`} />
              Server: {isConnected ? 'ONLINE' : 'OFFLINE'}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
              <Network className="w-3.5 h-3.5" />
              Mesh: {activeDevicesCount} Nodes
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${
              isBridgeConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBridgeConnected ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              Bridge: {isBridgeConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
              <Layers className="w-3.5 h-3.5" />
              Cache Size: {cacheSize}
            </div>

          </div>
        </div>
      </div>

      {/* SECTION 1: DEMO FLOW CONTROLS */}
      <Card className="relative overflow-hidden border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800/50 bg-slate-900/10">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 select-none">
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
            🎬 Simulation control center & demo flow
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* PAYMENT COMPOSER */}
            <form onSubmit={handleInject} className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 select-none">Sender Dropdown</label>
                <select
                  value={senderVpa}
                  onChange={(e) => setSenderVpa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-700"
                >
                  <option value="alice@demo">alice@demo (Alice - ₹5k)</option>
                  <option value="bob@demo">bob@demo (Bob - ₹1k)</option>
                  <option value="carol@demo">carol@demo (Carol - ₹2.5k)</option>
                  <option value="dave@demo">dave@demo (Dave - ₹500)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 select-none">Receiver Dropdown</label>
                <select
                  value={receiverVpa}
                  onChange={(e) => setReceiverVpa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-700"
                >
                  <option value="bob@demo">bob@demo (Bob)</option>
                  <option value="carol@demo">carol@demo (Carol)</option>
                  <option value="alice@demo">alice@demo (Alice)</option>
                  <option value="dave@demo">dave@demo (Dave)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 select-none">Amount Input (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 select-none">PIN Input</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  placeholder="UPI PIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono"
                />
              </div>
            </form>

            {/* CONTROL ACTION BUTTONS */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-3.5">
              
              <button
                onClick={handleInject}
                disabled={injectMutation.isPending}
                className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 select-none shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-indigo-400/20"
              >
                <Send className="w-4 h-4 shrink-0" />
                📤 Inject Packet
              </button>

              <button
                onClick={() => gossipMutation.mutate()}
                disabled={gossipMutation.isPending || isGossipAnimating}
                className="px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 select-none shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-cyan-400/20"
              >
                <RefreshCw className={`w-4 h-4 shrink-0 ${gossipMutation.isPending ? 'animate-spin' : ''}`} />
                🔄 Run Gossip
              </button>

              <button
                onClick={() => flushMutation.mutate()}
                disabled={flushMutation.isPending || isFlushAnimating}
                className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 select-none shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-400/20"
              >
                <Wifi className={`w-4 h-4 shrink-0 ${flushMutation.isPending ? 'animate-pulse' : ''}`} />
                📡 Upload (4G)
              </button>

              <button
                onClick={() => {
                  if (confirm('Reset simulator mesh & clear backend cache?')) {
                    resetMutation.mutate();
                  }
                }}
                disabled={resetMutation.isPending}
                className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 border border-slate-800 disabled:opacity-50 select-none"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                🗑 Reset System
              </button>

            </div>

          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: MESH DEVICES VISUALIZER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[460px]">
        
        {/* REACT FLOW MAP */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner flex flex-col justify-between">
          <div className="absolute top-4 left-4 z-10 select-none">
            <Badge variant="outline" className="bg-slate-900/80 border-slate-800 text-slate-400 font-mono text-[9px] py-1 px-2.5 backdrop-blur">
              Visual Centerpiece: P2P Mesh Diagram
            </Badge>
          </div>
          <div className="flex-1 min-h-[360px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.1 }}
              className="bg-slate-950/20"
            >
              <Background color="#1e293b" gap={16} size={0.8} />
            </ReactFlow>
          </div>
        </div>

        {/* DEVICE STATUS CARDS & INSPECTOR */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col justify-between overflow-hidden border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800/40 select-none">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                📱 Mesh Node Inspector
              </CardTitle>
              <CardDescription>Click a device node in the graph to inspect buffer</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedNode ? (
                selectedNode === 'backend' ? (
                  <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                    <div>
                      <span className="text-slate-500 font-bold">Node:</span>{' '}
                      <span className="text-slate-200">backend-server</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">Role:</span>{' '}
                      <span className="text-indigo-400 font-bold">Clearing Bank Server</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Validates decryption authenticity via server key, verifies freshness, and applies atomic idempotency lock to block duplicate settlements.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="text-xs space-y-1 leading-relaxed">
                      <div>
                        <span className="text-slate-500 font-bold">Node Name:</span>{' '}
                        <span className="text-slate-200 font-semibold">{selectedNode}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">Uplink:</span>{' '}
                        <Badge variant={selectedNode === 'phone-bridge' ? 'success' : 'secondary'} className="py-0 px-1.5 text-[8px]">
                          {selectedNode === 'phone-bridge' ? '4G Bridge Active' : 'Mesh BLE Offline'}
                        </Badge>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Device Storage Buffer</span>
                      {(() => {
                        const apiDevice = meshState?.devices?.find((d) => d.deviceId === selectedNode);
                        const packetIds = apiDevice?.packetIds || [];

                        if (packetIds.length === 0) {
                          return (
                            <div className="text-[10px] text-slate-600 text-center py-8 border border-dashed border-slate-800/60 rounded-lg">
                              Buffer Empty. No packets held.
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {packetIds.map((pid) => {
                              const fullInfo = knownPackets[pid] || Object.values(knownPackets).find((kp) => kp.packetId.startsWith(pid));
                              return (
                                <div key={pid} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px] space-y-1 hover:border-slate-700 transition-colors">
                                  <div className="flex justify-between font-mono">
                                    <span className="text-cyan-400 font-bold">ID: {pid}</span>
                                    <span className="text-emerald-400 font-bold">₹{fullInfo?.amount || 500}</span>
                                  </div>
                                  <div className="text-[9px] text-slate-500 truncate">
                                    {fullInfo?.senderVpa || 'alice@demo'} ➔ {fullInfo?.receiverVpa || 'bob@demo'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-center text-center p-6 min-h-[180px]">
                  <div className="space-y-2">
                    <Database className="w-8 h-8 text-slate-800 mx-auto animate-pulse" />
                    <p className="text-xs text-slate-500 font-semibold select-none">No Device Selected</p>
                    <p className="text-[9px] text-slate-600 leading-normal max-w-[200px] mx-auto select-none">
                      Click on Alice, Strangers, or Bridge nodes in the network graph to inspect held packets.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* SECTION 3: TERMINAL ACTIVITY LOG */}
      <Card className="border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800/40 select-none">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
            🪵 Live Simulation Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-slate-950">
          <div className="h-56 overflow-y-auto font-mono text-[11px] leading-relaxed p-2.5 bg-slate-950 space-y-2 select-all rounded border border-slate-900 shadow-inner">
            {recentActivity.length === 0 ? (
              <div className="text-slate-700 text-center py-16">System idle. Ingress packets or run gossip rounds to stream events.</div>
            ) : (
              recentActivity.map((logLine, idx) => (
                <div key={idx} className={`border-b border-slate-900/40 pb-1.5 ${getLogColorClass(logLine)}`}>
                  {logLine}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* INTERACTIVE CRYPTOGRAPHY OVERLAY ANIMATION MODAL */}
      <AnimatePresence>
        {cryptoOverlayOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 relative font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1.5 select-none">
                  <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                  CRYPTOGRAPHIC ENVELOPE GENERATION PIPELINE
                </span>
                <button
                  onClick={() => setCryptoOverlayOpen(false)}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition-colors select-none"
                >
                  Close
                </button>
              </div>

              <div className="py-6 flex flex-col justify-center items-center min-h-[280px]">
                {/* STATE 0: Raw JSON */}
                {cryptoOverlayStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full space-y-3"
                  >
                    <Badge variant="cyan">Step 1: Compiling Plaintext JSON</Badge>
                    <pre className="text-[9px] bg-slate-950 border border-slate-800 p-4 rounded-lg text-emerald-400 overflow-x-auto select-none">
{`{
  "senderVpa": "${senderVpa}",
  "receiverVpa": "${receiverVpa}",
  "amount": ${parseFloat(amount || '0').toFixed(2)},
  "pinHash": "sha256(****)",
  "nonce": "e3df2b1-91fa-4f91...",
  "signedAt": ${Date.now()}
}`}
                    </pre>
                  </motion.div>
                )}

                {/* STATE 1: AES-GCM */}
                {cryptoOverlayStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full space-y-3"
                  >
                    <Badge variant="cyan">Step 2: Authenticated Symmetric Encryption</Badge>
                    <div className="space-y-2 bg-slate-950 border border-slate-800 p-4 rounded-lg select-none text-[9px] text-slate-400">
                      <div>
                        <span className="text-slate-500">AES-256 Symmetric Key:</span>
                        <div className="text-cyan-400 font-bold break-all">8F2A9C5E3D1B7E0A6F4C2B8D0E3...</div>
                      </div>
                      <div className="border-t border-slate-850 pt-2 mt-2">
                        <span className="text-slate-500 font-bold block mb-1">AES-GCM Ciphertext Payload:</span>
                        <div className="text-amber-500 break-all select-all font-bold animate-pulse leading-normal">
                          eJw1kF1OwzAMhK+EvYJ5kL/bHCS9AM7S0jQNQ8rN3h6QExBOsDhOaG2l6Pz5x/YeeiH8rZ2vJ
                          m9K2g9gq0QZpG0D9e9Cg0V5aK9CgxUaGoxgoz3p+X0s4rD1jXw0z2XW83WZZ3u+LNM4/b1c/6
                          3yNJfZzmdlXG/nLMs828t1me1mXn4A12vL8g==
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STATE 2: RSA OAEP Wrapping */}
                {cryptoOverlayStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full space-y-3"
                  >
                    <Badge variant="cyan">Step 3: Wrapping Session Key (Server Public Key)</Badge>
                    <div className="space-y-2 bg-slate-950 border border-slate-800 p-4 rounded-lg select-none text-[9px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <Key className="w-7 h-7 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-slate-500 font-bold">RSA Wrapped Key (256 bytes):</div>
                          <div className="text-emerald-400 break-all truncate font-bold text-[8px]">
                            c4f828a11b6d19f2a901e38bd388f910a2cd91d9d93eefcf83819e91823ab23d01ff...
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STATE 3: Complete Ingress */}
                {cryptoOverlayStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full space-y-4 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Packet Injected successfully</h4>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-normal">
                        Encrypted envelope generated offline and injected into {startDevice} memory queue.
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-left text-[9px] text-slate-400 max-w-sm mx-auto space-y-1 select-all">
                      <div>
                        <span className="text-slate-600 font-bold">Packet ID:</span>{' '}
                        <span className="text-cyan-400">{lastCreatedPacket?.packetId || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold">Outer TTL:</span>{' '}
                        <span className="text-slate-300">5 Hops</span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold">Ciphertext Hash:</span>{' '}
                        <span className="text-emerald-400">Claimed successfully</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setCryptoOverlayOpen(false)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] transition-all select-none"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
