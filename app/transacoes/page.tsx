"use client";

import { useEffect, useState } from "react";
import {
    Search,
    Calendar,
    Filter,
    ArrowUpDown,
    Download,
    TrendingUp,
    TrendingDown,
    User as UserIcon,
    Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Transaction {
    id: string;
    data: string;
    descricao: string;
    tipo: "ENTRADA" | "SAIDA";
    valor: number;
    categoria: string;
    usuario?: {
        nome: string;
    };
}

interface User {
    id: string;
    nome: string;
}

export default function TransacoesPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        usuarioId: ""
    });
    const { showToast } = useToast();

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/usuarios");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Erro ao carregar usuários:", err);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append("startDate", filters.startDate);
            if (filters.endDate) params.append("endDate", filters.endDate);
            if (filters.usuarioId) params.append("usuarioId", filters.usuarioId);

            const res = await fetch(`/api/transacoes?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            } else {
                showToast("Erro ao carregar transações.", "error");
            }
        } catch (err) {
            console.error("Erro ao carregar transações:", err);
            showToast("Erro de conexão.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchTransactions();
    }, []);

    const handleApplyFilters = () => {
        fetchTransactions();
    };

    const totalArrecadado = transactions
        .filter(t => t.tipo === "ENTRADA")
        .reduce((acc, t) => acc + t.valor, 0);

    const totalGasto = transactions
        .filter(t => t.tipo === "SAIDA")
        .reduce((acc, t) => acc + t.valor, 0);

    return (
        <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Histórico de Transações</h2>
                        <p className="text-sm text-slate-500 mt-1">Visualize e filtre todas as movimentações financeiras do sistema.</p>
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <TrendingUp className="size-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Arrecadado</p>
                            <p className="text-2xl font-bold text-emerald-600">
                                R$ {totalArrecadado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                            <TrendingDown className="size-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Gasto</p>
                            <p className="text-2xl font-bold text-rose-600">
                                R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                <Calendar className="size-3" /> Data Inicial
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                <Calendar className="size-3" /> Data Final
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                <UserIcon className="size-3" /> Usuário
                            </label>
                            <select
                                value={filters.usuarioId}
                                onChange={(e) => setFilters({ ...filters, usuarioId: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
                            >
                                <option value="">Todos os usuários</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.nome}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleApplyFilters}
                            className="bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            <Filter className="size-4" />
                            Filtrar
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Data</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Descrição</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Responsável</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-center">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="size-8 animate-spin text-primary" />
                                                <p className="font-medium">Carregando transações...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            Nenhuma transação encontrada para os filtros selecionados.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                                {new Date(t.data).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900">{t.descricao}</span>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">{t.categoria}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                        {t.usuario?.nome?.[0] || "?"}
                                                    </div>
                                                    <span className="text-sm text-slate-600">{t.usuario?.nome || "Sistema"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${t.tipo === "ENTRADA"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-rose-100 text-rose-700"
                                                    }`}>
                                                    {t.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold text-sm ${t.tipo === "ENTRADA" ? "text-emerald-600" : "text-rose-600"
                                                }`}>
                                                {t.tipo === "ENTRADA" ? "+" : "-"} R$ {t.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
