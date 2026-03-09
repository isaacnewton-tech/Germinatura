"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Tag,
    History,
    Calendar,
    Percent,
    Layers,
    Loader2,
    Check,
    X,
    Filter,
    ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Promotion {
    id: string;
    produtoId: string;
    tipo: "VALOR" | "QUANTIDADE";
    valorDesconto: number;
    quantidadeMinima?: number;
    dataInicio: string;
    dataFim: string;
    ativo: boolean;
    produtos?: { nome: string }[];
}

interface Product {
    id: string;
    nome: string;
    preco: number;
    ativo: boolean;
}

export default function GestaoPromocoes() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [newPromo, setNewPromo] = useState({
        produtoId: "",
        tipo: "VALOR" as "VALOR" | "QUANTIDADE",
        valorDesconto: "",
        quantidadeMinima: "2",
        dataInicio: new Date().toISOString().split("T")[0],
        dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });

    const { showToast } = useToast();

    const loadData = async () => {
        setLoading(true);
        try {
            const [promoRes, prodRes] = await Promise.all([
                fetch("/api/admin/promocoes"),
                fetch("/api/produtos")
            ]);
            const promos = await promoRes.json();
            const prods = await prodRes.json();
            setPromotions(promos);
            // Filtrar apenas produtos base (não promocionais) para o dropdown
            setProducts(prods.filter((p: any) => !p.isPromocional));
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            showToast("Erro ao carregar dados da página.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPromo.produtoId || !newPromo.valorDesconto) {
            showToast("Preencha todos os campos obrigatórios.", "warning");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/admin/promocoes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newPromo,
                    valorDesconto: newPromo.valorDesconto.replace(",", "."),
                })
            });

            if (response.ok) {
                setIsModalOpen(false);
                setNewPromo({
                    ...newPromo,
                    produtoId: "",
                    valorDesconto: "",
                });
                loadData();
                showToast("Promoção cadastrada com sucesso!", "success");
            } else {
                const err = await response.json();
                showToast(err.error || "Erro ao cadastrar promoção.", "error");
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            showToast("Erro de conexão.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/admin/promocoes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ativo: !currentStatus })
            });

            if (response.ok) {
                setPromotions(promotions.map(p => p.id === id ? { ...p, ativo: !currentStatus } : p));
                showToast(`Promoção ${!currentStatus ? "ativada" : "inativada"} com sucesso!`, "success");
            } else {
                showToast("Erro ao atualizar status.", "error");
            }
        } catch (error) {
            showToast("Erro de conexão.", "error");
        }
    };

    const deletePromotion = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta promoção? Produtos temporários associados também serão removidos.")) return;

        try {
            const response = await fetch(`/api/admin/promocoes/${id}`, {
                method: "DELETE"
            });
            if (response.ok) {
                setPromotions(promotions.filter(p => p.id !== id));
                showToast("Promoção excluída com sucesso!", "success");
            } else {
                showToast("Erro ao excluir promoção.", "error");
            }
        } catch (error) {
            showToast("Erro de conexão.", "error");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Header Content */}
            <div className="bg-white border-b border-slate-200 p-4 md:p-8 shrink-0">
                <div className="max-w-6xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Promoções & Combos</h2>
                            <p className="text-sm text-slate-500 mt-1">Configure descontos por valor ou crie combos por quantidade.</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                        >
                            <Plus className="size-5" />
                            <span>Nova Promoção</span>
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativas</span>
                            <span className="text-2xl font-black text-emerald-500">{promotions.filter(p => p.ativo).length}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico</span>
                            <span className="text-2xl font-black text-slate-900">{promotions.length}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipos</span>
                            <div className="flex gap-2">
                                <Percent className="size-4 text-blue-500" />
                                <Layers className="size-4 text-orange-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-hidden p-4 md:p-8 flex flex-col">
                <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead className="sticky top-0 z-20">
                                <tr className="bg-slate-50/95 backdrop-blur-sm shadow-sm">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Produto</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Tipo</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Detalhes</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Vigência</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {promotions.map((promo) => {
                                    const now = new Date();
                                    const isExpired = new Date(promo.dataFim) < now;
                                    const isFuture = new Date(promo.dataInicio) > now;
                                    const prodNome = products.find(p => p.id === promo.produtoId)?.nome || "Produto Removido";

                                    return (
                                        <tr key={promo.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${promo.tipo === "VALOR" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>
                                                        {promo.tipo === "VALOR" ? <Percent className="size-4" /> : <Layers className="size-4" />}
                                                    </div>
                                                    <span className="font-bold text-slate-900">{prodNome}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${promo.tipo === "VALOR" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                                                    {promo.tipo === "VALOR" ? "Desconto %" : "Combo Qtd"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                {promo.tipo === "VALOR" ? (
                                                    <span className="font-bold text-slate-700">{promo.valorDesconto}% de desconto</span>
                                                ) : (
                                                    <span className="font-bold text-slate-700">{promo.quantidadeMinima} un. por R$ {promo.valorDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        {new Date(promo.dataInicio).toLocaleDateString()} - {new Date(promo.dataFim).toLocaleDateString()}
                                                    </span>
                                                    {isExpired ? (
                                                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Expirada</span>
                                                    ) : isFuture ? (
                                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">Agendada</span>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Em Vigor</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleStatus(promo.id, promo.ativo)}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${promo.ativo ? "bg-primary" : "bg-slate-200"}`}
                                                    >
                                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${promo.ativo ? "translate-x-5" : "translate-x-1"}`} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => deletePromotion(promo.id)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <X className="size-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Cadastro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-white flex flex-col max-h-[95vh]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nova Promoção</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Configure as regras de desconto para o produto.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors"
                            >
                                <X className="size-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* Produto */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Produto da Promoção</label>
                                <select
                                    required
                                    value={newPromo.produtoId}
                                    onChange={(e) => setNewPromo({ ...newPromo, produtoId: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold appearance-none cursor-pointer"
                                >
                                    <option value="">Selecione um produto...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome} (R$ {p.preco.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tipo */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Promoção</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setNewPromo({ ...newPromo, tipo: "VALOR" })}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newPromo.tipo === "VALOR" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"}`}
                                    >
                                        <Percent className="size-6" />
                                        <span className="text-xs font-black uppercase">Por Valor (%)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewPromo({ ...newPromo, tipo: "QUANTIDADE" })}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newPromo.tipo === "QUANTIDADE" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"}`}
                                    >
                                        <Layers className="size-6" />
                                        <span className="text-xs font-black uppercase">Por Qtd (Combo)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Detalhes Dinâmicos */}
                            {newPromo.tipo === "QUANTIDADE" ? (
                                <div className="grid grid-cols-2 gap-6 p-6 bg-orange-50/50 rounded-3xl border border-orange-100 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Qtd no Combo</label>
                                        <input
                                            type="number"
                                            value={newPromo.quantidadeMinima}
                                            onChange={(e) => setNewPromo({ ...newPromo, quantidadeMinima: e.target.value })}
                                            className="w-full px-5 py-3 bg-white border-2 border-orange-200/50 rounded-xl focus:border-orange-500 outline-none transition-all font-black text-xl text-orange-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Preço do Combo</label>
                                        <input
                                            type="text"
                                            placeholder="0,00"
                                            value={newPromo.valorDesconto}
                                            onChange={(e) => setNewPromo({ ...newPromo, valorDesconto: e.target.value })}
                                            className="w-full px-5 py-3 bg-white border-2 border-orange-200/50 rounded-xl focus:border-orange-500 outline-none transition-all font-black text-xl text-orange-600"
                                        />
                                    </div>
                                    <p className="col-span-2 text-[10px] font-bold text-orange-400 italic">Será criado um produto temporário separado no PDV.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Porcentagem de Desconto (%)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="text"
                                            placeholder="Ex: 10"
                                            value={newPromo.valorDesconto}
                                            onChange={(e) => setNewPromo({ ...newPromo, valorDesconto: e.target.value })}
                                            className="flex-1 w-0 min-w-0 px-5 py-3 bg-white border-2 border-blue-200/50 rounded-xl focus:border-blue-500 outline-none transition-all font-black text-4xl text-blue-600"
                                        />
                                        <span className="text-4xl font-black text-blue-300 shrink-0">%</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-blue-400 italic">Desconto aplicado diretamente no preço do produto pai.</p>
                                </div>
                            )}

                            {/* Validade */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Início da Vigência</label>
                                    <input
                                        type="date"
                                        value={newPromo.dataInicio}
                                        onChange={(e) => setNewPromo({ ...newPromo, dataInicio: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary outline-none transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fim da Vigência</label>
                                    <input
                                        type="date"
                                        value={newPromo.dataFim}
                                        onChange={(e) => setNewPromo({ ...newPromo, dataFim: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-5 text-slate-500 font-bold rounded-2xl hover:bg-white transition-all border-2 border-slate-200 uppercase tracking-widest text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="flex-[2] py-5 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
                            >
                                {isSaving ? (
                                    <Loader2 className="size-5 animate-spin" />
                                ) : (
                                    "Ativar Promoção"
                                )}
                                {!isSaving && <Check className="size-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
