interface Transaction {
    id: string;
    data: string;
    descricao: string;
    tipo: "ENTRADA" | "SAIDA";
    valor: number;
}

interface TransactionTableProps {
    transactions: Transaction[];
}

import { useRouter } from "next/navigation";

export function TransactionTable({ transactions }: TransactionTableProps) {
    const router = useRouter();
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-bold text-lg">Últimas Transações</h4>
                <button
                    onClick={() => router.push("/transacoes")}
                    className="text-sm text-primary font-semibold hover:underline cursor-pointer"
                >
                    Ver Todas
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">Data</th>
                            <th className="px-6 py-4 font-bold">Descrição</th>
                            <th className="px-6 py-4 font-bold text-center">Tipo</th>
                            <th className="px-6 py-4 font-bold text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm whitespace-nowrap">{t.data}</td>
                                <td className="px-6 py-4 text-sm font-medium">{t.descricao}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${t.tipo === "ENTRADA"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                        }`}>
                                        {t.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 text-sm text-right font-bold ${t.tipo === "ENTRADA" ? "text-green-600" : "text-red-600"
                                    }`}>
                                    {t.tipo === "ENTRADA" ? "+" : "-"} R$ {t.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
