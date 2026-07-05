'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { meshApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Wallet,
  Search,
  ArrowUpDown,
  Coins,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Account } from '../../types';

type SortKey = 'vpa' | 'holderName' | 'balance';
type SortOrder = 'asc' | 'desc';

export default function AccountsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('balance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Query Accounts from backend
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: meshApi.getAccounts,
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

  // Filter and Sort Accounts
  const getProcessedAccounts = (): Account[] => {
    if (!accounts) return [];

    let processed = [...accounts];

    // Filter by search query (VPA or Holder Name)
    if (searchQuery) {
      processed = processed.filter(
        (acc) =>
          acc.vpa.toLowerCase().includes(searchQuery.toLowerCase()) ||
          acc.holderName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    processed.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'balance') {
        valA = parseFloat(a.balance.toString());
        valB = parseFloat(b.balance.toString());
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return processed;
  };

  const processedAccounts = getProcessedAccounts();

  // Summary Metrics
  const totalAccountsCount = accounts?.length || 0;
  const totalBalanceVal = accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance.toString()), 0) || 0;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(processedAccounts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = processedAccounts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2 select-none">
          <Wallet className="w-5 h-5 text-emerald-400" />
          🏦 Account Balances
        </h2>
        <p className="text-xs text-slate-500 select-none">
          View and audit user nodes balances stored inside the backend clearing database.
        </p>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <Card className="bg-emerald-500/5 border-emerald-500/15">
          <CardHeader className="p-4 pb-1 select-none">
            <CardDescription className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Total Accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {totalAccountsCount}
            </div>
            <Users className="w-8 h-8 text-emerald-500/20" />
          </CardContent>
        </Card>

        <Card className="bg-indigo-500/5 border-indigo-500/15">
          <CardHeader className="p-4 pb-1 select-none">
            <CardDescription className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Total Balance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <div className="text-2xl font-black text-indigo-400 font-mono tracking-tight">
              ₹{totalBalanceVal.toFixed(2)}
            </div>
            <Coins className="w-8 h-8 text-indigo-500/20" />
          </CardContent>
        </Card>

        <Card className="bg-cyan-500/5 border-cyan-500/15">
          <CardHeader className="p-4 pb-1 select-none">
            <CardDescription className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Average Account Capital
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <div className="text-2xl font-black text-cyan-400 font-mono tracking-tight">
              ₹{(totalAccountsCount > 0 ? totalBalanceVal / totalAccountsCount : 0).toFixed(2)}
            </div>
            <TrendingUp className="w-8 h-8 text-cyan-500/20" />
          </CardContent>
        </Card>

      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search accounts by VPA address or holder name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-transparent border-none outline-none text-xs text-slate-300 placeholder-slate-650 w-full"
        />
      </div>

      {/* ACCOUNTS DATA TABLE */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 text-slate-500 text-xs font-mono">
              <RefreshCw className="w-4.5 h-4.5 animate-spin mr-2 inline text-emerald-450" />
              Loading database state...
            </div>
          ) : paginatedAccounts.length === 0 ? (
            <div className="text-center py-16 text-slate-600 text-xs select-none">
              No accounts found in database registry.
            </div>
          ) : (
            <div className="flex flex-col">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-900/30 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <th
                      onClick={() => handleSort('vpa')}
                      className="p-4 cursor-pointer hover:text-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Virtual Payment Address (VPA)
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('holderName')}
                      className="p-4 cursor-pointer hover:text-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Account Holder
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('balance')}
                      className="p-4 cursor-pointer hover:text-slate-300 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Capital Balance
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                  {paginatedAccounts.map((acc) => (
                    <tr key={acc.vpa} className="hover:bg-slate-900/15 transition-all">
                      <td className="p-4 font-sans font-semibold text-slate-200 select-all">
                        {acc.vpa}
                      </td>
                      <td className="p-4 font-sans text-slate-300">{acc.holderName}</td>
                      <td className="p-4 text-right font-bold text-emerald-400 text-xs">
                        ₹{parseFloat(acc.balance.toString()).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION PANEL */}
              <div className="p-4 border-t border-slate-850 flex items-center justify-between bg-slate-900/10">
                <span className="text-[10px] text-slate-500 font-medium">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, processedAccounts.length)} of {processedAccounts.length} entries
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
