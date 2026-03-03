"use client";

import { useState } from "react";
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Upload,
    Save,
    ChevronRight,
    Lightbulb,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function FluxoCaixa() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tipo: "ENTRADA",
        valor: "",
        data: new Date().toISOString().split("T")[0],
        categoria: "",
        descricao: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.valor || !formData.categoria) {
            alert("Por favor, preencha o valor e a categoria.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/transacoes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    valor: parseFloat(formData.valor.replace(",", "."))
                })
            });

            if (response.ok) {
                alert("Transação salva com sucesso!");
                router.push("/");
            } else {
                alert("Erro ao salvar transação.");
            }
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-8">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                        <span className="hover:text-primary cursor-pointer transition-colors">Financeiro</span>
                        <ChevronRight className="size-3" />
                        <span className="font-medium text-slate-900">Novo Lançamento</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Novo Lançamento Financeiro</h2>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700">Tipo de Movimentação</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="relative flex items-center justify-center p-4 rounded-xl border-2 border-slate-100 cursor-pointer transition-all has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 group">
                                    <input
                                        checked={formData.tipo === "ENTRADA"}
                                        onChange={() => setFormData({ ...formData, tipo: "ENTRADA" })}
                                        className="hidden peer"
                                        name="tipo"
                                        type="radio"
                                        value="ENTRADA"
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <TrendingUp className="size-5" />
                                        </div>
                                        <span className="font-bold text-emerald-700">Entrada</span>
                                    </div>
                                    {formData.tipo === "ENTRADA" && (
                                        <div className="absolute top-2 right-2 transition-opacity">
                                            <CheckCircle2 className="size-5 text-emerald-500" fill="currentColor" />
                                        </div>
                                    )}
                                </label>

                                <label className="relative flex items-center justify-center p-4 rounded-xl border-2 border-slate-100 cursor-pointer transition-all has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 group">
                                    <input
                                        checked={formData.tipo === "SAIDA"}
                                        onChange={() => setFormData({ ...formData, tipo: "SAIDA" })}
                                        className="hidden peer"
                                        name="tipo"
                                        type="radio"
                                        value="SAIDA"
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                                            <TrendingDown className="size-5" />
                                        </div>
                                        <span className="font-bold text-rose-700">Saída</span>
                                    </div>
                                    {formData.tipo === "SAIDA" && (
                                        <div className="absolute top-2 right-2 transition-opacity">
                                            <CheckCircle2 className="size-5 text-rose-500" fill="currentColor" />
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Valor (R$)</label>
                                <div className="relative">
                                    {/* <span className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-400 font-medium font-sans text-sm">R$</span> */}
                                    <input
                                        value={formData.valor}
                                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
                                        placeholder="0,00"
                                        type="text"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Data da Transação</label>
                                <div className="relative">
                                    <input
                                        value={formData.data}
                                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
                                        type="date"
                                    />
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-5 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Categoria</label>
                            <select
                                value={formData.categoria}
                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Selecione uma categoria</option>
                                <option value="Fornecedor">Fornecedor</option>
                                <option value="Mensalidade">Mensalidade</option>
                                <option value="Rifa">Rifa</option>
                                <option value="Venda PDV">Venda PDV</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Descrição</label>
                            <textarea
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                                placeholder="Ex: Pagamento da primeira parcela do Buffet - Evento de Formatura"
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row gap-3">
                            <button
                                disabled={loading}
                                className="flex-1 bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                type="submit"
                            >
                                {loading ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                                Salvar Transação
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="px-8 py-4 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-all"
                                type="button"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-4">
                    <Lightbulb className="size-6 text-primary shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold text-primary">Dica:</span> Lançamentos bem detalhados facilitam a prestação de contas no final do semestre.
                    </p>
                </div>
            </div>
        </main>
    );
}
