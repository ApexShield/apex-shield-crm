import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1)$2-$3").replace(/-$/, "");
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1)$2-$3").replace(/-$/, "");
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

export default function FormularioLead({ open, onClose, lead, onSave, isLoading, nextCodigo }) {
  const [formData, setFormData] = useState({
    codigo: nextCodigo || "",
    status: "AB Fone",
    data_cadastro: new Date().toISOString().split('T')[0],
    nome: "",
    regime_casamento: "",
    filhos: "",
    filhos_info: [],
    telefone: "",
    email: "",
    empresa: "",
    cargo: "",
    plano_saude: "",
    plano_saude_nome: "",
    valor_plano_saude: "",
    data_nascimento: "",
    idade: "",
    profissao: "",
    estado_civil: "",
    altura: "",
    peso: "",
    fuma: "",
    anda_moto: "",
    fonte_prospeccao: "",
    renda: "",
    patrimonio: "",
    data_visita: "",
    observacoes: [],
    novaObservacao: "",
    indicacao1_nome: "", indicacao1_profissao: "", indicacao1_telefone: "", indicacao1_conexao: "",
    indicacao2_nome: "", indicacao2_profissao: "", indicacao2_telefone: "", indicacao2_conexao: "",
    indicacao3_nome: "", indicacao3_profissao: "", indicacao3_telefone: "", indicacao3_conexao: "",
    indicacao4_nome: "", indicacao4_profissao: "", indicacao4_telefone: "", indicacao4_conexao: "",
    indicacao5_nome: "", indicacao5_profissao: "", indicacao5_telefone: "", indicacao5_conexao: ""
  });

  useEffect(() => {
    if (lead) {
      setFormData({ 
        ...formData, 
        ...lead,
        filhos_info: lead.filhos_info || [],
        observacoes: lead.observacoes || [],
        novaObservacao: ""
      });
    } else {
      setFormData({
        codigo: nextCodigo || "",
        status: "AB Fone",
        data_cadastro: new Date().toISOString().split('T')[0],
        nome: "",
        regime_casamento: "",
        filhos: "",
        filhos_info: [],
        telefone: "",
        email: "",
        empresa: "",
        cargo: "",
        plano_saude: "",
        plano_saude_nome: "",
        valor_plano_saude: "",
        data_nascimento: "",
        idade: "",
        profissao: "",
        estado_civil: "",
        altura: "",
        peso: "",
        fuma: "",
        anda_moto: "",
        fonte_prospeccao: "",
        renda: "",
        patrimonio: "",
        data_visita: "",
        observacoes: [],
        novaObservacao: "",
        indicacao1_nome: "", indicacao1_profissao: "", indicacao1_telefone: "", indicacao1_conexao: "",
        indicacao2_nome: "", indicacao2_profissao: "", indicacao2_telefone: "", indicacao2_conexao: "",
        indicacao3_nome: "", indicacao3_profissao: "", indicacao3_telefone: "", indicacao3_conexao: "",
        indicacao4_nome: "", indicacao4_profissao: "", indicacao4_telefone: "", indicacao4_conexao: "",
        indicacao5_nome: "", indicacao5_profissao: "", indicacao5_telefone: "", indicacao5_conexao: ""
      });
    }
  }, [lead, open, nextCodigo]);

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
    } catch (error) {
      console.error("Erro no handleSubmit:", error);
      alert("Erro ao salvar: " + error.message);
    }
  };

  const handleUpperCase = (field, value) => {
    setFormData({ ...formData, [field]: value.toUpperCase() });
  };

  const handleFilhosChange = (quantidade) => {
    const num = parseInt(quantidade) || 0;
    const newFilhosInfo = Array(num).fill(null).map((_, i) => 
      formData.filhos_info[i] || { nome: "", idade: "" }
    );
    setFormData({ ...formData, filhos: quantidade, filhos_info: newFilhosInfo });
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">CADASTRO DE LEAD - CRM</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-4">
            {/* COLUNA 1 */}
            <div className="space-y-4">
              <div className="bg-orange-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">CADASTRO DE LEAD</h3>
                
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
                    <Input tabIndex={4} value={formData.nome} onChange={(e) => handleUpperCase('nome', e.target.value)} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Regime de Casamento:</Label>
                    <Select value={formData.regime_casamento} onValueChange={(v) => setFormData({...formData, regime_casamento: v})}>
                      <SelectTrigger tabIndex={5}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMUNHÃO TOTAL">COMUNHÃO TOTAL</SelectItem>
                        <SelectItem value="COMUNHÃO PARCIAL">COMUNHÃO PARCIAL</SelectItem>
                        <SelectItem value="SEPARAÇÃO TOTAL">SEPARAÇÃO TOTAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Filhos:</Label>
                    <Select value={formData.filhos} onValueChange={handleFilhosChange}>
                      <SelectTrigger tabIndex={6}><SelectValue /></SelectTrigger>
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
                              newInfo[idx].nome = e.target.value.toUpperCase();
                              setFormData({ ...formData, filhos_info: newInfo });
                            }}
                          />
                          <Label className="text-xs">Idade:</Label>
                          <Input
                            value={filho.idade}
                            onChange={(e) => {
                              const newInfo = [...formData.filhos_info];
                              newInfo[idx].idade = e.target.value;
                              setFormData({ ...formData, filhos_info: newInfo });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-pink-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">DADOS DE SAÚDE</h3>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Fuma:</Label>
                    <Select value={formData.fuma} onValueChange={(v) => setFormData({...formData, fuma: v})}>
                      <SelectTrigger tabIndex={24}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Anda de Moto:</Label>
                    <Select value={formData.anda_moto} onValueChange={(v) => setFormData({...formData, anda_moto: v})}>
                      <SelectTrigger tabIndex={25}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">SIM</SelectItem>
                        <SelectItem value="NÃO">NÃO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA 2 */}
            <div className="space-y-4">
              <div className="bg-blue-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">INFORMAÇÕES DE CONTATO</h3>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Telefone:</Label>
                    <Input 
                      tabIndex={7}
                      value={formData.telefone} 
                      onChange={(e) => handlePhoneChange('telefone', e.target.value)}
                      maxLength={15}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">E-mail:</Label>
                    <Input 
                      tabIndex={8}
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => handleUpperCase('email', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Empresa:</Label>
                    <Input tabIndex={9} value={formData.empresa} onChange={(e) => handleUpperCase('empresa', e.target.value)} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Cargo:</Label>
                    <Input tabIndex={10} value={formData.cargo} onChange={(e) => handleUpperCase('cargo', e.target.value)} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Plano de Saúde:</Label>
                    <Select value={formData.plano_saude} onValueChange={(v) => setFormData({...formData, plano_saude: v, plano_saude_nome: v === "NÃO" ? "" : formData.plano_saude_nome})}>
                      <SelectTrigger tabIndex={11}><SelectValue /></SelectTrigger>
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
                        <SelectTrigger tabIndex={12}><SelectValue /></SelectTrigger>
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
                      tabIndex={13}
                      value={formData.valor_plano_saude} 
                      onChange={(e) => handleCurrencyChange('valor_plano_saude', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">DADOS COMERCIAIS</h3>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Fonte de Prospecção:</Label>
                    <Input tabIndex={14} value={formData.fonte_prospeccao} onChange={(e) => handleUpperCase('fonte_prospeccao', e.target.value)} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Renda Mensal Estimada:</Label>
                    <Input 
                      tabIndex={15}
                      value={formData.renda} 
                      onChange={(e) => handleCurrencyChange('renda', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Patrimônio:</Label>
                    <Input 
                      tabIndex={16}
                      value={formData.patrimonio} 
                      onChange={(e) => handleCurrencyChange('patrimonio', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA 3 */}
            <div className="space-y-4">
              <div className="bg-purple-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">DADOS PESSOAIS</h3>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Data de Nascimento:</Label>
                    <Input 
                      tabIndex={18}
                      type="date" 
                      value={formData.data_nascimento} 
                      onChange={(e) => handleDataNascimentoChange(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Idade:</Label>
                    <Input tabIndex={19} value={formData.idade} disabled className="bg-gray-100" />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Profissão:</Label>
                    <Input tabIndex={20} value={formData.profissao} onChange={(e) => handleUpperCase('profissao', e.target.value)} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Estado Civil:</Label>
                    <Select value={formData.estado_civil} onValueChange={(v) => setFormData({...formData, estado_civil: v})}>
                      <SelectTrigger tabIndex={21}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOLTEIRO">SOLTEIRO</SelectItem>
                        <SelectItem value="CASADO">CASADO</SelectItem>
                        <SelectItem value="DIVORCIADO">DIVORCIADO</SelectItem>
                        <SelectItem value="VIÚVO">VIÚVO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Altura (cm):</Label>
                    <Input tabIndex={22} value={formData.altura} onChange={(e) => setFormData({...formData, altura: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Peso (kg):</Label>
                    <Input tabIndex={23} value={formData.peso} onChange={(e) => setFormData({...formData, peso: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="bg-red-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">AGENDAMENTO</h3>
                
                <div>
                  <Label className="text-xs">Data de Visita:</Label>
                  <Input tabIndex={26} type="date" value={formData.data_visita} onChange={(e) => setFormData({...formData, data_visita: e.target.value})} />
                </div>
              </div>

              <div className="bg-cyan-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">OBSERVAÇÕES</h3>
                
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
                    tabIndex={27}
                    rows={3}
                    value={formData.novaObservacao} 
                    onChange={(e) => setFormData({...formData, novaObservacao: e.target.value.toUpperCase()})}
                    className="text-sm"
                    placeholder="Nova observação..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* INDICAÇÕES */}
          <div className="mt-4 bg-yellow-100 p-3 rounded">
            <h3 className="font-bold text-sm mb-3">INDICAÇÕES</h3>
            
            <div className="grid grid-cols-4 gap-2 text-xs font-bold mb-2">
              <div>Nome:</div>
              <div>Profissão:</div>
              <div>Telefone:</div>
              <div>Conexão:</div>
            </div>

            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="grid grid-cols-4 gap-2 mb-2">
                <Input 
                  className="h-8 text-xs"
                  value={formData[`indicacao${num}_nome`]} 
                  onChange={(e) => handleUpperCase(`indicacao${num}_nome`, e.target.value)}
                />
                <Input 
                  className="h-8 text-xs"
                  value={formData[`indicacao${num}_profissao`]} 
                  onChange={(e) => handleUpperCase(`indicacao${num}_profissao`, e.target.value)}
                />
                <Input 
                  className="h-8 text-xs"
                  value={formData[`indicacao${num}_telefone`]} 
                  onChange={(e) => handlePhoneChange(`indicacao${num}_telefone`, e.target.value)}
                  maxLength={15}
                />
                <Input 
                  className="h-8 text-xs"
                  value={formData[`indicacao${num}_conexao`]} 
                  onChange={(e) => handleUpperCase(`indicacao${num}_conexao`, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* BOTÕES */}
          <div className="flex gap-3 mt-6">
            <Button 
              type="submit" 
              tabIndex={28}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 font-bold text-lg py-6"
            >
              {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              SALVAR
            </Button>
            
            <Button 
              type="button"
              onClick={handleLimpar}
              className="flex-1 bg-gray-500 hover:bg-gray-600 font-bold text-lg py-6"
            >
              LIMPAR
            </Button>
            
            <Button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-red-600 hover:bg-red-700 font-bold text-lg py-6"
            >
              CANCELAR
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}