import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, User, AlertCircle, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const columns = [
  { id: "novo", title: "Novos", color: "bg-blue-500" },
  { id: "em_andamento", title: "Em Andamento", color: "bg-amber-500" },
  { id: "aguardando", title: "Aguardando", color: "bg-purple-500" },
  { id: "concluido", title: "Concluídos", color: "bg-emerald-500" }
];

const prioridadeColors = {
  urgente: "border-l-red-500",
  alta: "border-l-orange-500",
  media: "border-l-yellow-500",
  baixa: "border-l-slate-300"
};

const prioridadeLabels = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa"
};

const categoriaLabels = {
  suporte: "Suporte",
  vendas: "Vendas",
  financeiro: "Financeiro",
  reclamacao: "Reclamação",
  solicitacao: "Solicitação",
  outro: "Outro"
};

export default function TicketKanban({ tickets, onStatusChange }) {
  const getTicketsByStatus = (status) => {
    return tickets.filter(t => t.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <h3 className="font-semibold text-slate-700">{column.title}</h3>
            <Badge variant="secondary" className="ml-auto bg-slate-100 text-slate-600">
              {getTicketsByStatus(column.id).length}
            </Badge>
          </div>
          
          <div className="flex-1 space-y-3 min-h-[200px] p-2 bg-slate-50/50 rounded-xl">
            <AnimatePresence>
              {getTicketsByStatus(column.id).map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Link to={createPageUrl("TicketDetalhes") + `?id=${ticket.id}`}>
                    <Card 
                      className={`p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${prioridadeColors[ticket.prioridade]} bg-white`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <GripVertical className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                        <h4 className="font-medium text-slate-800 text-sm line-clamp-2">
                          {ticket.titulo}
                        </h4>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3 ml-6">
                        <Badge variant="outline" className="text-xs bg-slate-50">
                          {categoriaLabels[ticket.categoria]}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${
                          ticket.prioridade === 'urgente' ? 'bg-red-50 text-red-700 border-red-200' :
                          ticket.prioridade === 'alta' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-slate-50'
                        }`}>
                          {prioridadeLabels[ticket.prioridade]}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500 ml-6">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ticket.cliente_nome || "Cliente"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(ticket.created_date), "dd/MM", { locale: ptBR })}
                        </span>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {getTicketsByStatus(column.id).length === 0 && (
              <div className="flex items-center justify-center h-24 text-sm text-slate-400">
                Nenhum ticket
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}