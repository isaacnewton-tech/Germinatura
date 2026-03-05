"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    User,
    LogOut,
    Plus,
    Minus,
    ShoppingCart,
    X,
    CheckCircle2,
    Utensils,
    Beer,
    Cookie,
    Loader2,
    ArrowLeft
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { montarPayloadPix } from "@/lib/pix";
import { useToast } from "@/components/ui/Toast";

interface Product {
    id: string;
    nome: string;
    preco: number;
    ativo: boolean;
    imagemUrl?: string;
}

const getIcon = (nome: string) => {
    const n = nome.toLowerCase();
    if (n.includes("cachorro") || n.includes("quente") || n.includes("comida")) return Utensils;
    if (n.includes("refri") || n.includes("suco") || n.includes("bebida")) return Beer;
    return Cookie;
};

export default function PDVMobile() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const [user, setUser] = useState<any>(null);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch (err) {
                console.error("Erro ao carregar usuário:", err);
            }
        };

        fetchUser();

        fetch("/api/produtos")
            .then(res => res.json())
            .then(data => {
                setProducts(data.filter((p: Product) => p.ativo));
                setLoading(false); // This setLoading(false) is for products
            })
            .catch(err => {
                console.error("Erro ao carregar produtos:", err);
                setLoading(false);
            });
    }, []);

    const total = useMemo(() => {
        return Object.entries(cart).reduce((acc, [id, qty]) => {
            const product = products.find(p => p.id === id);
            return acc + (product?.preco || 0) * qty;
        }, 0);
    }, [cart, products]);

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => {
            const current = prev[id] || 0;
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const { [id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [id]: next };
        });
    };

    const pixPayload = useMemo(() => {
        if (total <= 0) return "";
        return montarPayloadPix({
            chave: process.env.NEXT_PUBLIC_PIX_CHAVE || "",
            nome: process.env.NEXT_PUBLIC_PIX_NOME_RECEBEDOR || "Comissao GerminareTECH",
            cidade: process.env.NEXT_PUBLIC_PIX_CIDADE || "Sao Paulo",
            valor: total.toFixed(2)
        });
    }, [total]);

    const cartItems = products.filter(p => cart[p.id] > 0);

    const { showToast } = useToast();

    const handleConfirmSale = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const saleData = {
                total,
                itens: cartItems.map(p => ({
                    produtoId: p.id,
                    quantidade: cart[p.id],
                    precoUnitario: p.preco
                }))
            };

            const response = await fetch("/api/vendas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(saleData)
            });

            if (response.ok) {
                setCart({});
                setIsModalOpen(false);
                showToast("Venda registrada com sucesso!", "success");
            } else {
                showToast("Erro ao registrar venda.", "error");
            }
        } catch (error) {
            console.error("Erro ao salvar venda:", error);
            showToast("Erro de conexão ao salvar venda.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="relative mx-auto min-h-screen max-w-md bg-background-light pb-32 font-sans">
            {/* Top Header Component */}
            <header className="sticky top-0 z-30 flex items-center justify-between bg-white/80 px-4 py-4 backdrop-blur-md border-b border-slate-200">
                <div className="flex items-center gap-3">
                    {user?.perfil === 'ADMIN' && (
                        <button
                            onClick={() => router.push("/")}
                            className="cursor-pointer mr-1 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                            title="Voltar ao Painel"
                        >
                            <ArrowLeft className="size-6" />
                        </button>
                    )}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                        <User className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900">
                            {user?.nome || "PDV - Vendedor"}
                        </h1>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{user?.perfil === 'ADMIN' ? 'Administrador' : 'Vendedor'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut className="size-5" />
                </button>
            </header>

            {/* Main Content */}
            <main className="p-4 space-y-4">
                <div className="flex items-center justify-between py-2">
                    <h2 className="text-xl font-bold tracking-tight">Produtos</h2>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {products.length} ITENS DISPONÍVEIS
                    </span>
                </div>

                {/* Product Cards */}
                {products.map((product) => (
                    <div key={product.id} className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm border border-slate-100 transition-transform active:scale-[0.98]">
                        <div className="flex gap-4">
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
                                {product.imagemUrl ? (
                                    <img
                                        alt={product.nome}
                                        className="h-full w-full object-cover"
                                        src={product.imagemUrl}
                                    />
                                ) : (
                                    (() => {
                                        const Icon = getIcon(product.nome);
                                        return <Icon className="size-10 text-slate-300" />;
                                    })()
                                )}
                            </div>
                            <div className="flex flex-1 flex-col justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">{product.nome}</h3>
                                    <p className="text-lg font-bold text-primary">R$ {product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => updateQuantity(product.id, -1)}
                                        disabled={!cart[product.id]}
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${cart[product.id]
                                            ? "bg-slate-100 text-slate-900 active:bg-primary/20"
                                            : "bg-slate-50 text-slate-300 cursor-not-allowed"
                                            }`}
                                    >
                                        <Minus className="size-5" />
                                    </button>
                                    <span className="w-8 text-center text-lg font-bold">{cart[product.id] || 0}</span>
                                    <button
                                        onClick={() => updateQuantity(product.id, 1)}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/20 active:scale-95"
                                    >
                                        <Plus className="size-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </main>

            {/* Fixed Footer */}
            <footer className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-slate-200 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="mb-4 flex items-center justify-between px-1">
                    <span className="text-slate-500 font-medium">Total do Pedido</span>
                    <span className="text-2xl font-black text-slate-900">
                        R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <button
                    onClick={() => total > 0 && setIsModalOpen(true)}
                    disabled={total === 0}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all active:scale-[0.97] ${total > 0 ? "bg-primary shadow-primary/30" : "bg-slate-300 cursor-not-allowed shadow-none"
                        }`}
                >
                    <ShoppingCart className="size-6" />
                    Cobrar
                </button>
            </footer>

            {/* Payment Modal (Bottom Sheet) */}
            <div
                className={`fixed inset-0 z-50 flex flex-col items-center justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
            >
                <div
                    className={`w-full max-w-md transform rounded-t-3xl bg-white p-6 transition-transform duration-300 shadow-2xl ${isModalOpen ? "translate-y-0" : "translate-y-full"
                        }`}
                >
                    <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-300"></div>

                    <div className="flex justify-between items-start mb-4">
                        <div className="text-left">
                            <h3 className="text-xl font-bold">Resumo da Venda</h3>
                            <p className="text-sm text-slate-500">Escaneie o QR Code para pagar via PIX</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
                        >
                            <X className="size-6" />
                        </button>
                    </div>

                    <div className="my-6 space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
                        {cartItems.map(p => (
                            <div key={p.id} className="flex justify-between text-sm">
                                <span className="text-slate-600">{cart[p.id]}x {p.nome}</span>
                                <span className="font-medium text-slate-900">
                                    R$ {(p.preco * cart[p.id]).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                        <div className="mt-2 border-t border-slate-200 pt-2 flex justify-between">
                            <span className="font-bold">Total</span>
                            <span className="font-bold text-primary text-lg">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="relative rounded-2xl border-4 border-slate-100 p-3 bg-white shadow-inner">
                            {pixPayload && (
                                <QRCodeSVG
                                    value={pixPayload}
                                    size={192}
                                    level="L"
                                    includeMargin={false}
                                />
                            )}
                        </div>
                        <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">
                            PIX DINÂMICO GERADO COM SUCESSO
                        </span>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        <button
                            onClick={handleConfirmSale}
                            disabled={isSaving}
                            className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/30 active:scale-[0.97] disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 className="size-6 animate-spin mr-2" />
                            ) : (
                                <CheckCircle2 className="size-6 mr-2" />
                            )}
                            Confirmar Venda
                        </button>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors"
                        >
                            Cancelar Pagamento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
