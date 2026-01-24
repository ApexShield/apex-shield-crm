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
import { UserPlus, Shield, User, Loader2, Edit2, Award, Calendar, Users, Crown, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GestaoUsuarios() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [showEditHierarchyDialog, setShowEditHierarchyDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

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

  const updateSystemRoleMutation = useMutation({
    mutationFn: async ({ userId, systemRole }) => {
      await base44.entities.User.update(userId, { role: systemRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setShowEditHierarchyDialog(false);
      setSelectedUser(null);
      alert("Função do sistema atualizada com sucesso!");
    },
    onError: (error) => {
      alert(`Erro ao atualizar: ${error.message}`);
    }
  });

  const updateHierarchyMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      const user = usuarios.find(u => u.id === userId);
      const oldHierarchy = user?.tipo_hierarquia;
      const newHierarchy = data.tipo_hierarquia;
      
      // Atualizar apenas o usuário selecionado
      await base44.entities.User.update(userId, data);
      
      // Se mudou de Líder de Unidade para Líder de Agência, limpar o lider_id
      if (oldHierarchy === "Líder de Unidade" && newHierarchy === "Líder de Agência") {
        await base44.entities.User.update(userId, { 
          ...data,
          lider_id: null,
          lider_email: null
        });
      }
      
      // Se mudou de Líder de Agência para outra coisa, atualizar subordinados
      if (oldHierarchy === "Líder de Agência" && newHierarchy !== "Líder de Agência") {
        // Encontrar Líderes de Unidade que reportavam a este usuário
        const subordinados = usuarios.filter(u => u.lider_id === userId);
        for (const sub of subordinados) {
          await base44.entities.User.update(sub.id, {
            lider_id: null,
            lider_email: null
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setShowEditHierarchyDialog(false);
      setSelectedUser(null);
      alert("Hierarquia atualizada com sucesso!");
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

  const handleEditHierarchy = (usuario) => {
    setSelectedUser(usuario);
    setShowEditHierarchyDialog(true);
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

  // Filtros
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchSearch = !searchTerm || 
      usuario.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRole = filterRole === "all" ||
      (filterRole === "admin" && usuario.role === "admin") ||
      (filterRole === "vip" && usuario.role_type === "UsuarioVIP") ||
      (filterRole === "user" && usuario.role !== "admin" && usuario.role_type !== "UsuarioVIP");
    
    return matchSearch && matchRole;
  });

  const userCount = usuarios.filter(u => (u.role_type === "Usuario" || !u.role_type) && u.role !== "admin").length;
  const vipCount = usuarios.filter(u => u.role_type === "UsuarioVIP").length;
  const adminCount = usuarios.filter(u => u?.role === "admin").length;

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

        {/* Filtros */}
        <div className="mb-6 grid sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="user">Usuários Padrão</SelectItem>
            </SelectContent>
          </Select>
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
                  {filteredUsuarios.map((usuario) => (
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
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditRole(usuario)}
                            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Tipo
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditHierarchy(usuario)}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Funções
                          </Button>
                        </div>
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

      {/* Dialog Editar Funções e Hierarquia */}
      <Dialog open={showEditHierarchyDialog} onOpenChange={setShowEditHierarchyDialog}>
        <DialogContent className="bg-slate-900 border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Editar Funções do Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <p className="font-semibold text-white text-lg">{selectedUser?.full_name || selectedUser?.email}</p>
              <p className="text-indigo-300 mt-1 text-sm">{selectedUser?.email}</p>
            </div>

            {/* Função no Sistema */}
            <div>
              <Label className="text-white font-bold mb-3 block">Função no Sistema</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateSystemRoleMutation.mutate({ userId: selectedUser?.id, systemRole: "user" })}
                  disabled={updateSystemRoleMutation.isPending}
                  className={`group border-2 rounded-xl p-6 transition-all ${
                    selectedUser?.role === "user" 
                      ? "bg-blue-500/20 border-blue-500" 
                      : "bg-white/5 hover:bg-white/10 border-white/20 hover:border-blue-500"
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-bold text-white mb-1">Usuário</div>
                  <div className="text-xs text-indigo-300">Acesso padrão ao sistema</div>
                </button>

                <button
                  onClick={() => updateSystemRoleMutation.mutate({ userId: selectedUser?.id, systemRole: "admin" })}
                  disabled={updateSystemRoleMutation.isPending}
                  className={`group border-2 rounded-xl p-6 transition-all ${
                    selectedUser?.role === "admin" 
                      ? "bg-orange-500/20 border-orange-500" 
                      : "bg-white/5 hover:bg-white/10 border-white/20 hover:border-orange-500"
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-bold text-white mb-1">Admin</div>
                  <div className="text-xs text-indigo-300">Acesso total ao sistema</div>
                </button>
              </div>
            </div>

            {/* Hierarquia Organizacional */}
            <div>
              <Label className="text-white font-bold mb-3 block">Hierarquia Organizacional</Label>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => {
                    updateHierarchyMutation.mutate({
                      userId: selectedUser?.id,
                      data: { tipo_hierarquia: "Líder de Agência" }
                    });
                  }}
                  disabled={updateHierarchyMutation.isPending}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    selectedUser?.tipo_hierarquia === "Líder de Agência"
                      ? "bg-blue-500/20 border-blue-500"
                      : "bg-white/5 hover:bg-white/10 border-white/20 hover:border-blue-500"
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-bold text-white text-sm mb-1">Líder de Agência</div>
                  <div className="text-xs text-indigo-300">Acesso a toda hierarquia</div>
                </button>

                <button
                  onClick={() => {
                    updateHierarchyMutation.mutate({
                      userId: selectedUser?.id,
                      data: { tipo_hierarquia: "Líder de Unidade" }
                    });
                  }}
                  disabled={updateHierarchyMutation.isPending}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    selectedUser?.tipo_hierarquia === "Líder de Unidade"
                      ? "bg-purple-500/20 border-purple-500"
                      : "bg-white/5 hover:bg-white/10 border-white/20 hover:border-purple-500"
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-bold text-white text-sm mb-1">Líder de Unidade</div>
                  <div className="text-xs text-indigo-300">Acesso aos corretores</div>
                </button>

                <button
                  onClick={() => {
                    updateHierarchyMutation.mutate({
                      userId: selectedUser?.id,
                      data: { tipo_hierarquia: "Corretor" }
                    });
                  }}
                  disabled={updateHierarchyMutation.isPending}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    selectedUser?.tipo_hierarquia === "Corretor"
                      ? "bg-cyan-500/20 border-cyan-500"
                      : "bg-white/5 hover:bg-white/10 border-white/20 hover:border-cyan-500"
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-bold text-white text-sm mb-1">Corretor</div>
                  <div className="text-xs text-indigo-300">Acesso próprio</div>
                </button>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-lg">
                <p className="text-sm text-indigo-200 leading-relaxed">
                  <strong className="text-indigo-300">Líder de Agência:</strong> Vê leads e agenda de todos os corretores da hierarquia (diretos e indiretos).<br/>
                  <strong className="text-indigo-300">Líder de Unidade:</strong> Vê leads e agenda dos corretores ligados diretamente.<br/>
                  <strong className="text-indigo-300">Corretor:</strong> Vê apenas seus próprios leads e agenda.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowEditHierarchyDialog(false)}
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Fechar
            </Button>
          </div>
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