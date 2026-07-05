'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePacketRegistry } from '../providers';
import { meshApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  History,
  Search,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Transaction } from '../../types';

type SortKey = 'id' | 'amount' | 'hopCount' | 'settledAt';
type SortOrder = 'asc' | 'desc';

export default function TransactionsPage() {
  const { duplicateTransactions } = usePacketRegistry();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('settledAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Query database transactions
  const { data: dbTransactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: meshApi.getTransactions,
    refetchInterval: 3000,
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Merge database transactions & client-side duplicate transactions
  const getMergedTransactions = (): any[] => {
    const dbList = dbTransactions ? [...dbTransactions] : [];
    const dupList = duplicateTransactions ? [...duplicateTransactions] : [];

    // Map db list and add database id
    const mappedDb = dbList.map((tx) => ({
      idStr: `#${tx.id}`,
      idVal: tx.id,
      packetHash: tx.packetHash,
      senderVpa: tx.senderVpa,
      receiverVpa: tx.receiverVpa,
      amount: parseFloat(tx.amount.toString()),
      signedAt: tx.signedAt,
      settledAt: tx.settledAt,
      bridgeNodeId: tx.bridgeNodeId,
      hopCount: tx.hopCount,
      status: tx.status,
    }));

    // Map duplicate list
    const mappedDups = dupList.map((tx) => ({
      idStr: 'DUP-DROP',
      idVal: 0, // for sorting lower
      packetHash: tx.packetHash,
      senderVpa: tx.senderVpa,
      receiverVpa: tx.receiverVpa,
      amount: tx.amount,
      signedAt: tx.signedAt,
      settledAt: tx.settledAt,
      bridgeNodeId: tx.bridgeNodeId,
      hopCount: tx.hopCount,
      status: tx.status,
    }));

    // Combine
    let combined = [...mappedDb, ...mappedDups];

    // Filter by search query
    if (searchQuery) {
      combined = combined.filter(
        (tx) =>
          tx.senderVpa.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.receiverVpa.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.packetHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.bridgeNodeId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      combined = combined.filter((tx) => tx.status === statusFilter);
    }

    // Sort
    combined.sort((a, b) => {
      let valA = a[sortKey === 'id' ? 'idVal' : sortKey];
      let valB = b[sortKey === 'id' ? 'idVal' : sortKey];

      if (sortKey === 'settledAt') {
        valA = new Date(a.settledAt).getTime();
        valB = new Date(b.settledAt).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return combined;
  };

  const processedTxs = getMergedTransactions();

  // Stats
  const totalTxsCount = processedTxs.length;
  const settledCount = processedTxs.filter((t) => t.status === 'SETTLED').length;
  const rejectedCount = processedTxs.filter((t) => t.status === 'REJECTED').length;
  const duplicateCount = processedTxs.filter((t) => t.status === 'DUPLICATE_DROPPED').length;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(processedTxs.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTxs = processedTxs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2 select-none">
          <History className="w-5 h-5 text-emerald-400" />
          📜 Transaction Ledger
        </h2>
        <p className="text-xs text-slate-500 select-none">
          Audit cleared transactions, validation errors, and dropped duplicate uploads inside the secure ledger database.
        </p>
      </div>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Ingress Runs', value: totalTxsCount, color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/15' },
          { title: 'Settled Payments', value: settledCount, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/15' },
          { title: 'Rejected Envelopes', value: rejectedCount, color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/15' },
          { title: 'Duplicate Drops', value: duplicateCount, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/15' },
        ].map((stat) => (
          <Card key={stat.title} className={`${stat.bg}`}>
            <CardHeader className="p-4 pb-0.5 select-none">
              <CardDescription className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {stat.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-xl font-extrabold ${stat.color} font-mono`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FILTERS PANEL */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 backdrop-blur-md">
        <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search transactions by sender, receiver, VPA, bridge, or hash..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent border-none outline-none text-xs text-slate-300 placeholder-slate-650 w-full"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none outline-none text-xs text-slate-300 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SETTLED">SETTLED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="DUPLICATE_DROPPED">DUPLICATE_DROPPED</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-16 text-slate-500 text-xs font-mono">
              <RefreshCw className="w-4.5 h-4.5 animate-spin mr-2 inline text-emerald-450" />
              Loading database state...
            </div>
          ) : paginatedTxs.length === 0 ? (
            <div className="text-center py-16 text-slate-600 text-xs select-none">
              No transactions captured. Inject payments and gossip them to Bridges to begin.
            </div>
          ) : (
            <div className="flex flex-col">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-900/30 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <th
                      onClick={() => handleSort('id')}
                      className="p-4 cursor-pointer hover:text-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        ID
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </th>
                    <th className="p-4">Sender (VPA)</th>
                    <th className="p-4">Receiver (VPA)</th>
                    <th
                      onClick={() => handleSort('amount')}
                      className="p-4 cursor-pointer hover:text-slate-300 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Amount
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Bridge Node</th>
                    <th
                      onClick={() => handleSort('hopCount')}
                      className="p-4 cursor-pointer hover:text-slate-300 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Hops
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('settledAt')}
                      className="p-4 cursor-pointer hover:text-slate-300 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Settled Time
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                  {paginatedTxs.map((tx, idx) => {
                    const time = new Date(tx.settledAt).toLocaleTimeString();
                    const date = new Date(tx.settledAt).toLocaleDateString();

                    return (
                      <tr key={tx.id || `${tx.packetHash}-${idx}`} className="hover:bg-slate-900/15 transition-all">
                        <td className="p-4 font-bold text-slate-500">{tx.idStr}</td>
                        <td className="p-4 font-sans font-semibold text-slate-200 select-all">{tx.senderVpa}</td>
                        <td className="p-4 font-sans font-semibold text-slate-200 select-all">{tx.receiverVpa}</td>
                        <td className="p-4 text-right font-bold text-emerald-400 text-xs">
                          ₹{tx.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center">
                            {tx.status === 'SETTLED' ? (
                              <Badge variant="success" className="gap-1 font-semibold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                SETTLED
                              </Badge>
                            ) : tx.status === 'REJECTED' ? (
                              <Badge variant="destructive" className="gap-1 font-semibold">
                                <AlertCircle className="w-3 h-3 text-rose-450" />
                                REJECTED
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="gap-1 font-semibold">
                                <AlertCircle className="w-3 h-3 text-amber-400" />
                                DUP_DROP
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="cyan" className="font-semibold">{tx.bridgeNodeId}</Badge>
                        </td>
                        <td className="p-4 text-center font-extrabold text-slate-400">{tx.hopCount}</td>
                        <td className="p-4 text-right text-[10px] text-slate-500 font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-650" />
                            <span>
                              {date} {time}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* PAGINATION PANEL */}
              <div className="p-4 border-t border-slate-850 flex items-center justify-between bg-slate-900/10">
                <span className="text-[10px] text-slate-500 font-medium">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, processedTxs.length)} of {processedTxs.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
