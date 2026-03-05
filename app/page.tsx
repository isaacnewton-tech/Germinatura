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
  Loader2,
  Pencil,
  Check,
  X as CloseIcon
} from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { TransactionTable } from "@/components/ui/TransactionTable";
import { useToast } from "@/components/ui/Toast";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [newMeta, setNewMeta] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const { showToast } = useToast();

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro desconhecido");
      }

      setData(json);
      setNewMeta(json.meta?.toString() || "60000");
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      // Mantém data como null para mostrar mensagem de erro
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateMeta = async () => {
    const valorMeta = parseFloat(newMeta.replace(",", "."));

    if (isNaN(valorMeta) || valorMeta <= 0) {
      showToast("Por favor, insira um valor válido para a meta.", "warning");
      return;
    }

    setSavingMeta(true);
    try {
      const res = await fetch("/api/configuracoes/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: valorMeta })
      });

      if (res.ok) {
        setIsEditingMeta(false);
        showToast("Meta atualizada com sucesso!", "success");
        fetchDashboardData();
      } else {
        const json = await res.json();
        showToast(json.error || "Erro ao atualizar meta", "error");
      }
    } catch (err) {
      console.error("Erro ao atualizar meta:", err);
      showToast("Erro de conexão ao atualizar meta", "error");
    } finally {
      setSavingMeta(false);
    }
  };

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
            value={`R$ ${(data.saldoAtual ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            variant="success"
            icon={Wallet}
            trend={{ value: "Saldo consolidado", isUp: true }}
          />
          <KPICard
            label="Total Arrecadado"
            value={`R$ ${(data.totalArrecadado ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            variant="primary"
            icon={PiggyBank}
            subtext="Entradas totais no sistema"
          />
          <KPICard
            label="Total Gasto"
            value={`R$ ${(data.totalGasto ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            variant="danger"
            icon={ShoppingCart}
            subtext="Saídas totais registradas"
          />
        </div>

        {/* Goal Progress */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-lg">Meta da Formatura</h4>
                <button
                  onClick={() => setIsEditingMeta(true)}
                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                  title="Editar Meta"
                >
                  <Pencil className="size-4" />
                </button>
              </div>
              <p className="text-sm text-slate-500">Progresso de arrecadação dos alunos</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary">
                {Math.min(100, Math.round((data.totalArrecadado / (data.meta || 60000)) * 100))}%
              </span>
              <span className="text-sm text-slate-500 ml-1">Arrecadado</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (data.totalArrecadado / (data.meta || 60000)) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className="font-semibold">R$ {(data.totalArrecadado ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            <span className="text-slate-500">Meta: R$ {(data.meta ?? 60000).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Edit Meta Overlay/Modal-like */}
          {isEditingMeta && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="w-full max-w-xs space-y-4">
                <div className="text-center">
                  <h5 className="font-bold text-slate-900">Editar Meta</h5>
                  <p className="text-xs text-slate-500">Defina o novo valor objetivo</p>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input
                    autoFocus
                    type="number"
                    value={newMeta}
                    onChange={(e: any) => setNewMeta(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditingMeta(false);
                      setNewMeta(data.meta.toString());
                    }}
                    className="flex-1 py-2 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-colors border border-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={savingMeta}
                    onClick={handleUpdateMeta}
                    className="flex-1 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    {savingMeta ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Transactions Table */}
        <TransactionTable
          transactions={(data?.transacoesRecentes || []).map((t: any) => ({
            ...t,
            data: new Date(t.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
          }))}
        />
      </div>

      <footer className="p-8 text-center text-slate-500 text-xs">
        © 2026 Comissão de Formatura Germinare TECH. Todos direitos reservados.
      </footer>
    </div>
  );
}
