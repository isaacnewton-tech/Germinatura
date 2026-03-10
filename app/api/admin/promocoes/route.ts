import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TipoPromocao } from "@prisma/client";

export async function GET() {
    try {
        const promocoes = await prisma.promocao.findMany({
            include: {
                produtos: {
                    where: { isPromocional: false },
                    take: 1
                }
            },
            orderBy: { criadoEm: "desc" }
        });
        return NextResponse.json(promocoes);
    } catch (error) {
        console.error("Erro ao buscar promoções:", error);
        return NextResponse.json({ error: "Erro ao buscar promoções" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            produtoId,
            tipo,
            valorDesconto,
            quantidadeMinima,
            dataInicio,
            dataFim
        } = body;

        // Validar produto pai
        const produtoPai = await prisma.produto.findUnique({
            where: { id: produtoId },
            include: { precos: { orderBy: { criadoEm: "desc" }, take: 1 } }
        });

        if (!produtoPai) {
            return NextResponse.json({ error: "Produto original não encontrado" }, { status: 404 });
        }

        if (tipo === "VALOR") {
            // Verificar se já existe promoção de valor ativa
            const existAtiva = await prisma.promocao.findFirst({
                where: {
                    produtoId,
                    tipo: "VALOR",
                    ativo: true,
                    dataFim: { gte: new Date() }
                }
            });
            if (existAtiva) {
                return NextResponse.json({ error: "Já existe uma promoção de valor ativa para este produto" }, { status: 400 });
            }
        }

        const promocao = await prisma.promocao.create({
            data: {
                produtoId,
                tipo,
                valorDesconto: parseFloat(valorDesconto),
                quantidadeMinima: tipo === "QUANTIDADE" ? parseInt(quantidadeMinima) : null,
                dataInicio: new Date(dataInicio),
                dataFim: new Date(dataFim),
            }
        });

        // Se for QUANTIDADE, criar o produto temporário
        if (tipo === "QUANTIDADE") {
            const precoFixo = parseFloat(valorDesconto); // Preço do combo
            await prisma.produto.create({
                data: {
                    nome: `${produtoPai.nome} (Promoção ${quantidadeMinima} un.)`,
                    ativo: true,
                    isPromocional: true,
                    produtoPaiId: produtoId,
                    promocaoId: promocao.id,
                    precos: {
                        create: {
                            valor: precoFixo
                        }
                    }
                }
            });
        }

        return NextResponse.json(promocao);
    } catch (error) {
        console.error("Erro ao criar promoção:", error);
        return NextResponse.json({ error: "Erro ao criar promoção" }, { status: 500 });
    }
}
