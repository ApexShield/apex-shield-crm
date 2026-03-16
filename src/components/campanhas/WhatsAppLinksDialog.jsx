import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, ExternalLink, CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function WhatsAppLinksDialog({ open, onClose, links = [] }) {
  const [enviados, setEnviados] = useState({});

  const handleOpen = (link, idx) => {
    window.open(link.url, '_blank');
    setEnviados(prev => ({ ...prev, [idx]: true }));
  };

  const handleCopyAll = () => {
    const text = links.map(l => `${l.nome}: ${l.url}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Links copiados!");
  };

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
          Clique em cada link para abrir a conversa no WhatsApp. Aguarde enviar um antes de abrir o próximo para evitar bloqueios.
        </p>

        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1 text-xs">
            <Copy className="w-3 h-3" /> Copiar todos os links
          </Button>
          <span className="text-xs text-slate-400 flex items-center">
            {Object.keys(enviados).length}/{links.length} abertos
          </span>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {links.map((link, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                enviados[idx] ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-green-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-800 truncate">{link.nome}</p>
                <p className="text-xs text-slate-400 truncate">{link.telefone}</p>
              </div>
              <Button
                size="sm"
                onClick={() => handleOpen(link, idx)}
                className={`gap-1 flex-shrink-0 ${
                  enviados[idx] 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                variant={enviados[idx] ? "outline" : "default"}
              >
                {enviados[idx] ? (
                  <><CheckCircle2 className="w-3 h-3" /> Aberto</>
                ) : (
                  <><ExternalLink className="w-3 h-3" /> Enviar</>
                )}
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={onClose} variant="outline" className="w-full mt-2">
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}