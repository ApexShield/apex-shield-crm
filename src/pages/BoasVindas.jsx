import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Target, 
  BarChart3, 
  Calendar,
  Clock,
  Palette,
  FileText,
  Upload,
  Download,
  FolderOpen,
  FileSpreadsheet,
  MessageCircle,
  UserPlus,
  Activity,
  Filter,
  Users,
  Zap,
  CheckCircle2,
  TrendingUp,
  Briefcase
} from "lucide-react";

export default function BoasVindas() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: "Funil de Vendas Completo",
      description: "9 etapas personalizadas do primeiro contato até a entrega da apólice",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: BarChart3,
      title: "Dashboard Operacional",
      description: "Visualização em tempo real do funil com gráficos e métricas",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Calendar,
      title: "Agenda Profissional",
      description: "Sistema de calendário integrado para gerenciar visitas e compromissos",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Clock,
      title: "Agendamento Inteligente",
      description: "Agende visitas, fechamentos (F até F5) e entregas de apólice",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Palette,
      title: "Sistema de Cores",
      description: "Identifique status rapidamente com cores personalizadas (Azul Pavão, Amarelo Banana, etc)",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: FileText,
      title: "Histórico Detalhado",
      description: "Observações com data/hora, mudanças de status e todo o histórico do lead",
      gradient: "from-teal-500 to-cyan-500"
    },
    {
      icon: Upload,
      title: "Import/Export Excel",
      description: "Importe centenas de leads via planilha e exporte dados a qualquer momento",
      gradient: "from-green-600 to-lime-500"
    },
    {
      icon: FolderOpen,
      title: "Gestão de Documentos",
      description: "Anexe e organize documentos de cada cliente",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Gestão de Apólices",
      description: "Controle completo de coberturas, valores e produtos contratados",
      gradient: "from-blue-600 to-indigo-600"
    },
    {
      icon: FileSpreadsheet,
      title: "Relatórios em PDF",
      description: "Gere relatórios diários e HOT40 para acompanhamento",
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp & Email 1-Clique",
      description: "Contato direto integrado ao cadastro para agilizar comunicação",
      gradient: "from-green-500 to-teal-500"
    },
    {
      icon: UserPlus,
      title: "Sistema de Indicações",
      description: "Registre e gerencie indicações de cada cliente",
      gradient: "from-purple-500 to-indigo-500"
    },
    {
      icon: Activity,
      title: "Perfil Completo do Lead",
      description: "Dados pessoais, profissionais, saúde, IMC, seguros atuais e patrimônio",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      icon: Filter,
      title: "Filtros Avançados",
      description: "Busque e filtre por status, nome, telefone e muito mais",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: Users,
      title: "Gestão de Equipe",
      description: "Controle de usuários com permissões (Admin/User/VIP)",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      icon: Zap,
      title: "Ações Rápidas",
      description: "Mude status, agende visitas e adicione observações em segundos",
      gradient: "from-yellow-500 to-green-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-2xl">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 tracking-tight">
              APEX SHIELD CRM
            </h1>
            <p className="text-xl sm:text-2xl text-indigo-200 font-semibold mb-2">
              A Plataforma Definitiva para Corretores de Seguro de Vida
            </p>
            <p className="text-indigo-300 text-lg max-w-3xl mx-auto">
              Sistema completo, profissional e 100% gratuito com tudo que você precisa para vender mais com método, organização e eficiência
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <div className="text-3xl font-bold text-white mb-1">16+</div>
              <div className="text-indigo-200 text-sm">Funcionalidades</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <div className="text-3xl font-bold text-white mb-1">9</div>
              <div className="text-indigo-200 text-sm">Etapas do Funil</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-indigo-200 text-sm">Gratuito</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <div className="text-3xl font-bold text-white mb-1">∞</div>
              <div className="text-indigo-200 text-sm">Leads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Tudo que você precisa em um só lugar
        </h2>
        <p className="text-indigo-300 text-center mb-12 text-lg">
          Ferramentas profissionais para gerenciar todo o ciclo de vendas
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx}
                className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:bg-white/10"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2 text-lg">{feature.title}</h3>
                <p className="text-indigo-200 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Key Benefits */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 sm:p-12 mb-16 shadow-2xl">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Por que escolher o Apex Shield?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-white mb-1">Organização Total</h4>
                <p className="text-indigo-100 text-sm">Todos os leads organizados por etapa do funil</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-white mb-1">Produtividade Máxima</h4>
                <p className="text-indigo-100 text-sm">Agenda integrada e ações rápidas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-white mb-1">Histórico Completo</h4>
                <p className="text-indigo-100 text-sm">Nunca perca informações importantes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-white mb-1">Comunicação Ágil</h4>
                <p className="text-indigo-100 text-sm">WhatsApp e email integrados</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-white mb-1">Gestão Visual</h4>
                <p className="text-indigo-100 text-sm">Cores e gráficos para decisões rápidas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-white mb-1">Escalável</h4>
                <p className="text-indigo-100 text-sm">Gerenciamento de equipe e permissões</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center">
          <Button
            onClick={() => navigate(createPageUrl("Leads"))}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black px-16 py-8 text-2xl shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 rounded-2xl"
          >
            <TrendingUp className="w-8 h-8 mr-3" />
            COMEÇAR AGORA
          </Button>
          <p className="text-white text-xl mt-6 font-bold">
            Tudo que você precisa para vender Seguro de Vida
          </p>
          <p className="text-indigo-300 text-lg mt-2">
            Com método, clareza e ritmo profissional
          </p>
          <p className="text-indigo-400 text-sm mt-6 italic">
            ✨ 100% Gratuito • Sem Limites • Sem Complicação
          </p>
        </div>
      </div>
    </div>
  );
}