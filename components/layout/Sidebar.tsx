"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    History,
    Landmark,
    Users,
    LayoutTemplate,
    LogOut,
    GraduationCap,
    Loader2
} from "lucide-react";

interface User {
    id: string;
    nome: string;
    email: string;
    perfil: string;
}

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const menuItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["ADMIN"] },
        { name: "Vendas", href: "/vendas", icon: History, roles: ["ADMIN"] },
        { name: "Produtos", href: "/produtos", icon: Package, roles: ["ADMIN"] },
        { name: "Financeiro", href: "/fluxo-caixa", icon: Landmark, roles: ["ADMIN"] },
        { name: "Usuários", href: "/configuracoes/usuarios", icon: Users, roles: ["ADMIN"] },
        { name: "PDV (Ponto de Venda)", href: "/pdv", icon: ShoppingBag, roles: ["ADMIN", "VENDEDOR"] },
    ];

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                console.log("Sidebar: User fetched:", data.user);
                setUser(data.user);
            } else {
                console.log("Sidebar: Failed to fetch user, status:", res.status);
                setUser(null);
            }
        } catch (err) {
            console.error("Sidebar: Error fetching user:", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    if (pathname === "/login" || pathname === "/pdv") return null;

    if (loading) {
        return (
            <aside className="w-full h-full border-r border-slate-200 bg-white flex flex-col items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
            </aside>
        );
    }

    const userProfile = user?.perfil || "";
    const filteredMenu = menuItems.filter(item => item.roles.includes(userProfile));

    console.log("Sidebar: Rendering filtered menu for profile:", userProfile, filteredMenu);

    return (
        <aside className="w-full h-full border-r border-slate-200 bg-white flex flex-col">
            <div className="p-6 flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    {/* <GraduationCap className="size-6" /> */}
                    <img src="https://i.imgur.com/EnMI9CP.png" alt="G" className="rounded-lg"/>
                </div>
                <div>
                    <h1 className="font-bold text-sm">Germinatura</h1>
                    <p className="text-xs text-slate-500">Gestão Escolar</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {filteredMenu.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold ${isActive
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                                }`}
                        >
                            <item.icon className="size-5" />
                            <span className="text-sm">{item.name}</span>
                        </Link>
                    );
                })}
                {filteredMenu.length === 0 && (
                    <div className="px-3 py-4 text-xs text-slate-400 italic">
                        Nenhum item disponível para seu perfil: {userProfile}
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-slate-200">
                <div
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all"
                >
                    <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden border border-slate-200">
                        {user?.nome?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-slate-900">{user?.nome || "Admin Logado"}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user?.perfil || "Acesso"}</p>
                    </div>
                    <LogOut className="size-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                </div>
            </div>
        </aside>
    );
}
