import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Users, UserPlus, Network, Crown, Shield, AlertCircle } from "lucide-react";
import OrgTree from "../components/organograma/OrgTree";
import ConvidarEquipeDialog from "../components/organograma/ConvidarEquipeDialog";
import VincularForm from "../components/organograma/VincularForm";

export default function Organograma() {
  const queryClient = useQueryClient();
  const [showConviteDialog, setShowConviteDialog] = useState(false);
  const [showVincularDialog, setShowVincularDialog] = useState(false);
  const [usuarioParaVincular, setUsuarioParaVincular] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser
  });

  const { data: agencias = [] } = useQuery({
    queryKey: ["agencias"],
    queryFn: () => base44.entities.Agencia.list(),
    enabled: !!currentUser
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades"],
    queryFn: () => base44.entities.Unidade.list(),
    enabled: !!currentUser
  });

  const isAdmin = currentUser?.role === "admin";
  const isLiderAgencia = currentUser?.tipo_hierarquia === "Líder de Agência";
  const isLiderUnidade = currentUser?.tipo_hierarquia === "Líder de Unidade";
  const isCorretor = currentUser?.tipo_hierarquia === "Corretor";

  const podeConvidar = isAdmin || isLiderAgencia || isLiderUnidade;
  const podeEditar = isAdmin || isLiderAgencia || isLiderUnidade;

  // Construir árvore hierárquica
  const construirArvore = (usuario) => {
    const subordinados = allUsers.filter(u =>
      u.lider_id === usuario.id || u.lider_email === usuario.email
    );
    return {
      ...usuario,
      subordinados: subordinados.map(s => construirArvore(s))
    };
  };

  // Coletar todos os IDs que aparecem na árvore recursivamente
  const coletarIdsNaArvore = (arvore) => {
    const ids = new Set();
    const percorrer = (node) => {
      ids.add(node.id);
      (node.subordinados || []).forEach(s => percorrer(s));
    };
    percorrer(arvore);
    return ids;
  };

  // IDs de todos que estão visíveis na árvore
  const idsNaArvore = useMemo(() => {
    const ids = new Set();
    arvoresVisiveis.forEach(arvore => {
      coletarIdsNaArvore(arvore).forEach(id => ids.add(id));
    });
    return ids;
  }, [arvoresVisiveis]);

  // Usuários sem hierarquia (apenas para admin)
  const usuariosSemHierarquia = useMemo(() => {
    if (!isAdmin) return [];
    return allUsers.filter(u =>
      !u.tipo_hierarquia || u.tipo_hierarquia === "Sem Hierarquia"
    );
  }, [allUsers, isAdmin]);

  // Usuários "órfãos": têm hierarquia definida mas não aparecem na árvore
  const usuariosOrfaos = useMemo(() => {
    if (!isAdmin) return [];
    return allUsers.filter(u =>
      u.tipo_hierarquia && 
      u.tipo_hierarquia !== "Sem Hierarquia" && 
      !idsNaArvore.has(u.id)
    );
  }, [allUsers, isAdmin, idsNaArvore]);

  // Árvores de agências visíveis conforme hierarquia do usuário
  const arvoresVisiveis = useMemo(() => {
    if (!currentUser || !allUsers.length) return [];

    // Encontrar Líderes de Agência relevantes
    let lideresAgencia = [];

    if (isAdmin) {
      // Admin vê todas as agências
      lideresAgencia = allUsers.filter(u => u.tipo_hierarquia === "Líder de Agência");
    } else if (isLiderAgencia) {
      // Líder de Agência vê apenas sua agência
      lideresAgencia = [currentUser];
    } else if (isLiderUnidade) {
      // Líder de Unidade vê a agência que está alocado
      const meuLider = allUsers.find(u =>
        u.id === currentUser.lider_id || u.email === currentUser.lider_email
      );
      if (meuLider?.tipo_hierarquia === "Líder de Agência") {
        lideresAgencia = [meuLider];
      } else if (meuLider) {
        // Se o líder é outro Líder de Unidade, buscar o Líder de Agência acima
        const liderAgencia = allUsers.find(u =>
          u.id === meuLider.lider_id || u.email === meuLider.lider_email
        );
        if (liderAgencia) lideresAgencia = [liderAgencia];
      }
    } else if (isCorretor) {
      // Corretor vê a agência se tiver vínculo
      const meuLider = allUsers.find(u =>
        u.id === currentUser.lider_id || u.email === currentUser.lider_email
      );
      if (meuLider) {
        if (meuLider.tipo_hierarquia === "Líder de Agência") {
          lideresAgencia = [meuLider];
        } else {
          const liderAgencia = allUsers.find(u =>
            u.id === meuLider.lider_id || u.email === meuLider.lider_email
          );
          if (liderAgencia) lideresAgencia = [liderAgencia];
        }
      }
    }

    return lideresAgencia.map(l => construirArvore(l));
  }, [currentUser, allUsers, isAdmin, isLiderAgencia, isLiderUnidade, isCorretor]);

  // Vincular mutation
  const vincularMutation = useMutation({
    mutationFn: async ({ usuarioId, liderId, liderEmail, tipoHierarquia }) => {
      const lider = allUsers.find(u => u.id === liderId);
      await base44.entities.User.update(usuarioId, {
        lider_id: liderId || null,
        lider_email: liderEmail || lider?.email || null,
        tipo_hierarquia: tipoHierarquia,
        agencia_id: lider?.agencia_id || "",
        unidade_id: lider?.unidade_id || ""
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowVincularDialog(false);
      setUsuarioParaVincular(null);
      alert("✅ Vínculo atualizado!");
    }
  });

  // Sem vínculo - corretor sem agência
  const semVinculo = !isAdmin && !isLiderAgencia && !isLiderUnidade && arvoresVisiveis.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 p-3 md:p-6 overflow-x-auto">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Organograma</h1>
              <p className="text-indigo-200">Hierarquia organizacional</p>
            </div>
          </div>

          {podeConvidar && (
            <Button onClick={() => setShowConviteDialog(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold shadow-lg">
              <UserPlus className="w-5 h-5 mr-2" />
              Convidar para Equipe
            </Button>
          )}
        </div>

        {/* Legenda */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-lg">
            <Crown className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-200 font-medium">Líder de Agência</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 rounded-lg">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-200 font-medium">Líder de Unidade</span>
          </div>
          <div className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-400/30 px-3 py-1.5 rounded-lg">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-cyan-200 font-medium">Corretor</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Painel lateral - somente Admin */}
          {isAdmin && (usuariosSemHierarquia.length > 0 || usuariosOrfaos.length > 0) && (
            <div className="w-full md:w-72 flex-shrink-0 space-y-4">
              {/* Usuários sem hierarquia */}
              {usuariosSemHierarquia.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-yellow-400/30 p-4 sticky top-6">
                  <h3 className="text-yellow-300 font-bold mb-3 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Sem Hierarquia ({usuariosSemHierarquia.length})
                  </h3>
                  <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                    {usuariosSemHierarquia.map(u => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setUsuarioParaVincular(u);
                          setShowVincularDialog(true);
                        }}
                        className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700/50 p-3 rounded-lg cursor-pointer transition-all border border-white/10 hover:border-yellow-400/30"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-xs">
                          {u.full_name?.charAt(0) || u.email?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{u.full_name || u.email?.split("@")[0]}</p>
                          <p className="text-white/50 text-[10px] truncate">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usuários órfãos - têm hierarquia mas não aparecem na árvore */}
              {usuariosOrfaos.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-orange-400/30 p-4">
                  <h3 className="text-orange-300 font-bold mb-1 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Sem Vínculo na Árvore ({usuariosOrfaos.length})
                  </h3>
                  <p className="text-orange-200/60 text-[10px] mb-3">Têm hierarquia mas não estão conectados a nenhum líder</p>
                  <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                    {usuariosOrfaos.map(u => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setUsuarioParaVincular(u);
                          setShowVincularDialog(true);
                        }}
                        className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700/50 p-3 rounded-lg cursor-pointer transition-all border border-white/10 hover:border-orange-400/30"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                          {u.full_name?.charAt(0) || u.email?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{u.full_name || u.email?.split("@")[0]}</p>
                          <p className="text-white/50 text-[10px] truncate">{u.email}</p>
                          <p className="text-orange-300/70 text-[10px]">{u.tipo_hierarquia}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Árvore hierárquica */}
          <div className="flex-1">
            {semVinculo ? (
              <Card className="border-2 border-dashed border-white/20 bg-white/5">
                <div className="text-center py-16 px-8">
                  <Users className="w-16 h-16 mx-auto mb-4 text-white/40" />
                  <h3 className="text-xl font-semibold text-white mb-2">Sem vínculo a agência</h3>
                  <p className="text-indigo-200 max-w-md mx-auto">
                    Você ainda não está vinculado a nenhuma agência. Aguarde um convite de um Líder de Agência ou Líder de Unidade.
                  </p>
                </div>
              </Card>
            ) : arvoresVisiveis.length > 0 ? (
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 md:p-8 overflow-x-auto">
                <div className="flex flex-col items-center gap-8 md:gap-12 min-w-fit">
                  {arvoresVisiveis.map(arvore => (
                    <OrgTree
                      key={arvore.id}
                      usuario={arvore}
                      clickable={podeEditar}
                      onClickUser={(u) => {
                        if (podeEditar) {
                          setUsuarioParaVincular(u);
                          setShowVincularDialog(true);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="border-2 border-dashed border-white/20 bg-white/5">
                <div className="text-center py-16 px-8">
                  <Network className="w-16 h-16 mx-auto mb-4 text-white/40" />
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhuma hierarquia configurada</h3>
                  <p className="text-indigo-200 mb-6 max-w-md mx-auto">
                    Comece criando agências e convidando membros para a equipe.
                  </p>
                  {podeConvidar && (
                    <Button onClick={() => setShowConviteDialog(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 font-bold">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Convidar Primeiro Membro
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Convidar Equipe */}
      <ConvidarEquipeDialog
        open={showConviteDialog}
        onClose={() => setShowConviteDialog(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        agencias={agencias}
        unidades={unidades}
      />

      {/* Dialog Vincular/Editar Usuário */}
      {podeEditar && (
        <Dialog open={showVincularDialog} onOpenChange={setShowVincularDialog}>
          <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-indigo-500/30 max-w-[95vw] md:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Editar Hierarquia</DialogTitle>
              <DialogDescription className="text-indigo-300">Altere a função e o líder do usuário</DialogDescription>
            </DialogHeader>
            {usuarioParaVincular && (
              <VincularForm
                usuarioParaVincular={usuarioParaVincular}
                allUsers={allUsers}
                vincularMutation={vincularMutation}
                onCancel={() => { setShowVincularDialog(false); setUsuarioParaVincular(null); }}
                currentUser={currentUser}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}