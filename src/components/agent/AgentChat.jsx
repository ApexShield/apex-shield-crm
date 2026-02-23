import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Plus, MessageSquare, Trash2 } from "lucide-react";
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      const convs = await base44.agents.listConversations({ agent_name: "apex_shield" });
      setConversations(convs || []);
      setLoading(false);
    };
    loadConversations();
  }, []);

  // Subscribe to conversation updates
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
      metadata: {
        name: `Conversa ${new Date().toLocaleDateString('pt-BR')}`,
      }
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
    
    await base44.agents.addMessage(conv, {
      role: "user",
      content: userMessage
    });
    
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-20px)] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-lg">
      {/* Sidebar de conversas */}
      <div className={cn(
        "w-72 bg-white border-r border-slate-200 flex flex-col transition-all",
        showSidebar ? "block" : "hidden lg:block"
      )}>
        <div className="p-4 border-b border-slate-100">
          <Button 
            onClick={createNewConversation} 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Conversa
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Nenhuma conversa ainda</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm",
                  currentConversation?.id === conv.id 
                    ? "bg-indigo-50 text-indigo-700 font-medium" 
                    : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{conv.metadata?.name || "Conversa"}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 ml-6">
                  {new Date(conv.created_date).toLocaleDateString('pt-BR')}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
          <button 
            onClick={() => setShowSidebar(!showSidebar)} 
            className="lg:hidden p-1 hover:bg-slate-100 rounded"
          >
            <MessageSquare className="w-5 h-5 text-slate-500" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AS</span>
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Agente Apex Shield</h2>
            <p className="text-xs text-slate-500">Especialista em Seguros de Vida e Gestão Financeira</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !currentConversation && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
                <span className="text-white font-bold text-2xl">AS</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Agente Apex Shield</h3>
              <p className="text-slate-500 max-w-md mb-6">
                Especialista certificado SUSEP em seguros de vida, finanças e contabilidade. 
                Posso criar leads, agendar compromissos, fazer cálculos de seguros e gerenciar suas finanças.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                {[
                  "Criar um novo lead",
                  "Agendar um compromisso",
                  "Calcular proteção de seguro",
                  "Registrar uma despesa ou receita",
                  "Enviar mensagem para aniversariantes do dia"
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); }}
                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all text-left"
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
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">AS</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Pensando...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-200 p-4">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 border-slate-300 focus:border-indigo-400 h-11"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 h-11 px-5"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}