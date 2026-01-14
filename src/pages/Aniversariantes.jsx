import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Cake, Phone, Mail, Calendar, Gift, PartyPopper, Sparkles } from "lucide-react";
import { format, parseISO, isSameDay, isWithinInterval, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export default function Aniversariantes() {
  const [filter, setFilter] = useState("hoje");
  const [showPopup, setShowPopup] = useState(false);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list()
  });

  // Verificar se há data de nascimento e calcular aniversariantes
  const aniversariantes = React.useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfDay(hoje);
    const fimSemana = addDays(inicioSemana, 7);

    const clientesComAniversario = clientes.filter(c => c.data_nascimento);

    return clientesComAniversario.map(cliente => {
      const dataNasc = parseISO(cliente.data_nascimento);
      const aniversarioEsteAno = new Date(hoje.getFullYear(), dataNasc.getMonth(), dataNasc.getDate());
      
      const idade = hoje.getFullYear() - dataNasc.getFullYear();
      const ehHoje = isSameDay(aniversarioEsteAno, hoje);
      const ehNaSemana = isWithinInterval(aniversarioEsteAno, { start: inicioSemana, end: fimSemana });

      return {
        ...cliente,
        dataAniversario: aniversarioEsteAno,
        idade,
        ehHoje,
        ehNaSemana
      };
    }).filter(c => filter === "hoje" ? c.ehHoje : c.ehNaSemana)
      .sort((a, b) => a.dataAniversario - b.dataAniversario);
  }, [clientes, filter]);

  const aniversariantesHoje = React.useMemo(() => {
    return aniversariantes.filter(a => a.ehHoje);
  }, [aniversariantes]);

  // Pop-up automático quando há aniversariantes do dia
  useEffect(() => {
    if (aniversariantesHoje.length > 0) {
      setShowPopup(true);
      // Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [aniversariantesHoje.length]);

  const handleSendMessage = (cliente) => {
    const mensagem = `Parabéns, ${cliente.nome}! Desejamos muitas felicidades! 🎂🎉`;
    if (cliente.telefone) {
      const telefone = cliente.telefone.replace(/\D/g, '');
      window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Cake className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-purple-900">🎉 Aniversariantes</h1>
              <p className="text-purple-600 font-medium">Celebre com seus clientes!</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            <Button
              onClick={() => setFilter("hoje")}
              className={`px-8 py-6 text-lg font-bold rounded-2xl transition-all ${
                filter === "hoje"
                  ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-xl scale-105"
                  : "bg-white text-purple-700 hover:bg-purple-50"
              }`}
            >
              <Cake className="w-5 h-5 mr-2" />
              Hoje ({aniversariantesHoje.length})
            </Button>
            <Button
              onClick={() => setFilter("semana")}
              className={`px-8 py-6 text-lg font-bold rounded-2xl transition-all ${
                filter === "semana"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl scale-105"
                  : "bg-white text-purple-700 hover:bg-purple-50"
              }`}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Esta Semana
            </Button>
          </div>
        </div>

        {/* Lista de Aniversariantes */}
        <AnimatePresence mode="wait">
          {aniversariantes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <Gift className="w-24 h-24 mx-auto text-purple-300 mb-4" />
              <p className="text-2xl text-purple-600 font-bold">
                Nenhum aniversariante {filter === "hoje" ? "hoje" : "esta semana"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {aniversariantes.map((cliente, index) => (
                <motion.div
                  key={cliente.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`relative overflow-hidden ${
                      cliente.ehHoje
                        ? "bg-gradient-to-br from-pink-400 via-rose-400 to-red-500"
                        : "bg-gradient-to-br from-purple-400 via-indigo-400 to-blue-500"
                    } p-6 hover:scale-105 transition-transform duration-300 shadow-2xl`}
                  >
                    {/* Confetti Background */}
                    <div className="absolute top-0 right-0 opacity-20">
                      <Sparkles className="w-32 h-32 text-white" />
                    </div>

                    {/* Badge "HOJE" */}
                    {cliente.ehHoje && (
                      <div className="absolute top-4 right-4">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="bg-yellow-300 text-yellow-900 px-3 py-1 rounded-full text-xs font-black shadow-lg"
                        >
                          🎂 HOJE!
                        </motion.div>
                      </div>
                    )}

                    {/* Ícone Principal */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <PartyPopper className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-white">{cliente.nome}</h3>
                        <p className="text-white/90 text-sm font-semibold">
                          {cliente.idade} anos
                        </p>
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <Calendar className="w-5 h-5 text-white flex-shrink-0" />
                        <span className="text-white font-semibold">
                          {format(cliente.dataAniversario, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>

                      {cliente.telefone && (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-3">
                          <Phone className="w-5 h-5 text-white flex-shrink-0" />
                          <span className="text-white font-medium text-sm">
                            {cliente.telefone}
                          </span>
                        </div>
                      )}

                      {cliente.email && (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-3">
                          <Mail className="w-5 h-5 text-white flex-shrink-0" />
                          <span className="text-white font-medium text-sm truncate">
                            {cliente.email}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botão de Ação */}
                    <Button
                      onClick={() => handleSendMessage(cliente)}
                      className="w-full bg-white text-purple-700 hover:bg-purple-50 font-bold py-3 rounded-xl shadow-lg"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Enviar Parabéns
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pop-up de Aniversariantes do Dia */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-pink-500 to-purple-600 border-0">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-white text-center flex items-center justify-center gap-3">
              <PartyPopper className="w-8 h-8" />
              Aniversariantes de Hoje!
              <Cake className="w-8 h-8" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {aniversariantesHoje.map((cliente, index) => (
              <motion.div
                key={cliente.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="bg-white/20 backdrop-blur-md border-white/40 p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <Cake className="w-8 h-8 text-pink-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white">{cliente.nome}</h4>
                      <p className="text-white/90">🎉 {cliente.idade} anos hoje!</p>
                      {cliente.telefone && (
                        <p className="text-white/80 text-sm flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4" />
                          {cliente.telefone}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        handleSendMessage(cliente);
                        confetti({
                          particleCount: 50,
                          spread: 60,
                          origin: { y: 0.8 }
                        });
                      }}
                      className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Parabenizar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Button
            onClick={() => setShowPopup(false)}
            className="w-full bg-white text-purple-700 hover:bg-purple-50 font-bold py-4 text-lg rounded-xl"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}