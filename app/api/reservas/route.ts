import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const cookie = req.cookies.get("session")?.value;
        if (!cookie) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        const session = await decrypt(cookie);
        if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

        const body = await req.json();
        const { itens } = body; // [{ produtoId: string, quantidade: number }]

        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            return NextResponse.json({ error: "Itens da reserva são obrigatórios" }, { status: 400 });
        }

        // Inicia uma transação Prisma para garantir que a reserva e a validação de estoque sejam atômicas
        const reserva = await prisma.$transaction(async (tx: any) => {
            // 1. Validar estoque
            for (const item of itens) {
                // Busca o produto de forma robusta
                let produto: any;
                try {
                    produto = await tx.produto.findUnique({
                        where: { id: item.produtoId },
                        select: { nome: true, estoque: true }
                    });
                } catch (readError: any) {
                    console.warn(`Reservas API: Prisma select failed for ${item.produtoId}, using raw SQL:`, readError.message);
                    const rawResult: any[] = await tx.$queryRawUnsafe(
                        `SELECT nome, estoque FROM "Produto" WHERE id = $1`,
                        item.produtoId
                    );
                    produto = rawResult[0];
                }

                if (!produto) {
                    throw new Error(`Produto não encontrado: ${item.produtoId}`);
                }

                if (produto.estoque < item.quantidade) {
                    throw new Error(`Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}, solicitado: ${item.quantidade}`);
                }

                try {
                    await tx.produto.update({
                        where: { id: item.produtoId },
                        data: { estoque: { decrement: item.quantidade } }
                    });
                } catch (updateError: any) {
                    console.warn(`Reservas API: Prisma update failed for ${item.produtoId}, using raw SQL:`, updateError.message);
                    await tx.$executeRawUnsafe(
                        `UPDATE "Produto" SET estoque = estoque - $1 WHERE id = $2`,
                        item.quantidade,
                        item.produtoId
                    );
                }
            }

            // 2. Criar a reserva
            return await tx.reserva.create({
                data: {
                    usuarioId: session.user.id,
                    status: "PENDENTE",
                    itens: {
                        create: itens.map((item: any) => ({
                            produtoId: item.produtoId,
                            quantidade: item.quantidade,
                        })),
                    },
                },
                include: {
                    itens: true,
                },
            });
        });

        return NextResponse.json(reserva);
    } catch (error: any) {
        console.error("Erro ao criar reserva:", error);
        if (error.message && (error.message.includes("Estoque insuficiente") || error.message.includes("Produto não encontrado"))) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Erro interno ao criar reserva" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const cookie = req.cookies.get("session")?.value;
        if (!cookie) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        const session = await decrypt(cookie);
        if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

        if (session.user.perfil === "ADMIN") {
            const reservas = await prisma.reserva.findMany({
                include: {
                    usuario: { select: { nome: true, email: true } },
                    itens: {
                        include: {
                            produto: {
                                include: {
                                    precos: {
                                        orderBy: { criadoEm: "desc" },
                                        take: 1
                                    }
                                }
                            }
                        }
                    },
                },
                orderBy: { criadoEm: "desc" },
            });
            return NextResponse.json(reservas);
        } else if (session.user.perfil === "CONSUMER") {
            const reservas = await prisma.reserva.findMany({
                where: { usuarioId: session.user.id },
                include: {
                    itens: {
                        include: {
                            produto: {
                                include: {
                                    precos: {
                                        orderBy: { criadoEm: "desc" },
                                        take: 1
                                    }
                                }
                            }
                        }
                    },
                },
                orderBy: { criadoEm: "desc" },
            });
            return NextResponse.json(reservas);
        }

        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    } catch (error) {
        console.error("Erro ao listar reservas:", error);
        return NextResponse.json({ error: "Erro interno ao listar reservas" }, { status: 500 });
    }
}
