import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

export default function AgendarVisitaDialog({ open, onClose, cliente, user, onSave }) {
  const [etapa, setEtapa] = useState(1); // 1: tipo, 2: horário, 3: endereço
  const [tipoVisita, setTipoVisita] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [endereco, setEndereco] = useState("");
  const [modalidade, setModalidade] = useState(""); // online ou presencial
  const [validando, setValidando] = useState(false);
  const [erro, setErro] = useState("");

  const isVIPOrAdmin = user?.role === "admin" || user?.role_type === "UsuarioVIP";

  const handleTipoVisita = (tipo) => {
    setTipoVisita(tipo);
    setEtapa(2);
  };

  const validarHorario = async () => {
    if (!data || !horario) {
      setErro("Por favor, preencha data e horário");
      return;
    }

    setValidando(true);
    setErro("");

    try {
      // Simular validação de conflito (em produção, chamar API do Google Calendar)
      // const conflito = await verificarConflitoGoogleCalendar(data, horario);
      
      // Simulação: 10% de chance de conflito para demonstração
      await new Promise(resolve => setTimeout(resolve, 1000));
      const temConflito = Math.random() < 0.1;

      if (temConflito) {
        setErro("Já existe um evento para o horário selecionado. Por favor, escolha outro horário.");
        setValidando(false);
        return;
      }

      setEtapa(3);
    } catch (error) {
      setErro("Erro ao validar horário. Tente novamente.");
    } finally {
      setValidando(false);
    }
  };

  const handleSalvar = async () => {
    if (!modalidade) {
      setErro("Por favor, selecione se o compromisso será online ou presencial");
      return;
    }

    if (modalidade === "presencial" && !endereco) {
      setErro("Por favor, informe o endereço para compromisso presencial");
      return;
    }

    setValidando(true);

    try {
      const dataHoraInicio = new Date(`${data}T${horario}:00`);
      const dataHoraFim = new Date(dataHoraInicio.getTime() + 60 * 60 * 1000); // +1 hora
      const titulo = `${tipoVisita} - ${cliente.nome}`;
      
      // Criar compromisso na agenda
      const descricaoCompleta = modalidade === "online" 
        ? `Modalidade: Online${cliente.email ? `\nEmail: ${cliente.email}` : ''}`
        : `Modalidade: Presencial\nEndereço: ${endereco}${cliente.email ? `\nEmail: ${cliente.email}` : ''}`;

      await base44.entities.Compromisso.create({
        titulo: titulo,
        descricao: descricaoCompleta,
        data_inicio: dataHoraInicio.toISOString(),
        data_fim: dataHoraFim.toISOString(),
        cor: "#0891b2", // Azul Pavão - Agendado
        tipo: "agendado",
        cliente_id: cliente.id || "",
        cliente_nome: cliente.nome,
        endereco: modalidade === "presencial" ? endereco : "Online",
        status_origem: tipoVisita
      });

      const agendamento = {
        tipo: tipoVisita,
        data: data,
        horario: horario,
        dataHora: dataHoraInicio.toISOString(),
        endereco: endereco,
        titulo: titulo,
        convidados: cliente.email ? [cliente.email] : []
      };

      onSave(agendamento);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      setErro("Erro ao criar agendamento. Tente novamente.");
    } finally {
      setValidando(false);
    }
  };

  const resetForm = () => {
    setEtapa(1);
    setTipoVisita("");
    setData("");
    setHorario("");
    setEndereco("");
    setModalidade("");
    setErro("");
  };

  if (!isVIPOrAdmin) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: '#AFCB3A' }} />
              Agendamento de Visita
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-gray-700 font-semibold mb-2">Função Exclusiva VIP</p>
            <p className="text-sm text-gray-600">Esta funcionalidade está disponível apenas para usuários VIP e Administradores.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => { resetForm(); onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: '#AFCB3A' }} />
            Agendar Visita - {cliente?.nome}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs rounded-full font-bold">
              ⭐ VIP
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* ETAPA 1: Tipo de Visita */}
          {etapa === 1 && (
            <div className="space-y-3">
              <Label className="text-base font-bold">Selecione o tipo de visita:</Label>
              
              <Button
                onClick={() => handleTipoVisita("AB Visita")}
                className="w-full py-6 text-base font-bold"
                style={{ background: 'linear-gradient(135deg, #0096D8, #AFCB3A)' }}
              >
                AB Visita
              </Button>

              <Button
                onClick={() => handleTipoVisita("AB Fechamento")}
                className="w-full py-6 text-base font-bold"
                style={{ background: 'linear-gradient(135deg, #AFCB3A, #0096D8)' }}
              >
                AB Fechamento
              </Button>

              <Button
                onClick={() => handleTipoVisita("Entrega de Apólice")}
                className="w-full py-6 text-base font-bold bg-purple-600 hover:bg-purple-700"
              >
                Entrega de Apólice
              </Button>
            </div>
          )}

          {/* ETAPA 2: Data e Horário */}
          {etapa === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Tipo:</strong> {tipoVisita}
                </p>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Data da Visita:
                </Label>
                <Input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  Horário:
                </Label>
                <Input
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                />
              </div>

              {erro && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setEtapa(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={validarHorario}
                  disabled={validando || !data || !horario}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {validando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    'Próximo'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ETAPA 3: Modalidade e Endereço */}
          {etapa === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1">
                <p><strong>Tipo:</strong> {tipoVisita}</p>
                <p><strong>Data:</strong> {format(new Date(data + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}</p>
                <p><strong>Horário:</strong> {horario}</p>
              </div>

              <div>
                <Label className="mb-2 font-semibold">Modalidade do Compromisso:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => setModalidade("online")}
                    variant={modalidade === "online" ? "default" : "outline"}
                    className={`h-12 ${modalidade === "online" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  >
                    💻 Online
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setModalidade("presencial")}
                    variant={modalidade === "presencial" ? "default" : "outline"}
                    className={`h-12 ${modalidade === "presencial" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  >
                    📍 Presencial
                  </Button>
                </div>
              </div>

              {modalidade === "presencial" && (
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Endereço da Visita:
                  </Label>
                  <Input
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                    className="h-12"
                  />
                </div>
              )}

              {modalidade === "online" && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="text-blue-700">
                    💻 Compromisso será realizado de forma online
                  </p>
                </div>
              )}

              {cliente.email && (
                <div className="bg-green-50 p-3 rounded-lg text-sm">
                  <p className="text-green-700">
                    ✉️ Convite será enviado para: <strong>{cliente.email}</strong>
                  </p>
                </div>
              )}

              {erro && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => { setEtapa(2); setErro(""); }}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSalvar}
                  disabled={validando}
                  className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
                >
                  {validando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    '✓ Confirmar Agendamento'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}