import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, DollarSign, RefreshCw } from "lucide-react";
import { parseISO, differenceInDays, isValid, format } from "date-fns";
import { motion } from "framer-motion";

export default function ComissaoExpiracaoPopup({ comissoes, onRenovar }) {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShownToday, setHasShownToday] = useState(false);

  const comissoesExpirando = useMemo(() => {
    const hoje = new Date();
    return comissoes.filter(c => {
      if (c.status !== "ativa") return false;
      const exp = parseISO(c.data_expiracao);
      if (!isValid(exp)) return false;
      const dias = differenceInDays(exp, hoje);
      // Mostra se faltam 7 dias ou menos (incluindo já expiradas recentemente)
      return dias <= 7 && dias >= -7;
    });
  }, [comissoes]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem("comissao_expiracao_popup_shown");

    if (comissoesExpirando.length > 0 && lastShown !== today && !hasShownToday) {
      // Atrasa 3s para não conflitar com popup de aniversário (que aparece em 1s)
      const timer = setTimeout(() => {
        setShowPopup(true);
        setHasShownToday(true);
        localStorage.setItem("comissao_expiracao_popup_shown", today);
      }, 3000);
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
          As seguintes comissões estão prestes a encerrar o período de 12 meses. Atualize o valor com a seguradora.
        </p>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {comissoesExpirando.map((c, index) => {
            const exp = parseISO(c.data_expiracao);
            const dias = differenceInDays(exp, new Date());
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="bg-white/20 backdrop-blur-md border-white/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{c.cliente_nome}</p>
                      <p className="text-xs text-white/70">
                        {c.produto} • R$ {c.valor_comissao?.toFixed(2)}/mês
                      </p>
                      <p className="text-xs text-white/60">
                        Expira: {isValid(exp) ? format(exp, "dd/MM/yyyy") : "—"}
                        {dias < 0
                          ? <span className="text-red-200 font-bold ml-1">(expirada há {Math.abs(dias)} dias)</span>
                          : dias === 0
                            ? <span className="text-yellow-200 font-bold ml-1">(expira hoje!)</span>
                            : <span className="text-yellow-100 ml-1">({dias} dias restantes)</span>
                        }
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => { onRenovar(c); setShowPopup(false); }}
                      className="bg-white/30 hover:bg-white/40 text-white text-xs font-bold"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Renovar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Button
          onClick={() => setShowPopup(false)}
          className="w-full bg-white text-orange-700 hover:bg-orange-50 font-bold py-3 text-sm rounded-xl"
        >
          Entendi
        </Button>
      </DialogContent>
    </Dialog>
  );
}