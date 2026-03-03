import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const vendas = await prisma.venda.findMany({
            include: {
                itens: {
                    include: {
                        produto: true
                    }
                },
                transacao: true,
                usuario: {
                    select: {
                        nome: true,
                        email: true
                    }
                }
            },
            orderBy: { criadoEm: "desc" },
        });
        return NextResponse.json(vendas);
    } catch (error) {
        console.error("Erro ao buscar vendas:", error);
        return NextResponse.json(
            { error: "Erro ao buscar vendas" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { total, itens } = body;

        const session = await getSession();
        const usuarioId = session?.user?.id;

        // Inicia uma transação Prisma para garantir que tudo seja criado ou nada
        const resultado = await prisma.$transaction(async (tx: any) => {
            // 1. Cria a Transação Financeira de Entrada
            const transacao = await tx.transacaoFinanceira.create({
                data: {
                    tipo: "ENTRADA",
                    categoria: "Venda PDV",
                    descricao: `Venda PDV - ${itens.length} itens`,
                    valor: parseFloat(total),
                    data: new Date(),
                },
            });

            // 2. Cria a Venda vinculada à transação
            const venda = await tx.venda.create({
                data: {
                    total: parseFloat(total),
                    transacaoId: transacao.id,
                    usuarioId: usuarioId || null,
                    itens: {
                        create: itens.map((item: any) => ({
                            produtoId: item.produtoId,
                            quantidade: item.quantidade,
                            precoUnitario: parseFloat(item.precoUnitario),
                        })),
                    },
                },
                include: {
                    itens: true,
                },
            });

            return { venda, transacao };
        });

        return NextResponse.json(resultado);
    } catch (error) {
        console.error("Erro ao registrar venda:", error);
        return NextResponse.json(
            { error: "Erro ao registrar venda" },
            { status: 500 }
        );
    }
}
