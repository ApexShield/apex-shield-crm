import { useState, useMemo, useRef, useEffect } from "react";
import { Search, User, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ClienteSearchBox({ clientes, onSelect, selectedId }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedCliente = clientes.find(c => c.id === selectedId);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resultados = useMemo(() => {
    if (!query.trim()) return clientes.slice(0, 30);
    const t = query.toLowerCase();
    return clientes.filter(c =>
      (c.nome || "").toLowerCase().includes(t) ||
      (c.email || "").toLowerCase().includes(t) ||
      (c.telefone || "").replace(/\D/g, "").includes(query.replace(/\D/g, "")) ||
      (c.cpf || "").replace(/\D/g, "").includes(query.replace(/\D/g, "")) ||
      (c.profissao || "").toLowerCase().includes(t) ||
      (c.empresa || "").toLowerCase().includes(t)
    ).slice(0, 30);
  }, [clientes, query]);

  const handleSelect = (cliente) => {
    setQuery("");
    setOpen(false);
    onSelect(cliente);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {selectedCliente && (
        <div className="flex items-center gap-3 bg-emerald-500/20 border border-emerald-400/40 rounded-lg px-4 py-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {selectedCliente.nome?.charAt(0) || "?"}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{selectedCliente.nome}</p>
            <p className="text-white/50 text-xs">{selectedCliente.profissao || "—"} • {selectedCliente.telefone || "Sem telefone"}</p>
          </div>
          <button onClick={() => { onSelect(null); setQuery(""); }} className="text-white/40 hover:text-white text-xs underline">Trocar</button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar cliente por nome, CPF, email, telefone, profissão..."
          className="pl-10 bg-white border-2 border-indigo-400 text-gray-900 font-semibold h-12"
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-indigo-300 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
          {resultados.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-amber-400" />
              Nenhum cliente encontrado
            </div>
          ) : (
            resultados.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0 ${c.id === selectedId ? "bg-indigo-50" : ""}`}
              >
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {c.nome?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-bold text-sm truncate">{c.nome}</p>
                  <p className="text-gray-500 text-xs truncate">
                    {c.profissao || "—"} • {c.telefone || "Sem telefone"} • {c.email || ""}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  {c.status || "—"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}