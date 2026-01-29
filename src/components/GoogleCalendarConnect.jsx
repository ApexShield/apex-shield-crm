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
    queryKey: ["google-calendar-user-connection"],
    queryFn: async () => {
      const response = await base44.functions.invoke('verificarConexaoGoogleUsuario');
      return response.data;
    },
    enabled: open && !!user
  });

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'google_auth_complete') {
        console.log('Autenticação Google concluída');
        // Atualizar UI
        queryClient.invalidateQueries({ queryKey: ["google-calendar-user-connection"] });
        setIsConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await base44.functions.invoke('iniciarOAuthGoogle');
      if (response.data.authUrl) {
        const popup = window.open(
          response.data.authUrl, 
          'GoogleAuth', 
          'width=600,height=700,toolbar=0,menubar=0,location=0'
        );
        
        // Verificar se popup foi bloqueado
        if (!popup || popup.closed) {
          alert('Por favor, habilite pop-ups para este site e tente novamente.');
          setIsConnecting(false);
          return;
        }
        
        // Timeout de segurança caso o usuário feche a janela sem completar
        const timeout = setTimeout(() => {
          if (isConnecting) {
            console.log('Timeout de conexão');
            setIsConnecting(false);
          }
        }, 60000); // 1 minuto
        
        // Limpar timeout se a conexão for bem-sucedida
        const originalHandler = window.onmessage;
        window.onmessage = (event) => {
          if (event.data?.type === 'google_auth_success') {
            clearTimeout(timeout);
          }
          if (originalHandler) originalHandler(event);
        };
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      alert('Erro ao iniciar conexão com Google');
      setIsConnecting(false);
    }
  };

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
                Sua agenda pessoal está sincronizada. Todos os compromissos serão criados no seu Google Calendar.
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
                    <p className="text-blue-300 font-bold mb-2">Conecte sua conta Google</p>
                    <p className="text-sm text-blue-200/80">
                      Para usar o Google Calendar, você precisa conectar sua conta pessoal do Gmail.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm text-indigo-200">
                <p className="font-bold text-white mb-2">O que será sincronizado:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                    <p>Seus compromissos e eventos</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                    <p>Links automáticos do Google Meet</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                    <p>Convites para participantes</p>
                  </div>
                </div>
              </div>

              {user?.email && !user.email.endsWith('@gmail.com') && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-200">
                    Você está logado com <strong>{user.email}</strong>. 
                    Na próxima etapa, conecte uma conta Gmail para usar o Google Calendar.
                  </p>
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-bold py-6 text-lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Conectar Google Calendar
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}