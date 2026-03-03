"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  PiggyBank,
  ShoppingCart,
  Search,
  Bell,
  Settings,
  TrendingUp,
  Loader2
} from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { TransactionTable } from "@/components/ui/TransactionTable";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar dashboard:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-500">Erro ao carregar dados do dashboard.</div>;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-lg md:text-xl font-bold tracking-tight">Finance Dashboard</h2>
          <span className="hidden xs:inline-block bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <input
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-64"
              placeholder="Pesquisar transações..."
              type="text"
            />
          </div>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <Bell className="size-5" />
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            label="Saldo Atual"
            value={`R$ ${data.saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            variant="success"
            icon={Wallet}
            trend={{ value: "Saldo consolidado", isUp: true }}
          />
          <KPICard
            label="Total Arrecadado"
            value={`R$ ${data.totalArrecadado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            variant="primary"
            icon={PiggyBank}
            subtext="Entradas totais no sistema"
          />
          <KPICard
            label="Total Gasto"
            value={`R$ ${data.totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            variant="danger"
            icon={ShoppingCart}
            subtext="Saídas totais registradas"
          />
        </div>

        {/* Goal Progress */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="font-bold text-lg">Meta da Formatura</h4>
              <p className="text-sm text-slate-500">Progresso de arrecadação dos alunos</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary">
                {Math.min(100, Math.round((data.totalArrecadado / Number(process.env.NEXT_PUBLIC_PIX_META_ARRECADACAO || 60000)) * 100))}%
              </span>
              <span className="text-sm text-slate-500 ml-1">Arrecadado</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (data.totalArrecadado / Number(process.env.NEXT_PUBLIC_PIX_META_ARRECADACAO || 60000)) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className="font-semibold">R$ {data.totalArrecadado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            <span className="text-slate-500">Meta: R$ {Number(process.env.NEXT_PUBLIC_PIX_META_ARRECADACAO || 60000).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>


        {/* Transactions Table */}
        <TransactionTable
          transactions={data.transacoesRecentes.map((t: any) => ({
            ...t,
            data: new Date(t.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
          }))}
        />
      </div>

      <footer className="p-8 text-center text-slate-500 text-xs">
        © 2024 Graduation Committee Management System. All rights reserved.
      </footer>
    </div>
  );
}
