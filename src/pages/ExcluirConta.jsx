import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

export default function ExcluirConta() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      setAuthenticated(authed);
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
      setLoading(false);
    });
  }, []);

  const canDelete = confirmText === "EXCLUIR";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.auth.updateMe({
        conta_excluida: true,
        data_exclusao: new Date().toISOString()
      });
      setDeleted(true);
      setTimeout(() => base44.auth.logout("/ExcluirConta"), 3000);
    } catch (err) {
      alert("Erro ao processar exclusão: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Exclusão de Conta</h1>
            <p className="text-red-100 text-sm mt-1">APEX SHIELD CRM</p>
          </div>

          <div className="p-6">
            {deleted ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-lg font-bold text-slate-800">Conta excluída com sucesso</h2>
                <p className="text-sm text-slate-600">
                  Seus dados foram marcados para exclusão permanente. Você será desconectado em instantes.
                </p>
              </div>
            ) : !authenticated ? (
              <div className="text-center space-y-4">
                <p className="text-slate-600">
                  Para solicitar a exclusão da sua conta e de todos os seus dados, você precisa estar conectado.
                </p>
                <Button
                  onClick={() => base44.auth.redirectToLogin("/ExcluirConta")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  Fazer Login para Continuar
                </Button>
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-slate-500">
                    Ao solicitar a exclusão, todos os dados associados à sua conta serão permanentemente removidos, incluindo leads, compromissos, metas e configurações pessoais.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Esta ação é irreversível
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Ao confirmar, todos os seus dados serão permanentemente excluídos:
                  </p>
                  <ul className="text-xs text-red-700 mt-2 space-y-1 list-disc pl-4">
                    <li>Leads e clientes cadastrados</li>
                    <li>Compromissos e agendamentos</li>
                    <li>Metas e dashboards</li>
                    <li>Documentos e observações</li>
                    <li>Configurações e dados pessoais</li>
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-700 font-medium">
                    Conta: <span className="text-indigo-600">{user?.email}</span>
                  </p>
                  {user?.full_name && (
                    <p className="text-sm text-slate-600">Nome: {user.full_name}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-700 mb-2">
                    Para confirmar, digite <strong className="text-red-600">EXCLUIR</strong> abaixo:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Digite EXCLUIR"
                    className="border-red-300 focus-visible:ring-red-500"
                  />
                </div>

                <Button
                  onClick={handleDelete}
                  disabled={!canDelete || deleting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6"
                >
                  {deleting ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processando...</>
                  ) : (
                    <><Trash2 className="w-5 h-5 mr-2" /> Excluir Minha Conta Permanentemente</>
                  )}
                </Button>

                <Link to="/" className="block text-center">
                  <Button variant="ghost" className="text-slate-500 gap-2">
                    <ArrowLeft className="w-4 h-4" /> Voltar ao App
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t px-6 py-4 text-center">
            <p className="text-xs text-slate-400">
              Em conformidade com a LGPD (Lei Geral de Proteção de Dados).
            </p>
            <div className="flex justify-center gap-4 mt-2">
              <Link to="/PoliticaPrivacidade" className="text-xs text-indigo-500 hover:underline">
                Política de Privacidade
              </Link>
              <Link to="/TermosServico" className="text-xs text-indigo-500 hover:underline">
                Termos de Serviço
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}