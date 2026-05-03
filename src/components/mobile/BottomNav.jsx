import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, BarChart3, Calendar, Bot, MoreHorizontal, Cake, Megaphone, Calculator, Target, Wallet, GitBranch, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

const MAIN_ITEMS = [
  { icon: Users, label: "Leads", page: "Leads" },
  { icon: BarChart3, label: "Dashboard", page: "DashboardAtividades" },
  { icon: Calendar, label: "Agenda", page: "Compromissos" },
  { icon: Bot, label: "Agente", page: "AgenteApex" },
];

const MORE_ITEMS = [
  { icon: Cake, label: "Aniversariantes", page: "Aniversariantes", color: "from-pink-500 to-rose-500" },
  { icon: Megaphone, label: "Campanhas", page: "Campanhas", color: "from-orange-500 to-amber-500" },
  { icon: Calculator, label: "Calculadora", page: "CalculadoraRapida", color: "from-blue-500 to-cyan-500" },
  { icon: Target, label: "Metas", page: "Metas", color: "from-emerald-500 to-green-500" },
  { icon: Wallet, label: "Financeiro", page: "GestaoCustos", color: "from-purple-500 to-violet-500" },
  { icon: GitBranch, label: "Organograma", page: "Organograma", color: "from-indigo-500 to-blue-500" },
];

export default function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [moreOpen]);

  const isMoreActive = MORE_ITEMS.some(
    item => location.pathname === createPageUrl(item.page) || location.pathname === `/${item.page}`
  );

  return (
    <>
      {/* Floating menu overlay */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating menu */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-20 left-3 right-3 z-[60] lg:hidden safe-area-bottom"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">Mais opções</span>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {MORE_ITEMS.map((item, idx) => {
                  const path = createPageUrl(item.page);
                  const isActive = location.pathname === path || location.pathname === `/${item.page}`;
                  return (
                    <motion.div
                      key={item.page}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Link
                        to={path}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all no-select ${
                          isActive ? "bg-indigo-50 ring-1 ring-indigo-200" : "bg-slate-50 active:bg-slate-100"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}>
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className={`text-[11px] font-semibold text-center leading-tight ${
                          isActive ? "text-indigo-600" : "text-slate-600"
                        }`}>{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden safe-area-bottom">
        <div className="grid grid-cols-5 h-14">
          {MAIN_ITEMS.map(item => {
            const path = createPageUrl(item.page);
            const isActive = location.pathname === path || location.pathname === `/${item.page}`;
            return (
              <Link
                key={item.page}
                to={path}
                className={`flex flex-col items-center justify-center gap-0.5 no-select ${
                  isActive ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center gap-0.5 no-select ${
              moreOpen || isMoreActive ? "text-indigo-600" : "text-slate-400"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}