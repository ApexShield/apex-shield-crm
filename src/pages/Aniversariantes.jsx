import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Cake, Phone, Mail, Calendar, Gift, PartyPopper, Sparkles, Users, Heart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isSameDay, isWithinInterval, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export default function Aniversariantes() {
  const [filter, setFilter] = useState("hoje");
  const [showPopup, setShowPopup] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  // Cada proprietário vê SOMENTE seus próprios leads aniversariantes
  const { data: clientes = [] } = useQuery({
    queryKey: ["meus-clientes-aniversario", user?.email],
    queryFn: () => base44.entities.Cliente.filter({ created_by: user.email }),
    enabled: !!user?.email
  });

  // Calcular aniversariantes (clientes + filhos + casamento)
  const aniversariantes = React.useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfDay(hoje);
    const fimSemana = addDays(inicioSemana, 7);
    const todos = [];

    // 1. Aniversários de clientes
    clientes.filter(c => c.data_nascimento).forEach(cliente => {
      const dataNasc = parseISO(cliente.data_nascimento);
      const aniversarioEsteAno = new Date(hoje.getFullYear(), dataNasc.getMonth(), dataNasc.getDate());
      const idade = hoje.getFullYear() - dataNasc.getFullYear();
      const ehHoje = isSameDay(aniversarioEsteAno, hoje);
      const ehNaSemana = isWithinInterval(aniversarioEsteAno, { start: inicioSemana, end: fimSemana });
      todos.push({
        ...cliente,
        tipo_aniversario: "cliente",
        display_nome: cliente.nome,
        display_info: `${idade} anos`,
        display_emoji: "🎂",
        dataAniversario: aniversarioEsteAno,
        idade,
        ehHoje,
        ehNaSemana
      });
    });

    // 2. Aniversários dos filhos
    clientes.forEach(cliente => {
      (cliente.filhos_info || []).forEach(filho => {
        if (!filho.data_nascimento) return;
        const dataNasc = parseISO(filho.data_nascimento);
        const aniversarioEsteAno = new Date(hoje.getFullYear(), dataNasc.getMonth(), dataNasc.getDate());
        const idade = hoje.getFullYear() - dataNasc.getFullYear();
        const ehHoje = isSameDay(aniversarioEsteAno, hoje);
        const ehNaSemana = isWithinInterval(aniversarioEsteAno, { start: inicioSemana, end: fimSemana });
        todos.push({
          ...cliente,
          tipo_aniversario: "filho",
          filho_nome: filho.nome || "Filho(a)",
          display_nome: `${filho.nome || "Filho(a)"} de ${cliente.nome}`,
          display_info: `Completando ${idade} anos`,
          display_emoji: "👶",
          dataAniversario: aniversarioEsteAno,
          idade,
          ehHoje,
          ehNaSemana
        });
      });
    });

    // 3. Aniversários de casamento
    clientes.filter(c => c.data_casamento).forEach(cliente => {
      const dataCasamento = parseISO(cliente.data_casamento);
      const aniversarioEsteAno = new Date(hoje.getFullYear(), dataCasamento.getMonth(), dataCasamento.getDate());
      const anos = hoje.getFullYear() - dataCasamento.getFullYear();
      const ehHoje = isSameDay(aniversarioEsteAno, hoje);
      const ehNaSemana = isWithinInterval(aniversarioEsteAno, { start: inicioSemana, end: fimSemana });
      todos.push({
        ...cliente,
        tipo_aniversario: "casamento",
        display_nome: cliente.nome,
        display_info: `${anos} anos de casado(a)`,
        display_emoji: "💍",
        dataAniversario: aniversarioEsteAno,
        idade: anos,
        ehHoje,
        ehNaSemana
      });
    });

    return todos
      .filter(c => filter === "hoje" ? c.ehHoje : c.ehNaSemana)
      .sort((a, b) => a.dataAniversario - b.dataAniversario);
  }, [clientes, filter]);

  const aniversariantesHoje = React.useMemo(() => {
    return aniversariantes.filter(a => a.ehHoje);
  }, [aniversariantes]);

  // Pop-up automático quando há aniversariantes do dia
  useEffect(() => {
    if (aniversariantesHoje.length > 0) {
      setShowPopup(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [aniversariantesHoje.length]);

  const handleSendMessage = async (item) => {
    const nomeCorretor = prompt("Digite o nome da corretora que assina a mensagem:");
    
    if (!nomeCorretor) {
      alert("É necessário informar o nome da corretora para enviar a mensagem.");
      return;
    }
    
    let mensagem = "";
    
    if (item.tipo_aniversario === "filho") {
      mensagem = `Olá, ${item.nome}!

Hoje é um dia muito especial para a sua família! ${item.filho_nome} está completando ${item.idade} anos!

Desejamos muita saúde, alegria e felicidade para ${item.filho_nome}. Que este novo ano de vida seja repleto de conquistas e momentos inesquecíveis!

Parabéns para ${item.filho_nome} e para toda a família!

Com carinho,
${nomeCorretor}`;
    } else if (item.tipo_aniversario === "casamento") {
      mensagem = `Olá, ${item.nome}!

Hoje é um dia muito especial — seu aniversário de casamento! Parabéns por ${item.idade} anos de união, amor e companheirismo!

Que esta data seja comemorada com muita alegria ao lado de quem você ama. Desejamos que o amor de vocês continue crescendo a cada dia!

Feliz aniversário de casamento!

Com carinho,
${nomeCorretor}`;
    } else {
      mensagem = `Olá, ${item.nome}!

Hoje é um dia muito especial e nós não poderíamos deixar passar em branco! Queremos te desejar um feliz aniversário repleto de alegrias, saúde e realizações.

Que este novo ciclo seja iluminado por momentos felizes ao lado de quem você ama. Agradecemos por fazer parte da nossa história e por confiar em nós.

Parabéns pelo seu dia!

Com carinho,
${nomeCorretor}`;
    }
    
    if (item.telefone) {
      const telefone = item.telefone.replace(/\D/g, '');
      window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
      
      try {
        const observacoes = item.observacoes || [];
        const tipoMsg = item.tipo_aniversario === "filho" 
          ? `aniversário do filho(a) ${item.filho_nome}` 
          : item.tipo_aniversario === "casamento" 
            ? "aniversário de casamento" 
            : "aniversário pessoal";
        observacoes.push({
          data: new Date().toISOString(),
          texto: `Parabéns (${tipoMsg}) enviados via WhatsApp por ${nomeCorretor}`
        });
        
        await base44.entities.Cliente.update(item.id, {
          observacoes,
          mensagem_aniversario_enviada: true,
          data_ultima_mensagem: new Date().toISOString()
        });
        
        queryClient.invalidateQueries({ queryKey: ["clientes"] });
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
      }
    }
  };

  const getGradient = (item) => {
    const gradients = {
      cliente: item.ehHoje ? "from-pink-400 via-rose-400 to-red-500" : "from-purple-400 via-indigo-400 to-blue-500",
      filho: item.ehHoje ? "from-cyan-400 via-blue-400 to-indigo-500" : "from-teal-400 via-cyan-400 to-blue-500",
      casamento: item.ehHoje ? "from-amber-400 via-yellow-400 to-orange-500" : "from-amber-300 via-yellow-300 to-orange-400"
    };
    return gradients[item.tipo_aniversario] || gradients.cliente;
  };

  const getBadge = (tipo) => {
    const badges = {
      cliente: "🎂 Aniversário",
      filho: "👶 Aniv. Filho(a)",
      casamento: "💍 Aniv. Casamento"
    };
    return badges[tipo] || badges.cliente;
  };

  const getIcon = (tipo) => {
    if (tipo === "casamento") return <Heart className="w-8 h-8 text-white" />;
    if (tipo === "filho") return <Users className="w-8 h-8 text-white" />;
    return <PartyPopper className="w-8 h-8 text-white" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Cake className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-purple-900">Aniversariantes</h1>
                <p className="text-purple-600 font-medium">Celebre com seus clientes!</p>
              </div>
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
              Hoje ({aniversariantes.filter(a => a.ehHoje).length})
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
              {aniversariantes.map((item, index) => (
                <motion.div
                  key={`${item.id}-${item.tipo_aniversario}-${index}`}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`relative overflow-hidden bg-gradient-to-br ${getGradient(item)} p-6 hover:scale-105 transition-transform duration-300 shadow-2xl`}
                  >
                    <div className="absolute top-0 right-0 opacity-20">
                      <Sparkles className="w-32 h-32 text-white" />
                    </div>

                    {/* Badge tipo */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/30 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-bold">
                        {getBadge(item.tipo_aniversario)}
                      </span>
                    </div>

                    {item.ehHoje && (
                      <div className="absolute top-4 right-4">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="bg-yellow-300 text-yellow-900 px-3 py-1 rounded-full text-xs font-black shadow-lg"
                        >
                          {item.display_emoji} HOJE!
                        </motion.div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-4 mt-8">
                      <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                        {getIcon(item.tipo_aniversario)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-white">{item.display_nome}</h3>
                        <p className="text-white/90 text-sm font-semibold">
                          {item.display_info}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <Calendar className="w-5 h-5 text-white flex-shrink-0" />
                        <span className="text-white font-semibold">
                          {format(item.dataAniversario, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>

                      {item.telefone && (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-3">
                          <Phone className="w-5 h-5 text-white flex-shrink-0" />
                          <span className="text-white font-medium text-sm">
                            {item.telefone}
                          </span>
                        </div>
                      )}

                      {item.email && (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-3">
                          <Mail className="w-5 h-5 text-white flex-shrink-0" />
                          <span className="text-white font-medium text-sm truncate">
                            {item.email}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSendMessage(item)}
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
            {aniversariantesHoje.map((item, index) => (
              <motion.div
                key={`popup-${item.id}-${item.tipo_aniversario}-${index}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="bg-white/20 backdrop-blur-md border-white/40 p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      {item.tipo_aniversario === "casamento" ? (
                        <Heart className="w-8 h-8 text-amber-500" />
                      ) : item.tipo_aniversario === "filho" ? (
                        <Users className="w-8 h-8 text-cyan-500" />
                      ) : (
                        <Cake className="w-8 h-8 text-pink-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          {getBadge(item.tipo_aniversario)}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-white">{item.display_nome}</h4>
                      <p className="text-white/90">{item.display_emoji} {item.display_info} hoje!</p>
                      {item.telefone && (
                        <p className="text-white/80 text-sm flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4" />
                          {item.telefone}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        handleSendMessage(item);
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