import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Users, Building2, User, Shield, Trash2, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Organograma() {
  const [editingUser, setEditingUser] = useState(null);
  const [selectedHierarchy, setSelectedHierarchy] = useState("");
  const [selectedLeader, setSelectedLeader] = useState("");
  const [nomeAgencia, setNomeAgencia] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser
  });

  const isLoading = isLoadingUser || isLoadingUsers;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      setSelectedHierarchy("");
      setSelectedLeader("");
      setNomeAgencia("");
    }
  });

  const resetAllHierarchiesMutation = useMutation({
    mutationFn: async () => {
      const nonAdminUsers = users.filter(u => u.role !== "admin");
      for (const user of nonAdminUsers) {
        await base44.entities.User.update(user.id, {
          tipo_hierarquia: "Sem Hierarquia",
          lider_id: null,
          lider_email: null,
          nome_agencia: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowResetDialog(false);
    }
  });

  const hasEditAccess = currentUser.role === "admin" || currentUser.tipo_hierarquia === "Líder de Agência";
  const hasViewAccess = hasEditAccess || currentUser.tipo_hierarquia === "Líder de Unidade";
  
  const visibleUsers = React.useMemo(() => {
    if (currentUser.role === "admin" || currentUser.tipo_hierarquia === "Líder de Agência") {
      return users;
    }
    if (currentUser.tipo_hierarquia === "Líder de Unidade") {
      return users;
    }
    const result = users.filter(u => {
      if (u.id === currentUser.id) return true;
      if (u.lider_id === currentUser.id) return true;
      if (u.lider_email === currentUser.email) return true;
      if (currentUser.lider_id && u.id === currentUser.lider_id) return true;
      return false;
    });
    return result.length > 0 ? result : [currentUser];
  }, [users, currentUser]);

  const organizedAgencies = React.useMemo(() => {
    const nonAdminUsers = visibleUsers.filter(u => u.role !== "admin");
    const lidersAgencia = nonAdminUsers.filter(u => u.tipo_hierarquia === "Líder de Agência");
    
    return lidersAgencia.map(liderAgencia => {
      const lidersUnidade = nonAdminUsers.filter(u => u.lider_id === liderAgencia.id && u.tipo_hierarquia === "Líder de Unidade");
      const corretoresDiretos = nonAdminUsers.filter(u => u.lider_id === liderAgencia.id && u.tipo_hierarquia === "Corretor");
      
      const unidades = lidersUnidade.map(liderUnidade => ({
        lider: liderUnidade,
        corretores: nonAdminUsers.filter(u => u.lider_id === liderUnidade.id && u.tipo_hierarquia === "Corretor")
      }));

      return {
        lider: liderAgencia,
        unidades,
        corretoresDiretos
      };
    });
  }, [visibleUsers]);

  const usersWithoutHierarchy = React.useMemo(() => {
    // Mostrar todos os usuários sem hierarquia definida (incluindo admins para o admin ver)
    return visibleUsers.filter(u => 
      !u.tipo_hierarquia || u.tipo_hierarquia === "Sem Hierarquia"
    );
  }, [visibleUsers]);

  const handleEditHierarchy = (userData) => {
    setEditingUser(userData);
    setSelectedHierarchy(userData.tipo_hierarquia || "Sem Hierarquia");
    setSelectedLeader(userData.lider_id || "");
    setNomeAgencia(userData.nome_agencia || "");
  };

  const handleSaveHierarchy = () => {
    const leader = users.find(u => u.id === selectedLeader);
    const updateData = {
      tipo_hierarquia: selectedHierarchy,
      lider_id: selectedLeader || null,
      lider_email: leader?.email || null
    };

    if (selectedHierarchy === "Líder de Agência") {
      updateData.nome_agencia = nomeAgencia || null;
    } else {
      updateData.nome_agencia = null;
    }

    updateUserMutation.mutate({ id: editingUser.id, data: updateData });
  };

  const availableLeaders = React.useMemo(() => {
    if (selectedHierarchy === "Líder de Unidade") {
      return users.filter(u => u.tipo_hierarquia === "Líder de Agência");
    } else if (selectedHierarchy === "Corretor") {
      return users.filter(u => 
        u.tipo_hierarquia === "Líder de Unidade" || 
        u.tipo_hierarquia === "Líder de Agência"
      );
    }
    return [];
  }, [selectedHierarchy, users]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">Organograma da Equipe</h1>
                <p className="text-indigo-300">Gerencie a hierarquia e estrutura organizacional</p>
              </div>
            </div>
            {hasEditAccess && (
              <Button 
                onClick={() => setShowResetDialog(true)}
                variant="destructive"
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Resetar Todas Hierarquias
              </Button>
            )}
          </div>
        </div>

        {!hasViewAccess ? (
          <div className="text-center py-12">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md mx-auto">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
              <p className="text-gray-300">
                Você não tem permissão para visualizar o organograma.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-white text-center py-12">Carregando organograma...</div>
        ) : (
          <div className="space-y-8">
            {/* Agências - Estrutura Piramidal */}
            {organizedAgencies.map((agencia) => (
              <div key={agencia.lider.id} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                {/* Topo da Pirâmide - Líder de Agência */}
                <div className="flex flex-col items-center mb-8">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {agencia.lider.nome_agencia || "Agência Sem Nome"}
                    </h2>
                    <p className="text-indigo-300 text-sm">Estrutura Organizacional</p>
                  </div>
                  
                  <Card
                    className={`bg-gradient-to-br from-purple-600 to-purple-800 p-6 w-72 ${hasEditAccess ? 'cursor-pointer hover:scale-105' : ''} transition-transform shadow-2xl`}
                    onClick={() => hasEditAccess && handleEditHierarchy(agencia.lider)}
                  >
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Building2 className="w-10 h-10 text-white" />
                      <div>
                        <h3 className="font-bold text-white text-lg">{agencia.lider.full_name}</h3>
                        <p className="text-white/80 text-sm">{agencia.lider.email}</p>
                        <span className="inline-block text-xs bg-white/20 px-3 py-1 rounded-full text-white mt-2">
                          Líder de Agência
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Nível 2 - Líderes de Unidade */}
                {agencia.unidades.length > 0 && (
                  <div className="flex justify-center gap-6 mb-6 flex-wrap">
                    {agencia.unidades.map((unidade) => (
                      <div key={unidade.lider.id} className="flex flex-col items-center">
                        <Card
                          className={`bg-gradient-to-br from-blue-600 to-blue-800 p-5 w-56 ${hasEditAccess ? 'cursor-pointer hover:scale-105' : ''} transition-transform shadow-xl`}
                          onClick={() => hasEditAccess && handleEditHierarchy(unidade.lider)}
                        >
                          <div className="flex flex-col items-center gap-2 text-center">
                            <Shield className="w-8 h-8 text-white" />
                            <div>
                              <h4 className="font-bold text-white">{unidade.lider.full_name}</h4>
                              <p className="text-white/80 text-xs">{unidade.lider.email}</p>
                              <span className="inline-block text-xs bg-white/20 px-2 py-1 rounded-full text-white mt-1">
                                Líder de Unidade
                              </span>
                            </div>
                          </div>
                        </Card>

                        {/* Corretores desta unidade */}
                        {unidade.corretores.length > 0 && (
                          <div className="flex gap-3 mt-4 flex-wrap justify-center max-w-md">
                            {unidade.corretores.map((corretor) => (
                              <Card
                                key={corretor.id}
                                className={`bg-gradient-to-br from-green-600 to-green-800 p-3 w-40 ${hasEditAccess ? 'cursor-pointer hover:scale-105' : ''} transition-transform shadow-lg`}
                                onClick={() => hasEditAccess && handleEditHierarchy(corretor)}
                              >
                                <div className="flex flex-col items-center gap-1 text-center">
                                  <User className="w-6 h-6 text-white" />
                                  <div>
                                    <p className="font-semibold text-white text-xs">{corretor.full_name}</p>
                                    <p className="text-white/70 text-[10px]">{corretor.email}</p>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Corretores diretos do Líder de Agência */}
                {agencia.corretoresDiretos.length > 0 && (
                  <div className="flex gap-3 justify-center flex-wrap mt-6">
                    {agencia.corretoresDiretos.map((corretor) => (
                      <Card
                        key={corretor.id}
                        className={`bg-gradient-to-br from-green-600 to-green-800 p-3 w-40 ${hasEditAccess ? 'cursor-pointer hover:scale-105' : ''} transition-transform shadow-lg`}
                        onClick={() => hasEditAccess && handleEditHierarchy(corretor)}
                      >
                        <div className="flex flex-col items-center gap-1 text-center">
                          <User className="w-6 h-6 text-white" />
                          <div>
                            <p className="font-semibold text-white text-xs">{corretor.full_name}</p>
                            <p className="text-white/70 text-[10px]">{corretor.email}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Usuários sem hierarquia */}
            {usersWithoutHierarchy.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  Usuários Sem Hierarquia - Clique para Definir
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {usersWithoutHierarchy.map(user => (
                    <Card
                      key={user.id}
                      className={`bg-gradient-to-br from-gray-500 to-gray-700 p-4 ${hasEditAccess ? 'cursor-pointer hover:scale-105' : ''} transition-transform`}
                      onClick={() => hasEditAccess && handleEditHierarchy(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-white" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{user.full_name}</p>
                          <p className="text-white/80 text-xs truncate">{user.email}</p>
                          <p className="text-yellow-300 text-xs mt-1">Clique para definir</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dialog de Edição */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="bg-slate-900 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Hierarquia</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <p className="text-white font-semibold">{editingUser.full_name}</p>
                  <p className="text-gray-400 text-sm">{editingUser.email}</p>
                </div>

                <div>
                  <Label className="text-white">Tipo Hierárquico</Label>
                  <Select value={selectedHierarchy} onValueChange={setSelectedHierarchy}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Líder de Agência">Líder de Agência</SelectItem>
                      <SelectItem value="Líder de Unidade">Líder de Unidade</SelectItem>
                      <SelectItem value="Corretor">Corretor</SelectItem>
                      <SelectItem value="Sem Hierarquia">Sem Hierarquia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedHierarchy === "Líder de Agência" && (
                  <div>
                    <Label className="text-white">Nome da Agência</Label>
                    <Input
                      value={nomeAgencia}
                      onChange={(e) => setNomeAgencia(e.target.value)}
                      placeholder="Ex: Agência São Paulo"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                )}

                {(selectedHierarchy === "Líder de Unidade" || selectedHierarchy === "Corretor") && (
                  <div>
                    <Label className="text-white">
                      {selectedHierarchy === "Líder de Unidade" ? "Líder de Agência" : "Líder (Agência ou Unidade)"}
                    </Label>
                    <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Selecione o líder" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLeaders.map(leader => (
                          <SelectItem key={leader.id} value={leader.id}>
                            {leader.full_name} - {leader.tipo_hierarquia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => setEditingUser(null)}
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveHierarchy}
                    disabled={updateUserMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Reset */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent className="bg-slate-900 border-white/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Resetar Todas as Hierarquias?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Esta ação irá remover todas as hierarquias de todos os usuários (exceto admins).
                Todos os usuários ficarão como "Sem Hierarquia". Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => resetAllHierarchiesMutation.mutate()}
                className="bg-red-600 hover:bg-red-700"
              >
                Resetar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}