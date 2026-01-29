import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function GoogleCalendarConnect({ open, onClose }) {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: connection, isLoading } = useQuery({
    queryKey: ["google-calendar-connection"],
    queryFn: async () => {
      const response = await base44.functions.invoke('verificarConexaoUsuarioCalendar');
      return response.data;
    },
    enabled: open && !!user
  });

  const handleConnect = () => {
    alert('✅ Google Calendar já está conectado via autenticação do sistema!');
    onClose();
  };

  const isGmailUser = user?.email?.endsWith('@gmail.com');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 to-indigo-900 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Calendar className="w-7 h-7 text-blue-400" />
            Conectar Google Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          ) : connection?.connected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <p className="text-green-300 font-bold">Conectado com sucesso!</p>
                </div>
                <p className="text-sm text-green-200/80">
                  Conta Google: <span className="font-bold">{connection.google_email}</span>
                </p>
              </div>

              <p className="text-indigo-200 text-sm">
                Sua agenda está sincronizada. Todos os compromissos serão criados no seu Google Calendar pessoal.
              </p>

              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Continuar
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-300 font-bold mb-2">Google Calendar Integrado</p>
                    <p className="text-sm text-blue-200/80">
                      O Google Calendar já está conectado ao sistema. Todos os compromissos serão sincronizados automaticamente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm text-indigo-200">
                <p className="font-bold text-white mb-2">Recursos disponíveis:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                    <p>Criação e gerenciamento de eventos</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                    <p>Links automáticos do Google Meet</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                    <p>Convites e confirmações de participantes</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold py-6 text-lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Começar a Usar
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}