import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function FormularioLead({ open, onClose, lead, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    // Cadastro de Lead
    codigo: "",
    status: "Novo",
    data_cadastro: new Date().toISOString().split('T')[0],
    nome: "",
    regime_casamento: "",
    filhos: "",
    
    // Informações de Contato
    telefone: "",
    email: "",
    empresa: "",
    cargo: "",
    plano_saude: "",
    valor_plano_saude: "",
    
    // Dados Pessoais
    data_nascimento: "",
    idade: "",
    profissao: "",
    estado_civil: "",
    altura: "",
    peso: "",
    
    // Dados de Saúde
    fuma: "",
    anda_moto: "",
    
    // Dados Comerciais
    fonte_prospeccao: "",
    renda: "",
    patrimonio: "",
    
    // Agendamento
    data_visita: "",
    
    // Observações
    observacoes: "",
    
    // Indicações
    indicacao1_nome: "",
    indicacao1_profissao: "",
    indicacao1_telefone: "",
    indicacao1_conexao: "",
    
    indicacao2_nome: "",
    indicacao2_profissao: "",
    indicacao2_telefone: "",
    indicacao2_conexao: "",
    
    indicacao3_nome: "",
    indicacao3_profissao: "",
    indicacao3_telefone: "",
    indicacao3_conexao: "",
    
    indicacao4_nome: "",
    indicacao4_profissao: "",
    indicacao4_telefone: "",
    indicacao4_conexao: "",
    
    indicacao5_nome: "",
    indicacao5_profissao: "",
    indicacao5_telefone: "",
    indicacao5_conexao: ""
  });

  useEffect(() => {
    if (lead) {
      setFormData({ ...formData, ...lead });
    } else {
      // Reset para novo lead
      setFormData({
        codigo: "",
        status: "Novo",
        data_cadastro: new Date().toISOString().split('T')[0],
        nome: "",
        regime_casamento: "",
        filhos: "",
        telefone: "",
        email: "",
        empresa: "",
        cargo: "",
        plano_saude: "",
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
        observacoes: "",
        indicacao1_nome: "", indicacao1_profissao: "", indicacao1_telefone: "", indicacao1_conexao: "",
        indicacao2_nome: "", indicacao2_profissao: "", indicacao2_telefone: "", indicacao2_conexao: "",
        indicacao3_nome: "", indicacao3_profissao: "", indicacao3_telefone: "", indicacao3_conexao: "",
        indicacao4_nome: "", indicacao4_profissao: "", indicacao4_telefone: "", indicacao4_conexao: "",
        indicacao5_nome: "", indicacao5_profissao: "", indicacao5_telefone: "", indicacao5_conexao: ""
      });
    }
  }, [lead, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleLimpar = () => {
    setFormData({
      ...formData,
      nome: "",
      telefone: "",
      email: "",
      empresa: "",
      cargo: "",
      observacoes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">CADASTRO DE LEAD - CRM</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-4">
            {/* COLUNA 1 - LARANJA */}
            <div className="space-y-4">
              <div className="bg-orange-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">CADASTRO DE LEAD</h3>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Código</Label>
                    <Input value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Status:</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Input type="date" value={formData.data_cadastro} onChange={(e) => setFormData({...formData, data_cadastro: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Nome Completo:</Label>
                    <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Regime de Casamento:</Label>
                    <Select value={formData.regime_casamento} onValueChange={(v) => setFormData({...formData, regime_casamento: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Comunhão Total">Comunhão Total</SelectItem>
                        <SelectItem value="Comunhão Parcial">Comunhão Parcial</SelectItem>
                        <SelectItem value="Separação Total">Separação Total</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Filhos:</Label>
                    <Select value={formData.filhos} onValueChange={(v) => setFormData({...formData, filhos: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4+">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-pink-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">DADOS DE SAÚDE</h3>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Fuma:</Label>
                    <Select value={formData.fuma} onValueChange={(v) => setFormData({...formData, fuma: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Anda de Moto:</Label>
                    <Select value={formData.anda_moto} onValueChange={(v) => setFormData({...formData, anda_moto: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA 2 - AZUL */}
            <div className="space-y-4">
              <div className="bg-blue-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">INFORMAÇÕES DE CONTATO</h3>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Telefone:</Label>
                    <Input value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">E-mail:</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Empresa:</Label>
                    <Input value={formData.empresa} onChange={(e) => setFormData({...formData, empresa: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Cargo:</Label>
                    <Input value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Plano de Saúde:</Label>
                    <Select value={formData.plano_saude} onValueChange={(v) => setFormData({...formData, plano_saude: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Valor Plano de Saúde:</Label>
                    <Input value={formData.valor_plano_saude} onChange={(e) => setFormData({...formData, valor_plano_saude: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="bg-green-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">DADOS COMERCIAIS</h3>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Fonte de Prospecção:</Label>
                    <Input value={formData.fonte_prospeccao} onChange={(e) => setFormData({...formData, fonte_prospeccao: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Renda Mensal Estimada:</Label>
                    <Input value={formData.renda} onChange={(e) => setFormData({...formData, renda: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Patrimônio:</Label>
                    <Input value={formData.patrimonio} onChange={(e) => setFormData({...formData, patrimonio: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA 3 - ROXO */}
            <div className="space-y-4">
              <div className="bg-purple-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">DADOS PESSOAIS</h3>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Data de Nascimento:</Label>
                    <Input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Idade:</Label>
                    <Input value={formData.idade} onChange={(e) => setFormData({...formData, idade: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Profissão:</Label>
                    <Input value={formData.profissao} onChange={(e) => setFormData({...formData, profissao: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Estado Civil:</Label>
                    <Select value={formData.estado_civil} onValueChange={(v) => setFormData({...formData, estado_civil: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Solteiro">Solteiro</SelectItem>
                        <SelectItem value="Casado">Casado</SelectItem>
                        <SelectItem value="Divorciado">Divorciado</SelectItem>
                        <SelectItem value="Viúvo">Viúvo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Altura (cm):</Label>
                    <Input value={formData.altura} onChange={(e) => setFormData({...formData, altura: e.target.value})} />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Peso (kg):</Label>
                    <Input value={formData.peso} onChange={(e) => setFormData({...formData, peso: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="bg-red-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">AGENDAMENTO</h3>
                
                <div>
                  <Label className="text-xs">Data de Visita:</Label>
                  <Input type="date" value={formData.data_visita} onChange={(e) => setFormData({...formData, data_visita: e.target.value})} />
                </div>
              </div>

              <div className="bg-cyan-200 p-3 rounded">
                <h3 className="font-bold text-sm mb-3">OBSERVAÇÕES</h3>
                
                <Textarea 
                  rows={4}
                  value={formData.observacoes} 
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* INDICAÇÕES */}
          <div className="mt-4 bg-yellow-100 p-3 rounded">
            <h3 className="font-bold text-sm mb-3">INDICAÇÕES</h3>
            
            <div className="grid grid-cols-4 gap-2 text-xs font-bold mb-2">
              <div>Nome 1:</div>
              <div>Profissão:</div>
              <div>Telefone:</div>
              <div>Conexão:</div>
            </div>

            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="grid grid-cols-4 gap-2 mb-2">
                <Input 
                  className="h-8 text-xs"
                  value={formData[`indicacao${num}_nome`]} 
                  onChange={(e) => setFormData({...formData, [`indicacao${num}_nome`]: e.target.value})}
                />
                <Input 
                  className="h-8 text-xs"
                  value={formData[`indicacao${num}_profissao`]} 
                  onChange={(e) => setFormData({...formData, [`indicacao${num}_profissao`]: e.target.value})}
                />
                <Input 
                  className="h-8 text-xs"
                  value={formData[`indicacao${num}_telefone`]} 
                  onChange={(e) => setFormData({...formData, [`indicacao${num}_telefone`]: e.target.value})}
                />
                <Input 
                  className="h-8 text-xs"
                  value={formData[`indicacao${num}_conexao`]} 
                  onChange={(e) => setFormData({...formData, [`indicacao${num}_conexao`]: e.target.value})}
                />
              </div>
            ))}
          </div>

          {/* BOTÕES */}
          <div className="flex gap-3 mt-6">
            <Button 
              type="submit" 
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