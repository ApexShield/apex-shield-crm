import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, User, Phone, Mail, Briefcase, Heart, DollarSign, Users, FileText, UserPlus, Save, XCircle, Eraser, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import AgendarVisitaDialog from "./AgendarVisitaDialog";
import EnderecoComGoogleMaps from "../EnderecoComGoogleMaps";

const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1)$2-$3").replace(/-$/, "");
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1)$2-$3").replace(/-$/, "");
};

const formatCPF = (value) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4").replace(/-$/, "");
};

const formatCurrency = (value) => {
  const numbers = value.replace(/\D/g, "");
  const amount = parseFloat(numbers) / 100;
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const calculateAge = (birthDate) => {
  if (!birthDate) return "";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age.toString();
};

const calculateIMC = (altura, peso) => {
  if (!altura || !peso) return "";
  const alturaM = parseFloat(altura) / 100;
  const pesoNum = parseFloat(peso);
  if (alturaM <= 0 || pesoNum <= 0) return "";
  const imc = pesoNum / (alturaM * alturaM);
  return imc.toFixed(2);
};

export default function FormularioLead({ open, onClose, lead, onSave, isLoading, nextCodigo }) {
  const [showAgendarVisita, setShowAgendarVisita] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    codigo: nextCodigo || "",
    status: "AB Fone",
    data_cadastro: new Date().toISOString().split('T')[0],
    nome: "",
    cpf: "",
    regime_casamento: "",
    data_casamento: "",
    filhos: "",
    filhos_info: [],
    telefone: "",
    email: "",
    empresa: "",
    cargo: "",
    plano_saude: "",
    plano_saude_nome: "",
    valor_plano_saude: "",
    seguro_vida: "",
    seguro_vida_seguradora: "",
    valor_seguro_vida: "",
    data_nascimento: "",
    idade: "",
    profissao: "",
    estado_civil: "",
    altura: "",
    peso: "",
    imc: "",
    fuma: "",
    anda_moto: "",
    fonte_prospeccao: "",
    custo_mensal_fixo: "",
    renda: "",
    patrimonio: "",
    data_contato: "",
    agendar_visita: "",
    endereco: "",
    endereco_place_id: "",
    endereco_lat: null,
    endereco_lng: null,
    observacoes: [],
    novaObservacao: "",
    documentos: [],
    num_indicacoes: "0",
    indicacoes: []
  });

  useEffect(() => {
    if (lead) {
      setFormData({ 
        ...formData, 
        ...lead,
        filhos_info: lead.filhos_info || [],
        observacoes: lead.observacoes || [],
        documentos: lead.documentos || [],
        indicacoes: lead.indicacoes || [],
        novaObservacao: ""
      });
    } else {
      setFormData({
        codigo: nextCodigo || "",
        status: "AB Fone",
        data_cadastro: new Date().toISOString().split('T')[0],
        nome: "",
        cpf: "",
        regime_casamento: "",
        data_casamento: "",
        filhos: "",
        filhos_info: [],
        telefone: "",
        email: "",
        empresa: "",
        cargo: "",
        plano_saude: "",
        plano_saude_nome: "",
        valor_plano_saude: "",
        seguro_vida: "",
        seguro_vida_seguradora: "",
        valor_seguro_vida: "",
        data_nascimento: "",
        idade: "",
        profissao: "",
        estado_civil: "",
        altura: "",
        peso: "",
        imc: "",
        fuma: "",
        anda_moto: "",
        fonte_prospeccao: "",
        custo_mensal_fixo: "",
        renda: "",
        patrimonio: "",
        data_contato: "",
        agendar_visita: "",
        endereco: "",
        endereco_place_id: "",
        endereco_lat: null,
        endereco_lng: null,
        observacoes: [],
        novaObservacao: "",
        documentos: [],
        num_indicacoes: "0",
        indicacoes: []
      });
      setHasUnsavedChanges(false);
    }
  }, [lead, open, nextCodigo]);

  // Detectar mudanças no formulário
  useEffect(() => {
    const formHasData = formData.nome || formData.telefone || formData.email || formData.cpf || formData.novaObservacao;
    setHasUnsavedChanges(!!formHasData && open);
  }, [formData, open]);

  // Prevenir fechamento da guia do navegador
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("FormData antes de salvar:", formData);
    
    const dataToSave = { ...formData };
    
    // Adicionar nova observação se houver
    if (formData.novaObservacao && formData.novaObservacao.trim()) {
      dataToSave.observacoes = [
        ...(formData.observacoes || []),
        {
          data: format(new Date(), "dd/MM/yyyy HH:mm"),
          texto: formData.novaObservacao.toUpperCase()
        }
      ];
    }
    
    // Remover campos temporários
    delete dataToSave.novaObservacao;
    
    // Garantir que campos obrigatórios existam
    if (!dataToSave.nome || dataToSave.nome.trim() === "") {
      alert("Por favor, preencha o nome do cliente");
      return;
    }
    
    // Limpar campos vazios para evitar problemas
    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === "" || dataToSave[key] === null || dataToSave[key] === undefined) {
        delete dataToSave[key];
      }
    });
    
    console.log("Dados a serem salvos (limpos):", dataToSave);
    
    try {
      await onSave(dataToSave);
      console.log("Salvo com sucesso!");
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Erro no handleSubmit:", error);
      alert("Erro ao salvar: " + error.message);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndClose = async () => {
    const dataToSave = { ...formData };
    
    if (formData.novaObservacao && formData.novaObservacao.trim()) {
      dataToSave.observacoes = [
        ...(formData.observacoes || []),
        {
          data: format(new Date(), "dd/MM/yyyy HH:mm"),
          texto: formData.novaObservacao.toUpperCase()
        }
      ];
    }
    
    delete dataToSave.novaObservacao;
    
    if (!dataToSave.nome || dataToSave.nome.trim() === "") {
      alert("Por favor, preencha o nome do cliente");
      return;
    }
    
    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === "" || dataToSave[key] === null || dataToSave[key] === undefined) {
        delete dataToSave[key];
      }
    });
    
    try {
      await onSave(dataToSave);
      setHasUnsavedChanges(false);
      setShowUnsavedDialog(false);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar: " + error.message);
    }
  };

  const handleDiscardAndClose = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    onClose();
  };

  const handleUpperCase = (field, value) => {
    setFormData({ ...formData, [field]: value.toUpperCase() });
  };

  const handleCPFChange = (value) => {
    setFormData({ ...formData, cpf: formatCPF(value) });
  };

  const handleFilhosChange = (quantidade) => {
    const num = parseInt(quantidade) || 0;
    const newFilhosInfo = Array(num).fill(null).map((_, i) => 
      formData.filhos_info[i] || { nome: "", data_nascimento: "" }
    );
    setFormData({ ...formData, filhos: quantidade, filhos_info: newFilhosInfo });
  };

  const handleIndicacoesChange = (quantidade) => {
    const num = parseInt(quantidade) || 0;
    const newIndicacoes = Array(num).fill(null).map((_, i) => 
      formData.indicacoes[i] || { nome: "", profissao: "", telefone: "", conexao: "" }
    );
    setFormData({ ...formData, num_indicacoes: quantidade, indicacoes: newIndicacoes });
  };

  const handleDataNascimentoChange = (date) => {
    const idade = calculateAge(date);
    setFormData({ ...formData, data_nascimento: date, idade });
  };

  const handlePhoneChange = (field, value) => {
    setFormData({ ...formData, [field]: formatPhone(value) });
  };

  const handleCurrencyChange = (field, value) => {
    setFormData({ ...formData, [field]: formatCurrency(value) });
  };

  const handleAlturaOrPesoChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    if (field === "altura" || field === "peso") {
      newData.imc = calculateIMC(
        field === "altura" ? value : formData.altura,
        field === "peso" ? value : formData.peso
      );
    }
    setFormData(newData);
  };

  const handleLimpar = () => {
    setFormData({
      ...formData,
      nome: "",
      telefone: "",
      email: "",
      empresa: "",
      cargo: "",
      novaObservacao: ""
    });
  };

  const numFilhos = parseInt(formData.filhos) || 0;

  // Auto-focus no nome quando abrir o formulário
  useEffect(() => {
    if (open && !lead) {
      const timer = setTimeout(() => {
        const nomeInput = document.querySelector('input[tabindex="4"]');
        if (nomeInput) nomeInput.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, lead]);

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 w-[95vw]">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800">CADASTRO DE LEAD - CRM</DialogTitle>
          </motion.div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto">
            {/* COLUNA 1 */}
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-orange-400 to-orange-500 p-4 rounded-2xl shadow-lg border-2 border-orange-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-white" />
                  <h3 className="font-black text-base text-white">CADASTRO DE LEAD</h3>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Código</Label>
                    <Input tabIndex={1} value={formData.codigo} disabled className="bg-gray-100" />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Status:</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger tabIndex={2}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Novo">Novo</SelectItem>
                        <SelectItem value="AB Fone">AB Fone</SelectItem>
                        <SelectItem value="AB Visita">AB Visita</SelectItem>
                        <SelectItem value="AB Fechamento">AB Fechamento</SelectItem>
                        <SelectItem value="Delay">Delay</SelectItem>
                        <SelectItem value="Análise">Análise</SelectItem>
                        <SelectItem value="Venda Feita">Venda Feita</SelectItem>
                        <SelectItem value="Entrega de Apólice">Entrega de Apólice</SelectItem>
                        <SelectItem value="Encerrado">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Data de:</Label>
                    <Input tabIndex={3} type="date" value={formData.data_cadastro} onChange={(e) => setFormData({...formData, data_cadastro: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Nome Completo:</Label>
                    <Input 
                      tabIndex={4} 
                      autoFocus={!lead}
                      value={formData.nome} 
                      onChange={(e) => handleUpperCase('nome', e.target.value)} 
                    />
                  </div>

                  <div>
                    <Label className="text-xs">CPF:</Label>
                    <Input 
                      tabIndex={4.5}
                      value={formData.cpf} 
                      onChange={(e) => handleCPFChange(e.target.value)} 
                      maxLength={14}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Filhos:</Label>
                    <Select value={formData.filhos} onValueChange={handleFilhosChange}>
                      <SelectTrigger tabIndex={5}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {numFilhos > 0 && (
                    <div className="border-t pt-2 space-y-2">
                      <Label className="text-xs font-bold">Informações dos Filhos:</Label>
                      {formData.filhos_info.map((filho, idx) => (
                        <div key={idx} className="space-y-1 border-l-2 border-orange-400 pl-2">
                          <Label className="text-xs">Filho {idx + 1} - Nome:</Label>
                          <Input
                            value={filho.nome}
                            onChange={(e) => {
                              const newInfo = [...formData.filhos_info];
                              newInfo[idx] = { ...newInfo[idx], nome: e.target.value.toUpperCase() };
                              setFormData({ ...formData, filhos_info: newInfo });
                            }}
                          />
                          <Label className="text-xs">Data de Nascimento:</Label>
                          <Input
                            type="date"
                            value={filho.data_nascimento || ""}
                            onChange={(e) => {
                              const newInfo = [...formData.filhos_info];
                              newInfo[idx] = { ...newInfo[idx], data_nascimento: e.target.value };
                              setFormData({ ...formData, filhos_info: newInfo });
                            }}
                            max={new Date().toISOString().split('T')[0]}
                          />
                          {filho.data_nascimento && (
                            <div className="text-xs font-semibold bg-white/50 rounded px-2 py-1">
                              Idade atual: {calculateAge(filho.data_nascimento)} anos
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-pink-400 to-pink-500 p-4 rounded-2xl shadow-lg border-2 border-pink-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-white" />
                  <h3 className="font-black text-base text-white">DADOS DE SAÚDE</h3>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Fuma:</Label>
                    <Select value={formData.fuma} onValueChange={(v) => setFormData({...formData, fuma: v})}>
                      <SelectTrigger tabIndex={27}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Anda de Moto:</Label>
                    <Select value={formData.anda_moto} onValueChange={(v) => setFormData({...formData, anda_moto: v})}>
                      <SelectTrigger tabIndex={28}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* COLUNA 2 */}
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-400 to-blue-500 p-4 rounded-2xl shadow-lg border-2 border-blue-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="w-5 h-5 text-white" />
                  <h3 className="font-black text-base text-white">INFORMAÇÕES DE CONTATO</h3>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Telefone:</Label>
                    <Input 
                      tabIndex={6}
                      value={formData.telefone} 
                      onChange={(e) => handlePhoneChange('telefone', e.target.value)}
                      maxLength={15}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">E-mail:</Label>
                    <Input 
                      tabIndex={7}
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => handleUpperCase('email', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Empresa:</Label>
                    <Input tabIndex={8} value={formData.empresa} onChange={(e) => handleUpperCase('empresa', e.target.value)} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Cargo:</Label>
                    <Input tabIndex={9} value={formData.cargo} onChange={(e) => handleUpperCase('cargo', e.target.value)} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Plano de Saúde:</Label>
                    <Select value={formData.plano_saude} onValueChange={(v) => setFormData({...formData, plano_saude: v, plano_saude_nome: v === "NÃO" ? "" : formData.plano_saude_nome})}>
                      <SelectTrigger tabIndex={10}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.plano_saude === "SIM" && (
                    <div>
                      <Label className="text-xs">Qual Plano:</Label>
                      <Select value={formData.plano_saude_nome} onValueChange={(v) => setFormData({...formData, plano_saude_nome: v})}>
                        <SelectTrigger tabIndex={11}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNIMED">UNIMED</SelectItem>
                          <SelectItem value="BRADESCO">BRADESCO</SelectItem>
                          <SelectItem value="IPASGO">IPASGO</SelectItem>
                          <SelectItem value="HAPVIDA">HAPVIDA</SelectItem>
                          <SelectItem value="OUTROS">OUTROS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-xs">Valor Plano de Saúde:</Label>
                    <Input 
                      tabIndex={12}
                      value={formData.valor_plano_saude} 
                      onChange={(e) => handleCurrencyChange('valor_plano_saude', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Seguro de Vida:</Label>
                    <Select value={formData.seguro_vida} onValueChange={(v) => setFormData({...formData, seguro_vida: v, seguro_vida_seguradora: v === "NÃO" ? "" : formData.seguro_vida_seguradora})}>
                      <SelectTrigger tabIndex={13}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.seguro_vida === "SIM" && (
                    <div>
                      <Label className="text-xs">Qual Seguradora:</Label>
                      <Select value={formData.seguro_vida_seguradora} onValueChange={(v) => setFormData({...formData, seguro_vida_seguradora: v})}>
                        <SelectTrigger tabIndex={14}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRUDENTIAL">PRUDENTIAL</SelectItem>
                          <SelectItem value="MONGERAL">MONGERAL</SelectItem>
                          <SelectItem value="PORTO SEGURO">PORTO SEGURO</SelectItem>
                          <SelectItem value="ITAÚ">ITAÚ</SelectItem>
                          <SelectItem value="BRADESCO">BRADESCO</SelectItem>
                          <SelectItem value="BANCO DO BRASIL">BANCO DO BRASIL</SelectItem>
                          <SelectItem value="AZOS">AZOS</SelectItem>
                          <SelectItem value="TOKIO MARINE">TOKIO MARINE</SelectItem>
                          <SelectItem value="OUTROS">OUTROS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">Valor do Seguro de Vida:</Label>
                    <Input 
                      tabIndex={15}
                      value={formData.valor_seguro_vida} 
                      onChange={(e) => handleCurrencyChange('valor_seguro_vida', e.target.value)}
                    />
                  </div>
                  </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gradient-to-br from-green-400 to-green-500 p-4 rounded-2xl shadow-lg border-2 border-green-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-white" />
                  <h3 className="font-black text-base text-white">DADOS COMERCIAIS</h3>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Fonte de Prospecção:</Label>
                    <Input tabIndex={16} value={formData.fonte_prospeccao} onChange={(e) => handleUpperCase('fonte_prospeccao', e.target.value)} />
                  </div>

                  <div>
                    <Label className="text-xs">Custo Mensal Fixo Total:</Label>
                    <Input 
                      tabIndex={17}
                      value={formData.custo_mensal_fixo} 
                      onChange={(e) => handleCurrencyChange('custo_mensal_fixo', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Renda Mensal Estimada:</Label>
                    <Input 
                      tabIndex={18}
                      value={formData.renda} 
                      onChange={(e) => handleCurrencyChange('renda', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Patrimônio:</Label>
                    <Input 
                      tabIndex={19}
                      value={formData.patrimonio} 
                      onChange={(e) => handleCurrencyChange('patrimonio', e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* COLUNA 3 */}
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-400 to-purple-500 p-4 rounded-2xl shadow-lg border-2 border-purple-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-white" />
                  <h3 className="font-black text-base text-white">DADOS PESSOAIS</h3>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Data de Nascimento:</Label>
                    <Input 
                      tabIndex={20}
                      type="date" 
                      value={formData.data_nascimento} 
                      onChange={(e) => handleDataNascimentoChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Idade:</Label>
                    <Input tabIndex={21} value={formData.idade} disabled className="bg-gray-100" />
                  </div>

                  <div>
                    <Label className="text-xs">Profissão:</Label>
                    <Input tabIndex={22} value={formData.profissao} onChange={(e) => handleUpperCase('profissao', e.target.value)} />
                  </div>

                  <div>
                    <Label className="text-xs">Estado Civil:</Label>
                    <Select value={formData.estado_civil} onValueChange={(v) => setFormData({...formData, estado_civil: v, regime_casamento: v !== "CASADO" ? "" : formData.regime_casamento, data_casamento: v !== "CASADO" ? "" : formData.data_casamento})}>
                      <SelectTrigger tabIndex={23}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOLTEIRO">SOLTEIRO</SelectItem>
                        <SelectItem value="CASADO">CASADO</SelectItem>
                        <SelectItem value="DIVORCIADO">DIVORCIADO</SelectItem>
                        <SelectItem value="VIÚVO">VIÚVO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.estado_civil === "CASADO" && (
                    <>
                      <div>
                        <Label className="text-xs">Regime de Casamento:</Label>
                        <Select value={formData.regime_casamento} onValueChange={(v) => setFormData({...formData, regime_casamento: v})}>
                          <SelectTrigger tabIndex={24}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COMUNHÃO TOTAL">COMUNHÃO TOTAL</SelectItem>
                            <SelectItem value="COMUNHÃO PARCIAL">COMUNHÃO PARCIAL</SelectItem>
                            <SelectItem value="SEPARAÇÃO TOTAL">SEPARAÇÃO TOTAL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Data de Casamento:</Label>
                        <Input 
                          type="date" 
                          value={formData.data_casamento || ""} 
                          onChange={(e) => setFormData({...formData, data_casamento: e.target.value})}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <Label className="text-xs">Altura (cm):</Label>
                    <Input 
                      tabIndex={25} 
                      value={formData.altura} 
                      onChange={(e) => handleAlturaOrPesoChange('altura', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Peso (kg):</Label>
                    <Input 
                      tabIndex={26} 
                      value={formData.peso} 
                      onChange={(e) => handleAlturaOrPesoChange('peso', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">IMC:</Label>
                    <Input 
                      value={formData.imc} 
                      disabled 
                      className="bg-gray-100 font-bold"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-gradient-to-br from-red-400 to-red-500 p-4 rounded-2xl shadow-lg border-2 border-red-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-white" />
                  <h3 className="font-black text-base text-white">AGENDAMENTO</h3>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Data de Contato:</Label>
                    <Input tabIndex={29} type="date" value={formData.data_contato} onChange={(e) => setFormData({...formData, data_contato: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Agendar Visita:</Label>
                    {formData.agendar_visita ? (
                      <div className="space-y-2">
                        <p className="text-sm text-blue-600 font-bold">
                          ✓ Visita agendada para: {(() => {
                            const d = new Date(formData.agendar_visita);
                            if (isNaN(d.getTime())) return formData.agendar_visita;
                            return format(d, "dd/MM/yyyy 'Horário' HH:mm");
                          })()}
                        </p>
                        <Button
                          type="button"
                          onClick={() => setShowAgendarVisita(true)}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Reagendar Visita
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setShowAgendarVisita(true)}
                        className="w-full justify-start bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        style={{ background: 'linear-gradient(135deg, #0096D8, #AFCB3A)' }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Agendar Visita
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-cyan-400 to-cyan-500 p-4 rounded-2xl shadow-lg border-2 border-cyan-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-white" />
                  <h3 className="font-black text-base text-white">OBSERVAÇÕES</h3>
                </div>
                
                <div className="space-y-2">
                  {formData.observacoes && formData.observacoes.length > 0 && (
                    <div className="bg-white p-2 rounded max-h-32 overflow-y-auto text-xs space-y-1">
                      {formData.observacoes.map((obs, idx) => (
                        <div key={idx} className="border-b pb-1">
                          <div className="font-bold text-blue-600">{obs.data}</div>
                          <div>{obs.texto}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Textarea 
                    tabIndex={30}
                    rows={3}
                    value={formData.novaObservacao} 
                    onChange={(e) => setFormData({...formData, novaObservacao: e.target.value.toUpperCase()})}
                    className="text-sm"
                    placeholder="Nova observação..."
                  />
                </div>
              </motion.div>
            </div>
          </div>

          {/* INDICAÇÕES */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-4 bg-gradient-to-br from-yellow-400 to-yellow-500 p-4 rounded-2xl shadow-lg border-2 border-yellow-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-white" />
              <h3 className="font-black text-base text-white">INDICAÇÕES</h3>
            </div>
            
            <div className="mb-3">
              <Label className="text-xs">Quantidade de Indicações:</Label>
              <Select value={formData.num_indicacoes} onValueChange={handleIndicacoesChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {parseInt(formData.num_indicacoes) > 0 && (
              <>
                <div className="grid grid-cols-4 gap-2 text-xs font-bold mb-2">
                  <div>Nome:</div>
                  <div>Profissão:</div>
                  <div>Telefone:</div>
                  <div>Conexão:</div>
                </div>

                {formData.indicacoes.map((indicacao, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                    <Input 
                      className="h-8 text-xs"
                      value={indicacao.nome} 
                      onChange={(e) => {
                        const newIndicacoes = [...formData.indicacoes];
                        newIndicacoes[idx].nome = e.target.value.toUpperCase();
                        setFormData({ ...formData, indicacoes: newIndicacoes });
                      }}
                    />
                    <Input 
                      className="h-8 text-xs"
                      value={indicacao.profissao} 
                      onChange={(e) => {
                        const newIndicacoes = [...formData.indicacoes];
                        newIndicacoes[idx].profissao = e.target.value.toUpperCase();
                        setFormData({ ...formData, indicacoes: newIndicacoes });
                      }}
                    />
                    <Input 
                      className="h-8 text-xs"
                      value={indicacao.telefone} 
                      onChange={(e) => {
                        const newIndicacoes = [...formData.indicacoes];
                        newIndicacoes[idx].telefone = formatPhone(e.target.value);
                        setFormData({ ...formData, indicacoes: newIndicacoes });
                      }}
                      maxLength={14}
                    />
                    <div className="flex gap-1">
                      <Input 
                        className="h-8 text-xs flex-1"
                        value={indicacao.conexao} 
                        onChange={(e) => {
                          const newIndicacoes = [...formData.indicacoes];
                          newIndicacoes[idx].conexao = e.target.value.toUpperCase();
                          setFormData({ ...formData, indicacoes: newIndicacoes });
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-2 text-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        onClick={async () => {
                          if (!indicacao.nome || !indicacao.telefone) {
                            alert('Preencha o nome e telefone da indicação antes de criar o lead');
                            return;
                          }
                          
                          const nomeNovoLead = `${indicacao.nome} IND ${formData.nome}`;
                          const telefoneNovoLead = indicacao.telefone;
                          
                          try {
                            await base44.entities.Cliente.create({
                              nome: nomeNovoLead,
                              telefone: telefoneNovoLead,
                              status: "Novo",
                              data_cadastro: new Date().toISOString().split('T')[0]
                            });
                            alert('✅ Lead criado com sucesso!');
                          } catch (error) {
                            console.error('Erro ao criar lead:', error);
                            alert('❌ Erro ao criar lead: ' + error.message);
                          }
                        }}
                      >
                        <UserPlus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </motion.div>

          {/* BOTÕES */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 mt-6 flex-wrap"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button 
                type="submit" 
                tabIndex={31}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-black text-xl py-7 shadow-xl rounded-xl"
              >
                {isLoading ? (
                  <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> SALVANDO...</>
                ) : (
                  <><Save className="w-6 h-6 mr-2" /> SALVAR</>
                )}
              </Button>
            </motion.div>

            {lead && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Button 
                  type="button"
                  onClick={() => {
                    const event = new CustomEvent('openApolice', { detail: lead });
                    window.dispatchEvent(event);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 font-black text-xl py-7 shadow-xl rounded-xl"
                >
                  <Sparkles className="w-6 h-6 mr-2" />
                  APÓLICE
                </Button>
              </motion.div>
            )}
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button 
                type="button"
                onClick={handleLimpar}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 font-black text-xl py-7 shadow-xl rounded-xl"
              >
                <Eraser className="w-6 h-6 mr-2" />
                LIMPAR
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button 
                type="button"
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-black text-xl py-7 shadow-xl rounded-xl"
              >
                <XCircle className="w-6 h-6 mr-2" />
                CANCELAR
              </Button>
            </motion.div>
          </motion.div>
        </form>

        <AgendarVisitaDialog
          open={showAgendarVisita}
          onClose={() => setShowAgendarVisita(false)}
          cliente={formData}
          user={user}
          onSave={(agendamento) => {
            // Atualiza o campo no formulário do lead
            setFormData({
              ...formData,
              agendar_visita: agendamento.dataHora
            });
            
            // Se estiver editando um lead existente, sincronizar
            if (lead?.id) {
              base44.entities.Cliente.update(lead.id, {
                agendar_visita: agendamento.dataHora
              }).then(() => {
                console.log("Lead atualizado com agendamento");
              }).catch(err => {
                console.error("Erro ao atualizar lead:", err);
              });
            }
          }}
        />
      </DialogContent>
    </Dialog>

    {/* Dialog de Confirmação de Dados Não Salvos */}
    <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-orange-600">⚠️ Dados não salvos</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-700">
            Você tem alterações não salvas. Deseja salvar as informações antes de fechar?
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDiscardAndClose}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            Descartar
          </Button>
          <Button
            onClick={handleSaveAndClose}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}