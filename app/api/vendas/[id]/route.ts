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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Perform deletion in a transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // 1. Delete all items related to the sale
            await tx.itemVenda.deleteMany({
                where: { vendaId: id }
            });

            // 2. Find if there's an associated transaction
            const venda = await tx.venda.findUnique({
                where: { id },
                select: { transacaoId: true }
            });

            // 3. Delete the sale
            await tx.venda.delete({
                where: { id }
            });

            // 4. Delete the transaction if it exists
            if (venda?.transacaoId) {
                await tx.transacaoFinanceira.delete({
                    where: { id: venda.transacaoId }
                });
            }
        });

        return NextResponse.json({ message: "Venda excluída com sucesso" });
    } catch (error) {
        console.error("Erro ao excluir venda:", error);
        return NextResponse.json(
            { error: "Erro ao excluir venda" },
            { status: 500 }
        );
    }
}
