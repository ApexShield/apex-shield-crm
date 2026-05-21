import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const fmtCurrency = (v) => v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00";

export default function TabelaAngariacaoForm({ angariacao, onRefresh }) {
  const [paMin, setPaMin] = useState("");
  const [paMax, setPaMax] = useState("");
  const [premio, setPremio] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!paMin || !paMax || !premio) {
      toast.error("Preencha PA mín, PA máx e Prêmio");
      return;
    }
    setSaving(true);
    await base44.entities.TabelaAngariacao.create({
      faixa_pa_min: parseFloat(paMin),
      faixa_pa_max: parseFloat(paMax),
      premio_angariacao: parseFloat(premio),
      descricao: descricao || ""
    });
    toast.success("Faixa adicionada!");
    setPaMin(""); setPaMax(""); setPremio(""); setDescricao("");
    setSaving(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    await base44.entities.TabelaAngariacao.delete(id);
    toast.success("Removida");
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-400" /> Adicionar Faixa de Angariação
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <Label className="text-white/70 text-xs">PA Mínimo (R$)</Label>
            <Input type="number" value={paMin} onChange={e => setPaMin(e.target.value)} placeholder="0"
              className="bg-white/10 border-white/20 text-white text-xs" />
          </div>
          <div>
            <Label className="text-white/70 text-xs">PA Máximo (R$)</Label>
            <Input type="number" value={paMax} onChange={e => setPaMax(e.target.value)} placeholder="50000"
              className="bg-white/10 border-white/20 text-white text-xs" />
          </div>
          <div>
            <Label className="text-white/70 text-xs">Prêmio Angariação (R$)</Label>
            <Input type="number" value={premio} onChange={e => setPremio(e.target.value)} placeholder="500"
              className="bg-white/10 border-white/20 text-white text-xs" />
          </div>
          <div>
            <Label className="text-white/70 text-xs">Descrição (opcional)</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Faixa Bronze"
              className="bg-white/10 border-white/20 text-white text-xs" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={saving} className="bg-amber-500 hover:bg-amber-600 w-full text-xs font-bold">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto max-h-[300px]">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-800/95 z-10">
              <TableRow className="border-white/10">
                <TableHead className="text-white text-xs font-bold">PA Mínimo</TableHead>
                <TableHead className="text-white text-xs font-bold">PA Máximo</TableHead>
                <TableHead className="text-white text-xs font-bold">Prêmio Angariação</TableHead>
                <TableHead className="text-white text-xs font-bold">Descrição</TableHead>
                <TableHead className="text-white text-xs font-bold w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {angariacao.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-white/50 py-8 text-xs">Nenhuma faixa cadastrada</TableCell></TableRow>
              ) : angariacao.sort((a, b) => a.faixa_pa_min - b.faixa_pa_min).map(a => (
                <TableRow key={a.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-white text-xs">{fmtCurrency(a.faixa_pa_min)}</TableCell>
                  <TableCell className="text-white text-xs">{fmtCurrency(a.faixa_pa_max)}</TableCell>
                  <TableCell className="text-amber-400 text-xs font-black">{fmtCurrency(a.premio_angariacao)}</TableCell>
                  <TableCell className="text-white/70 text-xs">{a.descricao || "—"}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 h-7 w-7">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}