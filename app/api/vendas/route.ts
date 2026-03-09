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
        const { total, itens, estoqueJaDescontado } = body;

        const session = await getSession();
        const usuarioId = session?.user?.id;

        // Inicia uma transação Prisma para garantir que tudo seja criado ou nada
        const resultado = await prisma.$transaction(async (tx: any) => {
            // 1. Validar e descontar estoque (se não foi descontado previamente)
            if (!estoqueJaDescontado) {
                for (const item of itens) {
                    // Update atômico com ACID
                    const result: any[] = await tx.$queryRawUnsafe(`
                        UPDATE "Produto"
                        SET estoque = estoque - $1, "atualizadoEm" = CURRENT_TIMESTAMP
                        WHERE id = $2 AND estoque >= $1
                        RETURNING id, nome, estoque
                    `, item.quantidade, item.produtoId);

                    if (result.length === 0) {
                        // Falhou o update - o produto não existe ou não tem estoque
                        const prod: any[] = await tx.$queryRawUnsafe(
                            `SELECT nome, estoque FROM "Produto" WHERE id = $1`,
                            item.produtoId
                        );

                        if (prod.length === 0) {
                            throw new Error(`Produto não encontrado: ${item.produtoId}`);
                        } else {
                            throw new Error(`Estoque insuficiente para ${prod[0].nome}. Disponível: ${prod[0].estoque}, Solicitado: ${item.quantidade}`);
                        }
                    }
                }
            }

            // 2. Cria a Transação Financeira de Entrada
            const transacao = await tx.transacaoFinanceira.create({
                data: {
                    tipo: "ENTRADA",
                    categoria: "Venda PDV",
                    descricao: `Venda PDV - ${itens.length} itens`,
                    valor: parseFloat(total),
                    data: new Date(),
                    usuarioId: usuarioId || null,
                },
            });

            // 3. Cria a Venda vinculada à transação
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
