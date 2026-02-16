import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Users, AlertTriangle, Scale, Mail, Globe } from "lucide-react";

export default function TermosServico() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Termos de Serviço
          </h1>
          <p className="text-slate-600">
            APEX SHIELD CRM - Gestão de Leads para Corretores de Seguros
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Última atualização: 12 de Fevereiro de 2026
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                1. Aceitação dos Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                Ao acessar e utilizar o APEX SHIELD CRM, você concorda com estes Termos de Serviço 
                e com a nossa Política de Privacidade. Se você não concorda com algum dos termos, 
                não deve utilizar o sistema.
              </p>
              <p>
                O uso continuado do sistema após alterações nos termos constitui aceitação das mudanças.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                2. Descrição do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                O APEX SHIELD CRM é uma plataforma de gestão de relacionamento com clientes (CRM) 
                projetada para corretores de seguros. O serviço inclui:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Gestão de leads e funil de vendas</li>
                <li>Agenda profissional com envio de convites por email</li>
                <li>Gestão de apólices e documentos</li>
                <li>Relatórios e análises de desempenho</li>
                <li>Comunicação integrada (WhatsApp e Email)</li>
                <li>Gestão financeira pessoal</li>
                <li>Organograma e gestão de equipe</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                3. Cadastro e Conta do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                Para utilizar o sistema, você deve criar uma conta fornecendo informações 
                verdadeiras e completas. Você é responsável por:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Todas as atividades realizadas em sua conta</li>
                <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
                <li>Manter seus dados de cadastro atualizados</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                4. Uso Aceitável
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>Ao utilizar o APEX SHIELD CRM, você concorda em:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Utilizar o sistema apenas para fins profissionais legítimos relacionados à corretagem de seguros</li>
                <li>Não compartilhar dados de clientes com terceiros não autorizados</li>
                <li>Não tentar acessar dados de outros usuários sem autorização</li>
                <li>Não utilizar o sistema para envio de spam ou comunicações não solicitadas</li>
                <li>Cumprir todas as leis aplicáveis, incluindo a LGPD</li>
                <li>Respeitar a propriedade intelectual do sistema</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                5. Agenda Profissional e Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                O APEX SHIELD CRM possui agenda profissional integrada para gerenciamento de compromissos:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>O sistema permite criar, editar e excluir compromissos</li>
                <li>Emails personalizados de convite são enviados aos participantes</li>
                <li>Ao alterar compromissos, os participantes podem ser notificados por email</li>
                <li>Você pode configurar um link padrão de reunião para seus convites</li>
              </ul>
              <p className="text-sm bg-indigo-50 p-3 rounded-lg mt-4">
                ✅ Os emails são enviados apenas para os participantes que você informar, 
                nunca para terceiros não autorizados.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                6. Proteção de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                O APEX SHIELD CRM está comprometido com a proteção dos seus dados:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Todos os dados são transmitidos via HTTPS/TLS</li>
                <li>Autenticação segura com controle de acesso por hierarquia</li>
                <li>Controle de acesso baseado em hierarquia (RLS)</li>
                <li>Cada usuário acessa apenas seus próprios dados e os de sua equipe</li>
                <li>Não vendemos ou compartilhamos dados com terceiros</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-indigo-600" />
                7. Limitação de Responsabilidade
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                O APEX SHIELD CRM é fornecido "como está". Não garantimos:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Disponibilidade ininterrupta do serviço</li>
                <li>Ausência total de erros ou falhas técnicas</li>
                <li>Resultados específicos de vendas ou negócios</li>
              </ul>
              <p>
                Não nos responsabilizamos por perdas de dados causadas por uso indevido, 
                falhas de conexão ou circunstâncias fora do nosso controle. Recomendamos 
                que mantenha backups dos seus dados importantes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                8. Propriedade Intelectual
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                Todo o conteúdo do APEX SHIELD CRM, incluindo design, código, textos e logotipos, 
                é de propriedade da APEX SHIELD Corretora de Seguros. É proibido:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Copiar, reproduzir ou distribuir o sistema</li>
                <li>Engenharia reversa ou descompilação</li>
                <li>Usar a marca APEX SHIELD sem autorização</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                9. Rescisão
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                Podemos suspender ou encerrar sua conta se:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Você violar estes Termos de Serviço</li>
                <li>Uso indevido do sistema for detectado</li>
                <li>Por solicitação do próprio usuário</li>
              </ul>
              <p>
                Você pode encerrar sua conta a qualquer momento, entrando em contato conosco. 
                Seus dados serão excluídos conforme nossa Política de Privacidade.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                10. Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                Para dúvidas sobre estes Termos de Serviço:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p><strong>E-mail:</strong> apexshieldcorretoradeseguros@gmail.com</p>
                <p><strong>Empresa:</strong> APEX SHIELD Corretora de Seguros</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Alterações nos Termos</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600">
              <p>
                Podemos atualizar estes Termos de Serviço periodicamente. Notificaremos os 
                usuários sobre mudanças significativas por e-mail ou aviso no aplicativo. 
                O uso continuado do sistema após alterações constitui aceitação dos novos termos.
              </p>
            </CardContent>
          </Card>

          <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-lg">
            <p className="text-slate-700">
              <strong>Resumo:</strong> Ao utilizar o APEX SHIELD CRM, você concorda em usar o 
              sistema de forma responsável e profissional. Protegemos seus dados e esperamos 
              que você respeite os dados de seus clientes. Em caso de dúvidas, entre em contato conosco.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}