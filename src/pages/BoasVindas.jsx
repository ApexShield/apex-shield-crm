import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, BarChart3, MessageCircle, Clock, FileText } from "lucide-react";

export default function BoasVindas() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-t-8" style={{ borderTopColor: '#0096D8' }}>
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #0096D8 0%, #AFCB3A 100%)' }}>
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#0096D8' }}>
            Bem-vindo ao Apex Shield
          </h1>
          <p className="text-xl font-semibold" style={{ color: '#AFCB3A' }}>
            CRM gratuito e completo para corretores de Seguro de Vida.
          </p>
        </div>

        {/* Texto Descritivo */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8 border-l-4" style={{ borderLeftColor: '#0096D8' }}>
          <p className="text-gray-700 leading-relaxed text-lg">
            O <strong>Apex Shield</strong> foi desenvolvido para <strong>aumentar sua eficiência no dia a dia</strong>: 
            organizar leads, acompanhar a evolução por etapas e manter o histórico de cada atendimento. 
            No <strong>Dashboard</strong>, você visualiza seu funil, prioriza retornos e faz contato com rapidez 
            com integrações de <strong>WhatsApp e e-mail</strong>.
          </p>
        </div>

        {/* Benefícios */}
        <div className="mb-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#0096D8' }}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                <strong>Funil de vendas completo</strong>: acompanhe a evolução do lead até o fechamento
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#AFCB3A' }}>
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                <strong>Dashboard operacional</strong>: visualize a evolução do lead e priorize quem precisa de retorno
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#0096D8' }}>
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                <strong>Follow-up mais engajado</strong>: mantenha próximas ações definidas e reduza esquecimentos
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#AFCB3A' }}>
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                <strong>WhatsApp e e-mail em 1 clique</strong>: acelere a tratativa direto do cadastro
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#0096D8' }}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                <strong>Histórico centralizado</strong>: registre informações do cliente com data e contexto
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={() => navigate(createPageUrl("Leads"))}
            className="text-white font-bold text-lg py-6 px-12 rounded-xl shadow-lg transform transition hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0096D8 0%, #AFCB3A 100%)' }}
          >
            ABRIR DASHBOARD
          </Button>
          <p className="text-sm text-gray-600 mt-4 font-medium">
            Tudo o que você precisa para vender Seguro de Vida com <strong>método</strong>, <strong>clareza</strong> e <strong>ritmo</strong>
          </p>
        </div>
      </div>
    </div>
  );
}