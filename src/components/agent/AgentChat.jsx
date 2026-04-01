import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Plus, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AgentMessageBubble from "./AgentMessageBubble";
import { cn } from "@/lib/utils";

export default function AgentChat() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    // Small delay to ensure DOM has rendered
    const t = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(t);
  }, [messages]);

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      const convs = await base44.agents.listConversations({ agent_name: "apex_shield" });
      const sorted = (convs || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setConversations(sorted);
      setLoading(false);
    };
    loadConversations();
  }, []);

  useEffect(() => {
    if (!currentConversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(currentConversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [currentConversation?.id]);

  const createNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "apex_shield",
      metadata: { name: `Conversa ${new Date().toLocaleDateString('pt-BR')}` }
    });
    setConversations(prev => [conv, ...prev]);
    setCurrentConversation(conv);
    setMessages(conv.messages || []);
  };

  const selectConversation = async (conv) => {
    const fullConv = await base44.agents.getConversation(conv.id);
    setCurrentConversation(fullConv);
    setMessages(fullConv.messages || []);
  };

  const deleteConversation = async (e, conv) => {
    e.stopPropagation();
    if (!confirm("Excluir esta conversa?")) return;
    await base44.agents.updateConversation(conv.id, { metadata: { ...conv.metadata, deleted: true } });
    setConversations(prev => prev.filter(c => c.id !== conv.id));
    if (currentConversation?.id === conv.id) {
      setCurrentConversation(null);
      setMessages([]);
    }
    toast.success("Conversa excluída");
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    let conv = currentConversation;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: "apex_shield",
        metadata: { name: input.slice(0, 40) }
      });
      setConversations(prev => [conv, ...prev]);
      setCurrentConversation(conv);
    }
    const userMessage = input.trim();
    setInput("");
    setSending(true);
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    await base44.agents.addMessage(conv, { role: "user", content: userMessage });
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-full h-full flex overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-white border-r border-slate-200 flex flex-col h-full",
        showSidebar ? "flex" : "hidden lg:flex"
      )}>
        <div className="p-3 border-b border-slate-100">
          <Button 
            onClick={createNewConversation} 
            size="sm"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-xs h-9"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nova Conversa
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-8">Nenhuma conversa ainda</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={cn(
                  "w-full text-left px-2.5 py-2 rounded-lg transition-all text-xs cursor-pointer group relative",
                  currentConversation?.id === conv.id 
                    ? "bg-indigo-50 text-indigo-700 font-medium" 
                    : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate flex-1">{conv.metadata?.name || "Conversa"}</span>
                  <button
                    onClick={(e) => deleteConversation(e, conv)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-opacity flex-shrink-0"
                    title="Excluir conversa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 ml-5">
                  {new Date(conv.created_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-2.5">
          <button 
            onClick={() => setShowSidebar(!showSidebar)} 
            className="lg:hidden p-1 hover:bg-slate-100 rounded"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">AS</span>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm leading-tight">Agente Apex Shield</h2>
            <p className="text-[11px] text-slate-500">Especialista em Seguros de Vida e Gestão Financeira</p>
          </div>
        </div>

        {/* Messages - scrollable */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {messages.length === 0 && !currentConversation && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">AS</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Agente Apex Shield</h3>
              <p className="text-slate-500 text-sm max-w-md mb-4">
                Posso criar leads, agendar compromissos, fazer cálculos de seguros e gerenciar suas finanças.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {[
                  "Criar um novo lead",
                  "Agendar um compromisso",
                  "Calcular proteção de seguro",
                  "Registrar uma despesa ou receita",
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <AgentMessageBubble key={idx} message={msg} />
          ))}
          
          {sending && (
            <div className="flex gap-2 justify-start">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-bold">AS</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Pensando...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input - fixed at bottom */}
        <div className="bg-white border-t border-slate-200 px-4 py-2.5">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 border-slate-300 focus:border-indigo-400 h-10 text-sm"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 h-10 px-4"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}