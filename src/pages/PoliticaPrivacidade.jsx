import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Mail, Calendar, FileText } from "lucide-react";

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-slate-600">
            APEX SHIELD CRM - Gestão de Leads para Corretores de Seguros
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Última atualização: 29 de Janeiro de 2026
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                1. Sobre Este Aplicativo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                O APEX SHIELD CRM é um sistema de gestão de relacionamento com clientes (CRM) 
                desenvolvido especificamente para corretores de seguros. Nosso objetivo é facilitar 
                o gerenciamento de leads, compromissos e a comunicação com clientes.
              </p>
              <p>
                Este aplicativo é operado por APEX SHIELD Corretora de Seguros e está em conformidade 
                com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                2. Integração com Google Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p className="font-semibold">Por que precisamos de acesso ao seu Google Calendar:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>
                  <strong>Criar compromissos:</strong> Agendar reuniões, visitas e ligações 
                  diretamente no seu calendário pessoal
                </li>
                <li>
                  <strong>Visualizar eventos:</strong> Mostrar seus compromissos na interface 
                  do CRM para melhor organização
                </li>
                <li>
                  <strong>Atualizar eventos:</strong> Editar horários, descrições e participantes 
                  de compromissos já agendados
                </li>
                <li>
                  <strong>Deletar eventos:</strong> Remover compromissos cancelados
                </li>
                <li>
                  <strong>Google Meet:</strong> Criar links automáticos de videochamada para 
                  reuniões online
                </li>
              </ul>
              <p className="text-sm bg-indigo-50 p-3 rounded-lg mt-4">
                ✅ <strong>Garantia:</strong> Só acessamos SEUS eventos. Nunca acessamos calendários 
                de outras pessoas. Nunca compartilhamos seus dados com terceiros.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                3. Dados Coletados e Armazenados
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p><strong>Dados de Cadastro:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Função na empresa (corretor, líder, admin)</li>
              </ul>

              <p className="mt-4"><strong>Dados de Leads/Clientes:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Informações de contato (nome, telefone, e-mail)</li>
                <li>Dados profissionais (empresa, cargo)</li>
                <li>Informações de seguro (apólices, coberturas)</li>
                <li>Histórico de interações e observações</li>
              </ul>

              <p className="mt-4"><strong>Dados do Google Calendar:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Eventos criados através do CRM</li>
                <li>Eventos existentes no seu calendário (somente para visualização)</li>
                <li>Participantes dos eventos</li>
              </ul>

              <p className="text-sm bg-amber-50 p-3 rounded-lg mt-4">
                ⚠️ <strong>Importante:</strong> Nunca solicitamos senhas, dados bancários ou 
                informações financeiras sensíveis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                4. Como Protegemos Seus Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <ul className="list-disc ml-6 space-y-2">
                <li>
                  <strong>Criptografia:</strong> Todos os dados são transmitidos usando 
                  protocolo HTTPS/TLS
                </li>
                <li>
                  <strong>Autenticação OAuth 2.0:</strong> Usamos o padrão de segurança do 
                  Google para acesso ao Calendar
                </li>
                <li>
                  <strong>Tokens seguros:</strong> Armazenamos tokens de acesso criptografados 
                  e com data de expiração
                </li>
                <li>
                  <strong>Acesso controlado:</strong> Apenas você pode ver seus próprios leads 
                  e compromissos
                </li>
                <li>
                  <strong>Servidores seguros:</strong> Infraestrutura hospedada em plataforma 
                  Base44 com certificações de segurança
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                5. Seus Direitos (LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>De acordo com a LGPD, você tem direito a:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Acessar</strong> seus dados pessoais armazenados</li>
                <li><strong>Corrigir</strong> dados incompletos ou incorretos</li>
                <li><strong>Excluir</strong> seus dados pessoais</li>
                <li><strong>Revogar</strong> o consentimento de uso de dados</li>
                <li><strong>Exportar</strong> seus dados em formato legível</li>
                <li><strong>Desconectar</strong> sua conta Google a qualquer momento</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                6. Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 space-y-3">
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política de privacidade:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p><strong>E-mail:</strong> apexshieldcorretoradeseguros@gmail.com</p>
                <p><strong>Empresa:</strong> APEX SHIELD Corretora de Seguros</p>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                Responderemos todas as solicitações em até 15 dias úteis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Alterações Nesta Política</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600">
              <p>
                Podemos atualizar esta política periodicamente. Notificaremos usuários sobre 
                mudanças significativas por e-mail ou através de aviso no aplicativo.
              </p>
            </CardContent>
          </Card>

          <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-lg">
            <p className="text-slate-700">
              <strong>Resumo:</strong> Usamos o Google Calendar apenas para criar e gerenciar 
              seus compromissos profissionais. Seus dados são protegidos, nunca compartilhados 
              com terceiros, e você pode revogar o acesso a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}