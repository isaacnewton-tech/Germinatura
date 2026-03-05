"use client";

import { useState, useEffect } from "react";
import {
    UserPlus,
    Pencil,
    Trash2,
    Search,
    X,
    Shield,
    User as UserIcon,
    Loader2,
    MoreVertical,
    Check,
    AlertCircle as AlertIcon
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Usuario {
    id: string;
    nome: string;
    email: string;
    perfil: "ADMIN" | "VENDEDOR";
    criadoEm: string;
}

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    // Form states
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        senha: "",
        perfil: "VENDEDOR" as "ADMIN" | "VENDEDOR"
    });

    const fetchUsuarios = async () => {
        try {
            const res = await fetch("/api/usuarios");
            if (res.ok) {
                const data = await res.json();
                setUsuarios(data);
            }
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleOpenModal = (user: Usuario | null = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                nome: user.nome,
                email: user.email,
                senha: "", // Don't show password
                perfil: user.perfil
            });
        } else {
            setSelectedUser(null);
            setFormData({
                nome: "",
                email: "",
                senha: "",
                perfil: "VENDEDOR"
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const method = selectedUser ? "PUT" : "POST";
        const url = selectedUser ? `/api/usuarios/${selectedUser.id}` : "/api/usuarios";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchUsuarios();
                setIsModalOpen(false);
                showToast(selectedUser ? "Usuário atualizado!" : "Usuário criado!", "success");
            } else {
                const error = await res.json();
                showToast(error.error || "Erro ao salvar usuário", "error");
            }
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            showToast("Erro de conexão", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setIsSaving(true);

        try {
            const res = await fetch(`/api/usuarios/${selectedUser.id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                await fetchUsuarios();
                setIsDeleteModalOpen(false);
                showToast("Usuário excluído com sucesso", "success");
            } else {
                showToast("Erro ao excluir usuário", "error");
            }
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            showToast("Erro de conexão ao excluir usuário", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsuarios = usuarios.filter((u: any) =>
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Gestão de Usuários</h2>
                        <p className="text-sm text-slate-500 mt-1">Gerencie os acessos administrativas e de vendedores.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <UserPlus className="size-5" />
                        <span>Novo Usuário</span>
                    </button>
                </header>

                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e: any) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Usuário</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Perfil</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Data de Cadastro</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsuarios.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                                                    {user.nome.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{user.nome}</span>
                                                    <span className="text-xs text-slate-500">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${user.perfil === "ADMIN"
                                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                                : "bg-blue-50 text-blue-700 border-blue-200"
                                                }`}>
                                                {user.perfil === "ADMIN" ? "Administrador" : "Vendedor"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(user.criadoEm).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(user)}
                                                    className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 rounded-lg"
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Usuário */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold">{selectedUser ? "Editar Usuário" : "Novo Usuário"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">
                                    {selectedUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}
                                </label>
                                <input
                                    type="password"
                                    required={!selectedUser}
                                    value={formData.senha}
                                    onChange={e => setFormData({ ...formData, senha: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Perfil de Acesso</label>
                                <select
                                    value={formData.perfil}
                                    onChange={e => setFormData({ ...formData, perfil: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="VENDEDOR">Vendedor (Só PDV)</option>
                                    <option value="ADMIN">Administrador (Total)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 px-4 font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-2.5 px-4 font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                                    {selectedUser ? "Salvar" : "Criar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Exclusão */}
            {isDeleteModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="mx-auto size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <AlertIcon className="size-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Excluir Usuário?</h3>
                        <p className="text-slate-500 mt-2">
                            Tem certeza que deseja remover <strong>{selectedUser.nome}</strong>? Esta ação não pode ser desfeita.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-2.5 font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={isSaving}
                                className="flex-1 py-2.5 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-red-200"
                            >
                                {isSaving ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
