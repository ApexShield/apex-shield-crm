import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Clock, User, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  novo: "bg-blue-100 text-blue-700 border-blue-200",
  em_andamento: "bg-amber-100 text-amber-700 border-amber-200",
  aguardando: "bg-purple-100 text-purple-700 border-purple-200",
  concluido: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

const statusLabels = {
  novo: "Novo",
  em_andamento: "Em Andamento",
  aguardando: "Aguardando",
  concluido: "Concluído"
};

const prioridadeIcons = {
  urgente: "text-red-500",
  alta: "text-orange-500",
  media: "text-yellow-500",
  baixa: "text-slate-400"
};

export default function RecentTickets({ tickets }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Tickets Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {tickets.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              Nenhum ticket encontrado
            </div>
          ) : (
            tickets.slice(0, 5).map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={createPageUrl("TicketDetalhes") + `?id=${ticket.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className={`${prioridadeIcons[ticket.prioridade]}`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {ticket.titulo}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.cliente_nome || "Cliente"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(ticket.created_date), "dd MMM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Badge className={`${statusColors[ticket.status]} border font-medium`}>
                    {statusLabels[ticket.status]}
                  </Badge>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}