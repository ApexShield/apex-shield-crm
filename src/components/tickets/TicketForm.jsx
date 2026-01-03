import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const prioridades = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" }
];

const categorias = [
  { value: "suporte", label: "Suporte" },
  { value: "vendas", label: "Vendas" },
  { value: "financeiro", label: "Financeiro" },
  { value: "reclamacao", label: "Reclamação" },
  { value: "solicitacao", label: "Solicitação" },
  { value: "outro", label: "Outro" }
];

export default function TicketForm({ open, onClose, clientes, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    cliente_id: "",
    cliente_nome: "",
    prioridade: "media",
    categoria: "suporte",
    data_limite: ""
  });

  useEffect(() => {
    if (open) {
      setFormData({
        titulo: "",
        descricao: "",
        cliente_id: "",
        cliente_nome: "",
        prioridade: "media",
        categoria: "suporte",
        data_limite: ""
      });
    }
  }, [open]);

  const handleClienteChange = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    setFormData({
      ...formData,
      cliente_id: clienteId,
      cliente_nome: cliente?.nome || ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">
            Novo Ticket
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="titulo" className="text-slate-700">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Resumo do chamado"
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="cliente" className="text-slate-700">Cliente *</Label>
            <Select
              value={formData.cliente_id}
              onValueChange={handleClienteChange}
              required
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome} {cliente.empresa && `- ${cliente.empresa}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria" className="text-slate-700">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="prioridade" className="text-slate-700">Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => setFormData({ ...formData, prioridade: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {prioridades.map((prio) => (
                    <SelectItem key={prio.value} value={prio.value}>
                      {prio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="data_limite" className="text-slate-700">Data Limite</Label>
            <Input
              id="data_limite"
              type="date"
              value={formData.data_limite}
              onChange={(e) => setFormData({ ...formData, data_limite: e.target.value })}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="descricao" className="text-slate-700">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o chamado em detalhes..."
              rows={4}
              className="mt-1"
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}