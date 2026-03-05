import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

const adminOnlyRoutes = ["/", "/vendas", "/produtos", "/fluxo-caixa", "/transacoes", "/configuracoes"];
const publicRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isPublicRoute = publicRoutes.includes(path);
    const isAdminOnlyRoute = adminOnlyRoutes.some(route =>
        route === "/" ? path === "/" : path.startsWith(route)
    );

    const cookie = req.cookies.get("session")?.value;
    let session = null;

    if (cookie) {
        try {
            session = await decrypt(cookie);
        } catch (e) {
            console.error("Erro ao descriptografar cookie de sessão");
        }
    }

    // 1. Se não estiver logado e não for rota pública, redireciona para login
    if (!session && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // 2. Se já estiver logado e tentar ir para /login, redireciona para a home apropriada
    if (path === "/login" && session) {
        if (session.user.perfil === "ADMIN") {
            return NextResponse.redirect(new URL("/", req.nextUrl));
        }
        return NextResponse.redirect(new URL("/pdv", req.nextUrl));
    }

    // 3. Verificação de permissões por perfil
    if (session) {
        // Se for VENDEDOR, ele SÓ pode acessar /pdv
        if (session.user.perfil === "VENDEDOR") {
            if (path !== "/pdv" && !path.startsWith("/pdv/")) {
                return NextResponse.redirect(new URL("/pdv", req.nextUrl));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
