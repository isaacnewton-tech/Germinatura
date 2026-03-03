import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const transacoes = await prisma.transacaoFinanceira.findMany({
            orderBy: { data: "desc" },
        });
        return NextResponse.json(transacoes);
    } catch (error) {
        console.error("Erro ao buscar transações:", error);
        return NextResponse.json(
            { error: "Erro ao buscar transações" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tipo, categoria, descricao, valor, data } = body;

        const transacao = await prisma.transacaoFinanceira.create({
            data: {
                tipo,
                categoria,
                descricao,
                valor: parseFloat(valor),
                data: data ? new Date(data) : new Date(),
            },
        });

        return NextResponse.json(transacao);
    } catch (error) {
        console.error("Erro ao criar transação:", error);
        return NextResponse.json(
            { error: "Erro ao criar transação" },
            { status: 500 }
        );
    }
}
