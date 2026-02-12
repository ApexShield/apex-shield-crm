import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cake, Phone, Gift, PartyPopper, Heart, Users } from "lucide-react";
import { parseISO, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function AniversariantesPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShownToday, setHasShownToday] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: allClientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list(),
    enabled: !!user
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user
  });

  const clientes = React.useMemo(() => {
    if (!user || !allClientes.length || !allUsers.length) return [];
    
    const usuariosComHierarquia = allUsers.filter(u => 
      u.tipo_hierarquia && u.tipo_hierarquia !== "Sem Hierarquia" && u.agencia_id
    );
    const emailsComHierarquia = usuariosComHierarquia.map(u => u.email);
    
    let leadsFiltrados = [];
    
    if (user.role === "admin") {
      leadsFiltrados = allClientes.filter(c => emailsComHierarquia.includes(c.created_by));
    }
    else if (user.tipo_hierarquia === "Líder de Agência" && user.agencia_id) {
      const usuariosDaAgencia = usuariosComHierarquia.filter(u => u.agencia_id === user.agencia_id);
      const emailsDaAgencia = usuariosDaAgencia.map(u => u.email);
      leadsFiltrados = allClientes.filter(c => emailsDaAgencia.includes(c.created_by));
    }
    else if (user.tipo_hierarquia === "Líder de Unidade" && user.unidade_id) {
      const usuariosDaUnidade = usuariosComHierarquia.filter(u => 
        u.unidade_id === user.unidade_id &&
        (u.lider_email === user.email || u.lider_id === user.id || u.email === user.email)
      );
      const emailsDaUnidade = usuariosDaUnidade.map(u => u.email);
      leadsFiltrados = allClientes.filter(c => emailsDaUnidade.includes(c.created_by));
    }
    else if (user.tipo_hierarquia && user.tipo_hierarquia !== "Sem Hierarquia" && user.agencia_id) {
      leadsFiltrados = allClientes.filter(c => c.created_by === user.email);
    }
    
    return leadsFiltrados;
  }, [allClientes, user, allUsers]);

  // Aniversariantes de hoje (clientes + filhos + casamento)
  const aniversariantesHoje = React.useMemo(() => {
    const hoje = new Date();
    const todos = [];

    // Clientes
    clientes.filter(c => c.data_nascimento).forEach(cliente => {
      const dataNasc = parseISO(cliente.data_nascimento);
      const aniversarioEsteAno = new Date(hoje.getFullYear(), dataNasc.getMonth(), dataNasc.getDate());
      const idade = hoje.getFullYear() - dataNasc.getFullYear();
      if (isSameDay(aniversarioEsteAno, hoje)) {
        todos.push({ ...cliente, tipo_aniversario: "cliente", display_nome: cliente.nome, display_info: `${idade} anos`, display_emoji: "🎂", idade });
      }
    });

    // Filhos
    clientes.forEach(cliente => {
      (cliente.filhos_info || []).forEach(filho => {
        if (!filho.data_nascimento) return;
        const dataNasc = parseISO(filho.data_nascimento);
        const aniversarioEsteAno = new Date(hoje.getFullYear(), dataNasc.getMonth(), dataNasc.getDate());
        const idade = hoje.getFullYear() - dataNasc.getFullYear();
        if (isSameDay(aniversarioEsteAno, hoje)) {
          todos.push({ ...cliente, tipo_aniversario: "filho", filho_nome: filho.nome || "Filho(a)", display_nome: `${filho.nome || "Filho(a)"} de ${cliente.nome}`, display_info: `Completando ${idade} anos`, display_emoji: "👶", idade });
        }
      });
    });

    // Casamento
    clientes.filter(c => c.data_casamento).forEach(cliente => {
      const dataCasamento = parseISO(cliente.data_casamento);
      const aniversarioEsteAno = new Date(hoje.getFullYear(), dataCasamento.getMonth(), dataCasamento.getDate());
      const anos = hoje.getFullYear() - dataCasamento.getFullYear();
      if (isSameDay(aniversarioEsteAno, hoje)) {
        todos.push({ ...cliente, tipo_aniversario: "casamento", display_nome: cliente.nome, display_info: `${anos} anos de casado(a)`, display_emoji: "💍", idade: anos });
      }
    });

    return todos;
  }, [clientes]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('aniversariantes_popup_shown');
    
    if (aniversariantesHoje.length > 0 && lastShown !== today && !hasShownToday) {
      setTimeout(() => {
        setShowPopup(true);
        setHasShownToday(true);
        localStorage.setItem('aniversariantes_popup_shown', today);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }, 1000);
    }
  }, [aniversariantesHoje.length, hasShownToday]);

  const handleSendMessage = async (item) => {
    const nomeCorretor = prompt("Digite o nome da corretora que assina a mensagem:");
    if (!nomeCorretor) {
      alert("É necessário informar o nome da corretora para enviar a mensagem.");
      return;
    }
    
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
      window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
      
      try {
        const observacoes = item.observacoes || [];
        const tipoMsg = item.tipo_aniversario === "filho" ? `aniversário do filho(a) ${item.filho_nome}` : item.tipo_aniversario === "casamento" ? "aniversário de casamento" : "aniversário pessoal";
        observacoes.push({ data: new Date().toISOString(), texto: `Parabéns (${tipoMsg}) enviados via WhatsApp por ${nomeCorretor}` });
        await base44.entities.Cliente.update(item.id, { observacoes, mensagem_aniversario_enviada: true, data_ultima_mensagem: new Date().toISOString() });
        queryClient.invalidateQueries({ queryKey: ["clientes"] });
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
      }
    }
  };

  const getBadge = (tipo) => {
    const badges = { cliente: "🎂 Aniversário", filho: "👶 Aniv. Filho(a)", casamento: "💍 Aniv. Casamento" };
    return badges[tipo] || badges.cliente;
  };

  if (aniversariantesHoje.length === 0) return null;

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-pink-500 to-purple-600 border-0">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-white text-center flex items-center justify-center gap-3">
            <PartyPopper className="w-8 h-8" />
            🎉 Aniversariantes de Hoje! 🎉
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
                    <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {getBadge(item.tipo_aniversario)}
                    </span>
                    <h4 className="text-xl font-bold text-white mt-1">{item.display_nome}</h4>
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
                      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
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
  );
}