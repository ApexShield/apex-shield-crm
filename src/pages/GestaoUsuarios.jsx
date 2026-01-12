import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Shield, User, Loader2, Edit2, Award, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GestaoUsuarios() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      if (currentUser?.role === "admin") {
        return await base44.entities.User.list("-created_date", 100);
      }
      return [];
    },
    enabled: !!currentUser && currentUser.role === "admin"
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setShowInviteDialog(false);
      setEmail("");
      setRole("user");
      alert("Convite enviado com sucesso!");
    },
    onError: (error) => {
      alert(`Erro ao convidar usuário: ${error.message}`);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roleType }) => {
      await base44.entities.User.update(userId, { role_type: roleType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setShowEditRoleDialog(false);
      setSelectedUser(null);
      alert("Tipo de usuário atualizado com sucesso!");
    },
    onError: (error) => {
      alert(`Erro ao atualizar: ${error.message}`);
    }
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (!email) {
      alert("Por favor, insira um email válido");
      return;
    }
    inviteMutation.mutate({ email, role });
  };

  const handleEditRole = (usuario) => {
    setSelectedUser(usuario);
    setShowEditRoleDialog(true);
  };

  const handleUpdateRole = (roleType) => {
    if (!selectedUser) return;
    updateRoleMutation.mutate({ userId: selectedUser.id, roleType });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
              <p className="text-gray-600 mt-1">Administração - Gerenciamento completo de usuários e permissões</p>
            </div>
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Convidar Usuário
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Usuários</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {usuarios.filter(u => u.role_type === "Usuario" || !u.role_type).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Usuários VIP</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {usuarios.filter(u => u.role_type === "UsuarioVIP").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Administradores</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {usuarios.filter(u => u.role === "admin").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Nome</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold">Função Sistema</TableHead>
                    <TableHead className="font-bold">Tipo de Usuário</TableHead>
                    <TableHead className="font-bold">Google Calendar</TableHead>
                    <TableHead className="font-bold">Data de Cadastro</TableHead>
                    <TableHead className="font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {usuario.role === "admin" ? (
                            <Shield className="w-4 h-4 text-indigo-600" />
                          ) : usuario.role_type === "UsuarioVIP" ? (
                            <Award className="w-4 h-4 text-purple-600" />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                          {usuario.full_name || "—"}
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            usuario.role === "admin"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {usuario.role === "admin" ? "ADMINISTRADOR" : "USUÁRIO"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            usuario.role_type === "UsuarioVIP"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {usuario.role_type === "UsuarioVIP" ? "VIP" : "PADRÃO"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {usuario.google_calendar_connected ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <Calendar className="w-3 h-3" />
                            Conectado
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Não conectado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(usuario.created_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRole(usuario)}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Alterar Tipo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Dialog Convidar Usuário */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
                required
              />
            </div>
            <div>
              <Label>Função no Sistema</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Usuários veem apenas seus próprios leads. Administradores veem todos os dados.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={inviteMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar Convite
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Tipo de Usuário */}
      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Tipo de Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900">{selectedUser?.full_name || selectedUser?.email}</p>
              <p className="text-sm text-gray-600 mt-1">
                Tipo atual: <span className="font-semibold">{selectedUser?.role_type === "UsuarioVIP" ? "Usuário VIP" : "Usuário Padrão"}</span>
              </p>
            </div>

            <div>
              <Label>Novo Tipo de Usuário</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 border-2 hover:border-blue-500 hover:bg-blue-50"
                  onClick={() => handleUpdateRole("Usuario")}
                  disabled={updateRoleMutation.isPending}
                >
                  <User className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold">Usuário</span>
                  <span className="text-xs text-gray-500">Acesso padrão</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 border-2 hover:border-purple-500 hover:bg-purple-50"
                  onClick={() => handleUpdateRole("UsuarioVIP")}
                  disabled={updateRoleMutation.isPending}
                >
                  <Award className="w-6 h-6 text-purple-600" />
                  <span className="font-semibold">Usuário VIP</span>
                  <span className="text-xs text-gray-500">Google Agenda</span>
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="text-xs text-gray-700">
                <strong>Usuário Padrão:</strong> Acesso a todas as funções do CRM.<br/>
                <strong>Usuário VIP:</strong> Acesso completo + integração com Google Agenda.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowEditRoleDialog(false)}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}