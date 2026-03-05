import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Loader2 } from "lucide-react";
import { getHierarchyConfig } from "../UserHierarchyConfig";

export default function ConvidarEquipeDialog({ open, onClose, currentUser, allUsers, agencias, unidades }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [tipoHierarquia, setTipoHierarquia] = useState("");
  const [agenciaId, setAgenciaId] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [erro, setErro] = useState("");

  const isAdmin = currentUser?.role === "admin";
  const isLiderAgencia = currentUser?.tipo_hierarquia === "Líder de Agência";
  const isLiderUnidade = currentUser?.tipo_hierarquia === "Líder de Unidade";

  // Agências que o líder pode gerenciar
  const agenciasDisponiveis = isAdmin 
    ? agencias 
    : agencias.filter(a => a.lider_agencia_email === currentUser?.email);

  // Unidades que o líder pode gerenciar
  const unidadesDisponiveis = isAdmin
    ? unidades
    : isLiderAgencia
      ? unidades.filter(u => agenciasDisponiveis.some(a => a.id === u.agencia_id))
      : unidades.filter(u => u.lider_unidade_email === currentUser?.email);

  // Tipos que cada hierarquia pode convidar
  const tiposBase = isAdmin
    ? ["Líder de Agência", "Líder de Unidade", "Corretor"]
    : isLiderAgencia
      ? ["Líder de Unidade", "Corretor"]
      : ["Corretor"];
  
  const tiposDisponiveis = tiposBase.map(t => {
    const cfg = getHierarchyConfig(t);
    return { value: t, label: t, icon: cfg.icon };
  });

  const conviteMutation = useMutation({
    mutationFn: async () => {
      if (!email || !tipoHierarquia) throw new Error("Preencha todos os campos");

      // Enviar convite do sistema Base44
      try {
        await base44.users.inviteUser(email, "user");
      } catch (e) {
        console.log("Usuário já existe ou convite já enviado:", e);
      }

      // Determinar agência/unidade
      let agIdFinal = agenciaId;
      let unIdFinal = unidadeId;
      let agNome = "";
      let unNome = "";
      let liderEmail = "";
      let liderId = "";

      if (isLiderAgencia) {
        const minhaAgencia = agenciasDisponiveis[0];
        if (minhaAgencia && !agIdFinal) agIdFinal = minhaAgencia.id;
        liderEmail = currentUser.email;
        liderId = currentUser.id;
      } else if (isLiderUnidade) {
        agIdFinal = currentUser.agencia_id || "";
        const minhaUnidade = unidadesDisponiveis[0];
        if (minhaUnidade && !unIdFinal) unIdFinal = minhaUnidade.id;
        liderEmail = currentUser.email;
        liderId = currentUser.id;
      }

      if (agIdFinal) {
        const ag = agencias.find(a => a.id === agIdFinal);
        agNome = ag?.nome || "";
      }
      if (unIdFinal) {
        const un = unidades.find(u => u.id === unIdFinal);
        unNome = un?.nome || "";
      }

      // Para Líder de Unidade convidado, o líder é o Líder de Agência
      if (tipoHierarquia === "Líder de Unidade" && isLiderAgencia) {
        liderEmail = currentUser.email;
        liderId = currentUser.id;
      }

      // Para Corretor, o líder é quem está convidando
      if (tipoHierarquia === "Corretor") {
        liderEmail = currentUser.email;
        liderId = currentUser.id;
      }

      // Criar convite hierárquico
      await base44.entities.ConviteHierarquia.create({
        email_convidado: email,
        tipo_hierarquia: tipoHierarquia,
        agencia_id: agIdFinal,
        agencia_nome: agNome,
        unidade_id: unIdFinal || "",
        unidade_nome: unNome,
        lider_id: liderId,
        lider_email: liderEmail,
        lider_nome: currentUser.full_name || currentUser.email,
        status: "pendente"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["convites"] });
      alert("✅ Convite enviado com sucesso! O usuário receberá o convite ao acessar o sistema.");
      resetForm();
      onClose();
    },
    onError: (error) => {
      setErro(error.message || "Erro ao enviar convite");
    }
  });

  const resetForm = () => {
    setEmail("");
    setTipoHierarquia("");
    setAgenciaId("");
    setUnidadeId("");
    setErro("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro("");

    if (!email) { setErro("Informe o email"); return; }
    if (!tipoHierarquia) { setErro("Selecione o tipo de hierarquia"); return; }

    if (tipoHierarquia === "Líder de Unidade" && !agenciaId && isAdmin) {
      setErro("Selecione a agência para o Líder de Unidade"); return;
    }
    if (tipoHierarquia === "Corretor" && !unidadeId && isAdmin) {
      setErro("Selecione a unidade para o Corretor"); return;
    }

    conviteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={() => { resetForm(); onClose(); }}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-slate-800 to-slate-900 border-indigo-500/30">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-emerald-400" />
            Convidar para Equipe
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-indigo-200 font-semibold">Email do Convidado *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              className="bg-slate-700/50 border-indigo-500/30 text-white placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <Label className="text-indigo-200 font-semibold">Função na Equipe *</Label>
            <Select value={tipoHierarquia} onValueChange={setTipoHierarquia}>
              <SelectTrigger className="bg-slate-700/50 border-indigo-500/30 text-white">
                <SelectValue placeholder="Selecione a função..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-indigo-500/30">
                {tiposDisponiveis.map(t => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.value} value={t.value} className="text-white">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Admin ou Líder de Agência: selecionar agência para Líderes de Unidade */}
          {(isAdmin && (tipoHierarquia === "Líder de Unidade" || tipoHierarquia === "Corretor" || tipoHierarquia === "Líder de Agência")) && (
            <div>
              <Label className="text-indigo-200 font-semibold">Agência {tipoHierarquia !== "Líder de Agência" ? "*" : "(opcional)"}</Label>
              <Select value={agenciaId} onValueChange={setAgenciaId}>
                <SelectTrigger className="bg-slate-700/50 border-indigo-500/30 text-white">
                  <SelectValue placeholder="Selecione a agência..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-indigo-500/30">
                  {agenciasDisponiveis.map(a => (
                    <SelectItem key={a.id} value={a.id} className="text-white">
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selecionar unidade para Corretores */}
          {((isAdmin || isLiderAgencia) && tipoHierarquia === "Corretor") && (
            <div>
              <Label className="text-indigo-200 font-semibold">Unidade {isAdmin ? "*" : "(opcional)"}</Label>
              <Select value={unidadeId} onValueChange={setUnidadeId}>
                <SelectTrigger className="bg-slate-700/50 border-indigo-500/30 text-white">
                  <SelectValue placeholder="Selecione a unidade..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-indigo-500/30">
                  {unidadesDisponiveis
                    .filter(u => !agenciaId || u.agencia_id === agenciaId)
                    .map(u => (
                      <SelectItem key={u.id} value={u.id} className="text-white">
                        {u.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {erro && (
            <div className="bg-red-500/20 border border-red-500/50 px-3 py-2 rounded-lg text-sm text-red-100">
              {erro}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 text-xs text-blue-200">
            💡 O convidado receberá um convite por email para acessar o sistema. Ao entrar, será solicitado que aceite fazer parte da equipe.
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancelar
            </Button>
            <Button type="submit" disabled={conviteMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold">
              {conviteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Enviar Convite</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}