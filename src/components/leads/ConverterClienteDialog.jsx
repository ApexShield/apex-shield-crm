import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1)$2-$3").replace(/-$/, "");
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1)$2-$3").replace(/-$/, "");
};

const formatCPF = (value) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4").replace(/-$/, "");
};

export default function ConverterClienteDialog({ open, onClose, lead, onConvert }) {
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erros, setErros] = useState([]);

  // Puxar dados existentes do lead sempre que o dialog abrir ou o lead mudar
  useEffect(() => {
    if (open && lead) {
      setCpf(lead.cpf || "");
      setNome(lead.nome || "");
      setEmail(lead.email || "");
      setTelefone(lead.telefone || "");
      setErros([]);
    }
  }, [open, lead]);

  const isFieldValid = (field, value) => {
    if (field === "cpf") return value.replace(/\D/g, "").length >= 11;
    return !!value.trim();
  };

  const handleConvert = () => {
    const missing = [];
    if (!nome.trim()) missing.push("Nome Completo");
    if (!cpf.trim() || cpf.replace(/\D/g, "").length < 11) missing.push("CPF (completo)");
    if (!email.trim()) missing.push("Email");
    if (!telefone.trim()) missing.push("Telefone");

    if (missing.length > 0) {
      setErros(missing);
      return;
    }

    setErros([]);
    onConvert({ cpf, nome, email, telefone });
  };

  const FieldStatus = ({ valid }) => (
    valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2" />
      : <AlertTriangle className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2" />
  );

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-slate-900 border-white/20 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            Converter Lead em Cliente
          </AlertDialogTitle>
          <AlertDialogDescription className="text-indigo-200">
            Para avançar para AB Fechamento, o lead precisa ser convertido em cliente.
            Os dados abaixo foram puxados do cadastro. Verifique e complete os campos obrigatórios:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="relative">
            <Label className="text-white text-xs">Nome Completo *</Label>
            <div className="relative">
              <Input value={nome} onChange={(e) => setNome(e.target.value.toUpperCase())}
                className="bg-white/10 border-white/20 text-white h-9 pr-10" />
              <FieldStatus valid={isFieldValid("nome", nome)} />
            </div>
          </div>
          <div>
            <Label className="text-white text-xs">CPF *</Label>
            <div className="relative">
              <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))}
                maxLength={14} placeholder="000.000.000-00"
                className="bg-white/10 border-white/20 text-white h-9 pr-10" />
              <FieldStatus valid={isFieldValid("cpf", cpf)} />
            </div>
          </div>
          <div>
            <Label className="text-white text-xs">Email *</Label>
            <div className="relative">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value.toUpperCase())}
                className="bg-white/10 border-white/20 text-white h-9 pr-10" />
              <FieldStatus valid={isFieldValid("email", email)} />
            </div>
          </div>
          <div>
            <Label className="text-white text-xs">Telefone *</Label>
            <div className="relative">
              <Input value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))}
                maxLength={15}
                className="bg-white/10 border-white/20 text-white h-9 pr-10" />
              <FieldStatus valid={isFieldValid("telefone", telefone)} />
            </div>
          </div>

          {erros.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-200">
                <p className="font-bold mb-1">Campos obrigatórios faltando:</p>
                {erros.map(e => <p key={e}>• {e}</p>)}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConvert} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
            <UserCheck className="w-4 h-4 mr-2" /> Converter em Cliente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}