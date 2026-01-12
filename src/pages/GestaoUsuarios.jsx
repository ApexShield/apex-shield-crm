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
import { UserPlus, Shield, User, Loader2, Edit2, Award, Calendar, Users, Crown } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Acesso Restrito</h1>
          <p className="text-indigo-200 text-lg">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  const userCount = usuarios.filter(u => u.role_type === "Usuario" || !u.role_type).length;
  const vipCount = usuarios.filter(u => u.role_type === "UsuarioVIP").length;
  const adminCount = usuarios.filter(u => u.role === "admin").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white">Gestão de Usuários</h1>
                <p className="text-indigo-300 text-lg">Administração de acessos e permissões</p>
              </div>
            </div>
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold px-8 py-6 text-lg"
            >
              <UserPlus className="w-6 h-6 mr-2" />
              Convidar Usuário
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-indigo-300 text-sm font-medium">Total</p>
                  <p className="text-3xl font-black text-white">{usuarios.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-indigo-300 text-sm font-medium">Usuários</p>
                  <p className="text-3xl font-black text-white">{userCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-indigo-300 text-sm font-medium">VIP</p>
                  <p className="text-3xl font-black text-white">{vipCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-indigo-300 text-sm font-medium">Admins</p>
                  <p className="text-3xl font-black text-white">{adminCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="font-bold text-white">Nome</TableHead>
                    <TableHead className="font-bold text-white">Email</TableHead>
                    <TableHead className="font-bold text-white">Função Sistema</TableHead>
                    <TableHead className="font-bold text-white">Tipo de Usuário</TableHead>
                    <TableHead className="font-bold text-white">Google Calendar</TableHead>
                    <TableHead className="font-bold text-white">Data de Cadastro</TableHead>
                    <TableHead className="font-bold text-white">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            usuario.role === "admin" 
                              ? "bg-gradient-to-br from-orange-500 to-red-600"
                              : usuario.role_type === "UsuarioVIP"
                              ? "bg-gradient-to-br from-purple-500 to-pink-600"
                              : "bg-gradient-to-br from-blue-500 to-cyan-600"
                          }`}>
                            {usuario.role === "admin" ? (
                              <Shield className="w-5 h-5 text-white" />
                            ) : usuario.role_type === "UsuarioVIP" ? (
                              <Award className="w-5 h-5 text-white" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          {usuario.full_name || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-indigo-300">{usuario.email}</TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            usuario.role === "admin"
                              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          {usuario.role === "admin" ? "ADMIN" : "USER"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            usuario.role_type === "UsuarioVIP"
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          {usuario.role_type === "UsuarioVIP" ? "VIP" : "PADRÃO"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {usuario.google_calendar_connected ? (
                          <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
                            <Calendar className="w-4 h-4" />
                            Conectado
                          </span>
                        ) : (
                          <span className="text-white/30 text-sm">Não conectado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-white">
                        {format(new Date(usuario.created_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleEditRole(usuario)}
                          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editar
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
        <DialogContent className="bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Convidar Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-white">Função no Sistema</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-indigo-300 mt-2">
                Usuários veem apenas seus próprios leads. Administradores veem todos os dados.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={inviteMutation.isPending}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar Convite
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Tipo de Usuário */}
      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent className="bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Alterar Tipo de Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <p className="font-semibold text-white text-lg">{selectedUser?.full_name || selectedUser?.email}</p>
              <p className="text-indigo-300 mt-1">
                Tipo atual: <span className="font-semibold text-white">{selectedUser?.role_type === "UsuarioVIP" ? "VIP" : "Padrão"}</span>
              </p>
            </div>

            <div>
              <Label className="text-white font-bold mb-3 block">Selecione o Novo Tipo</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleUpdateRole("Usuario")}
                  disabled={updateRoleMutation.isPending}
                  className="group bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-blue-500 rounded-xl p-6 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-bold text-white mb-1">Usuário</div>
                  <div className="text-xs text-indigo-300">Acesso padrão</div>
                </button>

                <button
                  onClick={() => handleUpdateRole("UsuarioVIP")}
                  disabled={updateRoleMutation.isPending}
                  className="group bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-purple-500 rounded-xl p-6 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-bold text-white mb-1">VIP</div>
                  <div className="text-xs text-indigo-300">Acesso + Agenda</div>
                </button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <p className="text-sm text-yellow-200">
                <strong className="text-yellow-400">Usuário Padrão:</strong> Acesso completo ao CRM.<br/>
                <strong className="text-yellow-400">Usuário VIP:</strong> Acesso completo + Integração com Google Agenda.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowEditRoleDialog(false)}
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}