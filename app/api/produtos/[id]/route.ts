import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const produto = await prisma.produto.findUnique({
            where: { id },
            include: {
                precos: {
                    orderBy: { criadoEm: "desc" },
                    take: 1
                }
            }
        });

        if (!produto) {
            return NextResponse.json(
                { error: "Produto não encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ...produto,
            preco: produto.precos[0]?.valor || 0
        });
    } catch (error) {
        console.error("Erro ao buscar produto:", error);
        return NextResponse.json(
            { error: "Erro ao buscar produto" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { nome, preco, ativo, imagemUrl } = body;

        // Buscar o produto para ter os valores atuais
        const currentProduct = await prisma.produto.findUnique({
            where: { id },
            include: {
                precos: {
                    orderBy: { criadoEm: "desc" },
                    take: 1
                }
            }
        });

        if (!currentProduct) {
            return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
        }

        const data: any = {};
        if (nome !== undefined) data.nome = nome;
        if (ativo !== undefined) data.ativo = ativo;
        if (imagemUrl !== undefined) data.imagemUrl = imagemUrl;

        // Lógica de preço
        if (preco !== undefined) {
            const currentPrice = currentProduct.precos[0]?.valor;
            const newPrice = parseFloat(preco);

            if (currentPrice !== newPrice) {
                data.precos = {
                    create: {
                        valor: newPrice
                    }
                };
            }
        }

        const produto = await prisma.produto.update({
            where: { id },
            data,
            include: {
                precos: {
                    orderBy: { criadoEm: "desc" },
                    take: 1
                }
            }
        });

        return NextResponse.json({
            ...produto,
            preco: produto.precos[0]?.valor || 0
        });
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        return NextResponse.json(
            { error: "Erro ao atualizar produto" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Soft delete ou Hard delete? Vou optar por Hard delete conforme solicitado
        // mas em sistemas reais geralmente usamos soft delete (campo ativo: false)
        await prisma.produto.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Produto excluído com sucesso" });
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        return NextResponse.json(
            { error: "Erro ao excluir produto" },
            { status: 500 }
        );
    }
}
