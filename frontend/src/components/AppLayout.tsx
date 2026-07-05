'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePacketRegistry } from '../app/providers';
import { meshApi } from '../lib/api';
import {
  Network,
  Activity,
  Layers,
  ShieldCheck,
  History,
  Send,
  RefreshCw,
  Trash2,
  Search,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  BarChart3,
  LayoutDashboard,
  Wallet,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { recentActivity, addActivityLog, clearActivityLogs } = usePacketRegistry();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live backend status check
  const { data: meshState, error, isSuccess } = useQuery({
    queryKey: ['meshState'],
    queryFn: meshApi.getMeshState,
    refetchInterval: 3000,
  });

  const isConnected = isSuccess && !error;

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: meshApi.resetMesh,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meshState'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      addActivityLog('Mesh network and server-side idempotency cache cleared successfully.');
    },
    onError: (err: any) => {
      addActivityLog(`System reset failed: ${err.message || 'Server error'}`);
    },
  });

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the mesh network simulation and backend idempotency cache?')) {
      resetMutation.mutate();
      clearActivityLogs();
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Accounts', path: '/accounts', icon: Wallet },
    { name: 'Transactions', path: '/transactions', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* GLOW DECORATIONS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* SIDEBAR */}
      <aside
        className={`bg-slate-900/60 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 z-30 flex flex-col shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* LOGO */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <Network className="w-5 h-5 text-emerald-400" />
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                UPI Offline Mesh
              </span>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-200 rounded-md p-1 hover:bg-slate-800/50 hidden md:block"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* NAV ITEMS */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {sidebarOpen ? (
                  <span className="truncate">{item.name}</span>
                ) : (
                  <div className="absolute left-16 bg-slate-900 border border-slate-800 px-2 py-1 rounded text-xs opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
          <div className="flex flex-col gap-2.5">
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Backend:</span>
                  <span
                    className={`font-semibold ${
                      isConnected ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono select-all truncate">
                  {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}
                </div>
              </>
            ) : (
              <div
                className={`w-3 h-3 rounded-full mx-auto ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-20">
          
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800/60 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 w-64">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search transaction, packet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-300 placeholder-slate-600 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Health status indicator badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold select-none ${
                isConnected
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]'
                  : 'bg-rose-500/5 border-rose-500/20 text-rose-400 animate-pulse'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`} />
              <span className="hidden md:inline">SYSTEM STATUS:</span>
              <span>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {/* Active Nodes telemetric count */}
            {isConnected && meshState && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 border-r border-slate-800 pr-4">
                <span className="font-mono text-emerald-400 font-bold">{meshState.devices?.length || 0}</span>
                <span>Devices</span>
                <span className="mx-1.5 font-slate-700">•</span>
                <span className="font-mono text-cyan-400 font-bold">{meshState.idempotencyCacheSize || 0}</span>
                <span>Idempotency Keys</span>
              </div>
            )}

            {/* Global system Reset action */}
            <button
              onClick={handleReset}
              disabled={resetMutation.isPending}
              className="px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="Reset mesh simulators and server cache"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset System</span>
            </button>

            {/* Notifications button */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 relative transition-all active:scale-95"
            >
              <Bell className="w-5 h-5" />
              {recentActivity.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              )}
            </button>
          </div>
        </header>

        {/* PAGE BODY */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </main>

        {/* LOGS PANEL SLIDEOUT (NOTIFICATION DRAWER) */}
        {notificationsOpen && (
          <div className="absolute inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-40 flex flex-col transition-all duration-300">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm tracking-wide text-slate-200">Simulation Activity Logs</span>
              </div>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="text-slate-400 hover:text-slate-200 rounded-md p-1 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs text-emerald-400 bg-slate-950/40">
              {recentActivity.length === 0 ? (
                <div className="text-slate-500 text-center py-10">No recent logs. Run simulator actions to populate activity.</div>
              ) : (
                recentActivity.map((log, idx) => (
                  <div key={idx} className="border-b border-slate-900/60 pb-2 break-words leading-relaxed">
                    {log}
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
              <button
                onClick={clearActivityLogs}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
              >
                Clear logs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
