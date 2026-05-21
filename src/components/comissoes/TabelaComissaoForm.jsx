import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const PRODUTOS = [
  "VS5", "VS10", "VS15", "VS20", "VS25", "VS75",
  "VT5", "VT10", "VT20", "VT65", "VT99",
  "VT Legado 10", "VT Legado 2",
  "VT Singular", "VT Singular Legado"
];

const FREQUENCIAS = ["Anual", "Mensal"];
const PERIODOS = ["Até 1 ano", "Após 2 anos", "Após 3 anos", "Após 4 anos", "Vitalício"];

export default function TabelaComissaoForm({ comissoes, onRefresh }) {
  const [produto, setProduto] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [percentual, setPercentual] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!produto || !frequencia || !periodo || !percentual) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    await base44.entities.TabelaComissao.create({
      produto, frequencia_pagamento: frequencia, periodo_pagamento: periodo,
      percentual_comissao: parseFloat(percentual)
    });
    toast.success("Comissão adicionada!");
    setProduto(""); setFrequencia(""); setPeriodo(""); setPercentual("");
    setSaving(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    await base44.entities.TabelaComissao.delete(id);
    toast.success("Removida");
    onRefresh();
  };

  // Group by product
  const grouped = {};
  comissoes.forEach(c => {
    const key = c.produto;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-400" /> Adicionar Comissão
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <Label className="text-white/70 text-xs">Produto</Label>
            <Select value={produto} onValueChange={setProduto}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{PRODUTOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/70 text-xs">Frequência</Label>
            <Select value={frequencia} onValueChange={setFrequencia}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{FREQUENCIAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/70 text-xs">Período</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{PERIODOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/70 text-xs">% Comissão</Label>
            <Input type="number" step="0.1" value={percentual} onChange={e => setPercentual(e.target.value)}
              placeholder="Ex: 45" className="bg-white/10 border-white/20 text-white text-xs" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 w-full text-xs font-bold">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto max-h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-800/95 z-10">
              <TableRow className="border-white/10">
                <TableHead className="text-white text-xs font-bold">Produto</TableHead>
                <TableHead className="text-white text-xs font-bold">Frequência</TableHead>
                <TableHead className="text-white text-xs font-bold">Período</TableHead>
                <TableHead className="text-white text-xs font-bold text-center">% Comissão</TableHead>
                <TableHead className="text-white text-xs font-bold w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-white/50 py-8 text-xs">Nenhuma comissão cadastrada</TableCell></TableRow>
              ) : comissoes.map(c => (
                <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-white text-xs font-bold">{c.produto}</TableCell>
                  <TableCell className="text-white/80 text-xs">{c.frequencia_pagamento}</TableCell>
                  <TableCell className="text-white/80 text-xs">{c.periodo_pagamento}</TableCell>
                  <TableCell className="text-emerald-400 text-xs font-black text-center">{c.percentual_comissao}%</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 h-7 w-7">
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