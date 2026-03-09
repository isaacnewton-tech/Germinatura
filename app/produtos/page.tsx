"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Edit,
    Utensils,
    Beer,
    Cookie,
    Loader2,
    Check,
    ImageIcon,
    X
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { showToast } = useToast();

    const loadProducts = () => {
        setLoading(true);
        fetch("/api/produtos")
            .then(res => res.json())
            .then((data: any) => {
                setProducts(data);
                setLoading(false);
            })
            .catch((err: any) => {
                console.error("Erro ao carregar produtos:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setProducts(products.map((p: any) => p.id === id ? { ...p, ativo: !currentStatus } : p));

            const response = await fetch(`/api/produtos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ativo: !currentStatus })
            });

            if (response.ok) {
                showToast(`Produto ${!currentStatus ? "ativado" : "inativado"} com sucesso!`, "success");
            } else {
                // Rollback if failed
                setProducts(products.map((p: any) => p.id === id ? { ...p, ativo: currentStatus } : p));
                showToast("Erro ao atualizar status do produto.", "error");
            }
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            // Rollback if failed
            setProducts(products.map((p: any) => p.id === id ? { ...p, ativo: currentStatus } : p));
            showToast("Erro de conexão ao atualizar status.", "error");
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

            const formData = new FormData();
            formData.append("nome", newProduct.nome);
            formData.append("preco", newProduct.preco.replace(",", "."));
            formData.append("ativo", String(newProduct.ativo));
            if (selectedFile) {
                formData.append("imagem", selectedFile);
            } else if (newProduct.imagemUrl) {
                formData.append("imagemUrl", newProduct.imagemUrl);
            }

            const response = await fetch(url, {
                method,
                body: formData
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
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalItens = products.length;
    const itensAtivos = products.filter((p: any) => p.ativo).length;

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Header Content - Fixed */}
            <div className="bg-white border-b border-slate-200 p-4 md:p-8 shrink-0">
                <div className="max-w-6xl mx-auto">
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Gestão de Cardápio</h2>
                            <p className="text-sm text-slate-500 mt-1">Gerencie os produtos e preços disponíveis para o evento.</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                        >
                            <Plus className="size-5" />
                            <span>Novo Produto</span>
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                            <span className="text-2xl font-black text-slate-900">{totalItens}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativos</span>
                            <span className="text-2xl font-black text-emerald-500">{itensAtivos}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geral</span>
                            <span className="text-2xl font-black text-primary">PDV</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area - Full Height Scroll */}
            <div className="flex-1 overflow-hidden p-4 md:p-8 flex flex-col">
                <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 z-20">
                                <tr className="bg-slate-50/95 backdrop-blur-sm shadow-sm">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Produto</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Preço</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.map((product: any) => {
                                    const Icon = getIcon(product.nome);
                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center transition-all">
                                                        {product.imagemUrl ? (
                                                            <img src={product.imagemUrl} alt={product.nome} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Icon className="size-6 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <span className="font-black text-slate-900">{product.nome}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-medium text-emerald-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    R$ {product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleStatus(product.id, product.ativo)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all shadow-inner cursor-pointer ${product.ativo ? "bg-primary" : "bg-slate-200"}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.ativo ? "translate-x-6 shadow-[-2px_0_5px_rgba(0,0,0,0.1)]" : "translate-x-1 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"}`} />
                                                    </button>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${product.ativo ? "text-primary" : "text-slate-400"}`}>
                                                        {product.ativo ? "Ativo" : "Inativo"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2.5 text-slate-400 hover:text-primary transition-all hover:bg-primary/5 rounded-xl group-hover:scale-110"
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

            {/* Modal - Cadastro / Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-white flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-2xl font-black text-slate-900 uppercase">
                                {editingProduct ? "Editar" : "Novo"} Produto
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors"
                            >
                                <X className="size-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome do Produto</label>
                                <input
                                    required
                                    type="text"
                                    value={newProduct.nome}
                                    onChange={(e: any) => setNewProduct({ ...newProduct, nome: e.target.value })}
                                    placeholder="Ex: Pastel de Queijo"
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Preço (R$)</label>
                                    <input
                                        required
                                        type="text"
                                        value={newProduct.preco}
                                        onChange={(e: any) => setNewProduct({ ...newProduct, preco: e.target.value })}
                                        placeholder="0,00"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-black text-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status Inicial</label>
                                    <div className="flex items-center gap-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => setNewProduct({ ...newProduct, ativo: !newProduct.ativo })}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all shadow-inner ${newProduct.ativo ? "bg-primary" : "bg-slate-200"}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all ${newProduct.ativo ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                        <span className="text-xs font-black uppercase text-slate-500">
                                            {newProduct.ativo ? "Ativo" : "Inativo"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Imagem</label>
                                {(previewUrl || newProduct.imagemUrl) ? (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50 group">
                                        <img
                                            src={previewUrl || newProduct.imagemUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setPreviewUrl(null);
                                                setNewProduct(prev => ({ ...prev, imagemUrl: "" }));
                                            }}
                                            className="absolute top-4 right-4 p-2 bg-white/95 rounded-xl shadow-lg hover:bg-white text-rose-500 transition-all font-black text-xs flex items-center gap-2"
                                        >
                                            <X className="size-4" />
                                            REMOVER
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-40 border-4 border-dashed border-slate-100 rounded-[2.5rem] hover:bg-slate-50 hover:border-primary/30 transition-all cursor-pointer group">
                                        <div className="flex flex-col items-center justify-center text-center px-4">
                                            <ImageIcon className="size-10 text-slate-300 group-hover:text-primary transition-colors mb-2" />
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Clique para enviar</p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </form>

                        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50 shrink-0">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 py-5 text-slate-500 font-bold rounded-2xl hover:bg-white transition-all border-2 border-slate-200 uppercase tracking-widest text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }}
                                disabled={isSaving}
                                className="flex-[1.5] py-5 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
                            >
                                {isSaving ? (
                                    <Loader2 className="size-5 animate-spin" />
                                ) : editingProduct ? (
                                    "Salvar Alterações"
                                ) : (
                                    "Cadastrar Produto"
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
