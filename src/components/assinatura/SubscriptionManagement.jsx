import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  AlertTriangle, ArrowUpCircle, XCircle, Loader2, 
  RotateCcw, CreditCard, Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PlanSelector, { PLANS } from "./PlanSelector";

export default function SubscriptionManagement({ subInfo }) {
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]); // default anual
  const queryClient = useQueryClient();

  const isMonthly = subInfo?.interval === "month";
  const isCancelScheduled = subInfo?.cancel_at_period_end;

  const handleCancel = async () => {
    setCancelling(true);
    const res = await base44.functions.invoke("cancelSubscription", { action: "cancel" });
    if (res.data?.success) {
      toast.success("Assinatura será cancelada ao final do período atual.");
      queryClient.invalidateQueries({ queryKey: ["subscription-info"] });
    } else {
      toast.error(res.data?.error || "Erro ao cancelar.");
    }
    setCancelling(false);
    setShowCancelDialog(false);
  };

  const handleReactivate = async () => {
    setReactivating(true);
    const res = await base44.functions.invoke("cancelSubscription", { action: "reactivate" });
    if (res.data?.success) {
      toast.success("Assinatura reativada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["subscription-info"] });
    } else {
      toast.error(res.data?.error || "Erro ao reativar.");
    }
    setReactivating(false);
  };

  const handleUpgrade = async () => {
    if (window.self !== window.top) {
      alert("O checkout funciona apenas no app publicado.");
      return;
    }
    setUpgradeLoading(true);
    const response = await base44.functions.invoke("createCheckout", {
      priceId: selectedPlan.priceId,
      successUrl: window.location.origin + "/Assinatura?status=success",
      cancelUrl: window.location.origin + "/Assinatura?status=cancel",
    });
    if (response.data?.url) {
      window.location.href = response.data.url;
    }
    setUpgradeLoading(false);
  };

  return (
    <div className="space-y-3">
      {/* Upgrade para Anual (só aparece se plano atual é mensal) */}
      {isMonthly && !isCancelScheduled && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-emerald-800 text-sm">Upgrade para Plano Anual</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Economize 10% — pague R$ 322,92/ano (equivalente a R$ 26,91/mês em vez de R$ 29,90)
              </p>
              {!showUpgrade ? (
                <Button 
                  size="sm" 
                  className="mt-3 bg-emerald-600 hover:bg-emerald-700 gap-1"
                  onClick={() => setShowUpgrade(true)}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Fazer Upgrade
                </Button>
              ) : (
                <div className="mt-3 space-y-3">
                  <PlanSelector selected={selectedPlan} onSelect={setSelectedPlan} />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleUpgrade}
                      disabled={upgradeLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                    >
                      {upgradeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                      Assinar {selectedPlan.label}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowUpgrade(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Cancelamento agendado */}
      {isCancelScheduled && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">Cancelamento agendado</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Sua assinatura será cancelada ao final do período atual. Você continuará com acesso até lá.
              </p>
              <Button 
                size="sm" 
                className="mt-3 bg-amber-600 hover:bg-amber-700 gap-1"
                onClick={handleReactivate}
                disabled={reactivating}
              >
                {reactivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Manter Assinatura
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Botão Cancelar */}
      {!isCancelScheduled && (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1 text-xs"
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancelar assinatura
          </Button>
        </div>
      )}

      {/* Dialog de confirmação de cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Cancelar Assinatura
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Você continuará com acesso até o final do período já pago, mas não será renovada automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}