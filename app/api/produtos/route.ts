import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const produtosRaw = await prisma.produto.findMany({
            include: {
                precos: {
                    orderBy: { criadoEm: "desc" },
                    take: 1
                }
            },
            orderBy: { criadoEm: "desc" },
        });

        // Mapear para incluir o preço mais recente no nível superior para compatibilidade
        const produtos = produtosRaw.map(p => ({
            ...p,
            preco: p.precos[0]?.valor || 0
        }));

        return NextResponse.json(produtos);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        return NextResponse.json(
            { error: "Erro ao buscar produtos" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nome, preco, ativo, imagemUrl } = body;

        const produto = await prisma.produto.create({
            data: {
                nome,
                ativo: ativo ?? true,
                imagemUrl,
                precos: {
                    create: {
                        valor: parseFloat(preco)
                    }
                }
            },
            include: {
                precos: true
            }
        });

        return NextResponse.json({
            ...produto,
            preco: produto.precos[0]?.valor || 0
        });
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        return NextResponse.json(
            { error: "Erro ao criar produto" },
            { status: 500 }
        );
    }
}
