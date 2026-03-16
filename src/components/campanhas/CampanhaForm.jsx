import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Link, MessageSquare, Mail, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const VARIAVEIS = [
  { label: "+ Primeiro Nome", value: "[NOME]" },
  { label: "+ Nome Completo", value: "[NOME_COMPLETO]" },
  { label: "+ Email", value: "[EMAIL]" },
  { label: "+ Telefone", value: "[TELEFONE]" },
  { label: "+ Corretor", value: "[CORRETOR]" },
  { label: "+ Categoria", value: "[CATEGORIA]" },
];

const STATUS_FILTROS = [
  { value: "todos", label: "Todos os clientes" },
  { value: "novo", label: "Novo" },
  { value: "ab_fone", label: "AB Fone" },
  { value: "ab_visita", label: "AB Visita" },
  { value: "ab_fechamento", label: "AB Fechamento" },
  { value: "delay", label: "Delay" },
  { value: "analise", label: "Análise" },
  { value: "venda_feita", label: "Venda Feita" },
  { value: "entrega_apolice", label: "Entrega de Apólice" },
];

export default function CampanhaForm({ open, onClose, clientes = [] }) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("email");
  const [linkConteudo, setLinkConteudo] = useState("");
  const [mensagem, setMensagem] = useState("Olá [NOME]! Tenho uma novidade incrível para compartilhar com você. Confira no link abaixo!");
  const [assuntoEmail, setAssuntoEmail] = useState("");
  const [filtroClientes, setFiltroClientes] = useState("todos");
  const [enviando, setEnviando] = useState(false);
  const queryClient = useQueryClient();

  const inserirVariavel = (variavel) => {
    setMensagem(prev => prev + " " + variavel);
  };

  // Clientes filtrados para preview
  const clientesFiltrados = (() => {
    const statusMap = {
      novo: "Novo", ab_fone: "AB Fone", ab_visita: "AB Visita",
      ab_fechamento: "AB Fechamento", delay: "Delay", analise: "Análise",
      venda_feita: "Venda Feita", entrega_apolice: "Entrega de Apólice"
    };
    if (filtroClientes === "todos") return clientes;
    return clientes.filter(c => c.status === statusMap[filtroClientes]);
  })();

  const clientesComEmail = clientesFiltrados.filter(c => c.email?.trim());
  const clientesComTelefone = clientesFiltrados.filter(c => c.telefone?.trim());

  const handleEnviar = async () => {
    if (!titulo.trim()) { toast.error("Informe o título da campanha"); return; }
    if (!mensagem.trim()) { toast.error("Informe a mensagem"); return; }

    setEnviando(true);

    // Criar campanha
    const campanha = await base44.entities.Campanha.create({
      titulo, tipo, link_conteudo: linkConteudo, mensagem,
      assunto_email: assuntoEmail || titulo,
      filtro_clientes: filtroClientes, status: "rascunho"
    });

    if (tipo === "email" || tipo === "ambos") {
      // Enviar emails via backend
      const res = await base44.functions.invoke("enviarCampanhaEmail", { campanha_id: campanha.id });
      if (res.data?.success) {
        toast.success(`${res.data.enviados} email(s) enviado(s) com sucesso!`);
      } else {
        toast.error("Erro ao enviar emails: " + (res.data?.error || "desconhecido"));
      }
    }

    if (tipo === "whatsapp" || tipo === "ambos") {
      // Gerar links WhatsApp e abrir
      let gerados = 0;
      const whatsLogs = [];
      for (const cliente of clientesComTelefone.slice(0, 20)) {
        const primeiroNome = (cliente.nome || '').split(' ')[0];
        let msg = mensagem
          .replace(/\[NOME\]/gi, primeiroNome)
          .replace(/\[NOME_COMPLETO\]/gi, cliente.nome || '')
          .replace(/\[TELEFONE\]/gi, cliente.telefone || '')
          .replace(/\[CORRETOR\]/gi, '')
          .replace(/\[CATEGORIA\]/gi, cliente.status || '')
          .replace(/\[EMAIL\]/gi, cliente.email || '');

        if (linkConteudo) msg += "\n\n" + linkConteudo;

        const tel = cliente.telefone.replace(/\D/g, '');
        const telFormatado = tel.startsWith('55') ? tel : '55' + tel;
        const url = `https://wa.me/${telFormatado}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        gerados++;

        whatsLogs.push({
          campanha_id: campanha.id,
          cliente_id: cliente.id,
          cliente_nome: cliente.nome || '',
          canal: 'whatsapp',
          destino: cliente.telefone,
          status: 'enviado',
          mensagem_enviada: msg.substring(0, 500)
        });

        await new Promise(r => setTimeout(r, 500));
      }

      // Save WhatsApp envio logs
      if (whatsLogs.length > 0) {
        try { await base44.entities.CampanhaEnvio.bulkCreate(whatsLogs); } catch (e) { console.error(e); }
      }

      await base44.entities.Campanha.update(campanha.id, {
        whatsapp_gerados: gerados,
        total_destinatarios: (tipo === "whatsapp") ? clientesComTelefone.length : undefined,
        status: tipo === "whatsapp" ? "concluida" : undefined
      });

      toast.success(`${gerados} conversa(s) WhatsApp aberta(s)!`);
    }

    queryClient.invalidateQueries({ queryKey: ["campanhas"] });
    setEnviando(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <Send className="w-5 h-5" />
              Nova Campanha de Divulgação
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* Título */}
          <div>
            <Label className="text-slate-700 font-semibold">Título da Campanha *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Nova postagem - Proteção Financeira" className="mt-1" />
          </div>

          {/* Canal */}
          <div>
            <Label className="text-slate-700 font-semibold">Canal de Envio</Label>
            <div className="flex gap-2 mt-1">
              {[
                { v: "email", label: "Email", icon: Mail, desc: "Envio automático" },
                { v: "whatsapp", label: "WhatsApp", icon: MessageSquare, desc: "Abre conversas" },
                { v: "ambos", label: "Ambos", icon: Send, desc: "Email + WhatsApp" },
              ].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setTipo(opt.v)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    tipo === opt.v ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <opt.icon className={`w-5 h-5 ${tipo === opt.v ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className={`text-sm font-semibold ${tipo === opt.v ? "text-indigo-700" : "text-slate-600"}`}>{opt.label}</span>
                  <span className="text-[10px] text-slate-400">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Link do conteúdo */}
          <div>
            <Label className="text-slate-700 font-semibold flex items-center gap-1">
              <Link className="w-4 h-4" /> Link do Conteúdo (Instagram, etc.)
            </Label>
            <Input value={linkConteudo} onChange={e => setLinkConteudo(e.target.value)} placeholder="https://www.instagram.com/p/..." className="mt-1" />
          </div>

          {/* Assunto do Email */}
          {(tipo === "email" || tipo === "ambos") && (
            <div>
              <Label className="text-slate-700 font-semibold">Assunto do Email</Label>
              <Input value={assuntoEmail} onChange={e => setAssuntoEmail(e.target.value)} placeholder="Deixe vazio para usar o título" className="mt-1" />
            </div>
          )}

          {/* Filtro de clientes */}
          <div>
            <Label className="text-slate-700 font-semibold">Destinatários</Label>
            <Select value={filtroClientes} onValueChange={setFiltroClientes}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTROS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-3 mt-2 text-xs text-slate-500">
              {(tipo === "email" || tipo === "ambos") && (
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {clientesComEmail.length} com email</span>
              )}
              {(tipo === "whatsapp" || tipo === "ambos") && (
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {clientesComTelefone.length} com telefone</span>
              )}
            </div>
          </div>

          {/* Mensagem */}
          <div>
            <Label className="text-slate-700 font-semibold">Mensagem</Label>
            <Textarea
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              rows={5}
              className="mt-1"
              placeholder="Escreva sua mensagem personalizada..."
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {VARIAVEIS.map(v => (
                <button
                  key={v.value}
                  onClick={() => inserirVariavel(v.value)}
                  className="text-xs px-2.5 py-1 rounded-full border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 transition-colors"
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Use as variáveis acima para personalizar. Serão substituídas pelos dados do cliente.</p>
          </div>

          {/* Aviso WhatsApp */}
          {(tipo === "whatsapp" || tipo === "ambos") && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              <p className="font-semibold mb-1">⚠️ Lembrete: Uso Responsável</p>
              <ul className="space-y-0.5 list-disc ml-4">
                <li>Use apenas com contatos conhecidos</li>
                <li>Limite: 15-20 mensagens/dia, bem espaçadas</li>
                <li>Personalize sempre que possível</li>
                <li>A responsabilidade por bloqueios é sua</li>
              </ul>
            </div>
          )}

          {/* Preview */}
          {clientesFiltrados.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Prévia (primeiro cliente)
              </p>
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-500 mb-1 font-medium">
                  {clientesFiltrados[0].nome} {clientesFiltrados[0].telefone && `• ${clientesFiltrados[0].telefone}`}
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {mensagem
                    .replace(/\[NOME\]/gi, (clientesFiltrados[0].nome || '').split(' ')[0])
                    .replace(/\[NOME_COMPLETO\]/gi, clientesFiltrados[0].nome || '')
                    .replace(/\[TELEFONE\]/gi, clientesFiltrados[0].telefone || '')
                    .replace(/\[EMAIL\]/gi, clientesFiltrados[0].email || '')
                    .replace(/\[CORRETOR\]/gi, 'Corretor')
                    .replace(/\[CATEGORIA\]/gi, clientesFiltrados[0].status || '')
                  }
                  {linkConteudo && <><br /><br /><a href={linkConteudo} className="text-indigo-600 underline text-xs">{linkConteudo}</a></>}
                </p>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={enviando}>Cancelar</Button>
            <Button
              onClick={handleEnviar}
              disabled={enviando || !titulo.trim() || !mensagem.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {enviando ? "Enviando..." : "Enviar Campanha"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}