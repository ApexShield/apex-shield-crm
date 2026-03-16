import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, ExternalLink, CheckCircle2, Copy, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function WhatsAppLinksDialog({ open, onClose, links = [] }) {
  const [enviados, setEnviados] = useState({});
  const [loading, setLoading] = useState({});

  const handleOpen = async (link, idx) => {
    window.open(link.url, '_blank');
    setLoading(prev => ({ ...prev, [idx]: true }));

    // Marcar como enviado no banco
    if (link.envio_id) {
      try {
        await base44.entities.CampanhaEnvio.update(link.envio_id, { status: 'enviado' });
      } catch (e) {
        console.error("Erro ao atualizar envio:", e);
      }
    }

    setEnviados(prev => ({ ...prev, [idx]: true }));
    setLoading(prev => ({ ...prev, [idx]: false }));
  };

  const handleCopyAll = () => {
    const text = links.map(l => `${l.nome}: ${l.url}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Links copiados!");
  };

  const totalEnviados = Object.keys(enviados).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <MessageSquare className="w-5 h-5" />
            Links WhatsApp — Clique para enviar
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-slate-500 -mt-2">
          Clique em cada link para abrir a conversa no WhatsApp. Só será contado como enviado após o clique.
        </p>

        <div className="flex gap-2 mb-2 items-center">
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1 text-xs">
            <Copy className="w-3 h-3" /> Copiar todos os links
          </Button>
          <span className="text-xs text-slate-400 flex items-center ml-auto">
            <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
            {totalEnviados}/{links.length} enviados
          </span>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {links.map((link, idx) => {
            const isEnviado = enviados[idx];
            const isLoading = loading[idx];

            return (
              <div
                key={idx}
                className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                  isEnviado ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isEnviado ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{link.nome}</p>
                    <p className="text-xs text-slate-400 truncate">{link.telefone}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleOpen(link, idx)}
                  disabled={isLoading}
                  className={`gap-1 flex-shrink-0 ${
                    isEnviado 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  variant={isEnviado ? "outline" : "default"}
                >
                  {isEnviado ? (
                    <><CheckCircle2 className="w-3 h-3" /> Enviado</>
                  ) : (
                    <><ExternalLink className="w-3 h-3" /> Enviar</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <Button onClick={onClose} variant="outline" className="w-full mt-2">
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}