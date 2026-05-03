import { Link, useLocation } from "react-router-dom";
import { Users, BarChart3, Calendar, Bot } from "lucide-react";
import { createPageUrl } from "@/utils";

const NAV_ITEMS = [
  { icon: Users, label: "Leads", page: "Leads" },
  { icon: BarChart3, label: "Dashboard", page: "DashboardAtividades" },
  { icon: Calendar, label: "Agenda", page: "Compromissos" },
  { icon: Bot, label: "Agente", page: "AgenteApex" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden safe-area-bottom">
      <div className="grid grid-cols-4 h-14">
        {NAV_ITEMS.map(item => {
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
      </div>
    </nav>
  );
}