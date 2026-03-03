import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

const protectedRoutes = ["/", "/vendas", "/produtos", "/fluxo-caixa", "/pdv"];
const adminOnlyRoutes = ["/", "/vendas", "/produtos", "/fluxo-caixa"];

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.includes(path);
    const isAdminOnlyRoute = adminOnlyRoutes.includes(path);

    const cookie = req.cookies.get("session")?.value;
    let session = null;

    if (cookie) {
        try {
            session = await decrypt(cookie);
        } catch (e) {
            console.error("Erro ao descriptografar cookie de sessão");
        }
    }

    // Se for rota protegida e não tiver sessão, manda para /login
    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // Se já estiver logado e tentar ir para /login, manda para a home apropriada
    if (path === "/login" && session) {
        if (session.user.perfil === "ADMIN") {
            return NextResponse.redirect(new URL("/", req.nextUrl));
        }
        return NextResponse.redirect(new URL("/pdv", req.nextUrl));
    }

    // Se for VENDEDOR e tentar acessar rota de ADMIN, manda para /pdv
    if (isAdminOnlyRoute && session?.user.perfil === "VENDEDOR") {
        return NextResponse.redirect(new URL("/pdv", req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
