"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ShoppingBag,
    Plus,
    Minus,
    Check,
    Loader2,
    Search,
    Package,
    ArrowLeft
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

interface Produto {
    id: string;
    nome: string;
    imagemUrl?: string;
    estoque: number;
    precos: { valor: number }[];
}

interface ItemCarrinho {
    produto: Produto;
    quantidade: number;
}

export default function NovaReservaPage() {
    const router = useRouter();
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { showToast } = useToast();

    const fetchProdutos = async () => {
        try {
            const res = await fetch("/api/produtos");
            if (res.ok) {
                const data = await res.json();
                setProdutos(data);
            }
        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProdutos();
    }, []);

    const addToCart = (produto: Produto) => {
        setCarrinho(prev => {
            const existing = prev.find(item => item.produto.id === produto.id);
            if (existing) {
                return prev.map(item =>
                    item.produto.id === produto.id
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                );
            }
            return [...prev, { produto, quantidade: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCarrinho(prev => prev.map(item => {
            if (item.produto.id === id) {
                const newQty = Math.max(0, item.quantidade + delta);
                return { ...item, quantidade: newQty };
            }
            return item;
        }).filter(item => item.quantidade > 0));
    };

    const handleFinalizarReserva = async () => {
        if (carrinho.length === 0) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/reservas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itens: carrinho.map(item => ({
                        produtoId: item.produto.id,
                        quantidade: item.quantidade
                    }))
                })
            });

            if (res.ok) {
                showToast("Reserva enviada com sucesso!", "success");
                router.push("/reservas");
            } else {
                const errData = await res.json();
                showToast(errData.error || "Erro ao realizar reserva", "error");
            }
        } catch (error) {
            showToast("Erro de conexão", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProdutos = produtos.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
            {/* Lista de Produtos */}
            <div className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/reservas" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-2 text-sm font-bold">
                            <ArrowLeft className="size-4" />
                            Voltar para minhas reservas
                        </Link>
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Catálogo de Produtos</h2>
                        <p className="text-slate-500">Selecione os itens que deseja reservar.</p>
                    </div>
                </header>

                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
                        {filteredProdutos.map(produto => (
                            <div key={produto.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full">
                                {produto.estoque === 0 && (
                                    <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest z-10">
                                        Esgotado
                                    </div>
                                )}
                                <div className="h-40 mb-4 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 relative shrink-0">
                                    {produto.imagemUrl ? (
                                        <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                            <Package className="size-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <h3 className="font-bold text-slate-900 mb-1 line-clamp-2 min-h-[2.5rem]" title={produto.nome}>{produto.nome}</h3>
                                    <p className="text-xl font-black text-primary mb-2">
                                        {produto.precos?.[0]?.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                                    </p>
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-6">
                                        <Package className="size-3.5" />
                                        {produto.estoque} em estoque
                                    </p>
                                    <button
                                        onClick={() => addToCart(produto)}
                                        disabled={produto.estoque === 0}
                                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-slate-900 mt-auto"
                                    >
                                        <Plus className="size-5" />
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Carrinho */}
            <aside className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <ShoppingBag className="size-6" />
                    </div>
                    <h3 className="text-xl font-bold">Minha Reserva</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {carrinho.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-4">
                            <ShoppingBag className="size-16 opacity-20" />
                            <p className="font-medium">Seu carrinho está vazio.<br />Escolha produtos ao lado.</p>
                        </div>
                    ) : (
                        carrinho.map(item => (
                            <div key={item.produto.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate text-slate-900">{item.produto.nome}</p>
                                    <p className="text-xs text-slate-500">
                                        {item.produto.precos?.[0]?.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                                    <button
                                        onClick={() => updateQuantity(item.produto.id, -1)}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                    >
                                        <Minus className="size-3" />
                                    </button>
                                    <span className="text-sm font-bold w-6 text-center">{item.quantidade}</span>
                                    <button
                                        onClick={() => updateQuantity(item.produto.id, 1)}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                    >
                                        <Plus className="size-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-slate-500 font-medium">Total Estimado</span>
                        <span className="text-2xl font-black text-slate-900">
                            {carrinho.reduce((acc, item) => acc + (item.produto.precos?.[0]?.valor || 0) * item.quantidade, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                    <button
                        onClick={handleFinalizarReserva}
                        disabled={carrinho.length === 0 || isSaving}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                    >
                        {isSaving ? <Loader2 className="size-6 animate-spin" /> : <Check className="size-6" />}
                        FINALIZAR RESERVA
                    </button>
                </div>
            </aside>
        </div>
    );
}
