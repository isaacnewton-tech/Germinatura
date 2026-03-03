"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Edit,
    Utensils,
    Beer,
    Cookie,
    Loader2,
    X,
    Check
} from "lucide-react";
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

export default function GestaoProdutos() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [newProduct, setNewProduct] = useState({
        nome: "",
        preco: "",
        ativo: true,
        imagemUrl: ""
    });
    const { showToast } = useToast();

    const loadProducts = () => {
        setLoading(true);
        fetch("/api/produtos")
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erro ao carregar produtos:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            setProducts(products.map(p => p.id === id ? { ...p, ativo: !currentStatus } : p));
            
            const response = await fetch(`/api/produtos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ativo: !currentStatus })
            });

            if (response.ok) {
                setProducts(products.map(p => p.id === id ? { ...p, ativo: !currentStatus } : p));
            }
            else {
                setProducts(products.map(p => p.id === id ? { ...p, ativo: currentStatus } : p));
            }
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProduct.nome || !newProduct.preco) {
            showToast("Nome e preço são obrigatórios.", "warning");
            return;
        }

        setIsSaving(true);
        try {
            const url = editingProduct ? `/api/produtos/${editingProduct.id}` : "/api/produtos";
            const method = editingProduct ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: newProduct.nome,
                    ativo: newProduct.ativo,
                    imagemUrl: newProduct.imagemUrl,
                    preco: parseFloat(newProduct.preco.replace(",", "."))
                })
            });

            if (response.ok) {
                setIsModalOpen(false);
                setEditingProduct(null);
                setNewProduct({ nome: "", preco: "", ativo: true, imagemUrl: "" });
                loadProducts();
                showToast(
                    editingProduct ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!",
                    "success"
                );
            } else {
                showToast(
                    editingProduct ? "Erro ao atualizar produto." : "Erro ao cadastrar produto.",
                    "error"
                );
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            showToast("Erro de conexão.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setNewProduct({
            nome: product.nome,
            preco: product.preco.toString().replace(".", ","),
            ativo: product.ativo,
            imagemUrl: product.imagemUrl || ""
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setNewProduct({ nome: "", preco: "", ativo: true, imagemUrl: "" });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalItens = products.length;
    const itensAtivos = products.filter(p => p.ativo).length;

    return (
        <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto relative">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Gestão de Cardápio</h2>
                        <p className="text-sm text-slate-500 mt-1">Gerencie os produtos e preços disponíveis para o evento.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="cursor-pointer bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus className="size-5" />
                        <span>Novo Produto</span>
                    </button>
                </header>

                {/* Stats Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Total de Itens</p>
                        <p className="text-2xl font-bold mt-1 text-slate-900">{totalItens} Itens</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Itens Ativos</p>
                        <p className="text-2xl font-bold mt-1 text-emerald-600">{itensAtivos}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Categorias</p>
                        <p className="text-2xl font-bold mt-1 text-primary">Cardápio Geral</p>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Nome</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Preço</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.map((product) => {
                                    const Icon = getIcon(product.nome);
                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                        {product.imagemUrl ? (
                                                            <img src={product.imagemUrl} alt={product.nome} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Icon className="size-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-slate-900">{product.nome}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-slate-600 font-medium">
                                                    R$ {product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleStatus(product.id, product.ativo)}
                                                        className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.ativo ? "bg-primary" : "bg-slate-200"}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.ativo ? "translate-x-6" : "translate-x-1"}`} />
                                                    </button>
                                                    <span className="text-sm font-medium text-slate-500">
                                                        {product.ativo ? "Ativo" : "Inativo"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                                                >
                                                    <Edit className="size-5" />
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

            {/* Modal de Cadastro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold">
                                {editingProduct ? "Editar Produto" : "Cadastrar Novo Produto"}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                <X className="size-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Nome do Produto</label>
                                <input
                                    required
                                    type="text"
                                    value={newProduct.nome}
                                    onChange={(e) => setNewProduct({ ...newProduct, nome: e.target.value })}
                                    placeholder="Ex: Pastel de Queijo"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Preço (R$)</label>
                                    <input
                                        required
                                        type="text"
                                        value={newProduct.preco}
                                        onChange={(e) => setNewProduct({ ...newProduct, preco: e.target.value })}
                                        placeholder="0,00"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Status Inicial</label>
                                    <div className="flex items-center gap-3 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setNewProduct({ ...newProduct, ativo: !newProduct.ativo })}
                                            className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newProduct.ativo ? "bg-primary" : "bg-slate-200"}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newProduct.ativo ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                        <span className="text-sm font-medium text-slate-500">
                                            {newProduct.ativo ? "Ativo" : "Inativo"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">URL da Imagem (Opcional)</label>
                                <input
                                    type="text"
                                    value={newProduct.imagemUrl}
                                    onChange={(e) => setNewProduct({ ...newProduct, imagemUrl: e.target.value })}
                                    placeholder="https://exemplo.com/imagem.jpg"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="cursor-pointer flex-1 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <Loader2 className="size-5 animate-spin" />
                                    ) : editingProduct ? (
                                        <Check className="size-5" />
                                    ) : (
                                        <Plus className="size-5" />
                                    )}
                                    {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="cursor-pointer px-6 py-3.5 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
