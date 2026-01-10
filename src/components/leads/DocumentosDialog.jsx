import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Download, Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DocumentosDialog({ open, onClose, cliente, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      const novosDocumentos = [
        ...(cliente.documentos || []),
        {
          nome: selectedFile.name,
          url: file_url,
          data_upload: new Date().toISOString()
        }
      ];

      await base44.entities.Cliente.update(cliente.id, { documentos: novosDocumentos });
      onUpdate();
      setSelectedFile(null);
      alert("Documento enviado com sucesso!");
    } catch (error) {
      alert("Erro ao enviar documento: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (index) => {
    if (!confirm("Confirma a exclusão deste documento?")) return;

    try {
      const novosDocumentos = cliente.documentos.filter((_, i) => i !== index);
      await base44.entities.Cliente.update(cliente.id, { documentos: novosDocumentos });
      onUpdate();
      alert("Documento excluído com sucesso!");
    } catch (error) {
      alert("Erro ao excluir documento: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            DOCUMENTOS - {cliente?.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Section */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              ADICIONAR NOVO DOCUMENTO
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Selecione o arquivo:</Label>
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0])}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="bg-green-600 hover:bg-green-700 w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    ENVIAR DOCUMENTO
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Documents List */}
          <div className="bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              DOCUMENTOS ANEXADOS ({cliente?.documentos?.length || 0})
            </h3>

            {!cliente?.documentos || cliente.documentos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Nenhum documento anexado ainda
              </p>
            ) : (
              <div className="space-y-2">
                {cliente.documentos.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-3 rounded border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{doc.nome}</p>
                        <p className="text-xs text-gray-500">
                          Enviado em: {format(new Date(doc.data_upload), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            FECHAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}