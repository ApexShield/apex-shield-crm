import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Menu, X, LogOut, ChevronRight, Briefcase, Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ConvitesDialog from "./components/ConvitesDialog";
import AniversariantesPopup from "./components/AniversariantesPopup";

const navigation = [
  { name: "Leads", icon: Users, page: "Leads" },
  { name: "Compromissos", icon: CalendarIcon, page: "Compromissos" },
  { name: "Aniversariantes", icon: Users, page: "Aniversariantes" },
  { name: "Calculadora Rápida", icon: Briefcase, page: "CalculadoraRapida" },
  { name: "Gestão Financeira", icon: Users, page: "GestaoCustos" },
  { name: "Gestão de Usuários", icon: Users, page: "GestaoUsuarios", adminOnly: true },
  { name: "Organograma", icon: Users, page: "Organograma" },
  { name: "Política de Privacidade", icon: Briefcase, page: "PoliticaPrivacidade" },
  { name: "Termos de Serviço", icon: Briefcase, page: "TermosServico" }
];

const PUBLIC_PAGES = ["Home", "PoliticaPrivacidade", "TermosServico"];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConvitesDialog, setShowConvitesDialog] = useState(false);

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

  // Mostrar convites pendentes automaticamente
  useEffect(() => {
    if (convitesPendentes.length > 0) {
      setShowConvitesDialog(true);
    }
  }, [convitesPendentes.length]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Páginas públicas: sem sidebar, sem layout do CRM
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Páginas protegidas: redirecionar para login se não autenticado
  if (!user && !isPublicPage) {
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
              // Esconder itens admin-only se não for admin
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
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
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-800">APEX SHIELD CRM</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main>
          {children}
        </main>
        </div>

        {/* Dialog de Convites */}
        <ConvitesDialog
        open={showConvitesDialog}
        onClose={() => setShowConvitesDialog(false)}
        userEmail={user?.email}
        />

        {/* Popup de Aniversariantes */}
        <AniversariantesPopup />
        </div>
        );
        }