import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // 1. Calcula Saldo Atual, Total Arrecadado e Total Gasto
        const transacoes = await prisma.transacaoFinanceira.findMany();

        let configMeta: any = null;
        try {
            const results = await prisma.$queryRaw`SELECT * FROM "Configuracao" WHERE "chave" = 'META_ARRECADACAO' LIMIT 1`;
            if (Array.isArray(results) && results.length > 0) {
                configMeta = results[0];
            }
        } catch (e) {
            console.warn("Raw SQL select failed in dashboard:", e);
        }

        const meta = configMeta ? parseFloat(configMeta.valor) : parseFloat(process.env.NEXT_PUBLIC_PIX_META_ARRECADACAO || "60000");

        const totalArrecadado = transacoes
            .filter((t) => t.tipo === "ENTRADA")
            .reduce((acc, t) => acc + t.valor, 0);

        const totalGasto = transacoes
            .filter((t) => t.tipo === "SAIDA")
            .reduce((acc, t) => acc + t.valor, 0);

        const saldoAtual = totalArrecadado - totalGasto;

        // 2. Busca as últimas 3 transações
        const transacoesRecentes = await prisma.transacaoFinanceira.findMany({
            take: 3,
            orderBy: { data: "desc" },
        });

        // 3. Agrupamento simplificado por mês (últimos 6 meses)
        // Para simplificar, vamos retornar dados fixos ou uma lógica básica
        const hoje = new Date();
        const meses = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const label = d.toLocaleString("pt-BR", { month: "short" });

            const somaEntradas = transacoes
                .filter(t => t.tipo === "ENTRADA" &&
                    new Date(t.data).getMonth() === d.getMonth() &&
                    new Date(t.data).getFullYear() === d.getFullYear())
                .reduce((acc, t) => acc + t.valor, 0);

            meses.push({ mes: label, valor: somaEntradas });
        }

        return NextResponse.json({
            saldoAtual,
            totalArrecadado,
            totalGasto,
            meta,
            transacoesRecentes,
            entradasPorMes: meses,
        });
    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        return NextResponse.json(
            { error: "Erro ao carregar dashboard" },
            { status: 500 }
        );
    }
}
