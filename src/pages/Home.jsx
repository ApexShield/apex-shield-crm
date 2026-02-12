import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { 
  Shield, Target, BarChart3, Calendar, Clock, FileText, Users, Zap,
  TrendingUp, Sparkles, Rocket, Gift, Star, DollarSign, LineChart,
  ShieldCheck, Bell, Mail, Phone, Globe, Lock, Layers, Award,
  MessageCircle, Network, Cake, FolderOpen, Upload, UserPlus, Activity
} from "lucide-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Google Site Verification meta tag
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'google-site-verification';
    meta.content = 'XRLxgP2qEXgHOSlX4WwQECA9f7pK7LsAQWfTN6eICLY';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (auth) {
        // Usuário logado → redirecionar para BoasVindas (que redireciona para Leads se já aceitou)
        window.location.href = createPageUrl("BoasVindas");
      } else {
        setIsAuthenticated(false);
      }
    }).catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const features = [
    { icon: Target, title: "Funil de Vendas em 9 Etapas", desc: "Do primeiro contato até entrega da apólice com cores visuais distintas", gradient: "from-blue-500 to-cyan-500" },
    { icon: Calendar, title: "Google Calendar Integrado", desc: "Agende reuniões e compromissos sincronizados com seu Google Calendar", gradient: "from-green-500 to-emerald-500" },
    { icon: BarChart3, title: "Dashboard em Tempo Real", desc: "Gráficos, métricas e visão 360° do seu funil de vendas", gradient: "from-purple-500 to-pink-500" },
    { icon: Clock, title: "Agendamento Inteligente", desc: "Visitas, fechamentos e entregas com modalidade online/presencial", gradient: "from-orange-500 to-red-500" },
    { icon: Cake, title: "Aniversariantes Automático", desc: "Alerta de aniversários com envio de mensagem WhatsApp em 1 clique", gradient: "from-pink-500 to-rose-500" },
    { icon: DollarSign, title: "Gestão Financeira", desc: "Controle despesas e receitas com gráficos e categorização", gradient: "from-emerald-500 to-green-600" },
    { icon: Network, title: "Organograma e Hierarquia", desc: "Estrutura por agências, líderes e corretores com permissões", gradient: "from-indigo-500 to-purple-500" },
    { icon: Users, title: "Gestão de Equipe", desc: "Convide usuários, defina permissões e hierarquia", gradient: "from-blue-600 to-indigo-600" },
    { icon: Shield, title: "Gestão de Apólices", desc: "Produtos, coberturas, beneficiários e valores detalhados", gradient: "from-cyan-500 to-blue-500" },
    { icon: FolderOpen, title: "Gestão de Documentos", desc: "Upload e organização de documentos por cliente", gradient: "from-yellow-500 to-orange-500" },
    { icon: Upload, title: "Import/Export Excel", desc: "Importe centenas de leads e exporte relatórios em segundos", gradient: "from-green-600 to-lime-500" },
    { icon: MessageCircle, title: "WhatsApp Integrado", desc: "Envio direto de mensagens com templates prontos", gradient: "from-green-500 to-teal-500" },
    { icon: Mail, title: "Email Profissional", desc: "Envio de emails diretamente do sistema", gradient: "from-blue-500 to-indigo-500" },
    { icon: UserPlus, title: "Sistema de Indicações", desc: "Registre indicações de cada cliente com follow-up", gradient: "from-purple-500 to-indigo-500" },
    { icon: Activity, title: "Perfil 360° do Cliente", desc: "Dados pessoais, profissionais, saúde e patrimônio", gradient: "from-cyan-500 to-blue-500" },
    { icon: LineChart, title: "Relatórios em PDF", desc: "Relatórios diários, HOT40 e customizados profissionais", gradient: "from-red-500 to-pink-500" },
    { icon: Lock, title: "Segurança RLS", desc: "Cada usuário vê apenas seus leads e os de sua equipe", gradient: "from-slate-600 to-slate-700" },
    { icon: Bell, title: "Notificações e Alertas", desc: "Nunca perca uma visita ou aniversário", gradient: "from-red-500 to-orange-500" },
  ];

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 to-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-12 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-10">
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }}
              className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/50">
              <Sparkles className="w-14 h-14 text-white" />
            </motion.div>

            <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4 tracking-tight">
              APEX SHIELD CRM
            </h1>

            <p className="text-2xl sm:text-3xl text-cyan-300 font-bold flex items-center justify-center gap-2 mb-3">
              <Rocket className="w-8 h-8 text-yellow-400" />
              O CRM Mais Completo para Corretores de Seguros
              <Star className="w-8 h-8 text-yellow-400" />
            </p>

            <p className="text-cyan-200 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed mb-8">
              O APEX SHIELD CRM é uma plataforma profissional de gestão de relacionamento com clientes (CRM) 
              desenvolvida especificamente para <strong>corretores de seguros</strong>. Gerencie leads, compromissos, 
              apólices, documentos e equipe — tudo em um só lugar, integrado ao Google Calendar.
            </p>

            {/* Stats */}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-10">
              {[
                { num: "24+", label: "Funcionalidades", icon: Zap, color: "from-yellow-400 to-orange-500" },
                { num: "9", label: "Etapas Funil", icon: Target, color: "from-blue-400 to-cyan-500" },
                { num: "100%", label: "Gratuito", icon: Gift, color: "from-green-400 to-emerald-500" },
                { num: "∞", label: "Leads Ilimitados", icon: TrendingUp, color: "from-purple-400 to-pink-500" }
              ].map((stat, idx) => (
                <motion.div key={idx} variants={item} whileHover={{ scale: 1.05, y: -5 }}
                  className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all shadow-xl">
                  <stat.icon className={`w-8 h-8 mb-3 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                  <div className={`text-4xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-1`}>{stat.num}</div>
                  <div className="text-cyan-200 text-sm font-semibold">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Login */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => base44.auth.redirectToLogin(createPageUrl("BoasVindas"))}
                size="lg"
                className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white font-black px-16 py-8 text-2xl shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 rounded-3xl group overflow-hidden"
              >
                <motion.div animate={{ x: [-1000, 1000] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                <Rocket className="w-8 h-8 mr-3 group-hover:rotate-12 transition-transform" />
                ENTRAR NO CRM
                <Sparkles className="w-8 h-8 ml-3 group-hover:scale-125 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Sobre o App - Seção para Google */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-white/20 mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6 text-center">
            O que é o APEX SHIELD CRM?
          </h2>
          <div className="text-cyan-100 text-lg leading-relaxed space-y-4 max-w-4xl mx-auto">
            <p>
              O <strong className="text-cyan-300">APEX SHIELD CRM</strong> é um sistema de gestão de relacionamento com clientes 
              desenvolvido pela <strong className="text-cyan-300">APEX SHIELD Corretora de Seguros</strong> para ajudar corretores 
              de seguros a organizarem sua operação de vendas de forma profissional.
            </p>
            <p>
              O sistema oferece <strong>funil de vendas em 9 etapas</strong>, agendamento de compromissos com 
              <strong> integração ao Google Calendar</strong> (criação de eventos, Google Meet automático e convites), 
              gestão de apólices, documentos, relatórios em PDF, comunicação integrada via WhatsApp e Email, 
              gestão financeira, organograma de equipe com hierarquia e muito mais.
            </p>
            <p>
              Utilizamos a <strong>integração com o Google Calendar</strong> para permitir que corretores agendem 
              reuniões, visitas e compromissos diretamente no calendário, com geração automática de links 
              do Google Meet para reuniões online. Os dados são protegidos com criptografia e nunca 
              compartilhados com terceiros.
            </p>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 mb-3">
            Funcionalidades
          </h2>
          <p className="text-cyan-200 text-xl font-semibold">
            Tudo que um corretor de seguros precisa em um só lugar
          </p>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div key={idx} variants={item} whileHover={{ scale: 1.03, y: -4 }}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/50 transition-all overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative z-10 flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">{feature.title}</h3>
                    <p className="text-cyan-100/80 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Por que escolher */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="relative bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-10 sm:p-14 mb-16 shadow-2xl border border-white/30 overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
              Por que escolher o APEX SHIELD CRM?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, title: "Organização Total", desc: "Funil visual com 9 etapas e cores inteligentes", color: "from-blue-400 to-cyan-400" },
                { icon: Rocket, title: "Produtividade 10x", desc: "Ações em 2 cliques e automações poderosas", color: "from-purple-400 to-pink-400" },
                { icon: Globe, title: "Google Calendar", desc: "Agenda sincronizada com Google Meet automático", color: "from-green-400 to-emerald-400" },
                { icon: Phone, title: "Comunicação Integrada", desc: "WhatsApp, Email e telefone em 1 clique", color: "from-orange-400 to-red-400" },
                { icon: Lock, title: "Dados Protegidos", desc: "Criptografia, LGPD e controle de acesso", color: "from-slate-400 to-slate-500" },
                { icon: Award, title: "100% Gratuito", desc: "Todas as funcionalidades sem custo algum", color: "from-yellow-400 to-orange-400" },
              ].map((b, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-4 bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center shadow-lg`}>
                    <b.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{b.title}</h4>
                    <p className="text-cyan-100/80 text-sm">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Final */}
        <div className="text-center mb-16">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("BoasVindas"))}
              size="lg"
              className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white font-black px-16 py-8 text-2xl shadow-2xl rounded-3xl group overflow-hidden"
            >
              <motion.div animate={{ x: [-1000, 1000] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
              <Rocket className="w-8 h-8 mr-3" />
              COMEÇAR AGORA — É GRÁTIS
              <Sparkles className="w-8 h-8 ml-3" />
            </Button>
          </motion.div>
        </div>

        {/* Footer com links obrigatórios */}
        <footer className="border-t border-white/10 pt-8 pb-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">APEX SHIELD Corretora de Seguros</span>
            </div>
            
            <p className="text-cyan-200/70 text-sm max-w-2xl mx-auto">
              O APEX SHIELD CRM utiliza a integração com Google Calendar para gerenciamento de 
              compromissos profissionais. Seus dados são protegidos e nunca compartilhados com terceiros.
            </p>

            <div className="flex items-center justify-center gap-6 flex-wrap">
              <Link
                to={createPageUrl("PoliticaPrivacidade")}
                className="text-cyan-300 hover:text-cyan-200 underline text-sm font-medium inline-flex items-center gap-1"
              >
                <Shield className="w-4 h-4" />
                Política de Privacidade
              </Link>
              <Link
                to={createPageUrl("TermosServico")}
                className="text-cyan-300 hover:text-cyan-200 underline text-sm font-medium inline-flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Termos de Serviço
              </Link>
            </div>

            <p className="text-cyan-200/50 text-xs">
              Contato: apexshieldcorretoradeseguros@gmail.com
            </p>
            <p className="text-cyan-200/40 text-xs">
              © {new Date().getFullYear()} APEX SHIELD Corretora de Seguros. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}