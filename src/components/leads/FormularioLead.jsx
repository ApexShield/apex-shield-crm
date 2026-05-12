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

  const getEmptyFormData = () => ({
    codigo: nextCodigo || "",
    status: "AB Fone",
    qualificacao: "",
    data_cadastro: new Date().toISOString().split('T')[0],
    nome: "",
    cpf: "",
    regime_casamento: "",
    data_casamento: "",
    filhos: undefined,
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
    custo_agua: "",
    custo_energia: "",
    custo_internet: "",
    custo_gas: "",
    custo_aluguel: "",
    custo_escola: "",
    custo_plano_saude_fixo: "",
    custo_transporte: "",
    custo_alimentacao: "",
    custo_cartao_credito: "",
    custo_outros_fixos: "",
    custo_variavel_total: "",
    custo_lazer: "",
    custo_hobbies: "",
    custo_vestuario: "",
    custo_viagens: "",
    custo_outros_variaveis: "",
    renda: "",
    patrimonio: "",
    patrimonio_imoveis: "",
    patrimonio_veiculos: "",
    patrimonio_investimentos: "",
    patrimonio_poupanca: "",
    patrimonio_previdencia: "",
    patrimonio_outros: "",
    data_contato: "",
    agendar_visita: "",
    endereco: "",
    endereco_place_id: "",
    endereco_lat: null,
    endereco_lng: null,
    observacoes: [],
    novaObservacao: "",
    documentos: [],
    num_indicacoes: undefined,
    indicacoes: []
  });

  const [formData, setFormData] = useState(getEmptyFormData);

  useEffect(() => {
    if (lead) {
      const base = getEmptyFormData();
      // Merge lead data, converting null/undefined to "" for controlled inputs
      const merged = { ...base };
      Object.keys(base).forEach(key => {
        if (key === 'filhos_info' || key === 'observacoes' || key === 'documentos' || key === 'indicacoes') {
          merged[key] = lead[key] || base[key];
        } else if (key === 'filhos') {
          merged[key] = lead.filhos != null ? String(lead.filhos) : undefined;
        } else if (key === 'num_indicacoes') {
          merged[key] = lead.num_indicacoes != null ? String(lead.num_indicacoes) : undefined;
        } else if (key === 'novaObservacao') {
          merged[key] = "";
        } else if (lead[key] != null) {
          merged[key] = lead[key];
        }
      });
      // Also copy any lead fields not in base (like id, created_by, etc.)
      Object.keys(lead).forEach(key => {
        if (!(key in base)) merged[key] = lead[key];
      });
      setFormData(merged);
    } else {
      setFormData(getEmptyFormData());
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
    
    // Limpar campos vazios para evitar problemas (preservar arrays)
    Object.keys(dataToSave).forEach(key => {
      if (Array.isArray(dataToSave[key])) return; // preservar arrays mesmo vazios
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
      if (Array.isArray(dataToSave[key])) return; // preservar arrays mesmo vazios
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

  const handleUpperCase = (field, value, e) => {
    // Preservar posição do cursor
    const input = e?.target;
    const pos = input?.selectionStart;
    setFormData(prev => ({ ...prev, [field]: value.toUpperCase() }));
    if (input) {
      requestAnimationFrame(() => {
        input.setSelectionRange(pos, pos);
      });
    }
  };

  const handleCPFChange = (value, e) => {
    const input = e?.target;
    const prevLen = input?.value?.length || 0;
    const formatted = formatCPF(value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
    if (input) {
      const diff = formatted.length - prevLen;
      const pos = (input.selectionStart || 0) + diff;
      requestAnimationFrame(() => {
        input.setSelectionRange(pos, pos);
      });
    }
  };

  const handleFilhosChange = (quantidade) => {
    const num = parseInt(quantidade) || 0;
    setFormData(prev => {
      const newFilhosInfo = Array(num).fill(null).map((_, i) => 
        prev.filhos_info[i] || { nome: "", data_nascimento: "" }
      );
      return { ...prev, filhos: quantidade, filhos_info: newFilhosInfo };
    });
  };

  const handleIndicacoesChange = (quantidade) => {
    const num = parseInt(quantidade) || 0;
    setFormData(prev => {
      const newIndicacoes = Array(num).fill(null).map((_, i) => 
        prev.indicacoes[i] || { nome: "", profissao: "", telefone: "", conexao: "" }
      );
      return { ...prev, num_indicacoes: quantidade, indicacoes: newIndicacoes };
    });
  };

  const handleDataNascimentoChange = (date) => {
    const idade = calculateAge(date);
    setFormData(prev => ({ ...prev, data_nascimento: date, idade }));
  };

  const handlePhoneChange = (field, value, e) => {
    const input = e?.target;
    const prevLen = input?.value?.length || 0;
    const formatted = formatPhone(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
    if (input) {
      const diff = formatted.length - prevLen;
      const pos = (input.selectionStart || 0) + diff;
      requestAnimationFrame(() => {
        input.setSelectionRange(pos, pos);
      });
    }
  };

  const handleCurrencyChange = (field, value, e) => {
    const input = e?.target;
    const prevLen = input?.value?.length || 0;
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
    if (input) {
      const diff = formatted.length - prevLen;
      const pos = (input.selectionStart || 0) + diff;
      requestAnimationFrame(() => {
        input.setSelectionRange(pos, pos);
      });
    }
  };

  const handleAlturaOrPesoChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === "altura" || field === "peso") {
        newData.imc = calculateIMC(
          field === "altura" ? value : prev.altura,
          field === "peso" ? value : prev.peso
        );
      }
      return newData;
    });
  };

  const handleLimpar = () => {
    setFormData(prev => ({
      ...prev,
      nome: "",
      telefone: "",
      email: "",
      empresa: "",
      cargo: "",
      novaObservacao: ""
    }));
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
      <DialogContent className="compact-form max-w-7xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 w-[95vw]">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* COLUNA 1 - Cadastro + Contato */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-3 rounded-2xl shadow-lg border-2 border-orange-300">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-white" />
                  <h3 className="font-black text-sm text-white">CADASTRO DE LEAD</h3>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <Label className="text-[11px]">Código</Label>
                    <Input tabIndex={1} value={formData.codigo} disabled className="bg-gray-100 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Status:</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({...prev, status: v}))}>
                      <SelectTrigger tabIndex={2} className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
                    <Label className="text-[11px]">Qualificação:</Label>
                    <Select value={formData.qualificacao || undefined} onValueChange={(v) => setFormData(prev => ({...prev, qualificacao: v}))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quente">🔥 Quente</SelectItem>
                        <SelectItem value="frio">❄️ Frio</SelectItem>
                        <SelectItem value="neutro">⚡ Neutro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px]">Data de Cadastro:</Label>
                    <Input tabIndex={3} type="date" value={formData.data_cadastro} onChange={(e) => setFormData(prev => ({...prev, data_cadastro: e.target.value}))} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Nome Completo:</Label>
                    <Input tabIndex={4} autoFocus={!lead} value={formData.nome} onChange={(e) => handleUpperCase('nome', e.target.value, e)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">CPF:</Label>
                    <Input tabIndex={4.5} value={formData.cpf} onChange={(e) => handleCPFChange(e.target.value, e)} maxLength={14} placeholder="000.000.000-00" className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Telefone:</Label>
                    <Input tabIndex={6} value={formData.telefone} onChange={(e) => handlePhoneChange('telefone', e.target.value, e)} maxLength={15} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">E-mail:</Label>
                    <Input tabIndex={7} type="email" value={formData.email} onChange={(e) => handleUpperCase('email', e.target.value, e)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Empresa:</Label>
                    <Input tabIndex={8} value={formData.empresa} onChange={(e) => handleUpperCase('empresa', e.target.value, e)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Cargo:</Label>
                    <Input tabIndex={9} value={formData.cargo} onChange={(e) => handleUpperCase('cargo', e.target.value, e)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Filhos:</Label>
                    <Select value={formData.filhos != null ? formData.filhos : undefined} onValueChange={handleFilhosChange}>
                      <SelectTrigger tabIndex={5} className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {[0,1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {numFilhos > 0 && (
                    <div className="border-t pt-1.5 space-y-1.5">
                      <Label className="text-[11px] font-bold">Info Filhos:</Label>
                      {formData.filhos_info.map((filho, idx) => (
                        <div key={idx} className="space-y-1 border-l-2 border-orange-400 pl-2">
                          <Label className="text-[11px]">Filho {idx + 1}:</Label>
                          <Input value={filho.nome} onChange={(e) => { const val = e.target.value.toUpperCase(); setFormData(prev => { const n = [...prev.filhos_info]; n[idx] = { ...n[idx], nome: val }; return { ...prev, filhos_info: n }; }); }} className="h-7 text-xs" />
                          <Input type="date" value={filho.data_nascimento || ""} onChange={(e) => { const val = e.target.value; setFormData(prev => { const n = [...prev.filhos_info]; n[idx] = { ...n[idx], data_nascimento: val }; return { ...prev, filhos_info: n }; }); }} max={new Date().toISOString().split('T')[0]} className="h-7 text-xs" />
                          {filho.data_nascimento && <div className="text-[10px] font-semibold bg-white/50 rounded px-1 py-0.5">Idade: {calculateAge(filho.data_nascimento)} anos</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* COLUNA 2 - Dados Pessoais + Agendamento + Observações */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-purple-400 to-purple-500 p-3 rounded-2xl shadow-lg border-2 border-purple-300">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-white" />
                  <h3 className="font-black text-sm text-white">DADOS PESSOAIS</h3>
                </div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Nascimento:</Label>
                      <Input tabIndex={20} type="date" value={formData.data_nascimento} onChange={(e) => handleDataNascimentoChange(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px]">Idade:</Label>
                      <Input value={formData.idade} disabled className="bg-gray-100 h-8 text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px]">Profissão:</Label>
                    <Input tabIndex={22} value={formData.profissao} onChange={(e) => handleUpperCase('profissao', e.target.value, e)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Estado Civil:</Label>
                    <Select value={formData.estado_civil || undefined} onValueChange={(v) => setFormData(prev => ({...prev, estado_civil: v, regime_casamento: (v !== "CASADO" && v !== "UNIÃO ESTÁVEL") ? "" : prev.regime_casamento, data_casamento: (v !== "CASADO" && v !== "UNIÃO ESTÁVEL") ? "" : prev.data_casamento}))}>

                      <SelectTrigger tabIndex={23} className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOLTEIRO">SOLTEIRO</SelectItem>
                        <SelectItem value="CASADO">CASADO</SelectItem>
                        <SelectItem value="UNIÃO ESTÁVEL">UNIÃO ESTÁVEL</SelectItem>
                        <SelectItem value="DIVORCIADO">DIVORCIADO</SelectItem>
                        <SelectItem value="VIÚVO">VIÚVO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.estado_civil === "CASADO" || formData.estado_civil === "UNIÃO ESTÁVEL") && (
                    <>
                      <div>
                        <Label className="text-[11px]">Regime:</Label>
                        <Select value={formData.regime_casamento || undefined} onValueChange={(v) => setFormData(prev => ({...prev, regime_casamento: v}))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COMUNHÃO TOTAL">COMUNHÃO TOTAL</SelectItem>
                            <SelectItem value="COMUNHÃO PARCIAL">COMUNHÃO PARCIAL</SelectItem>
                            <SelectItem value="SEPARAÇÃO TOTAL">SEPARAÇÃO TOTAL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px]">Data Casamento:</Label>
                        <Input type="date" value={formData.data_casamento || ""} onChange={(e) => setFormData(prev => ({...prev, data_casamento: e.target.value}))} max={new Date().toISOString().split('T')[0]} className="h-8 text-xs" />
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[11px]">Altura (cm):</Label>
                      <Input tabIndex={25} value={formData.altura} onChange={(e) => handleAlturaOrPesoChange('altura', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px]">Peso (kg):</Label>
                      <Input tabIndex={26} value={formData.peso} onChange={(e) => handleAlturaOrPesoChange('peso', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px]">IMC:</Label>
                      <Input value={formData.imc} disabled className="bg-gray-100 font-bold h-8 text-xs" />
                      {formData.imc && (() => {
                        const imc = parseFloat(formData.imc.replace(',', '.'));
                        if (isNaN(imc)) return null;
                        let label, color;
                        if (imc < 18.5) { label = 'Abaixo do peso'; color = 'text-blue-600 bg-blue-100'; }
                        else if (imc < 24.9) { label = 'Peso normal'; color = 'text-green-700 bg-green-100'; }
                        else if (imc < 29.9) { label = 'Sobrepeso'; color = 'text-yellow-700 bg-yellow-100'; }
                        else if (imc < 34.9) { label = 'Obesidade grau I'; color = 'text-orange-700 bg-orange-100'; }
                        else if (imc < 39.9) { label = 'Obesidade grau II'; color = 'text-red-600 bg-red-100'; }
                        else { label = 'Obesidade grau III'; color = 'text-red-800 bg-red-200'; }
                        return <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 text-center ${color}`}>{label}</div>;
                      })()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px]">Fonte Prospecção:</Label>
                    <Input tabIndex={16} value={formData.fonte_prospeccao} onChange={(e) => handleUpperCase('fonte_prospeccao', e.target.value, e)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Renda Mensal:</Label>
                    <Input tabIndex={17} value={formData.renda} onChange={(e) => handleCurrencyChange('renda', e.target.value, e)} className="h-8 text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-400 to-red-500 p-3 rounded-2xl shadow-lg border-2 border-red-300">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-white" />
                  <h3 className="font-black text-sm text-white">AGENDAMENTO</h3>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <Label className="text-[11px]">Data de Contato:</Label>
                    <Input tabIndex={29} type="date" value={formData.data_contato} onChange={(e) => setFormData(prev => ({...prev, data_contato: e.target.value}))} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Agendar Visita:</Label>
                    {formData.agendar_visita ? (
                      <div className="space-y-1">
                        <p className="text-xs text-blue-600 font-bold">
                          ✓ {(() => { const d = new Date(formData.agendar_visita); if (isNaN(d.getTime())) return formData.agendar_visita; return format(d, "dd/MM/yyyy HH:mm"); })()}
                        </p>
                        <Button type="button" onClick={() => setShowAgendarVisita(true)} className="w-full h-8 text-xs" variant="outline">
                          <Calendar className="w-3 h-3 mr-1" /> Reagendar
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" onClick={() => setShowAgendarVisita(true)} className="w-full h-8 text-xs" style={{ background: 'linear-gradient(135deg, #0096D8, #AFCB3A)' }}>
                        <Calendar className="w-3 h-3 mr-1" /> Agendar Visita
                      </Button>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* COLUNA 3 - Custos Fixos e Variáveis */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-green-400 to-green-500 p-3 rounded-2xl shadow-lg border-2 border-green-300">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-white" />
                  <h3 className="font-black text-sm text-white">CUSTOS MENSAIS</h3>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black text-white">💰 FIXOS:</Label>
                  {[
                    { field: 'custo_agua', label: 'Água' },
                    { field: 'custo_energia', label: 'Energia' },
                    { field: 'custo_internet', label: 'Internet' },
                    { field: 'custo_gas', label: 'Gás' },
                    { field: 'custo_aluguel', label: 'Aluguel/Financiam.' },
                    { field: 'custo_escola', label: 'Escola Filhos' },
                    { field: 'custo_plano_saude_fixo', label: 'Plano Saúde' },
                    { field: 'custo_transporte', label: 'Transporte/Comb.' },
                    { field: 'custo_alimentacao', label: 'Alimentação' },
                    { field: 'custo_cartao_credito', label: 'Cartão Crédito' },
                    { field: 'custo_outros_fixos', label: 'Outros Fixos' },
                  ].map(item => (
                    <div key={item.field} className="flex items-center gap-1">
                      <Label className="text-[10px] w-24 flex-shrink-0 text-right">{item.label}:</Label>
                      <Input value={formData[item.field]} onChange={(e) => handleCurrencyChange(item.field, e.target.value, e)} placeholder="R$ 0,00" className="h-7 text-xs flex-1" />
                    </div>
                  ))}
                  <div className="bg-white/30 rounded-lg px-2 py-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px] font-bold">Total Fixos:</Label>
                      <span className="text-xs font-black text-green-900">
                        {(() => {
                          const fields = ['custo_agua','custo_energia','custo_internet','custo_gas','custo_aluguel','custo_escola','custo_plano_saude_fixo','custo_transporte','custo_alimentacao','custo_cartao_credito','custo_outros_fixos'];
                          return fields.reduce((s, f) => s + (parseFloat((formData[f] || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-green-300/50 pt-1.5 mt-1">
                    <Label className="text-[11px] font-black text-white">🎯 VARIÁVEIS:</Label>
                  </div>
                  {[
                    { field: 'custo_lazer', label: 'Lazer' },
                    { field: 'custo_hobbies', label: 'Hobbies' },
                    { field: 'custo_vestuario', label: 'Vestuário' },
                    { field: 'custo_viagens', label: 'Viagens' },
                    { field: 'custo_outros_variaveis', label: 'Outros Var.' },
                  ].map(item => (
                    <div key={item.field} className="flex items-center gap-1">
                      <Label className="text-[10px] w-24 flex-shrink-0 text-right">{item.label}:</Label>
                      <Input value={formData[item.field]} onChange={(e) => handleCurrencyChange(item.field, e.target.value, e)} placeholder="R$ 0,00" className="h-7 text-xs flex-1" />
                    </div>
                  ))}
                  <div className="bg-white/30 rounded-lg px-2 py-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px] font-bold">Total Variáveis:</Label>
                      <span className="text-xs font-black text-green-900">
                        {(() => {
                          const fields = ['custo_lazer','custo_hobbies','custo_vestuario','custo_viagens','custo_outros_variaveis'];
                          return fields.reduce((s, f) => s + (parseFloat((formData[f] || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-green-800/30 rounded-lg px-2 py-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px] font-bold text-white">TOTAL MENSAL:</Label>
                      <span className="text-sm font-black text-white">
                        {(() => {
                          const all = ['custo_agua','custo_energia','custo_internet','custo_gas','custo_aluguel','custo_escola','custo_plano_saude_fixo','custo_transporte','custo_alimentacao','custo_cartao_credito','custo_outros_fixos','custo_lazer','custo_hobbies','custo_vestuario','custo_viagens','custo_outros_variaveis'];
                          return all.reduce((s, f) => s + (parseFloat((formData[f] || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA 4 - Patrimônio + Saúde */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg border-2 border-emerald-400">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-white" />
                  <h3 className="font-black text-sm text-white">PATRIMÔNIO</h3>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black text-white">🏠 FÍSICO:</Label>
                  {[
                    { field: 'patrimonio_imoveis', label: 'Imóveis' },
                    { field: 'patrimonio_veiculos', label: 'Veículos' },
                    { field: 'patrimonio_outros', label: 'Outros Bens' },
                  ].map(item => (
                    <div key={item.field} className="flex items-center gap-1">
                      <Label className="text-[10px] w-20 flex-shrink-0 text-right">{item.label}:</Label>
                      <Input value={formData[item.field]} onChange={(e) => handleCurrencyChange(item.field, e.target.value, e)} placeholder="R$ 0,00" className="h-7 text-xs flex-1" />
                    </div>
                  ))}

                  <div className="border-t border-emerald-400/50 pt-1.5 mt-1">
                    <Label className="text-[11px] font-black text-white">📊 APLICAÇÕES:</Label>
                  </div>
                  {[
                    { field: 'patrimonio_investimentos', label: 'Investimentos' },
                    { field: 'patrimonio_poupanca', label: 'Poupança' },
                    { field: 'patrimonio_previdencia', label: 'Previdência' },
                  ].map(item => (
                    <div key={item.field} className="flex items-center gap-1">
                      <Label className="text-[10px] w-20 flex-shrink-0 text-right">{item.label}:</Label>
                      <Input value={formData[item.field]} onChange={(e) => handleCurrencyChange(item.field, e.target.value, e)} placeholder="R$ 0,00" className="h-7 text-xs flex-1" />
                    </div>
                  ))}

                  <div className="bg-emerald-800/30 rounded-lg px-2 py-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-[11px] font-bold text-white">TOTAL:</Label>
                      <span className="text-sm font-black text-white">
                        {(() => {
                          const fields = ['patrimonio_imoveis','patrimonio_veiculos','patrimonio_outros','patrimonio_investimentos','patrimonio_poupanca','patrimonio_previdencia'];
                          return fields.reduce((s, f) => s + (parseFloat((formData[f] || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SAÚDE E SEGUROS */}
              <div className="bg-gradient-to-br from-pink-400 to-pink-500 p-3 rounded-2xl shadow-lg border-2 border-pink-300">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-white" />
                  <h3 className="font-black text-sm text-white">SAÚDE E SEGUROS</h3>
                </div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Fuma:</Label>
                      <Select value={formData.fuma || undefined} onValueChange={(v) => setFormData(prev => ({...prev, fuma: v}))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SIM">SIM</SelectItem>
                          <SelectItem value="NÃO">NÃO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px]">Moto:</Label>
                      <Select value={formData.anda_moto || undefined} onValueChange={(v) => setFormData(prev => ({...prev, anda_moto: v}))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SIM">SIM</SelectItem>
                          <SelectItem value="NÃO">NÃO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px]">Plano de Saúde:</Label>
                    <Select value={formData.plano_saude || undefined} onValueChange={(v) => setFormData(prev => ({...prev, plano_saude: v, plano_saude_nome: v === "NÃO" ? "" : prev.plano_saude_nome}))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.plano_saude === "SIM" && (
                    <div>
                      <Label className="text-[11px]">Qual Plano:</Label>
                      <Select value={formData.plano_saude_nome || undefined} onValueChange={(v) => setFormData(prev => ({...prev, plano_saude_nome: v}))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                    <Label className="text-[11px]">Valor Plano Saúde:</Label>
                    <Input value={formData.valor_plano_saude} onChange={(e) => handleCurrencyChange('valor_plano_saude', e.target.value, e)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Seguro de Vida:</Label>
                    <Select value={formData.seguro_vida || undefined} onValueChange={(v) => setFormData(prev => ({...prev, seguro_vida: v, seguro_vida_seguradora: v === "NÃO" ? "" : prev.seguro_vida_seguradora}))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.seguro_vida === "SIM" && (
                    <div>
                      <Label className="text-[11px]">Seguradora:</Label>
                      <Select value={formData.seguro_vida_seguradora || undefined} onValueChange={(v) => setFormData(prev => ({...prev, seguro_vida_seguradora: v}))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                    <Label className="text-[11px]">Valor Seguro Vida:</Label>
                    <Input value={formData.valor_seguro_vida} onChange={(e) => handleCurrencyChange('valor_seguro_vida', e.target.value, e)} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* INDICAÇÕES + OBSERVAÇÕES lado a lado */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* INDICAÇÕES - 2/3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="lg:col-span-2 bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-2xl shadow-lg border-2 border-yellow-300"
            >
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-4 h-4 text-white" />
                <h3 className="font-black text-sm text-white">INDICAÇÕES</h3>
              </div>
              
              <div className="mb-2">
                <Label className="text-[11px]">Qtd Indicações:</Label>
                <Select value={formData.num_indicacoes != null ? formData.num_indicacoes : undefined} onValueChange={handleIndicacoesChange}>
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue placeholder="0" />
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
                  {/* Desktop: grid 4 colunas / Mobile: cada indicação em bloco */}
                  <div className="hidden md:grid grid-cols-4 gap-1.5 text-[10px] font-bold mb-1">
                    <div>Nome:</div>
                    <div>Profissão:</div>
                    <div>Telefone:</div>
                    <div>Conexão:</div>
                  </div>

                  {formData.indicacoes.map((indicacao, idx) => (
                    <div key={idx}>
                      {/* Desktop layout */}
                      <div className="hidden md:grid grid-cols-4 gap-1.5 mb-1.5">
                        <Input 
                          className="h-7 text-xs"
                          value={indicacao.nome} 
                          onChange={(e) => {
                            const newIndicacoes = [...formData.indicacoes];
                            newIndicacoes[idx] = { ...newIndicacoes[idx], nome: e.target.value.toUpperCase() };
                            setFormData(prev => ({ ...prev, indicacoes: newIndicacoes }));
                          }}
                        />
                        <Input 
                          className="h-7 text-xs"
                          value={indicacao.profissao} 
                          onChange={(e) => {
                            const newIndicacoes = [...formData.indicacoes];
                            newIndicacoes[idx] = { ...newIndicacoes[idx], profissao: e.target.value.toUpperCase() };
                            setFormData(prev => ({ ...prev, indicacoes: newIndicacoes }));
                          }}
                        />
                        <Input 
                          className="h-7 text-xs"
                          value={indicacao.telefone} 
                          onChange={(e) => {
                            const newIndicacoes = [...formData.indicacoes];
                            newIndicacoes[idx] = { ...newIndicacoes[idx], telefone: formatPhone(e.target.value) };
                            setFormData(prev => ({ ...prev, indicacoes: newIndicacoes }));
                          }}
                          maxLength={14}
                        />
                        <div className="flex gap-1">
                          <Input 
                            className="h-7 text-xs flex-1"
                            value={indicacao.conexao} 
                            onChange={(e) => {
                              const newIndicacoes = [...formData.indicacoes];
                              newIndicacoes[idx] = { ...newIndicacoes[idx], conexao: e.target.value.toUpperCase() };
                              setFormData(prev => ({ ...prev, indicacoes: newIndicacoes }));
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 px-1.5 text-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            onClick={async () => {
                              if (!indicacao.nome || !indicacao.telefone) {
                                alert('Preencha o nome e telefone da indicação antes de criar o lead');
                                return;
                              }
                              const nomeNovoLead = `${indicacao.nome} IND ${formData.nome}`;
                              try {
                                await base44.entities.Cliente.create({
                                  nome: nomeNovoLead,
                                  telefone: indicacao.telefone,
                                  status: "Novo",
                                  data_cadastro: new Date().toISOString().split('T')[0]
                                });
                                alert('✅ Lead criado com sucesso!');
                              } catch (error) {
                                alert('❌ Erro ao criar lead: ' + error.message);
                              }
                            }}
                          >
                            <UserPlus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Mobile layout - stacked */}
                      <div className="md:hidden bg-white/30 rounded-lg p-2 mb-2 space-y-1">
                        <div className="text-[10px] font-bold text-yellow-900">Indicação {idx + 1}:</div>
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <Label className="text-[10px]">Nome:</Label>
                            <Input 
                              className="h-8 text-xs"
                              placeholder="Nome"
                              value={indicacao.nome} 
                              onChange={(e) => {
                                const newIndicacoes = [...formData.indicacoes];
                                newIndicacoes[idx] = { ...newIndicacoes[idx], nome: e.target.value.toUpperCase() };
                                setFormData(prev => ({ ...prev, indicacoes: newIndicacoes }));
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Profissão:</Label>
                            <Input 
                              className="h-8 text-xs"
                              placeholder="Profissão"
                              value={indicacao.profissao} 
                              onChange={(e) => {
                                const newIndicacoes = [...formData.indicacoes];
                                newIndicacoes[idx] = { ...newIndicacoes[idx], profissao: e.target.value.toUpperCase() };
                                setFormData(prev => ({ ...prev, indicacoes: newIndicacoes }));
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Telefone:</Label>
                            <Input 
                              className="h-8 text-xs"
                              placeholder="Telefone"
                              value={indicacao.telefone} 
                              onChange={(e) => {
                                const newIndicacoes = [...formData.indicacoes];
                                newIndicacoes[idx] = { ...newIndicacoes[idx], telefone: formatPhone(e.target.value) };
                                setFormData(prev => ({ ...prev, indicacoes: newIndicacoes }));
                              }}
                              maxLength={14}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Conexão:</Label>
                            <Input 
                              className="h-8 text-xs"
                              placeholder="Conexão"
                              value={indicacao.conexao} 
                              onChange={(e) => {
                                const newIndicacoes = [...formData.indicacoes];
                                newIndicacoes[idx] = { ...newIndicacoes[idx], conexao: e.target.value.toUpperCase() };
                                setFormData(prev => ({ ...prev, indicacoes: newIndicacoes }));
                              }}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="w-full h-8 text-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          onClick={async () => {
                            if (!indicacao.nome || !indicacao.telefone) {
                              alert('Preencha o nome e telefone da indicação antes de criar o lead');
                              return;
                            }
                            const nomeNovoLead = `${indicacao.nome} IND ${formData.nome}`;
                            try {
                              await base44.entities.Cliente.create({
                                nome: nomeNovoLead,
                                telefone: indicacao.telefone,
                                status: "Novo",
                                data_cadastro: new Date().toISOString().split('T')[0]
                              });
                              alert('✅ Lead criado com sucesso!');
                            } catch (error) {
                              alert('❌ Erro ao criar lead: ' + error.message);
                            }
                          }}
                        >
                          <UserPlus className="w-3 h-3 mr-1" /> Criar Lead
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </motion.div>

            {/* OBSERVAÇÕES - 1/3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.47 }}
              className="bg-gradient-to-br from-cyan-400 to-cyan-500 p-3 rounded-2xl shadow-lg border-2 border-cyan-300 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-white" />
                <h3 className="font-black text-sm text-white">OBSERVAÇÕES</h3>
              </div>
              <div className="flex-1 flex flex-col space-y-1.5">
                {formData.observacoes && formData.observacoes.length > 0 && (
                  <div className="bg-white p-1.5 rounded max-h-28 overflow-y-auto text-[11px] space-y-1">
                    {formData.observacoes.map((obs, idx) => (
                      <div key={idx} className="border-b pb-0.5">
                        <div className="font-bold text-blue-600">{obs.data}</div>
                        <div>{obs.texto}</div>
                      </div>
                    ))}
                  </div>
                )}
                <Textarea tabIndex={30} value={formData.novaObservacao} onChange={(e) => setFormData(prev => ({...prev, novaObservacao: e.target.value.toUpperCase()}))} className="text-xs flex-1 min-h-[80px]" placeholder="Nova observação..." />
              </div>
            </motion.div>
          </div>

          {/* BOTÕES */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:flex gap-2 md:gap-3 mt-6"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button 
                type="submit" 
                tabIndex={31}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-black text-sm md:text-xl py-4 md:py-7 shadow-xl rounded-xl"
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
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 font-black text-sm md:text-xl py-4 md:py-7 shadow-xl rounded-xl"
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
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 font-black text-sm md:text-xl py-4 md:py-7 shadow-xl rounded-xl"
              >
                <Eraser className="w-6 h-6 mr-2" />
                LIMPAR
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button 
                type="button"
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-black text-sm md:text-xl py-4 md:py-7 shadow-xl rounded-xl"
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
            setFormData(prev => ({
              ...prev,
              agendar_visita: agendamento.dataHora
            }));
            
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