import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ReciboDialog({ open, onClose, cliente }) {
  const [formData, setFormData] = useState({
    premio: "",
    periodicidade: "mensal",
    nacionalidade: "",
    rg: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cep: "",
    cidade: "",
    estado: "",
    produto: "Seguro de Vida",
    proposta: ""
  });
  const [gerando, setGerando] = useState(false);

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const allFilled = formData.premio && formData.nacionalidade && formData.rg &&
    formData.endereco && formData.numero && formData.bairro && formData.cep &&
    formData.cidade && formData.estado && formData.produto && formData.proposta;

  // Convert an image URL to base64 data URI so html2canvas can render it
  const imageToBase64 = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve("");
      img.src = url;
    });
  };

  const gerarRecibo = async () => {
    setGerando(true);
    const nome = (cliente?.nome || "").toUpperCase();
    const profissao = (cliente?.profissao || "").toUpperCase();
    const cpf = cliente?.cpf || "";
    const hoje = new Date();
    const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];

    const checkMensal = formData.periodicidade === "mensal" ? "✓" : "&nbsp;&nbsp;";
    const checkAnual = formData.periodicidade === "anual" ? "✓" : "&nbsp;&nbsp;";

    const u = (val) => `<span style="border-bottom:1px solid #333;padding:0 6px;min-width:60px;display:inline-block;">${val || "&nbsp;"}</span>`;

    // Pre-load logo as base64 so html2canvas can render it
    const logoBase64 = await imageToBase64("https://media.base44.com/images/public/69587402a43b69a04695a178/f7a13bd12_generated_image.png");

    const colorBarHtml = `<div style="display:flex;height:38px;width:100%;">
      <div style="flex:1;background:#4BA946;"></div>
      <div style="flex:1.2;background:#8DC63F;"></div>
      <div style="flex:1;background:#00A4E4;"></div>
      <div style="flex:0.8;background:#0072BC;"></div>
    </div>`;

    const logoImg = logoBase64 ? `<img src="${logoBase64}" style="height:90px;object-fit:contain;" />` : "";
    const logoImgSmall = logoBase64 ? `<img src="${logoBase64}" style="height:45px;object-fit:contain;" />` : "";

    const html = `
      <div id="recibo-container" style="width:700px;min-height:990px;font-family:'Times New Roman',Times,serif;background:#ffffff;box-sizing:border-box;font-size:15px;line-height:2;color:#1a1a1a;position:relative;display:flex;flex-direction:column;">
        
        <!-- Top color bar -->
        ${colorBarHtml}

        <div style="flex:1;padding:20px 55px 30px;position:relative;">
          <!-- Header: Logo + Premio -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;">
            ${logoImg}
            <div style="text-align:right;">
              <div style="font-size:14px;">Prêmio: ${u("R$ " + formData.premio)}</div>
              <div style="font-size:14px;margin-top:4px;">Mensal ( ${checkMensal} )&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Anual ( ${checkAnual} )</div>
            </div>
          </div>

          <div style="text-align:justify;">
            <p>Eu, ${u(nome)},</p>
            <p>nacionalidade: ${u(formData.nacionalidade.toUpperCase())}, profissão: ${u(profissao)},</p>
            <p>portador(a) do RG nº: ${u(formData.rg)}, inscrito(a) no CPF/ME sob</p>
            <p>o nº: ${u(cpf)}, residente no endereço: ${u(formData.endereco.toUpperCase())},</p>
            <p>nº ${u(formData.numero)}, complemento: ${u(formData.complemento?.toUpperCase() || "")},</p>
            <p>bairro: ${u(formData.bairro.toUpperCase())}, CEP: ${u(formData.cep)},</p>
            <p>cidade: ${u(formData.cidade.toUpperCase())}, estado: ${u(formData.estado.toUpperCase())},</p>
            <p>declaro, através deste documento, que estou contratando o produto:</p>
            <p>${u(formData.produto.toUpperCase())} através da proposta nº: ${u(formData.proposta)}</p>
            <p>tendo conhecimento de seu teor integral, sendo responsável pela veracidade das informações e dados descritos na proposta, especialmente em relação às questões de saúde constantes na Declaração Pessoal de Saúde (DPS) e beneficiários.</p>
          </div>

          <div style="margin-top:40px;text-align:center;">
            <p>${u(formData.cidade.toUpperCase())} ${u(String(hoje.getDate()))} de ${u(meses[hoje.getMonth()])} de 202${u(String(hoje.getFullYear()).slice(-1))}</p>
          </div>

          <div style="margin-top:80px;text-align:center;">
            <div style="border-top:1px solid #333;width:350px;margin:0 auto;padding-top:6px;font-size:13px;">
              [ASSINATURA IDÊNTICA AO DOCUMENTO DE IDENTIFICAÇÃO]
            </div>
          </div>

          <!-- Footer: MetLife logo bottom-right -->
          <div style="position:absolute;bottom:20px;right:0;">
            ${logoImgSmall}
          </div>
        </div>

        <!-- Bottom color bar -->
        ${colorBarHtml}
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container.querySelector("#recibo-container"), {
        scale: 2, backgroundColor: "#ffffff", useCORS: true
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
      pdf.save(`Recibo_${(cliente?.nome || "cliente").replace(/\s+/g, "_")}.pdf`);
    } finally {
      document.body.removeChild(container);
      setGerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            Emitir Recibo — {cliente?.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 compact-form">
          {/* Dados puxados automaticamente */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Dados do cliente (automático)</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> <strong>{cliente?.nome || "—"}</strong></div>
              <div><span className="text-muted-foreground">Profissão:</span> <strong>{cliente?.profissao || "—"}</strong></div>
              <div><span className="text-muted-foreground">CPF:</span> <strong>{cliente?.cpf || "—"}</strong></div>
            </div>
          </div>

          {/* Campos manuais */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Prêmio (R$) *</Label>
              <Input value={formData.premio} onChange={e => update("premio", e.target.value)} placeholder="Ex: 1493,70" />
            </div>
            <div>
              <Label className="text-xs">Periodicidade *</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name="periodicidade" checked={formData.periodicidade === "mensal"} onChange={() => update("periodicidade", "mensal")} /> Mensal
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name="periodicidade" checked={formData.periodicidade === "anual"} onChange={() => update("periodicidade", "anual")} /> Anual
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nacionalidade *</Label>
              <Input value={formData.nacionalidade} onChange={e => update("nacionalidade", e.target.value)} placeholder="Ex: Brasileiro" />
            </div>
            <div>
              <Label className="text-xs">Nº do RG *</Label>
              <Input value={formData.rg} onChange={e => update("rg", e.target.value)} placeholder="Número do RG" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Endereço *</Label>
            <Input value={formData.endereco} onChange={e => update("endereco", e.target.value)} placeholder="Rua / Avenida" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Número *</Label>
              <Input value={formData.numero} onChange={e => update("numero", e.target.value)} placeholder="Nº" />
            </div>
            <div>
              <Label className="text-xs">Complemento</Label>
              <Input value={formData.complemento} onChange={e => update("complemento", e.target.value)} placeholder="Apto, Bloco..." />
            </div>
            <div>
              <Label className="text-xs">Bairro *</Label>
              <Input value={formData.bairro} onChange={e => update("bairro", e.target.value)} placeholder="Bairro" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">CEP *</Label>
              <Input value={formData.cep} onChange={e => update("cep", e.target.value)} placeholder="00000-000" />
            </div>
            <div>
              <Label className="text-xs">Cidade *</Label>
              <Input value={formData.cidade} onChange={e => update("cidade", e.target.value)} placeholder="Cidade" />
            </div>
            <div>
              <Label className="text-xs">Estado *</Label>
              <Input value={formData.estado} onChange={e => update("estado", e.target.value)} placeholder="UF" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Produto *</Label>
              <Input value={formData.produto} onChange={e => update("produto", e.target.value)} placeholder="Seguro de Vida" />
            </div>
            <div>
              <Label className="text-xs">Nº da Proposta *</Label>
              <Input value={formData.proposta} onChange={e => update("proposta", e.target.value)} placeholder="Número da proposta" />
            </div>
          </div>

          <Button onClick={gerarRecibo} disabled={!allFilled || gerando}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 font-bold py-6 text-base">
            {gerando ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gerando...</> : <><Download className="w-5 h-5 mr-2" />Emitir Recibo PDF</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}