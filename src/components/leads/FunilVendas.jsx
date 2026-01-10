import { useMemo } from "react";
import { motion } from "framer-motion";

const FUNIL_STAGES = [
  { label: "Cotações", color: "#8e44ad", width: "100%" },
  { label: "Propostas em andamento", color: "#e74c3c", width: "85%" },
  { label: "Assinatura pendente", color: "#3498db", width: "70%" },
  { label: "Propostas finalizadas", color: "#95c45d", width: "55%" },
  { label: "Propostas transmitidas", color: "#f39c12", width: "40%" }
];

export default function FunilVendas({ clientes }) {
  const contadores = useMemo(() => {
    const counts = {
      "Cotações": 0,
      "Propostas em andamento": 0,
      "Assinatura pendente": 0,
      "Propostas finalizadas": 0,
      "Propostas transmitidas": 0
    };

    clientes.forEach(cliente => {
      switch(cliente.status) {
        case "Novo":
        case "AB Fone":
          counts["Cotações"]++;
          break;
        case "AB Visita":
        case "AB Fechamento":
        case "Delay":
          counts["Propostas em andamento"]++;
          break;
        case "Análise":
          counts["Assinatura pendente"]++;
          break;
        case "Venda Feita":
          counts["Propostas finalizadas"]++;
          break;
        case "Entrega de Apólice":
        case "Encerrado":
          counts["Propostas transmitidas"]++;
          break;
      }
    });

    return counts;
  }, [clientes]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Funil de venda</h2>
      
      <div className="space-y-2">
        {FUNIL_STAGES.map((stage, index) => (
          <motion.div
            key={stage.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center"
          >
            <div
              className="text-white font-bold text-2xl py-6 rounded flex items-center justify-center transition-all hover:scale-105"
              style={{ 
                backgroundColor: stage.color,
                width: stage.width,
                minWidth: "120px"
              }}
            >
              {contadores[stage.label]}
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-2 text-center">
              {stage.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}