import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, itens } = body;

        if (!action || !itens || !Array.isArray(itens) || itens.length === 0) {
            return NextResponse.json(
                { error: "Dados inválidos para manipulação de estoque" },
                { status: 400 }
            );
        }

        if (action !== "reservar" && action !== "liberar") {
            return NextResponse.json(
                { error: "Ação inválida. Use 'reservar' ou 'liberar'." },
                { status: 400 }
            );
        }

        const resultado = await prisma.$transaction(async (tx: any) => {
            for (const item of itens) {
                if (!item.produtoId || typeof item.quantidade !== 'number' || item.quantidade <= 0) {
                    throw new Error("Item inválido no array de itens.");
                }

                // Se for reservar, verifica se tem estoque suficiente e desconta
                if (action === "reservar") {
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
                } else if (action === "liberar") {
                    // Efetua a liberação (incrementa)
                    try {
                        await tx.produto.update({
                            where: { id: item.produtoId },
                            data: { estoque: { increment: item.quantidade } }
                        });
                    } catch (updateError: any) {
                        console.warn(`Estoque API: Prisma increment failed, using raw SQL`);
                        await tx.$executeRawUnsafe(
                            `UPDATE "Produto" SET estoque = estoque + $1 WHERE id = $2`,
                            item.quantidade,
                            item.produtoId
                        );
                    }
                }
            }
            return { success: true, action };
        });

        return NextResponse.json(resultado);
    } catch (error: any) {
        console.error(`Erro ao ${error?.message?.includes('Ação') ? 'manipular' : 'processar'} estoque:`, error);

        const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";
        const isClientError = errorMessage.includes('Estoque insuficiente') ||
            errorMessage.includes('Produto não encontrado') ||
            errorMessage.includes('inválid');

        return NextResponse.json(
            { error: errorMessage },
            { status: isClientError ? 400 : 500 }
        );
    }
}
