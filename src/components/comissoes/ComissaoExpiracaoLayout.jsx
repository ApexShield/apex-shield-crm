import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, DollarSign, RefreshCw } from "lucide-react";
import { parseISO, differenceInDays, isValid, format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function ComissaoExpiracaoLayout() {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShownToday, setHasShownToday] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: comissoes = [] } = useQuery({
    queryKey: ["comissoes-cliente-layout"],
    queryFn: () => base44.entities.ComissaoCliente.filter({}, "-created_date", 500),
    enabled: !!user
  });

  const comissoesExpirando = useMemo(() => {
    const hoje = new Date();
    return comissoes.filter(c => {
      if (c.status !== "ativa") return false;
      const exp = parseISO(c.data_expiracao);
      if (!isValid(exp)) return false;
      const dias = differenceInDays(exp, hoje);
      return dias <= 7 && dias >= -7;
    });
  }, [comissoes]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem("comissao_expiracao_layout_shown");

    if (comissoesExpirando.length > 0 && lastShown !== today && !hasShownToday) {
      // Atrasa 4s para não conflitar com popup de aniversário (1s)
      const timer = setTimeout(() => {
        setShowPopup(true);
        setHasShownToday(true);
        localStorage.setItem("comissao_expiracao_layout_shown", today);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [comissoesExpirando.length, hasShownToday]);

  if (comissoesExpirando.length === 0) return null;

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-amber-600 to-orange-700 border-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-white text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-7 h-7" />
            Comissões Expirando!
          </DialogTitle>
        </DialogHeader>

        <p className="text-white/80 text-sm text-center -mt-2">
          Comissões prestes a encerrar o período de 12 meses. Atualize os valores.
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comissoesExpirando.map((c, index) => {
            const exp = parseISO(c.data_expiracao);
            const dias = differenceInDays(exp, new Date());
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/20 backdrop-blur-md border-white/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{c.cliente_nome}</p>
                      <p className="text-xs text-white/70">
                        {c.produto} • R$ {c.valor_comissao?.toFixed(2)}/mês •
                        {dias < 0
                          ? <span className="text-red-200 font-bold ml-1">Expirada</span>
                          : dias === 0
                            ? <span className="text-yellow-200 font-bold ml-1">Expira hoje</span>
                            : <span className="ml-1">{dias}d restantes</span>
                        }
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => { setShowPopup(false); navigate("/Comissoes"); }}
            className="flex-1 bg-white text-orange-700 hover:bg-orange-50 font-bold py-3 text-sm rounded-xl gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Ir para Comissões
          </Button>
          <Button
            onClick={() => setShowPopup(false)}
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10 font-bold py-3 text-sm rounded-xl"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}