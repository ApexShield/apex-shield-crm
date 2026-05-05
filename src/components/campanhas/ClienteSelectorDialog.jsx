import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, CheckCircle2, Mail, Phone, Building2, Briefcase } from "lucide-react";

export default function ClienteSelectorDialog({ open, onClose, clientes = [], selectedIds = [], onConfirm }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set(selectedIds));

  // Sync selected state when dialog opens or selectedIds change
  useEffect(() => {
    if (open) {
      setSelected(new Set(selectedIds));
      setSearch("");
    }
  }, [open, selectedIds]);

  const filteredClientes = useMemo(() => {
    if (!search.trim()) return clientes;
    const s = search.toLowerCase();
    return clientes.filter(c =>
      (c.nome || '').toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.telefone || '').includes(s) ||
      (c.empresa || '').toLowerCase().includes(s) ||
      (c.cargo || '').toLowerCase().includes(s) ||
      (c.profissao || '').toLowerCase().includes(s)
    );
  }, [clientes, search]);

  const toggleClient = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredClientes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredClientes.map(c => c.id)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
        <div className="px-6 pt-5 pb-3 border-b border-slate-200 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Users className="w-5 h-5 text-indigo-600" />
              Selecionar Clientes ({selected.size} selecionado{selected.size !== 1 ? 's' : ''})
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, email, telefone, empresa, cargo, profissão..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <button onClick={toggleAll} className="text-xs text-indigo-600 hover:underline font-medium">
              {selected.size === filteredClientes.length ? "Desmarcar todos" : "Selecionar todos"}
            </button>
            <span className="text-xs text-slate-400">{filteredClientes.length} cliente(s)</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {filteredClientes.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Nenhum cliente encontrado</p>
          ) : (
            <div className="space-y-1">
              {filteredClientes.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleClient(c.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                    selected.has(c.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Checkbox checked={selected.has(c.id)} className="pointer-events-none" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{c.nome}</p>
                    <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
                      {c.email && <span className="flex items-center gap-0.5 truncate"><Mail className="w-3 h-3" />{c.email}</span>}
                      {c.telefone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.telefone}</span>}
                      {c.empresa && <span className="flex items-center gap-0.5"><Building2 className="w-3 h-3" />{c.empresa}</span>}
                      {c.cargo && <span className="flex items-center gap-0.5"><Briefcase className="w-3 h-3" />{c.cargo}</span>}
                    </div>
                  </div>
                  {selected.has(c.id) && <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={() => { onConfirm(Array.from(selected)); onClose(); }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Confirmar ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}