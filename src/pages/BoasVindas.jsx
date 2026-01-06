import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Briefcase, CheckCircle2, UserPlus } from "lucide-react";

export default function BoasVindas() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl mb-4">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bem-vindo ao CRM Leads
          </h1>
          <p className="text-lg text-gray-600">
            Sistema de Gestão para Corretores de Seguros
          </p>
        </div>

        <div className="bg-indigo-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Sobre o Sistema
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Este software foi desenvolvido especialmente para <strong>gestão da agenda e leads de corretores de seguros</strong>.
            Com ele você poderá gerenciar seus contatos, acompanhar o funil de vendas, registrar visitas e muito mais.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Controle completo dos seus leads e pipeline de vendas</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Acompanhamento de status desde o primeiro contato até o fechamento</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Histórico detalhado de cada cliente e observações importantes</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Integração com WhatsApp para comunicação rápida</span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-purple-600" />
            Seu Acesso Está Pronto
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Seu acesso foi validado com sucesso via token no seu e-mail. 
            Você está autenticado e pronto para começar a usar o sistema!
          </p>
          <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500">
            <p className="text-sm text-gray-600">
              <strong>Importante:</strong> Seus dados estão protegidos e você terá controle total sobre seus leads e clientes.
              Mantenha sua senha segura e não compartilhe com terceiros.
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate(createPageUrl("Leads"))}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-lg py-6 rounded-xl shadow-lg"
        >
          COMEÇAR A USAR O SISTEMA
        </Button>
      </div>
    </div>
  );
}