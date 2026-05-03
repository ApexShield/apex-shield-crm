import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function DeleteAccountDialog({ open, onClose, userEmail }) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmText === "EXCLUIR";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete user data and logout
      await base44.auth.updateMe({ conta_excluida: true, data_exclusao: new Date().toISOString() });
      toast.success("Conta marcada para exclusão. Você será desconectado.");
      setTimeout(() => base44.auth.logout(), 1500);
    } catch (err) {
      toast.error("Erro ao processar exclusão: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">Excluir Conta</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Esta ação é <strong>irreversível</strong>. Todos os seus dados, leads e configurações serão perdidos.
            </p>
            <p className="text-sm">
              Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
            </p>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Digite EXCLUIR"
              className="border-red-300 focus:ring-red-500"
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setConfirmText(""); onClose(); }}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Excluir Permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}