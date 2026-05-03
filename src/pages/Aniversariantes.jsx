import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Cake, Phone, Mail, Calendar, Gift, Sparkles, Users, Heart, PartyPopper } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isSameDay, isWithinInterval, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export default function Aniversariantes() {
  const [filter, setFilter] = useState("hoje");
  const [nomeCorretorDialog, setNomeCorretorDialog] = useState(false);
  const [nomeCorretor, setNomeCorretor] = useState("");
  const [itemParaEnviar, setItemParaEnviar] = useState(null);
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

  // Pop-up removido daqui - já existe no AniversariantesPopup do Layout

  const handleSendMessage = (item) => {
    setItemParaEnviar(item);
    setNomeCorretor(user?.full_name || "");
    setNomeCorretorDialog(true);
  };

  const confirmarEnvio = async () => {
    const item = itemParaEnviar;
    if (!item || !nomeCorretor.trim()) return;

    setNomeCorretorDialog(false);

    let mensagem = "";

    if (item.tipo_aniversario === "filho") {
      mensagem = `Olá, ${item.nome}!\n\nHoje é um dia muito especial para a sua família! ${item.filho_nome} está completando ${item.idade} anos!\n\nDesejamos muita saúde, alegria e felicidade para ${item.filho_nome}. Que este novo ano de vida seja repleto de conquistas e momentos inesquecíveis!\n\nParabéns para ${item.filho_nome} e para toda a família!\n\nCom carinho,\n${nomeCorretor}`;
    } else if (item.tipo_aniversario === "casamento") {
      mensagem = `Olá, ${item.nome}!\n\nHoje é um dia muito especial — seu aniversário de casamento! Parabéns por ${item.idade} anos de união, amor e companheirismo!\n\nQue esta data seja comemorada com muita alegria ao lado de quem você ama. Desejamos que o amor de vocês continue crescendo a cada dia!\n\nFeliz aniversário de casamento!\n\nCom carinho,\n${nomeCorretor}`;
    } else {
      mensagem = `Olá, ${item.nome}!\n\nHoje é um dia muito especial e nós não poderíamos deixar passar em branco! Queremos te desejar um feliz aniversário repleto de alegrias, saúde e realizações.\n\nQue este novo ciclo seja iluminado por momentos felizes ao lado de quem você ama. Agradecemos por fazer parte da nossa história e por confiar em nós.\n\nParabéns pelo seu dia!\n\nCom carinho,\n${nomeCorretor}`;
    }

    if (item.telefone) {
      const telefone = item.telefone.replace(/\D/g, '');
      const telFormatado = telefone.startsWith('55') ? telefone : '55' + telefone;
      window.open(`https://wa.me/${telFormatado}?text=${encodeURIComponent(mensagem)}`, '_blank');

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
    }

    setItemParaEnviar(null);
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
    if (tipo === "casamento") return <Heart className="w-5 h-5 md:w-7 md:h-7 text-white" />;
    if (tipo === "filho") return <Users className="w-5 h-5 md:w-7 md:h-7 text-white" />;
    return <PartyPopper className="w-5 h-5 md:w-7 md:h-7 text-white" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
              <Cake className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-purple-900">Aniversariantes</h1>
              <p className="text-xs md:text-sm text-purple-600 font-medium">Celebre com seus clientes!</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <Button
              onClick={() => setFilter("hoje")}
              className={`px-4 md:px-8 py-2.5 md:py-5 text-xs md:text-base font-bold rounded-xl md:rounded-2xl transition-all ${
                filter === "hoje"
                  ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg"
                  : "bg-white text-purple-700 hover:bg-purple-50"
              }`}
            >
              <Cake className="w-3.5 h-3.5 md:w-5 md:h-5 mr-1.5" />
              Hoje ({aniversariantes.filter(a => a.ehHoje).length})
            </Button>
            <Button
              onClick={() => setFilter("semana")}
              className={`px-4 md:px-8 py-2.5 md:py-5 text-xs md:text-base font-bold rounded-xl md:rounded-2xl transition-all ${
                filter === "semana"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                  : "bg-white text-purple-700 hover:bg-purple-50"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 md:w-5 md:h-5 mr-1.5" />
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
              <Gift className="w-14 h-14 md:w-24 md:h-24 mx-auto text-purple-300 mb-3" />
              <p className="text-base md:text-2xl text-purple-600 font-bold">
                Nenhum aniversariante {filter === "hoje" ? "hoje" : "esta semana"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
            >
              {aniversariantes.map((item, index) => (
                <motion.div
                  key={`${item.id}-${item.tipo_aniversario}-${index}`}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`relative overflow-hidden bg-gradient-to-br ${getGradient(item)} p-4 md:p-6 shadow-xl`}
                  >
                    <div className="absolute top-0 right-0 opacity-20">
                      <Sparkles className="w-20 h-20 md:w-32 md:h-32 text-white" />
                    </div>

                    {/* Badge tipo */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/30 backdrop-blur-sm text-white text-[10px] md:text-xs px-2 py-0.5 md:px-3 md:py-1 rounded-full font-bold">
                        {getBadge(item.tipo_aniversario)}
                      </span>
                    </div>

                    {item.ehHoje && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-black shadow-lg">
                          {item.display_emoji} HOJE!
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3 mt-7 md:mt-8">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                        {getIcon(item.tipo_aniversario)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-lg font-black text-white truncate">{item.display_nome}</h3>
                        <p className="text-white/90 text-xs md:text-sm font-semibold">
                          {item.display_info}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 md:space-y-2 mb-3">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-2 md:p-3">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-white flex-shrink-0" />
                        <span className="text-white font-semibold text-xs md:text-sm">
                          {format(item.dataAniversario, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>

                      {item.telefone && (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-2 md:p-3">
                          <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-white flex-shrink-0" />
                          <span className="text-white font-medium text-xs md:text-sm">{item.telefone}</span>
                        </div>
                      )}

                      {item.email && (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-2 md:p-3">
                          <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-white flex-shrink-0" />
                          <span className="text-white font-medium text-xs md:text-sm truncate">{item.email}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSendMessage(item)}
                      className="w-full bg-white text-purple-700 hover:bg-purple-50 font-bold py-2 md:py-3 rounded-xl shadow-lg text-xs md:text-sm"
                    >
                      <Gift className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                      Enviar Parabéns
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialog nome do corretor */}
      <Dialog open={nomeCorretorDialog} onOpenChange={setNomeCorretorDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nome do Corretor(a)</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">Digite o nome que assinará a mensagem:</p>
          <Input
            value={nomeCorretor}
            onChange={e => setNomeCorretor(e.target.value)}
            placeholder="Seu nome"
            onKeyDown={e => e.key === "Enter" && confirmarEnvio()}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setNomeCorretorDialog(false)}>Cancelar</Button>
            <Button onClick={confirmarEnvio} disabled={!nomeCorretor.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              Enviar Parabéns
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}