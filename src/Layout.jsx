import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Menu, X, LogOut, ChevronRight, Briefcase, Calendar as CalendarIcon, Bot, BarChart3, Megaphone, Crown, Ticket, Target, Trash2, ArrowLeft, Headphones, UserCheck
} from "lucide-react";
import { getHierarchyConfig } from "./components/UserHierarchyConfig";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ConvitesDialog from "./components/ConvitesDialog";
import AniversariantesPopup from "./components/AniversariantesPopup";
import ComissaoExpiracaoLayout from "./components/comissoes/ComissaoExpiracaoLayout";
import BottomNav from "./components/mobile/BottomNav";
import DeleteAccountDialog from "./components/mobile/DeleteAccountDialog";
import PullToRefresh from "./components/mobile/PullToRefresh";

const navigation = [
  { name: "Painel Principal", icon: BarChart3, page: "PainelPrincipal" },
  { name: "Leads", icon: Users, page: "Leads" },
  { name: "Clientes", icon: UserCheck, page: "ClientesConvertidos" },
  { name: "Dashboard Atividades", icon: BarChart3, page: "DashboardAtividades" },
  { name: "Compromissos", icon: CalendarIcon, page: "Compromissos" },
  { name: "Aniversariantes", icon: Users, page: "Aniversariantes" },
  { name: "Calculadora Rápida", icon: Briefcase, page: "CalculadoraRapida" },
  { name: "Campanhas", icon: Megaphone, page: "Campanhas" },
  { name: "Metas", icon: Target, page: "Metas" },
  { name: "Comissões", icon: Briefcase, page: "Comissoes" },
  { name: "Gestão Financeira", icon: Users, page: "GestaoCustos" },
  { name: "Gestão de Usuários", icon: Users, page: "GestaoUsuarios", adminOnly: true },
  { name: "Gerenciar Cupons", icon: Ticket, page: "GerenciarCupons", adminOnly: true },
  { name: "Simulador Etário", icon: BarChart3, page: "SimuladorReenquadramento" },
  { name: "Agente Apex", icon: Bot, page: "AgenteApex" },
  { name: "Organograma", icon: Users, page: "Organograma" },
  // { name: "Assinatura", icon: Crown, page: "Assinatura" },
  { name: "Política de Privacidade", icon: Briefcase, page: "PoliticaPrivacidade" },
  { name: "Termos de Serviço", icon: Briefcase, page: "TermosServico" },
  { name: "Suporte", icon: Headphones, page: "Suporte" }
];

const PUBLIC_PAGES = ["Home", "PoliticaPrivacidade", "TermosServico", "BoasVindas", "Suporte", "ExcluirConta"];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConvitesDialog, setShowConvitesDialog] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Main pages that show the menu icon; sub-pages show back arrow
  const MAIN_PAGES = ["PainelPrincipal", "Leads", "DashboardAtividades", "Compromissos", "AgenteApex", "Home", "BoasVindas"];
  const isMainPage = MAIN_PAGES.includes(currentPageName) || location.pathname === "/";

  const isPublicPage = PUBLIC_PAGES.includes(currentPageName);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
    retry: false,
    enabled: !isPublicPage
  });

  const { data: convitesPendentes = [] } = useQuery({
    queryKey: ["convites", user?.email],
    queryFn: async () => {
      const allConvites = await base44.entities.ConviteHierarquia.list();
      return allConvites.filter(c => c.email_convidado === user?.email && c.status === "pendente");
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (convitesPendentes.length > 0) {
      setShowConvitesDialog(true);
    }
  }, [convitesPendentes.length]);

  const queryClient = useQueryClient();

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  const handlePullRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  // Páginas públicas: renderizar apenas o conteúdo, sem sidebar nem layout do CRM
  if (isPublicPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Páginas protegidas: mostrar loading enquanto carrega user
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-out
        lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">APEX SHIELD CRM</h1>
                <p className="text-xs text-slate-500">Gestão de Leads</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              if (item.adminOnly && (!user || user.role !== "admin")) return null;

              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${isActive 
                        ? "bg-indigo-50 text-indigo-600" 
                        : "text-slate-600 hover:bg-slate-50"
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              {(() => {
                const cfg = getHierarchyConfig(user?.tipo_hierarquia);
                return (
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cfg.avatarBg} flex items-center justify-center text-white font-semibold`}>
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate text-sm">
                  {user?.full_name || "Usuário"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteAccount(true)}
              className="w-full mt-2 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 gap-1.5 justify-start"
            >
              <Trash2 className="w-3 h-3" />
              Excluir Conta
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 safe-area-top">
          <div className="flex items-center justify-between">
            {isMainPage ? (
              <Button 
                variant="ghost" 
                size="icon"
                className="min-w-[44px] min-h-[44px]"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                className="min-w-[44px] min-h-[44px]"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">APEX SHIELD CRM</span>
            </div>
            <div className="w-11" />
          </div>
        </header>

        <main className="mobile-content-pad">
          <PullToRefresh onRefresh={handlePullRefresh}>
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="lg:animate-none"
            >
              {children}
            </motion.div>
          </PullToRefresh>
        </main>
      </div>

      <BottomNav />

      <ConvitesDialog
        open={showConvitesDialog}
        onClose={() => setShowConvitesDialog(false)}
        userEmail={user?.email}
      />

      <AniversariantesPopup />
      <ComissaoExpiracaoLayout />

      <DeleteAccountDialog
        open={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        userEmail={user?.email}
      />
    </div>
  );
}