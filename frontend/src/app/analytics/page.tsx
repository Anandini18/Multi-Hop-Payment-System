'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePacketRegistry } from '../providers';
import { meshApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Award,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Hash,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const { duplicateTransactions, recentActivity } = usePacketRegistry();

  // Guard against hydration mismatch in Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Queries
  const { data: meshState } = useQuery({
    queryKey: ['meshState'],
    queryFn: meshApi.getMeshState,
    refetchInterval: 3000,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: meshApi.getTransactions,
    refetchInterval: 3000,
  });

  if (!mounted) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500 font-mono text-xs select-none">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-400" />
        Running analytics engine...
      </div>
    );
  }

  // Summary Metrics calculations
  const dbTxs = transactions || [];
  const dupsCount = duplicateTransactions?.length || 0;
  
  const settledCount = dbTxs.filter((t) => t.status === 'SETTLED').length;
  const rejectedCount = dbTxs.filter((t) => t.status === 'REJECTED').length;
  const totalCount = dbTxs.length + dupsCount;
  
  const cacheSize = meshState?.idempotencyCacheSize || 0;

  // Chart 1: Mesh Activity Chart (device packet loads)
  const meshActivityData = meshState?.devices?.map((d) => ({
    name: d.deviceId.replace('phone-', ''),
    packets: d.packetCount,
  })) || [
    { name: 'alice', packets: 0 },
    { name: 'stranger1', packets: 0 },
    { name: 'stranger2', packets: 0 },
    { name: 'stranger3', packets: 0 },
    { name: 'bridge', packets: 0 },
  ];

  // Chart 2: Status Distribution Pie Chart
  const statusDistData = [
    { name: 'Settled', value: settledCount, color: '#10b981' },
    { name: 'Rejected', value: rejectedCount, color: '#f43f5e' },
    { name: 'Duplicate Drop', value: dupsCount, color: '#f59e0b' },
  ];

  // Chart 3: Transaction Volume History
  const getVolumeHistory = () => {
    if (dbTxs.length === 0) {
      return [{ time: '00:00', amount: 0 }];
    }
    // Map last 8 database transactions chronological
    return [...dbTxs]
      .reverse()
      .slice(-8)
      .map((t) => ({
        time: new Date(t.settledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        amount: parseFloat(t.amount.toString()),
      }));
  };

  const volumeData = getVolumeHistory();

  // Chart 4: Settlement Trend (Cumulative line count)
  const getSettlementTrend = () => {
    if (dbTxs.length === 0) {
      return [{ name: 'Init', settled: 0 }];
    }
    let count = 0;
    return [...dbTxs]
      .reverse()
      .map((t, idx) => {
        if (t.status === 'SETTLED') {
          count++;
        }
        return {
          name: `Tx ${idx + 1}`,
          settled: count,
        };
      });
  };

  const trendData = getSettlementTrend();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2 select-none">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-500 select-none">
            System performance telemetry, device storage buffers, propagation hop count metrics, and ledger settlement analytics.
          </p>
        </div>
        <Badge variant="outline" className="bg-slate-900 border-slate-800 text-slate-400 select-none">
          Live Telemetry active
        </Badge>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: 'Total Ingress Runs', value: totalCount, desc: 'Db runs + Duplicate uploads', color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/15', icon: Activity },
          { title: 'Settled Tx', value: settledCount, desc: 'Successfully settled ledger', color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/15', icon: CheckCircle2 },
          { title: 'Rejected Tx', value: rejectedCount, desc: 'Decryption & freshness errors', color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/15', icon: AlertTriangle },
          { title: 'Duplicate Drops', value: dupsCount, desc: 'Intercepted at idempotency', color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/15', icon: Layers },
          { title: 'Idempotency Cache', value: cacheSize, desc: 'Active Redis claims keys', color: 'text-cyan-400', bg: 'bg-cyan-500/5 border-cyan-500/15', icon: Hash },
        ].map((kpi, idx) => (
          <Card key={kpi.title} className={`${kpi.bg} relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:scale-105 transition-transform">
              <kpi.icon className="w-12 h-12" />
            </div>
            <CardHeader className="p-4 pb-0.5 select-none">
              <CardDescription className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {kpi.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-xl font-extrabold ${kpi.color} font-mono tracking-tight`}>{kpi.value}</div>
              <span className="text-[9px] text-slate-600 block mt-1">{kpi.desc}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CHART 1: MESH ACTIVITY DEVICE LOAD */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              Mesh Activity load
            </CardTitle>
            <CardDescription>Number of payment envelopes currently held in device buffers</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meshActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#06b6d4', fontSize: '10px' }}
                />
                <Bar dataKey="packets" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CHART 2: SETTLEMENT TREND */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Settlement Success Trend
            </CardTitle>
            <CardDescription>Cumulative growth of successfully settled payments</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#10b981', fontSize: '10px' }}
                />
                <Line type="monotone" dataKey="settled" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#059669', r: 3.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CHART 3: TRANSACTION VOLUME */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              Transaction Capital Volume
            </CardTitle>
            <CardDescription>Amount value in INR (₹) of recent settled database runs</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#06b6d4', fontSize: '10px' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#0891b2', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CHART 4: STATUS DISTRIBUTION PIE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              Status Distribution Ratio
            </CardTitle>
            <CardDescription>Outcome allocations for all attempted bridge uploads</CardDescription>
          </CardHeader>
          <CardContent className="h-60 flex items-center justify-between">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-36 space-y-2 font-mono text-[9px] text-slate-500">
              {statusDistData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}:</span>
                  <span className="font-extrabold text-slate-300 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
