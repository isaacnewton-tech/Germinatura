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
    precoOriginal?: number;
    temDesconto?: boolean;
    isPromocional?: boolean;
    ativo: boolean;
    imagemUrl?: string;
    estoque: number;
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
            .then((data: any) => {
                setProducts(data.filter((p: Product) => p.ativo));
                setLoading(false); // This setLoading(false) is for products
            })
            .catch((err: any) => {
                console.error("Erro ao carregar produtos:", err);
                setLoading(false);
            });
    }, []);

    // Calculate cart items early for use in effects and handlers
    const cartItems = products.filter((p: any) => cart[p.id] > 0);

    // Handle tab closing when modal is open (stock is reserved)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isModalOpen && Object.keys(cart).length > 0) {
                const releaseData = {
                    action: "liberar",
                    itens: cartItems.map((p: any) => ({
                        produtoId: p.id,
                        quantidade: cart[p.id]
                    }))
                };
                const blob = new Blob([JSON.stringify(releaseData)], { type: 'application/json' });
                navigator.sendBeacon("/api/pdv/estoque", blob);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isModalOpen, cart, cartItems]);

    const total = useMemo(() => {
        return Object.entries(cart).reduce((acc: any, [id, qty]) => {
            const product = products.find((p: any) => p.id === id);
            return acc + (product?.preco || 0) * qty;
        }, 0);
    }, [cart, products]);

    const { showToast } = useToast();

    const updateQuantity = (id: string, delta: number) => {
        const product = products.find((p: any) => p.id === id);
        if (!product) return;

        setCart((prev: any) => {
            const current = prev[id] || 0;
            const next = Math.max(0, current + delta);

            // Validate against stock
            if (next > product.estoque) {
                showToast(`Estoque insuficiente. Apenas ${product.estoque} disponível(is).`, "error");
                return prev;
            }

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

    // Fetch the latest stock from the API and validate the cart
    const validateStock = async (): Promise<boolean> => {
        try {
            const res = await fetch("/api/produtos");
            if (!res.ok) throw new Error("Falha ao buscar produtos");
            const latestProducts: Product[] = await res.json();

            // Update local products state with fresh stock data
            setProducts(latestProducts.filter((p) => p.ativo));

            let isValid = true;
            let errorMessage = "";

            // Check if any item in the cart exceeds the new stock
            cartItems.forEach((cartItem) => {
                const latestProduct = latestProducts.find(p => p.id === cartItem.id);
                const requestedQty = cart[cartItem.id];
                const availableStock = latestProduct?.estoque || 0;

                if (requestedQty > availableStock) {
                    isValid = false;
                    errorMessage = `Estoque insuficiente para ${cartItem.nome}. Solicitado: ${requestedQty}, Disponível: ${availableStock}.`;

                    // Adjust cart to the max available if it's less than requested
                    setCart((prev) => {
                        if (availableStock === 0) {
                            const { [cartItem.id]: _, ...rest } = prev;
                            return rest;
                        }
                        return { ...prev, [cartItem.id]: availableStock };
                    });
                }
            });

            if (!isValid) {
                showToast(errorMessage, "error");
                // Close modal if it was open to force user to review the cart
                setIsModalOpen(false);
            }

            return isValid;
        } catch (error) {
            console.error("Erro ao validar estoque:", error);
            showToast("Erro ao verificar estoque atualizado.", "error");
            return false;
        }
    };

    // RELEASE STOCK HANDLERS
    const handleReleaseStock = async () => {
        if (Object.keys(cart).length === 0) return;

        const releaseData = {
            action: "liberar",
            itens: cartItems.map((p: any) => ({
                produtoId: p.id,
                quantidade: cart[p.id]
            }))
        };

        try {
            await fetch("/api/pdv/estoque", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(releaseData)
            });
        } catch (error) {
            console.error("Falha ao liberar:", error);
        }
    };

    const handleCloseModal = async () => {
        setIsSaving(true);
        await handleReleaseStock();
        // Update local stock silently
        fetch("/api/produtos")
            .then(res => res.json())
            .then((data: any[]) => setProducts(data.filter((p: Product) => p.ativo)));
        setIsSaving(false);
        setIsModalOpen(false);
    };

    // CHECKOUT HANDLER WITH RESERVATION
    const handleCheckout = async () => {
        if (total <= 0) return;

        setIsSaving(true);
        const isValid = await validateStock();

        if (isValid) {
            try {
                const reserveData = {
                    action: "reservar",
                    itens: cartItems.map((p: any) => ({
                        produtoId: p.id,
                        quantidade: cart[p.id]
                    }))
                };

                const res = await fetch("/api/pdv/estoque", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(reserveData)
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    showToast(errorData.error || "Erro ao reservar estoque.", "error");
                    await validateStock(); // Refresh local stock visually
                    setIsSaving(false);
                    return;
                }

                setIsModalOpen(true);
            } catch (error) {
                console.error("Erro ao reservar:", error);
                showToast("Erro de conexão ao reservar estoque.", "error");
            }
        }
        setIsSaving(false);
    };

    // CONFIRM SALE HANDLER
    const handleConfirmSale = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const saleData = {
                total,
                itens: cartItems.map((p: any) => ({
                    produtoId: p.id,
                    quantidade: cart[p.id],
                    precoUnitario: p.preco
                })),
                estoqueJaDescontado: true // Skip decrementing algorithm inside /api/vendas
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

                // Update local stock silently to reflect the current state
                fetch("/api/produtos")
                    .then(res => res.json())
                    .then((data: any[]) => setProducts(data.filter((p: Product) => p.ativo)))
                    .catch(err => console.error("Erro ao atualizar estoque visual:", err));

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
                {products.map((product: any) => (
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
                                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        {product.nome}
                                        {(product.temDesconto || product.isPromocional) && (
                                            <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shrink-0">
                                                EM PROMOÇÃO
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            {product.temDesconto && product.precoOriginal && (
                                                <span className="text-[10px] font-bold text-slate-400 line-through leading-none">
                                                    R$ {product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                </span>
                                            )}
                                            <p className="text-lg font-bold text-primary leading-tight">
                                                R$ {product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${product.estoque > 5 ? 'bg-emerald-50 text-emerald-600' :
                                            product.estoque > 0 ? 'bg-amber-50 text-amber-600' :
                                                'bg-rose-50 text-rose-600'
                                            }`}>
                                            Estoque: {product.estoque}
                                        </span>
                                    </div>
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
                                        disabled={product.estoque <= 0 || (cart[product.id] || 0) >= product.estoque}
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-md active:scale-95 transition-all ${product.estoque <= 0 || (cart[product.id] || 0) >= product.estoque
                                            ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                            : "bg-primary text-white shadow-primary/20"
                                            }`}
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
                    onClick={handleCheckout}
                    disabled={total === 0 || isSaving}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all active:scale-[0.97] ${total > 0 && !isSaving ? "bg-primary shadow-primary/30" : "bg-slate-300 cursor-not-allowed shadow-none"
                        }`}
                >
                    {isSaving ? <Loader2 className="size-6 animate-spin" /> : <ShoppingCart className="size-6" />}
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
                            onClick={handleCloseModal}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
                        >
                            <X className="size-6" />
                        </button>
                    </div>

                    <div className="my-6 space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
                        {cartItems.map((p: any) => (
                            <div key={p.id} className="flex justify-between text-sm">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                    {cart[p.id]}x {p.nome}
                                    {(p.temDesconto || p.isPromocional) && (
                                        <span className="bg-amber-100 text-amber-700 text-[7px] font-black px-1 py-0.5 rounded uppercase shrink-0">
                                            PROMO
                                        </span>
                                    )}
                                </span>
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
                            onClick={handleCloseModal}
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
