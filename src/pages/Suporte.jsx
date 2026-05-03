import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, Mail, Phone, MessageCircle, HelpCircle, AlertTriangle, Briefcase } from "lucide-react";

export default function Suporte() {
  const whatsappNumber = "5562999076728";
  const email = "apexshieldcrm@gmail.com";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Headphones className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Central de Suporte
          </h1>
          <p className="text-slate-600">
            APEX SHIELD CRM - Estamos aqui para ajudar você
          </p>
        </div>

        <div className="space-y-6">
          {/* Canais de Atendimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                Canais de Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Entre em contato conosco pelos canais abaixo. Nossa equipe está pronta para
                atender você de segunda a sexta, das 8h às 18h.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Preciso de suporte com o APEX SHIELD CRM.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">WhatsApp</p>
                      <p className="text-white/80 text-sm">+55 62 99907-6728</p>
                    </div>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Suporte APEX SHIELD CRM")}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">E-mail</p>
                      <p className="text-white/80 text-sm break-all">{email}</p>
                    </div>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                Perguntas Frequentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-slate-600">
              {[
                {
                  pergunta: "Como adicionar um novo lead?",
                  resposta: "Acesse a aba \"Leads\" e clique no botão \"Criar\". Preencha os dados do cliente e clique em \"Salvar\"."
                },
                {
                  pergunta: "Como agendar uma visita?",
                  resposta: "Dentro do cadastro do lead, clique no botão \"Agendar Visita\" na seção de Agendamento. Defina data, horário e modalidade."
                },
                {
                  pergunta: "Como enviar campanhas por email ou WhatsApp?",
                  resposta: "Acesse o menu \"Campanhas\", crie uma nova campanha, selecione os clientes desejados e escolha o canal de envio."
                },
                {
                  pergunta: "Como exportar meus relatórios?",
                  resposta: "Na aba \"Leads\", clique em \"Relatórios\" para gerar PDFs de resumo diário ou lista HOT40."
                },
                {
                  pergunta: "Como excluir minha conta?",
                  resposta: "Abra o menu lateral, role até o final e clique em \"Excluir Conta\". Confirme digitando \"EXCLUIR\"."
                },
              ].map((faq, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <p className="font-semibold text-slate-800 mb-1">{faq.pergunta}</p>
                  <p className="text-sm">{faq.resposta}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reportar Problema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-indigo-600" />
                Reportar um Problema
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                Se você encontrou um bug ou comportamento inesperado no aplicativo,
                envie uma mensagem detalhada pelo WhatsApp ou e-mail informando:
              </p>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>Descrição do problema</li>
                <li>Tela onde o erro ocorreu</li>
                <li>Passos para reproduzir o problema</li>
                <li>Capturas de tela, se possível</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Gostaria de reportar um problema no APEX SHIELD CRM:\n\nDescrição:\nTela:\nPassos:")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 gap-2">
                    <Phone className="w-4 h-4" />
                    Reportar via WhatsApp
                  </Button>
                </a>
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Bug Report - APEX SHIELD CRM")}&body=${encodeURIComponent("Descrição do problema:\n\nTela onde ocorreu:\n\nPassos para reproduzir:\n\n")}`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full gap-2">
                    <Mail className="w-4 h-4" />
                    Reportar via E-mail
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Sobre */}
          <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <p className="font-bold text-slate-800">APEX SHIELD CRM</p>
            </div>
            <p className="text-slate-700 text-sm">
              Sistema de gestão de leads desenvolvido para corretores de seguros.
              Nosso compromisso é oferecer a melhor experiência para o seu dia a dia profissional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}