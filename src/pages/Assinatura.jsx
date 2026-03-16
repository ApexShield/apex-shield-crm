import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { 
  Crown, Check, Loader2, CreditCard, Shield, Sparkles, 
  CheckCircle2, XCircle, Star, Ticket, X
} from "lucide-react";
import { toast } from "sonner";

const PRICE_ID = "price_1TBPWELVnpTd5qx7tTvZK0to";

const FEATURES = [
  "Gestão ilimitada de leads",
  "Funil de vendas em 9 etapas",
  "Agenda com convites por email",
  "Dashboard de atividades e KPIs",
  "Dashboard de equipe para líderes",
  "Agente IA Apex (chat + WhatsApp)",
  "Campanhas Email e WhatsApp",
  "Gestão financeira completa",
  "Relatórios em PDF",
  "Organograma e hierarquia",
  "Lembretes automáticos",
  "Suporte prioritário",
];

export default function Assinatura() {
  const [loading, setLoading] = useState(false);
  const [cupomCode, setCupomCode] = useState("");
  const [cupomValidating, setCupomValidating] = useState(false);
  const [cupomApplied, setCupomApplied] = useState(null); // { desconto, promotion_code_id }
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get("status");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const isActive = user?.subscription_status === "active";

  const handleValidateCupom = async () => {
    if (!cupomCode.trim()) return;
    setCupomValidating(true);
    const res = await base44.functions.invoke("validarCupom", { codigo: cupomCode.trim() });
    if (res.data?.valid) {
      setCupomApplied({ desconto: res.data.desconto, promotion_code_id: res.data.promotion_code_id });
      toast.success(res.data.message);
    } else {
      toast.error(res.data?.message || "Cupom inválido");
      setCupomApplied(null);
    }
    setCupomValidating(false);
  };

  const handleRemoveCupom = () => {
    setCupomApplied(null);
    setCupomCode("");
  };

  const handleSubscribe = async () => {
    if (window.self !== window.top) {
      alert("O checkout funciona apenas no app publicado. Abra o app diretamente no navegador.");
      return;
    }
    setLoading(true);
    const response = await base44.functions.invoke("createCheckout", {
      priceId: PRICE_ID,
      successUrl: window.location.origin + "/Assinatura?status=success",
      cancelUrl: window.location.origin + "/Assinatura?status=cancel",
      promotionCodeId: cupomApplied?.promotion_code_id || null,
    });
    if (response.data?.url) {
      window.location.href = response.data.url;
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-[800px] mx-auto space-y-6">
      {/* Status messages */}
      {status === "success" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-emerald-800">Assinatura realizada com sucesso!</p>
            <p className="text-sm text-emerald-600">Seu acesso premium está ativo. Aproveite todos os recursos!</p>
          </div>
        </motion.div>
      )}
      {status === "cancel" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-800">Pagamento cancelado</p>
            <p className="text-sm text-amber-600">Você pode assinar a qualquer momento.</p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Assinatura CRM</h1>
          <p className="text-sm text-slate-500">Acesse todos os recursos do APEX SHIELD CRM</p>
        </div>
      </motion.div>

      {/* Pricing Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="relative overflow-hidden border-2 border-indigo-200">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-bold uppercase tracking-wider text-indigo-200">Plano Premium</span>
              <Star className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm text-indigo-200">R$</span>
              <span className="text-5xl font-black">29</span>
              <span className="text-2xl font-bold">,90</span>
              <span className="text-indigo-200 ml-1">/mês</span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-3 mb-6">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{f}</span>
                </div>
              ))}
            </div>

            {isActive ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-emerald-700">Assinatura Ativa</span>
                </div>
                <p className="text-sm text-emerald-600">Você tem acesso completo a todos os recursos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cupom de Desconto */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-slate-700">Tem um cupom de desconto?</span>
                  </div>
                  {cupomApplied ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-mono font-bold text-emerald-700">{cupomCode.toUpperCase()}</span>
                        <span className="text-sm text-emerald-600">— {cupomApplied.desconto}% OFF</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleRemoveCupom} className="h-7 w-7">
                        <X className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={cupomCode}
                        onChange={e => setCupomCode(e.target.value.toUpperCase())}
                        placeholder="Digite o código"
                        className="font-mono uppercase"
                        onKeyDown={e => e.key === "Enter" && handleValidateCupom()}
                      />
                      <Button
                        onClick={handleValidateCupom}
                        disabled={cupomValidating || !cupomCode.trim()}
                        variant="outline"
                        className="gap-1 flex-shrink-0"
                      >
                        {cupomValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Preço com desconto */}
                {cupomApplied && (
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center">
                    <span className="text-sm text-slate-500 line-through mr-2">R$ 29,90</span>
                    <span className="text-lg font-black text-violet-700">
                      R$ {(29.90 * (1 - cupomApplied.desconto / 100)).toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-violet-500 text-sm">/mês</span>
                  </div>
                )}

                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-6 text-lg rounded-xl gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {loading ? "Redirecionando..." : "Assinar Agora"}
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Pagamento seguro</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}