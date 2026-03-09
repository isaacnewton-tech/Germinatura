import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();

        // 1. Buscar produtos base ativos
        const produtosBase = await prisma.produto.findMany({
            where: {
                isPromocional: false,
                ativo: true
            },
            include: {
                precos: {
                    orderBy: { criadoEm: "desc" },
                    take: 1
                }
            },
            orderBy: { criadoEm: "desc" },
        });

        // 2. Buscar estoques
        let estoqueMap: Record<string, number> = {};
        try {
            const rawEstoques: any[] = await prisma.$queryRawUnsafe(`SELECT id, estoque, ativo FROM "Produto"`);
            rawEstoques.forEach(item => {
                estoqueMap[item.id] = item.estoque;
            });
        } catch (rawErr) {
            console.warn("Produtos API: Failed to fetch raw stock:", rawErr);
        }

        // 3. Buscar TODAS as promoções ativas para mapeamento
        const promocoesAtivas = await prisma.promocao.findMany({
            where: {
                ativo: true,
                dataInicio: { lte: now },
                dataFim: { gte: now }
            }
        });

        const promoMap: Record<string, any> = {};
        promocoesAtivas.forEach(p => {
            // Se houver mais de uma, a última ganha (ou podemos definir prioridade)
            promoMap[p.produtoId] = p;
        });

        // 4. Buscar produtos promocionais (Combos)
        const combosRaw = await prisma.produto.findMany({
            where: {
                isPromocional: true,
                ativo: true
            },
            include: {
                precos: {
                    orderBy: { criadoEm: "desc" },
                    take: 1
                },
                produtoPai: true
                // Promoção será pega do promoMap ou incluída aqui se o promocaoId estiver setado (que está para combos)
            }
        });

        // 5. Mapear e filtrar
        const produtosFormatados = produtosBase.map(p => {
            const precoBase = p.precos?.[0]?.valor || 0;
            let precoFinal = precoBase;
            const promo = promoMap[p.id];
            let temDesconto = false;

            // Aplicar desconto de valor (%) se houver promoção ativa do tipo VALOR
            if (promo && promo.tipo === "VALOR") {
                const descontoPercent = promo.valorDesconto || 0;
                precoFinal = precoBase * (1 - descontoPercent / 100);
                temDesconto = true;
            }

            return {
                ...p,
                precoOriginal: precoBase,
                preco: precoFinal,
                temDesconto,
                promocao: promo || null, // Para compatibilidade com o frontend
                estoque: estoqueMap[p.id] ?? 0
            };
        });

        const combosFiltrados = combosRaw
            .filter(c => {
                // Para combos, usamos o promocaoId setado no produto ou buscamos no map
                // O combo creation já seta o promocaoId
                if (!c.promocaoId) return false;
                const promo = promocoesAtivas.find(p => p.id === c.promocaoId);

                if (!promo || !promo.ativo) return false;
                if (!c.produtoPai || !c.produtoPai.ativo) return false;

                const estoquePai = estoqueMap[c.produtoPaiId!] ?? 0;
                const reqMin = promo.quantidadeMinima ?? 0;

                return estoquePai >= reqMin;
            })
            .map(c => {
                const promo = promocoesAtivas.find(p => p.id === c.promocaoId);
                return {
                    ...c,
                    preco: c.precos?.[0]?.valor || 0,
                    promocao: promo,
                    estoque: Math.floor((estoqueMap[c.produtoPaiId!] ?? 0) / (promo?.quantidadeMinima || 1))
                };
            });

        return NextResponse.json([...produtosFormatados, ...combosFiltrados]);
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
        const formData = await request.formData();
        const nome = formData.get("nome") as string;
        const preco = formData.get("preco") as string;
        const ativo = formData.get("ativo") === "true";
        const file = formData.get("imagem") as File | null;

        let imagemUrl = formData.get("imagemUrl") as string | null;

        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64String = buffer.toString("base64");
            imagemUrl = `data:${file.type};base64,${base64String}`;
        }

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
            { error: `Erro ao criar produto: ${error instanceof Error ? error.message : "Erro desconhecido"}` },
            { status: 500 }
        );
    }
}
