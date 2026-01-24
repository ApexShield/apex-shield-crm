import React from "react";
import { Card } from "@/components/ui/card";
import { Building, Users, User, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HierarchyTree({ agencias, unidades, usuarios }) {
  const [expandedAgencias, setExpandedAgencias] = React.useState({});
  const [expandedUnidades, setExpandedUnidades] = React.useState({});

  const toggleAgencia = (agenciaId) => {
    setExpandedAgencias(prev => ({ ...prev, [agenciaId]: !prev[agenciaId] }));
  };

  const toggleUnidade = (unidadeId) => {
    setExpandedUnidades(prev => ({ ...prev, [unidadeId]: !prev[unidadeId] }));
  };

  return (
    <div className="space-y-4">
      {agencias.map(agencia => {
        const unidadesDaAgencia = unidades.filter(u => u.agencia_id === agencia.id);
        const liderAgencia = usuarios.find(u => u.email === agencia.lider_agencia_email);
        const isExpanded = expandedAgencias[agencia.id];

        return (
          <Card key={agencia.id} className="bg-white/5 border-white/10 p-4">
            {/* Agência */}
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-3 rounded-lg transition-all"
              onClick={() => toggleAgencia(agencia.id)}
            >
              {unidadesDaAgencia.length > 0 ? (
                isExpanded ? 
                  <ChevronDown className="w-5 h-5 text-purple-400" /> : 
                  <ChevronRight className="w-5 h-5 text-purple-400" />
              ) : (
                <div className="w-5" />
              )}
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">{agencia.nome}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-400 font-semibold">Líder de Agência:</span>
                  <span className="text-white/80">{liderAgencia?.full_name || agencia.lider_agencia_email}</span>
                </div>
              </div>
            </div>

            {/* Unidades da Agência */}
            <AnimatePresence>
              {isExpanded && unidadesDaAgencia.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-8 mt-3 space-y-3"
                >
                  {unidadesDaAgencia.map(unidade => {
                    const liderUnidade = usuarios.find(u => u.email === unidade.lider_unidade_email);
                    const corretoresDaUnidade = usuarios.filter(u => 
                      u.unidade_id === unidade.id && u.tipo_hierarquia === "Corretor"
                    );
                    const isUnidadeExpanded = expandedUnidades[unidade.id];

                    return (
                      <Card key={unidade.id} className="bg-white/5 border-blue-500/30 p-3">
                        {/* Unidade */}
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-all"
                          onClick={() => toggleUnidade(unidade.id)}
                        >
                          {corretoresDaUnidade.length > 0 ? (
                            isUnidadeExpanded ? 
                              <ChevronDown className="w-4 h-4 text-blue-400" /> : 
                              <ChevronRight className="w-4 h-4 text-blue-400" />
                          ) : (
                            <div className="w-4" />
                          )}
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-bold">{unidade.nome}</h4>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-blue-400 font-semibold">Líder de Unidade:</span>
                              <span className="text-white/80">{liderUnidade?.full_name || unidade.lider_unidade_email || "Sem líder"}</span>
                            </div>
                          </div>
                          <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
                            {corretoresDaUnidade.length} corretor{corretoresDaUnidade.length !== 1 ? 'es' : ''}
                          </span>
                        </div>

                        {/* Corretores da Unidade */}
                        <AnimatePresence>
                          {isUnidadeExpanded && corretoresDaUnidade.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="ml-6 mt-2 space-y-2"
                            >
                              {corretoresDaUnidade.map(corretor => (
                                <div 
                                  key={corretor.id}
                                  className="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                                >
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-white text-sm font-semibold">{corretor.full_name || corretor.email}</p>
                                    <p className="text-green-400 text-xs">Corretor</p>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}