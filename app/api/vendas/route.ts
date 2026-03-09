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
                    console.log(`[DEBUG PDV] Processando item: ${item.produtoId}, Qtd: ${item.quantidade}`);

                    // Buscar se o produto é promocional e tem pai
                    const query = `
                        SELECT p.id, p.nome, p."isPromocional", p."produtoPaiId", pr."quantidadeMinima"
                        FROM "Produto" p
                        LEFT JOIN "Promocao" pr ON p."promocaoId" = pr.id
                        WHERE p.id = '${item.produtoId}'
                    `;

                    const produtoInfoArr: any[] = await tx.$queryRawUnsafe(query);
                    const produtoInfo = produtoInfoArr[0] || {};
                    console.log(`[DEBUG PDV] Dados SQL:`, JSON.stringify(produtoInfo));

                    let targetId = item.produtoId;
                    let quantADescontar = item.quantidade;

                    // Tentar capturar campos em qualquer casing (Postgres pode ser chato com quotes)
                    const isPromoField = produtoInfo.isPromocional ?? produtoInfo.ispromocional ?? false;
                    const paiIdField = produtoInfo.produtoPaiId ?? produtoInfo.produtopaiid ?? null;
                    const qtdMinField = Number(produtoInfo.quantidadeMinima ?? produtoInfo.quantidademinima ?? 1);

                    const isPromo = isPromoField === true || isPromoField === 'true' || isPromoField === 1;
                    const paiId = paiIdField;

                    if (isPromo && paiId) {
                        targetId = paiId;
                        quantADescontar = item.quantidade * qtdMinField;
                        console.log(`[DEBUG PDV] COMBO DETECTADO! Redirecionando: ${item.produtoId} -> ${targetId} (Qtd: ${quantADescontar})`);
                    } else {
                        console.log(`[DEBUG PDV] Produto Normal (isPromo:${isPromo}, paiId:${paiId})`);
                    }

                    // Update atômico com ACID
                    const result: any[] = await tx.$queryRawUnsafe(`
                        UPDATE "Produto"
                        SET estoque = estoque - $1, "atualizadoEm" = CURRENT_TIMESTAMP
                        WHERE id = $2 AND estoque >= $1
                        RETURNING id, nome, estoque
                    `, quantADescontar, targetId);

                    if (result.length === 0) {
                        // Falhou o update - o produto não existe ou não tem estoque
                        const prod: any[] = await tx.$queryRawUnsafe(
                            `SELECT nome, estoque FROM "Produto" WHERE id = $1`,
                            targetId
                        );

                        if (prod.length === 0) {
                            throw new Error(`Produto não encontrado: ${targetId}`);
                        } else {
                            throw new Error(`Estoque insuficiente para ${prod[0].nome}. Disponível: ${prod[0].estoque}, Solicitado: ${quantADescontar}`);
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
