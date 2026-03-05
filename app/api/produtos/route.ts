import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const produtosRaw = await prisma.produto.findMany({
            include: {
                precos: {
                    orderBy: { criadoEm: "desc" },
                    take: 1
                }
            },
            orderBy: { criadoEm: "desc" },
        });

        // Mapear para incluir o preço mais recente no nível superior para compatibilidade
        const produtos = (produtosRaw as any[]).map((p: any) => ({
            ...p,
            preco: p.precos[0]?.valor || 0
        }));

        return NextResponse.json(produtos);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        return NextResponse.json(
            { error: "Erro ao buscar produtos" },
            { status: 500 }
        );
    }
}

import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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

            const fileExtension = path.extname(file.name);
            const fileName = `${uuidv4()}${fileExtension}`;
            const publicPath = path.join(process.cwd(), "public", "uploads", fileName);

            await writeFile(publicPath, buffer);
            imagemUrl = `/uploads/${fileName}`;
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
