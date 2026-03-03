import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function DashboardRecordsList({ data, onEdit }) {
  const queryClient = useQueryClient();

  const handleDelete = async (record) => {
    if (!confirm("Excluir este registro?")) return;
    await base44.entities.DashboardDiario.delete(record.id);
    queryClient.invalidateQueries({ queryKey: ["dashboard-diario"] });
    toast.success("Registro excluído");
  };

  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Registros Inseridos</h3>
      </div>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2 text-slate-600 font-semibold">Data</th>
              <th className="text-left px-3 py-2 text-slate-600 font-semibold">Dia</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">Sem</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">Lig.R</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">Lig.A</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">Agend</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">AB.M</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">AB.R</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">F.Ag</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">F.R</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">N</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">RECS</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">PA</th>
              <th className="text-center px-2 py-2 text-slate-600 font-semibold">CS</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => (
              <tr key={r.id} className={idx % 2 === 0 ? "" : "bg-slate-50/50"}>
                <td className="px-3 py-2 text-slate-700 font-medium whitespace-nowrap">
                  {format(new Date(r.data + "T12:00:00"), "dd/MM", { locale: ptBR })}
                </td>
                <td className="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">{r.dia_semana?.replace(" feira", "").replace(" Feira", "")}</td>
                <td className="text-center px-2 py-2 text-slate-500">{r.semana}</td>
                <td className="text-center px-2 py-2">{r.ligacoes_realizadas || 0}</td>
                <td className="text-center px-2 py-2">{r.ligacoes_atendidas || 0}</td>
                <td className="text-center px-2 py-2">{r.agendamentos_feitos || 0}</td>
                <td className="text-center px-2 py-2">{r.abs_marcadas || 0}</td>
                <td className="text-center px-2 py-2">{r.abs_realizadas || 0}</td>
                <td className="text-center px-2 py-2">{r.f_agendados || 0}</td>
                <td className="text-center px-2 py-2">{r.f_realizados || 0}</td>
                <td className="text-center px-2 py-2">{r.n_protocoladas || 0}</td>
                <td className="text-center px-2 py-2">{r.recs || 0}</td>
                <td className="text-center px-2 py-2 text-xs">{(r.pa || 0).toLocaleString("pt-BR")}</td>
                <td className="text-center px-2 py-2 text-xs">{(r.cs || 0).toLocaleString("pt-BR")}</td>
                <td className="px-2 py-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(r)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDelete(r)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}