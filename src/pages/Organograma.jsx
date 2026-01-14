import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Building2, User, Shield, MoveVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const HIERARCHY_COLORS = {
  "Líder de Agência": "from-purple-600 to-purple-800",
  "Líder de Unidade": "from-blue-600 to-blue-800",
  "Corretor": "from-green-600 to-green-800",
  "Sem Hierarquia": "from-gray-500 to-gray-700"
};

const HIERARCHY_ICONS = {
  "Líder de Agência": Building2,
  "Líder de Unidade": Shield,
  "Corretor": User,
  "Sem Hierarquia": Users
};

export default function Organograma() {
  const [editingUser, setEditingUser] = useState(null);
  const [selectedHierarchy, setSelectedHierarchy] = useState("");
  const [selectedLeader, setSelectedLeader] = useState("");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    }
  });

  // Organizar usuários por hierarquia (usando visibleUsers)
  const organizedUsers = React.useMemo(() => {
    // Filtrar admins da hierarquia
    const nonAdminUsers = visibleUsers.filter(u => u.role !== "admin");
    
    const lidersAgencia = nonAdminUsers.filter(u => u.tipo_hierarquia === "Líder de Agência");
    const result = [];

    lidersAgencia.forEach(liderAgencia => {
      const lidersUnidade = nonAdminUsers.filter(u => u.lider_id === liderAgencia.id);
      const structure = {
        lider: liderAgencia,
        unidades: lidersUnidade.map(liderUnidade => ({
          lider: liderUnidade,
          corretores: nonAdminUsers.filter(u => u.lider_id === liderUnidade.id)
        }))
      };
      result.push(structure);
    });

    // Usuários sem hierarquia ou órfãos
    const orphans = nonAdminUsers.filter(u => 
      u.tipo_hierarquia === "Sem Hierarquia" || 
      (u.tipo_hierarquia !== "Líder de Agência" && !u.lider_id)
    );

    return { structured: result, orphans };
  }, [visibleUsers]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Extrair informações do drop
    const destParts = destination.droppableId.split("-");
    const destType = destParts[0]; // "lider", "corretor"
    const destSubType = destParts[1]; // "agencia", "unidade", "area"
    const destId = destParts[2] || destParts[3];

    const user = users.find(u => u.id === draggableId);
    if (!user) return;

    let updateData = {};

    // Líder de Unidade movido para área de outro Líder de Agência
    if (destSubType === "unidade" && destParts[2] === "area" && user.tipo_hierarquia === "Líder de Unidade") {
      const liderAgenciaId = destParts[3];
      const liderAgencia = users.find(u => u.id === liderAgenciaId);
      updateData = {
        lider_id: liderAgenciaId,
        lider_email: liderAgencia?.email
      };
    } 
    // Corretor movido para área de outro Líder de Unidade
    else if (destSubType === "area" && user.tipo_hierarquia === "Corretor") {
      const liderUnidadeId = destParts[2];
      const liderUnidade = users.find(u => u.id === liderUnidadeId);
      updateData = {
        lider_id: liderUnidadeId,
        lider_email: liderUnidade?.email
      };
    }

    if (Object.keys(updateData).length > 0) {
      updateUserMutation.mutate({ id: user.id, data: updateData });
    }
  };

  const handleEditHierarchy = (userData) => {
    setEditingUser(userData);
    setSelectedHierarchy(userData.tipo_hierarquia || "Sem Hierarquia");
    setSelectedLeader(userData.lider_id || "");
  };

  const handleSaveHierarchy = () => {
    const leader = users.find(u => u.id === selectedLeader);
    updateUserMutation.mutate({
      id: editingUser.id,
      data: {
        tipo_hierarquia: selectedHierarchy,
        lider_id: selectedLeader || null,
        lider_email: leader?.email || null
      }
    });
  };

  const availableLeaders = React.useMemo(() => {
    if (selectedHierarchy === "Líder de Unidade") {
      return users.filter(u => u.tipo_hierarquia === "Líder de Agência");
    } else if (selectedHierarchy === "Corretor") {
      return users.filter(u => u.tipo_hierarquia === "Líder de Unidade");
    }
    return [];
  }, [selectedHierarchy, users]);

  // Verificar se tem acesso (admin ou líder de agência)
  const hasEditAccess = currentUser?.role === "admin" || currentUser?.tipo_hierarquia === "Líder de Agência";
  
  // Filtrar usuários que o usuário comum pode ver
  const visibleUsers = React.useMemo(() => {
    if (currentUser?.role === "admin" || currentUser?.tipo_hierarquia === "Líder de Agência") {
      // Admin e Líder de Agência veem todos
      return users;
    }
    
    // Usuário comum vê apenas sua hierarquia
    const result = users.filter(u => {
      if (u.id === currentUser?.id) return true; // Ele mesmo
      if (u.lider_id === currentUser?.id) return true; // Seus subordinados diretos
      if (u.lider_email === currentUser?.email) return true; // Seus subordinados por email
      if (currentUser?.lider_id && u.id === currentUser.lider_id) return true; // Seu líder
      return false;
    });
    
    return result.length > 0 ? result : [currentUser]; // Se não está vinculado, mostra só ele
  }, [users, currentUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
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
          </div>
        </div>

        {/* Legenda */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            {Object.entries(HIERARCHY_COLORS).map(([type, gradient]) => {
              const Icon = HIERARCHY_ICONS[type];
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">{type}</span>
                </div>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="text-white text-center py-12">Carregando organograma...</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-8">
              {/* Estruturas organizadas */}
              {organizedUsers.structured.map((agencia, agenciaIdx) => (
                <div key={agencia.lider.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                  {/* Líder de Agência */}
                  <Droppable droppableId={`lider-agencia-${agencia.lider.id}`} type="lider-unidade">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`mb-6 ${snapshot.isDraggingOver ? 'bg-purple-500/20 rounded-xl' : ''}`}
                      >
                        <Card
                          className={`bg-gradient-to-br ${HIERARCHY_COLORS["Líder de Agência"]} p-4 ${hasEditAccess ? 'cursor-pointer hover:scale-105' : ''} transition-transform`}
                          onClick={() => hasEditAccess && handleEditHierarchy(agencia.lider)}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-white" />
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-lg">{agencia.lider.full_name}</h3>
                              <p className="text-white/80 text-sm">{agencia.lider.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
                                  Líder de Agência
                                </span>
                              </div>
                            </div>
                            <MoveVertical className="w-5 h-5 text-white/50" />
                          </div>
                        </Card>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Líderes de Unidade */}
                  <div className="pl-12 space-y-4">
                    <Droppable droppableId={`lider-unidade-area-${agencia.lider.id}`} type="lider-unidade">
                      {(providedDrop) => (
                        <div ref={providedDrop.innerRef} {...providedDrop.droppableProps}>
                          {agencia.unidades.map((unidade, unidadeIdx) => (
                            <div key={unidade.lider.id} className="mb-4">
                              <Draggable draggableId={unidade.lider.id} index={unidadeIdx}>
                                {(provided, snapshot) => (
                                  <div>
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      <Card
                                        className={`bg-gradient-to-br ${HIERARCHY_COLORS["Líder de Unidade"]} p-4 ${hasEditAccess ? 'cursor-pointer hover:scale-105' : ''} transition-transform mb-3 ${
                                          snapshot.isDragging ? 'shadow-2xl opacity-80' : ''
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          hasEditAccess && handleEditHierarchy(unidade.lider);
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Shield className="w-6 h-6 text-white" />
                                          <div className="flex-1">
                                            <h4 className="font-bold text-white">{unidade.lider.full_name}</h4>
                                            <p className="text-white/80 text-sm">{unidade.lider.email}</p>
                                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
                                              Líder de Unidade
                                            </span>
                                          </div>
                                          <MoveVertical className="w-4 h-4 text-white/50" />
                                        </div>
                                      </Card>
                                    </div>

                                    {/* Corretores */}
                                    <div className="pl-12 space-y-2">
                                      <Droppable droppableId={`corretor-area-${unidade.lider.id}`} type="corretor">
                                        {(providedCorr) => (
                                          <div ref={providedCorr.innerRef} {...providedCorr.droppableProps}>
                                            {unidade.corretores.map((corretor, corretorIdx) => (
                                              <Draggable key={corretor.id} draggableId={corretor.id} index={corretorIdx}>
                                                {(providedCor, snapshotCor) => (
                                                  <div
                                                    ref={providedCor.innerRef}
                                                    {...providedCor.draggableProps}
                                                    {...providedCor.dragHandleProps}
                                                  >
                                                    <Card
                                                      className={`bg-gradient-to-br ${HIERARCHY_COLORS["Corretor"]} p-3 ${hasEditAccess ? 'cursor-pointer hover:scale-105' : ''} transition-transform ${
                                                        snapshotCor.isDragging ? 'shadow-2xl opacity-80' : ''
                                                      }`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        hasEditAccess && handleEditHierarchy(corretor);
                                                      }}
                                                    >
                                                      <div className="flex items-center gap-3">
                                                        <User className="w-5 h-5 text-white" />
                                                        <div className="flex-1">
                                                          <p className="font-semibold text-white text-sm">{corretor.full_name}</p>
                                                          <p className="text-white/80 text-xs">{corretor.email}</p>
                                                        </div>
                                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
                                                          Corretor
                                                        </span>
                                                        <MoveVertical className="w-4 h-4 text-white/50" />
                                                      </div>
                                                    </Card>
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))}
                                            {providedCorr.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            </div>
                          ))}
                          {providedDrop.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}

              {/* Usuários sem hierarquia */}
              {organizedUsers.orphans.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Usuários Sem Hierarquia Definida
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {organizedUsers.orphans.map(user => (
                      <Card
                        key={user.id}
                        className={`bg-gradient-to-br ${HIERARCHY_COLORS["Sem Hierarquia"]} p-3 ${hasEditAccess ? 'cursor-pointer hover:scale-105' : ''} transition-transform`}
                        onClick={() => hasEditAccess && handleEditHierarchy(user)}
                      >
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-white" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{user.full_name}</p>
                            <p className="text-white/80 text-xs truncate">{user.email}</p>
                            {!user.tipo_hierarquia && (
                              <p className="text-white/60 text-xs mt-1">Hierarquia ainda não definida</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DragDropContext>
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

                {(selectedHierarchy === "Líder de Unidade" || selectedHierarchy === "Corretor") && (
                  <div>
                    <Label className="text-white">
                      {selectedHierarchy === "Líder de Unidade" ? "Líder de Agência" : "Líder de Unidade"}
                    </Label>
                    <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Selecione o líder" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLeaders.map(leader => (
                          <SelectItem key={leader.id} value={leader.id}>
                            {leader.full_name} ({leader.email})
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
      </div>
    </div>
  );
}