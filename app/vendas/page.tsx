"use client";

import { useEffect, useState } from "react";
import {
    ShoppingBag,
    Calendar,
    Search,
    ChevronRight,
    MoreHorizontal,
    Loader2,
    X,
    Receipt,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface ItemVenda {
    id: string;
    quantidade: number;
    precoUnitario: number;
    produto: {
        nome: string;
    };
}

interface Venda {
    id: string;
    total: number;
    criadoEm: string;
    itens: ItemVenda[];
    transacao?: {
        id: string;
    };
    usuario?: {
        nome: string;
    };
}

export default function VendasPage() {
    const [vendas, setVendas] = useState<Venda[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchVendas = async () => {
            try {
                const res = await fetch("/api/vendas");
                const data = await res.json();

                if (Array.isArray(data)) {
                    setVendas(data);
                } else {
                    console.error("API returned non-array data:", data);
                    setVendas([]);
                }
            } catch (error) {
                console.error("Erro ao carregar vendas:", error);
                setVendas([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVendas();
    }, []);

    const filteredVendas = vendas.filter(venda =>
        venda.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venda.usuario?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venda.itens.some(item => item.produto.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto relative">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight">Histórico de Vendas</h2>
                        <p className="text-slate-500 mt-1">Acompanhe todos os pedidos realizados no PDV.</p>
                    </div>
                    <Link
                        href="/pdv"
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <ShoppingBag className="size-5" />
                        <span>Nova Venda (PDV)</span>
                    </Link>
                </header>

                {/* Filters & Search */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                        <input
                            type="text"
                            placeholder="Buscar por ID, produto ou vendedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Sales Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID Venda</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Data e Hora</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vendedor</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Itens</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredVendas.map((venda) => (
                                    <tr key={venda.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-xs font-bold text-slate-400">#{venda.id.slice(-6).toUpperCase()}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">
                                                    {new Date(venda.criadoEm).toLocaleDateString("pt-BR")}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(venda.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                    {venda.usuario?.nome?.[0] || "?"}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{venda.usuario?.nome || "Sistema"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                {venda.itens.reduce((acc, item) => acc + item.quantidade, 0)} itens
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-primary">
                                                R$ {venda.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => setSelectedVenda(venda)}
                                                className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 rounded-lg"
                                            >
                                                <ChevronRight className="size-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredVendas.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            Nenhuma venda encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* View Modal */}
            {selectedVenda && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
                    <div className="w-full max-w-md h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold">Detalhes da Venda</h3>
                                <p className="text-xs font-mono text-slate-500 mt-1">ID: {selectedVenda.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedVenda(null)}
                                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <X className="size-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <Receipt className="size-4" />
                                    Itens do Pedido
                                </h4>
                                <div className="space-y-3">
                                    {selectedVenda.itens.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{item.produto.nome}</span>
                                                <span className="text-xs text-slate-500">{item.quantidade}x R$ {item.precoUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <span className="font-semibold text-slate-700">
                                                R$ {(item.quantidade * item.precoUnitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal</span>
                                        <span>R$ {selectedVenda.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-2xl font-black text-slate-900 pt-2">
                                        <span>Total</span>
                                        <span className="text-primary">R$ {selectedVenda.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informações Adicionais</p>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                    <div>
                                        <p className="text-slate-400">Data</p>
                                        <p className="font-medium">{new Date(selectedVenda.criadoEm).toLocaleDateString("pt-BR")}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Vendedor</p>
                                        <p className="font-medium">{selectedVenda.usuario?.nome || "Sistema"}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Pagamento</p>
                                        <p className="font-medium text-emerald-500 flex items-center gap-1">
                                            <div className="size-2 rounded-full bg-emerald-500" />
                                            Confirmado
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedVenda(null)}
                                className="w-full py-4 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
                            >
                                Fechar Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
