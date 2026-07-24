import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import AdicionarComissaoDialog from "../components/comissoes/AdicionarComissaoDialog";
import RenovarComissaoDialog from "../components/comissoes/RenovarComissaoDialog";
import ComissaoListagem from "../components/comissoes/ComissaoListagem";
import ResumoMesAtual from "../components/comissoes/ResumoMesAtual";
import ComissaoHistoricoMensal from "../components/comissoes/ComissaoHistoricoMensal";
import ComissaoExpiracaoPopup from "../components/comissoes/ComissaoExpiracaoPopup";

export default function Comissoes() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [renovarComissao, setRenovarComissao] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: comissoes = [], isLoading } = useQuery({
    queryKey: ["comissoes-cliente"],
    queryFn: () => base44.entities.ComissaoCliente.filter({}, "-created_date", 500),
    enabled: !!user
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.filter({}, "-created_date", 5000),
    enabled: !!user
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["comissoes-cliente"] });
  }, [queryClient]);

  // Auto-refresh ao voltar para a aba
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refresh]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-3 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-white">Comissões</h1>
              <p className="text-sm text-emerald-300">Gerencie as comissões individuais de cada cliente</p>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-500 hover:bg-emerald-600 font-bold gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Comissão
          </Button>
        </div>

        {/* Resumo do mês */}
        <ResumoMesAtual comissoes={comissoes} />

        {/* Histórico mensal + filtros */}
        <ComissaoHistoricoMensal comissoes={comissoes} />

        {/* Lista de comissões */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <ComissaoListagem
            comissoes={comissoes}
            onRefresh={refresh}
            onRenovar={(c) => setRenovarComissao(c)}
          />
        )}

        {/* Dialogs */}
        <AdicionarComissaoDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          clientes={clientes}
          onAdded={refresh}
        />

        <RenovarComissaoDialog
          open={!!renovarComissao}
          onClose={() => setRenovarComissao(null)}
          comissao={renovarComissao}
          onRenewed={refresh}
        />

        {/* Popup de expiração */}
        <ComissaoExpiracaoPopup
          comissoes={comissoes}
          onRenovar={(c) => setRenovarComissao(c)}
        />
      </div>
    </div>
  );
}