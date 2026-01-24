import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Building, Users } from "lucide-react";

export default function ConvitesDialog({ open, onClose, userEmail }) {
  const queryClient = useQueryClient();

  const { data: convites = [] } = useQuery({
    queryKey: ["convites", userEmail],
    queryFn: async () => {
      const allConvites = await base44.entities.ConviteHierarquia.list();
      return allConvites.filter(c => c.email_convidado === userEmail && c.status === "pendente");
    },
    enabled: open && !!userEmail
  });

  const responderConviteMutation = useMutation({
    mutationFn: async ({ convite, aceitar }) => {
      if (aceitar) {
        // Buscar dados atualizados
        const agencias = await base44.entities.Agencia.list();
        const unidades = await base44.entities.Unidade.list();
        const agencia = agencias.find(a => a.id === convite.agencia_id);
        const unidade = unidades ? unidades.find(u => u.id === convite.unidade_id) : null;
        const me = await base44.auth.me();

        // Preparar dados para atualização do usuário
        const updateData = {
          tipo_hierarquia: convite.tipo_hierarquia,
          agencia_id: convite.agencia_id,
          agencia_nome: agencia?.nome || convite.agencia_nome,
          unidade_id: convite.unidade_id || "",
          unidade_nome: unidade?.nome || convite.unidade_nome || ""
        };

        // Definir líder baseado no tipo de hierarquia
        if (convite.tipo_hierarquia === "Líder de Agência") {
          // Líder de Agência não tem líder acima
          updateData.lider_id = "";
          updateData.lider_email = "";
          updateData.lider_nome = "";
          
          // Atualizar a agência com este líder
          if (agencia) {
            await base44.entities.Agencia.update(agencia.id, {
              lider_agencia_id: me.id,
              lider_agencia_email: me.email,
              lider_agencia_nome: me.full_name
            });
          }
        } else if (convite.tipo_hierarquia === "Líder de Unidade") {
          updateData.lider_id = agencia?.lider_agencia_id || convite.lider_id || "";
          updateData.lider_email = agencia?.lider_agencia_email || convite.lider_email || "";
          updateData.lider_nome = agencia?.lider_agencia_nome || convite.lider_nome || "";
          
          // Atualizar unidade com o líder
          if (unidade) {
            await base44.entities.Unidade.update(unidade.id, {
              lider_unidade_id: me.id,
              lider_unidade_email: me.email,
              lider_unidade_nome: me.full_name
            });
          }
        } else if (convite.tipo_hierarquia === "Corretor") {
          if (convite.unidade_id && unidade) {
            updateData.lider_id = unidade.lider_unidade_id || "";
            updateData.lider_email = unidade.lider_unidade_email || "";
            updateData.lider_nome = unidade.lider_unidade_nome || "";
          } else {
            updateData.lider_id = agencia?.lider_agencia_id || convite.lider_id || "";
            updateData.lider_email = agencia?.lider_agencia_email || convite.lider_email || "";
            updateData.lider_nome = agencia?.lider_agencia_nome || convite.lider_nome || "";
          }
        }

        // Atualizar usuário atual via updateMe
        await base44.auth.updateMe(updateData);
      }
      
      // Atualizar status do convite
      await base44.entities.ConviteHierarquia.update(convite.id, {
        status: aceitar ? "aceito" : "recusado",
        data_resposta: new Date().toISOString()
      });
    },
    onSuccess: (_, { aceitar }) => {
      queryClient.invalidateQueries({ queryKey: ["convites"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      queryClient.invalidateQueries({ queryKey: ["agencias"] });
      
      if (aceitar) {
        alert("Convite aceito com sucesso! Sua hierarquia foi atualizada. A página será recarregada.");
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  });

  if (convites.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Convites Pendentes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-slate-300">
            Você recebeu {convites.length} convite{convites.length > 1 ? "s" : ""} para integrar uma hierarquia organizacional:
          </p>

          {convites.map((convite) => (
            <Card key={convite.id} className="bg-slate-700/50 border-slate-600 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    {convite.tipo_hierarquia === "Líder de Unidade" ? (
                      <Users className="w-6 h-6 text-white" />
                    ) : (
                      <Building className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{convite.tipo_hierarquia}</h3>
                    <p className="text-slate-400 text-sm">
                      Convidado por: {convite.lider_nome || convite.lider_email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold">Agência:</span>
                  <span>{convite.agencia_nome}</span>
                </div>
                {convite.unidade_nome && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold">Unidade:</span>
                    <span>{convite.unidade_nome}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => responderConviteMutation.mutate({ convite, aceitar: true })}
                  disabled={responderConviteMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aceitar
                </Button>
                <Button
                  onClick={() => responderConviteMutation.mutate({ convite, aceitar: false })}
                  disabled={responderConviteMutation.isPending}
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/20"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Recusar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}