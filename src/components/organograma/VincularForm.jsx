import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VincularForm({ usuarioParaVincular, allUsers, vincularMutation, onCancel, currentUser }) {
  const [tipoHierarquia, setTipoHierarquia] = useState(usuarioParaVincular.tipo_hierarquia || "");
  const [liderId, setLiderId] = useState(usuarioParaVincular.lider_id || "none");

  const isAdmin = currentUser?.role === "admin";
  const isLiderAgencia = currentUser?.tipo_hierarquia === "Líder de Agência";
  const isLiderUnidade = currentUser?.tipo_hierarquia === "Líder de Unidade";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tipoHierarquia) return;
    
    // Non-admin leaders set themselves as the leader
    let finalLiderId = liderId;
    let finalLiderEmail = null;
    
    if (!isAdmin && (isLiderAgencia || isLiderUnidade)) {
      finalLiderId = currentUser.id;
      finalLiderEmail = currentUser.email;
    } else {
      const lider = allUsers.find(u => u.id === liderId);
      finalLiderEmail = lider?.email || null;
      finalLiderId = liderId === "none" ? null : liderId;
    }
    
    vincularMutation.mutate({
      usuarioId: usuarioParaVincular.id,
      liderId: finalLiderId,
      liderEmail: finalLiderEmail,
      tipoHierarquia
    });
  };

  const possiveisLideres = allUsers.filter(
    u => u.id !== usuarioParaVincular.id && (u.tipo_hierarquia === "Líder de Agência" || u.tipo_hierarquia === "Líder de Unidade")
  );
  
  // Tipos disponíveis conforme quem está editando
  const tiposDisponiveis = isAdmin
    ? ["Líder de Agência", "Líder de Unidade", "Corretor"]
    : isLiderAgencia
      ? ["Líder de Unidade", "Corretor"]
      : ["Corretor"];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 p-4 rounded-xl">
        <p className="text-sm text-indigo-200 mb-1">Editando:</p>
        <p className="font-bold text-white text-lg">{usuarioParaVincular.full_name || usuarioParaVincular.email}</p>
        <p className="text-xs text-indigo-300">{usuarioParaVincular.email}</p>
      </div>

      <div>
        <Label className="text-indigo-200 font-semibold mb-2 block">Função *</Label>
        <Select value={tipoHierarquia} onValueChange={setTipoHierarquia}>
          <SelectTrigger className="bg-slate-700/50 border-indigo-500/30 text-white">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-indigo-500/30 z-[100]">
            {tiposDisponiveis.includes("Líder de Agência") && <SelectItem value="Líder de Agência" className="text-white">🟢 Líder de Agência</SelectItem>}
            {tiposDisponiveis.includes("Líder de Unidade") && <SelectItem value="Líder de Unidade" className="text-white">🔵 Líder de Unidade</SelectItem>}
            {tiposDisponiveis.includes("Corretor") && <SelectItem value="Corretor" className="text-white">🔷 Corretor</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {isAdmin && (
        <div>
          <Label className="text-indigo-200 font-semibold mb-2 block">Reporta para</Label>
          <Select value={liderId} onValueChange={setLiderId}>
            <SelectTrigger className="bg-slate-700/50 border-indigo-500/30 text-white">
              <SelectValue placeholder="Sem líder (topo)" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-indigo-500/30 z-[100]">
              <SelectItem value="none" className="text-white">⭐ Sem líder (topo)</SelectItem>
              {possiveisLideres.map(u => (
                <SelectItem key={u.id} value={u.id} className="text-white">
                  {u.full_name || u.email} - {u.tipo_hierarquia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {!isAdmin && (
        <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-lg p-3 text-xs text-indigo-200">
          💡 O usuário ficará vinculado a você ({currentUser?.full_name || currentUser?.email})
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}
          className="border-slate-600 text-slate-300 hover:bg-slate-700">
          Cancelar
        </Button>
        <Button type="submit" disabled={vincularMutation.isPending || !tipoHierarquia}
          className="bg-gradient-to-r from-green-500 to-emerald-600 font-bold">
          {vincularMutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}