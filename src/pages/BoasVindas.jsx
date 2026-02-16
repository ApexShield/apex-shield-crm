import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Briefcase,
  Sparkles,
  Rocket,
  Gift,
  Network,
  Star,
  DollarSign,
  LineChart,
  UserCheck,
  ShieldCheck,
  Bell,
  Mail,
  Phone,
  Globe,
  Lock,
  Layers,
  Share2,
  Cake,
  Award,
  LayoutDashboard,
  Building,
  User
} from "lucide-react";

export default function BoasVindas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [selectedHierarchy, setSelectedHierarchy] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  // Redirecionar para Leads se usuário já aceitou política
  useEffect(() => {
    if (currentUser?.aceite_politica_privacidade) {
      navigate(createPageUrl("Leads"));
    }
  }, [currentUser, navigate]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setShowProfileDialog(false);
      setShowPrivacyDialog(false);
      navigate(createPageUrl("Leads"));
    }
  });

  const handleStartClick = () => {
    // Mostrar diálogo de aceite da política
    setShowPrivacyDialog(true);
  };

  const handleAcceptPrivacy = () => {
    if (acceptedPrivacy) {
      // Verificar se usuário já tem hierarquia definida
      if (currentUser?.tipo_hierarquia && currentUser.tipo_hierarquia !== "Sem Hierarquia") {
        // Salvar aceite e redirecionar
        updateProfileMutation.mutate({
          aceite_politica_privacidade: true,
          data_aceite_politica: new Date().toISOString()
        });
      } else {
        // Mostrar diálogo de perfil
        setShowPrivacyDialog(false);
        setShowProfileDialog(true);
      }
    }
  };

  const handleSaveProfile = () => {
    if (selectedHierarchy) {
      updateProfileMutation.mutate({
        tipo_hierarquia: selectedHierarchy,
        aceite_politica_privacidade: true,
        data_aceite_politica: new Date().toISOString()
      });
    }
  };

  const features = [
    {
      icon: Target,
      title: "Funil de Vendas em 9 Etapas",
      description: "Do primeiro contato até entrega da apólice com cores visuais distintas",
      gradient: "from-blue-500 via-cyan-500 to-blue-600",
      category: "Vendas"
    },
    {
      icon: LayoutDashboard,
      title: "Dashboard em Tempo Real",
      description: "Gráficos, métricas e visão 360° do seu funil de vendas",
      gradient: "from-purple-500 via-pink-500 to-purple-600",
      category: "Gestão"
    },
    {
      icon: Calendar,
      title: "Agenda Semanal Profissional",
      description: "Calendário completo com visualização por hora e cores personalizadas",
      gradient: "from-green-500 via-emerald-500 to-green-600",
      category: "Produtividade"
    },
    {
      icon: Clock,
      title: "Agendamento Inteligente",
      description: "Visitas (F1-F5), fechamentos e entregas com modalidade online/presencial",
      gradient: "from-orange-500 via-red-500 to-orange-600",
      category: "Vendas"
    },
    {
      icon: Cake,
      title: "Aniversariantes Automático",
      description: "Alerta de aniversários com envio de mensagem WhatsApp em 1 clique",
      gradient: "from-pink-500 via-rose-500 to-pink-600",
      category: "Relacionamento"
    },
    {
      icon: DollarSign,
      title: "Gestão Financeira Completa",
      description: "Controle despesas e receitas com gráficos e categorização",
      gradient: "from-emerald-500 via-green-600 to-emerald-600",
      category: "Finanças"
    },
    {
      icon: Network,
      title: "Organograma e Hierarquia",
      description: "Estrutura por agências, líderes de unidade e corretores com permissões",
      gradient: "from-indigo-500 via-purple-500 to-indigo-600",
      category: "Gestão"
    },
    {
      icon: Users,
      title: "Gestão de Equipe Avançada",
      description: "Convide usuários, defina permissões (Admin/VIP/Padrão) e hierarquia",
      gradient: "from-blue-600 via-indigo-600 to-blue-700",
      category: "Gestão"
    },
    {
      icon: Shield,
      title: "Gestão de Apólices Detalhada",
      description: "Produtos, coberturas, beneficiários e valores com importação automática",
      gradient: "from-cyan-500 via-blue-500 to-cyan-600",
      category: "Vendas"
    },
    {
      icon: FileText,
      title: "Histórico Completo e Automático",
      description: "Todas mudanças de status, observações com data/hora e timeline",
      gradient: "from-teal-500 via-cyan-500 to-teal-600",
      category: "Gestão"
    },
    {
      icon: Upload,
      title: "Import/Export Excel Massivo",
      description: "Importe centenas de leads e exporte relatórios em segundos",
      gradient: "from-green-600 via-lime-500 to-green-700",
      category: "Produtividade"
    },
    {
      icon: FolderOpen,
      title: "Gestão de Documentos",
      description: "Upload e organização de documentos por cliente com preview",
      gradient: "from-yellow-500 via-orange-500 to-yellow-600",
      category: "Gestão"
    },
    {
      icon: FileSpreadsheet,
      title: "Relatórios Profissionais em PDF",
      description: "Relatórios diários, HOT40 e customizados com design profissional",
      gradient: "from-red-500 via-pink-500 to-red-600",
      category: "Gestão"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Integrado",
      description: "Envio direto de mensagens com templates prontos em 1 clique",
      gradient: "from-green-500 via-teal-500 to-green-600",
      category: "Relacionamento"
    },
    {
      icon: Mail,
      title: "Email Profissional",
      description: "Envio de emails diretamente do sistema com templates",
      gradient: "from-blue-500 via-indigo-500 to-blue-600",
      category: "Relacionamento"
    },
    {
      icon: UserPlus,
      title: "Sistema de Indicações",
      description: "Registre indicações de cada cliente com nome, conexão e follow-up",
      gradient: "from-purple-500 via-indigo-500 to-purple-600",
      category: "Vendas"
    },
    {
      icon: Activity,
      title: "Perfil 360° do Cliente",
      description: "Dados pessoais, profissionais, saúde, IMC, seguros e patrimônio",
      gradient: "from-cyan-500 via-blue-500 to-cyan-600",
      category: "Vendas"
    },
    {
      icon: Filter,
      title: "Filtros Super Avançados",
      description: "Busque por nome, status, telefone, data e múltiplos critérios",
      gradient: "from-pink-500 via-rose-500 to-pink-600",
      category: "Produtividade"
    },
    {
      icon: Zap,
      title: "Ações Rápidas e Intuitivas",
      description: "Mude status, agende, adicione observações em 2 cliques",
      gradient: "from-yellow-500 via-amber-500 to-yellow-600",
      category: "Produtividade"
    },
    {
      icon: Palette,
      title: "Sistema de Cores Inteligente",
      description: "Identifique status visualmente: Azul Pavão, Verde Limão, Amarelo Banana",
      gradient: "from-indigo-500 via-purple-500 to-indigo-600",
      category: "Produtividade"
    },
    {
      icon: Lock,
      title: "Segurança e Permissões RLS",
      description: "Cada usuário vê apenas seus leads e os de sua equipe conforme hierarquia",
      gradient: "from-slate-600 via-slate-700 to-slate-800",
      category: "Gestão"
    },
    {
      icon: Bell,
      title: "Notificações e Alertas",
      description: "Nunca perca uma visita ou aniversário com sistema de alertas",
      gradient: "from-red-500 via-orange-500 to-red-600",
      category: "Produtividade"
    },
    {
      icon: LineChart,
      title: "Gráficos e Analytics",
      description: "Acompanhe conversão, leads por etapa e performance da equipe",
      gradient: "from-blue-600 via-purple-600 to-blue-700",
      category: "Gestão"
    },
    {
      icon: Award,
      title: "Sistema VIP de Usuários",
      description: "Usuários VIP com funcionalidades exclusivas de agendamento",
      gradient: "from-amber-500 via-yellow-500 to-amber-600",
      category: "Gestão"
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 to-pink-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/50"
            >
              <Sparkles className="w-14 h-14 text-white" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4 tracking-tight"
            >
              APEX SHIELD CRM
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <p className="text-2xl sm:text-3xl text-cyan-300 font-bold flex items-center justify-center gap-2">
                <Rocket className="w-8 h-8 text-yellow-400" />
                O CRM Mais Completo para Corretores
                <Star className="w-8 h-8 text-yellow-400" />
              </p>
              <p className="text-cyan-200 text-xl max-w-4xl mx-auto leading-relaxed">
                24 funcionalidades poderosas · Totalmente gratuito · Sem limites de leads
              </p>
            </motion.div>
          </motion.div>

          {/* Stats Animados */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12"
          >
            {[
              { num: "24+", label: "Funcionalidades", icon: Zap, color: "from-yellow-400 to-orange-500" },
              { num: "9", label: "Etapas Funil", icon: Target, color: "from-blue-400 to-cyan-500" },
              { num: "100%", label: "Gratuito", icon: Gift, color: "from-green-400 to-emerald-500" },
              { num: "∞", label: "Leads Ilimitados", icon: TrendingUp, color: "from-purple-400 to-pink-500" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={item}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all shadow-xl hover:shadow-2xl cursor-pointer"
              >
                <stat.icon className={`w-8 h-8 mb-3 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform`} />
                <div className={`text-4xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.num}
                </div>
                <div className="text-cyan-200 text-sm font-semibold">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 mb-3">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-cyan-200 text-xl font-semibold">
            24 Ferramentas Profissionais · Zero Complicação · Máxima Produtividade
          </p>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={idx}
                variants={item}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  transition: { duration: 0.2 }
                }}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/50 transition-all duration-300 cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl"
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg group-hover:shadow-2xl`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                  
                  <div className="inline-block mb-2">
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full border border-cyan-400/30">
                      {feature.category}
                    </span>
                  </div>
                  
                  <h3 className="font-black text-white mb-2 text-lg group-hover:text-cyan-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-cyan-100/80 text-sm leading-relaxed group-hover:text-white transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.gradient} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Key Benefits */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-10 sm:p-14 mb-16 shadow-2xl border border-white/30 overflow-hidden"
        >
          {/* Animated background orbs */}
          <motion.div 
            animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl"
          />

          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-black text-center mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
              Por que escolher o Apex Shield?
            </h2>
            <p className="text-center text-cyan-200 mb-10 text-lg">
              O CRM que vai revolucionar sua forma de vender seguros
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, title: "Organização Total", desc: "Funil visual com 9 etapas e cores inteligentes", color: "from-blue-400 to-cyan-400" },
                { icon: Rocket, title: "Produtividade 10x", desc: "Ações em 2 cliques e automações poderosas", color: "from-purple-400 to-pink-400" },
                { icon: Globe, title: "Histórico Completo", desc: "Timeline automático de todas as interações", color: "from-green-400 to-emerald-400" },
                { icon: Phone, title: "Comunicação Integrada", desc: "WhatsApp, Email e telefone em 1 clique", color: "from-orange-400 to-red-400" },
                { icon: BarChart3, title: "Analytics Avançado", desc: "Gráficos, métricas e relatórios em tempo real", color: "from-cyan-400 to-blue-400" },
                { icon: Users, title: "Gestão de Equipe", desc: "Hierarquia, permissões e controle total", color: "from-indigo-400 to-purple-400" },
                { icon: Layers, title: "Tudo Integrado", desc: "Agenda, leads, documentos e apólices unificados", color: "from-teal-400 to-cyan-400" },
                { icon: Award, title: "Profissional", desc: "Interface moderna e experiência premium", color: "from-yellow-400 to-orange-400" },
                { icon: Sparkles, title: "100% Gratuito", desc: "Todas as funcionalidades sem custo algum", color: "from-pink-400 to-rose-400" }
              ].map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-white/30 transition-all cursor-pointer"
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1 text-lg group-hover:text-cyan-300 transition-colors">
                      {benefit.title}
                    </h4>
                    <p className="text-cyan-100/80 text-sm leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Final */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleStartClick}
              size="lg"
              className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white font-black px-20 py-10 text-3xl shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 rounded-3xl group overflow-hidden"
            >
              <motion.div
                animate={{ x: [-1000, 1000] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
              <Rocket className="w-10 h-10 mr-4 group-hover:rotate-12 transition-transform" />
              COMEÇAR AGORA
              <Sparkles className="w-10 h-10 ml-4 group-hover:scale-125 transition-transform" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-8 space-y-3"
          >
            <p className="text-white text-2xl font-black flex items-center justify-center gap-2">
              <Star className="w-7 h-7 text-yellow-400" />
              Transforme sua operação de vendas hoje mesmo
              <Star className="w-7 h-7 text-yellow-400" />
            </p>
            <p className="text-cyan-200 text-xl font-semibold">
              24 Ferramentas Poderosas · Sistema Profissional · Totalmente Gratuito
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
              <a
                href={createPageUrl("PoliticaPrivacidade")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:text-cyan-200 underline text-sm font-medium inline-flex items-center gap-1"
              >
                <Shield className="w-4 h-4" />
                Política de Privacidade
              </a>
              <span className="text-cyan-500">•</span>
              <a
                href={createPageUrl("TermosServico")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:text-cyan-200 underline text-sm font-medium inline-flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Termos de Serviço
              </a>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Gift className="w-5 h-5 text-green-400" />
                <span className="text-cyan-100 font-semibold">100% Gratuito</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-cyan-100 font-semibold">Leads Ilimitados</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-cyan-100 font-semibold">Setup em Minutos</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Dialog de Aceite da Política de Privacidade */}
        <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
          <DialogContent className="bg-slate-900 border-white/20 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl flex items-center gap-2">
                <Shield className="w-6 h-6 text-cyan-400" />
                Política de Privacidade
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-cyan-100 text-sm leading-relaxed">
                <p className="mb-3">
                  Para usar o <strong>APEX SHIELD CRM</strong>, precisamos do seu consentimento para:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>Criar e gerenciar compromissos</strong> na agenda profissional do CRM</li>
                  <li><strong>Enviar convites por email</strong> aos participantes dos compromissos</li>
                  <li><strong>Armazenar dados de leads e clientes</strong> que você cadastrar</li>
                  <li><strong>Proteger seus dados</strong> com criptografia e segurança</li>
                </ul>
                <p className="mt-3 text-xs text-cyan-200">
                  ✅ Seus dados são privados e nunca compartilhados com terceiros<br/>
                  ✅ Você pode revogar o acesso a qualquer momento
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <Checkbox 
                  id="accept-privacy"
                  checked={acceptedPrivacy}
                  onCheckedChange={setAcceptedPrivacy}
                  className="mt-1"
                />
                <Label 
                  htmlFor="accept-privacy" 
                  className="text-white cursor-pointer leading-relaxed"
                >
                  Li e aceito a{" "}
                  <a
                    href={createPageUrl("PoliticaPrivacidade")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline font-semibold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Política de Privacidade
                  </a>
                  {" "}e concordo com o uso dos meus dados conforme descrito.
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowPrivacyDialog(false)}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAcceptPrivacy}
                  disabled={!acceptedPrivacy || updateProfileMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  {updateProfileMutation.isPending ? "Processando..." : "Aceitar e Continuar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Seleção de Perfil */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="bg-slate-900 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl">Defina seu Perfil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-300">
                Selecione o tipo de usuário que melhor descreve seu papel na equipe:
              </p>

              <div className="space-y-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedHierarchy("Líder de Agência")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedHierarchy === "Líder de Agência"
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building className="w-8 h-8 text-purple-400" />
                    <div>
                      <h3 className="text-white font-bold">Líder de Agência</h3>
                      <p className="text-gray-400 text-sm">Gerencia uma agência completa e suas unidades</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedHierarchy("Líder de Unidade")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedHierarchy === "Líder de Unidade"
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-400" />
                    <div>
                      <h3 className="text-white font-bold">Líder de Unidade</h3>
                      <p className="text-gray-400 text-sm">Gerencia uma unidade e seus corretores</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedHierarchy("Corretor")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedHierarchy === "Corretor"
                      ? "border-green-500 bg-green-500/20"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-8 h-8 text-green-400" />
                    <div>
                      <h3 className="text-white font-bold">Corretor</h3>
                      <p className="text-gray-400 text-sm">Atua diretamente na venda de seguros</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowProfileDialog(false)}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={!selectedHierarchy || updateProfileMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {updateProfileMutation.isPending ? "Salvando..." : "Confirmar e Começar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}