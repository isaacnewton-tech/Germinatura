import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const venda = await prisma.venda.findUnique({
            where: { id },
            include: {
                itens: {
                    include: {
                        produto: true
                    }
                },
                transacao: true
            }
        });

        if (!venda) {
            return NextResponse.json(
                { error: "Venda não encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json(venda);
    } catch (error) {
        console.error("Erro ao buscar detalhes da venda:", error);
        return NextResponse.json(
            { error: "Erro ao buscar detalhes da venda" },
            { status: 500 }
        );
    }
}
