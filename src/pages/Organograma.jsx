import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, UserPlus, Plus, Edit, Trash2, Network } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function Organograma() {
  const queryClient = useQueryClient();
  const [showAgenciaDialog, setShowAgenciaDialog] = useState(false);
  const [showUnidadeDialog, setShowUnidadeDialog] = useState(false);
  const [showUsuarioDialog, setShowUsuarioDialog] = useState(false);
  const [editingAgencia, setEditingAgencia] = useState(null);
  const [editingUnidade, setEditingUnidade] = useState(null);
  const [selectedAgenciaForUnidade, setSelectedAgenciaForUnidade] = useState("");

  const [agenciaForm, setAgenciaForm] = useState({ nome: "", descricao: "" });
  const [unidadeForm, setUnidadeForm] = useState({ nome: "", descricao: "", agencia_id: "" });
  const [usuarioForm, setUsuarioForm] = useState({
    email: "",
    tipo: "",
    agencia_id: "",
    unidade_id: ""
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: agencias = [] } = useQuery({
    queryKey: ["agencias"],
    queryFn: () => base44.entities.Agencia.list()
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades"],
    queryFn: () => base44.entities.Unidade.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list()
  });

  // Filtrar agências visíveis
  const minhasAgencias = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "admin") return agencias;
    
    return agencias.filter(a => 
      a.lider_agencia_id === currentUser.id || 
      a.lider_agencia_email === currentUser.email ||
      a.id === currentUser.agencia_id
    );
  }, [agencias, currentUser]);

  // Filtrar unidades visíveis
  const minhasUnidades = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "admin") return unidades;
    
    const agenciaIds = minhasAgencias.map(a => a.id);
    return unidades.filter(u => 
      agenciaIds.includes(u.agencia_id) ||
      u.lider_unidade_id === currentUser.id ||
      u.lider_unidade_email === currentUser.email
    );
  }, [unidades, minhasAgencias, currentUser]);

  // Filtrar usuários visíveis
  const meusUsuarios = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "admin") return users;
    
    const agenciaIds = minhasAgencias.map(a => a.id);
    const unidadeIds = minhasUnidades.map(u => u.id);
    
    return users.filter(u => 
      agenciaIds.includes(u.agencia_id) ||
      unidadeIds.includes(u.unidade_id) ||
      u.lider_id === currentUser.id ||
      u.lider_email === currentUser.email ||
      u.id === currentUser.id
    );
  }, [users, minhasAgencias, minhasUnidades, currentUser]);

  // Mutations
  const createAgenciaMutation = useMutation({
    mutationFn: async (data) => {
      const agencia = await base44.entities.Agencia.create({
        ...data,
        lider_agencia_id: currentUser.id,
        lider_agencia_email: currentUser.email,
        lider_agencia_nome: currentUser.full_name
      });
      
      // Atualizar o próprio usuário
      await base44.auth.updateMe({
        tipo_hierarquia: "Líder de Agência",
        agencia_id: agencia.id,
        agencia_nome: agencia.nome,
        lider_id: null,
        lider_email: null,
        unidade_id: null
      });
      
      return agencia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencias"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowAgenciaDialog(false);
      setAgenciaForm({ nome: "", descricao: "" });
    }
  });

  const updateAgenciaMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agencia.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencias"] });
      setShowAgenciaDialog(false);
      setEditingAgencia(null);
      setAgenciaForm({ nome: "", descricao: "" });
    }
  });

  const deleteAgenciaMutation = useMutation({
    mutationFn: (id) => base44.entities.Agencia.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencias"] });
    }
  });

  const createUnidadeMutation = useMutation({
    mutationFn: async (data) => {
      const agencia = agencias.find(a => a.id === data.agencia_id);
      return base44.entities.Unidade.create({
        ...data,
        agencia_nome: agencia?.nome
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      setShowUnidadeDialog(false);
      setUnidadeForm({ nome: "", descricao: "", agencia_id: "" });
    }
  });

  const updateUnidadeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Unidade.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      setShowUnidadeDialog(false);
      setEditingUnidade(null);
      setUnidadeForm({ nome: "", descricao: "", agencia_id: "" });
    }
  });

  const deleteUnidadeMutation = useMutation({
    mutationFn: (id) => base44.entities.Unidade.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
    }
  });

  const inviteUsuarioMutation = useMutation({
    mutationFn: async (data) => {
      const role = data.tipo === "Líder de Agência" || data.tipo === "Líder de Unidade" ? "admin" : "user";
      await base44.users.inviteUser(data.email, role);
      
      // Aguardar um pouco para o usuário ser criado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const allUsers = await base44.entities.User.list();
      const novoUsuario = allUsers.find(u => u.email === data.email);
      
      if (novoUsuario) {
        const agencia = agencias.find(a => a.id === data.agencia_id);
        const unidade = unidades.find(u => u.id === data.unidade_id);
        
        const updateData = {
          tipo_hierarquia: data.tipo,
          agencia_id: data.agencia_id || null,
          agencia_nome: agencia?.nome || null,
          unidade_id: data.unidade_id || null,
          unidade_nome: unidade?.nome || null
        };

        if (data.tipo === "Líder de Unidade" && unidade) {
          updateData.lider_id = agencia?.lider_agencia_id || null;
          updateData.lider_email = agencia?.lider_agencia_email || null;
          updateData.lider_nome = agencia?.lider_agencia_nome || null;
          
          // Atualizar unidade com o líder
          await base44.entities.Unidade.update(unidade.id, {
            lider_unidade_id: novoUsuario.id,
            lider_unidade_email: novoUsuario.email,
            lider_unidade_nome: novoUsuario.full_name
          });
        } else if (data.tipo === "Corretor" && data.unidade_id) {
          updateData.lider_id = unidade?.lider_unidade_id || null;
          updateData.lider_email = unidade?.lider_unidade_email || null;
          updateData.lider_nome = unidade?.lider_unidade_nome || null;
        } else if (data.tipo === "Corretor" && data.agencia_id) {
          updateData.lider_id = agencia?.lider_agencia_id || null;
          updateData.lider_email = agencia?.lider_agencia_email || null;
          updateData.lider_nome = agencia?.lider_agencia_nome || null;
        }

        await base44.entities.User.update(novoUsuario.id, updateData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      setShowUsuarioDialog(false);
      setUsuarioForm({ email: "", tipo: "", agencia_id: "", unidade_id: "" });
    }
  });

  const handleCreateAgencia = () => {
    setEditingAgencia(null);
    setAgenciaForm({ nome: "", descricao: "" });
    setShowAgenciaDialog(true);
  };

  const handleEditAgencia = (agencia) => {
    setEditingAgencia(agencia);
    setAgenciaForm({ nome: agencia.nome, descricao: agencia.descricao || "" });
    setShowAgenciaDialog(true);
  };

  const handleCreateUnidade = (agenciaId = "") => {
    setEditingUnidade(null);
    setUnidadeForm({ nome: "", descricao: "", agencia_id: agenciaId });
    setShowUnidadeDialog(true);
  };

  const handleEditUnidade = (unidade) => {
    setEditingUnidade(unidade);
    setUnidadeForm({ 
      nome: unidade.nome, 
      descricao: unidade.descricao || "", 
      agencia_id: unidade.agencia_id 
    });
    setShowUnidadeDialog(true);
  };

  const podeEditarHierarquia = currentUser?.role === "admin" || 
    currentUser?.tipo_hierarquia === "Líder de Agência" || 
    currentUser?.tipo_hierarquia === "Líder de Unidade";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Organograma</h1>
              <p className="text-slate-600">Gerencie a estrutura organizacional</p>
            </div>
          </div>
          
          {podeEditarHierarquia && (
            <div className="flex gap-3">
              {(currentUser?.role === "admin" || !currentUser?.agencia_id) && (
                <Button onClick={handleCreateAgencia} className="bg-indigo-600 hover:bg-indigo-700">
                  <Building className="w-4 h-4 mr-2" />
                  Nova Agência
                </Button>
              )}
              {currentUser?.tipo_hierarquia === "Líder de Agência" && (
                <Button onClick={() => handleCreateUnidade(currentUser.agencia_id)} className="bg-purple-600 hover:bg-purple-700">
                  <Users className="w-4 h-4 mr-2" />
                  Nova Unidade
                </Button>
              )}
              <Button onClick={() => setShowUsuarioDialog(true)} className="bg-green-600 hover:bg-green-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Usuário
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {minhasAgencias.map(agencia => {
            const unidadesDaAgencia = minhasUnidades.filter(u => u.agencia_id === agencia.id);
            const usuariosDaAgencia = meusUsuarios.filter(u => u.agencia_id === agencia.id);
            const liderAgencia = users.find(u => u.id === agencia.lider_agencia_id);

            return (
              <Card key={agencia.id} className="border-2 border-indigo-200">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="w-8 h-8 text-indigo-600" />
                      <div>
                        <CardTitle className="text-2xl text-indigo-900">{agencia.nome}</CardTitle>
                        {agencia.descricao && (
                          <p className="text-sm text-slate-600 mt-1">{agencia.descricao}</p>
                        )}
                        {liderAgencia && (
                          <p className="text-sm text-indigo-600 mt-1 font-semibold">
                            Líder: {liderAgencia.full_name || liderAgencia.email}
                          </p>
                        )}
                      </div>
                    </div>
                    {podeEditarHierarquia && agencia.lider_agencia_id === currentUser?.id && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleCreateUnidade(agencia.id)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Unidade
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditAgencia(agencia)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Deletar agência ${agencia.nome}?`)) {
                              deleteAgenciaMutation.mutate(agencia.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {unidadesDaAgencia.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {unidadesDaAgencia.map(unidade => {
                        const usuariosDaUnidade = usuariosDaAgencia.filter(u => u.unidade_id === unidade.id);
                        const liderUnidade = users.find(u => u.id === unidade.lider_unidade_id);

                        return (
                          <Card key={unidade.id} className="border border-purple-200 bg-purple-50/50">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2">
                                  <Users className="w-5 h-5 text-purple-600 mt-1" />
                                  <div>
                                    <CardTitle className="text-lg text-purple-900">{unidade.nome}</CardTitle>
                                    {unidade.descricao && (
                                      <p className="text-xs text-slate-600 mt-1">{unidade.descricao}</p>
                                    )}
                                    {liderUnidade && (
                                      <p className="text-xs text-purple-700 mt-1 font-semibold">
                                        Líder: {liderUnidade.full_name || liderUnidade.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {podeEditarHierarquia && (
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => handleEditUnidade(unidade)}>
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-red-600"
                                      onClick={() => {
                                        if (confirm(`Deletar unidade ${unidade.nome}?`)) {
                                          deleteUnidadeMutation.mutate(unidade.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {usuariosDaUnidade.length > 0 ? (
                                  usuariosDaUnidade.map(usuario => (
                                    <div key={usuario.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded-lg">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                                        {usuario.full_name?.charAt(0) || usuario.email?.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-800">{usuario.full_name || usuario.email}</p>
                                        <p className="text-xs text-slate-500">{usuario.tipo_hierarquia || "Corretor"}</p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-500 italic">Nenhum corretor</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma unidade criada</p>
                      {podeEditarHierarquia && (
                        <Button 
                          size="sm" 
                          className="mt-4" 
                          onClick={() => handleCreateUnidade(agencia.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Primeira Unidade
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Corretores diretos da agência (sem unidade) */}
                  {usuariosDaAgencia.filter(u => !u.unidade_id && u.tipo_hierarquia === "Corretor").length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Corretores Diretos</h4>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {usuariosDaAgencia.filter(u => !u.unidade_id && u.tipo_hierarquia === "Corretor").map(usuario => (
                          <div key={usuario.id} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
                              {usuario.full_name?.charAt(0) || usuario.email?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{usuario.full_name || usuario.email}</p>
                              <p className="text-xs text-slate-500">Corretor</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {minhasAgencias.length === 0 && (
            <Card className="border-2 border-dashed border-slate-300">
              <CardContent className="text-center py-12">
                <Building className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhuma agência encontrada</h3>
                <p className="text-slate-500 mb-4">Crie sua primeira agência para começar</p>
                {podeEditarHierarquia && (
                  <Button onClick={handleCreateAgencia} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Agência
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog Agência */}
      <Dialog open={showAgenciaDialog} onOpenChange={setShowAgenciaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAgencia ? "Editar Agência" : "Nova Agência"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingAgencia) {
              updateAgenciaMutation.mutate({ id: editingAgencia.id, data: agenciaForm });
            } else {
              createAgenciaMutation.mutate(agenciaForm);
            }
          }} className="space-y-4">
            <div>
              <Label>Nome da Agência *</Label>
              <Input
                value={agenciaForm.nome}
                onChange={(e) => setAgenciaForm({ ...agenciaForm, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={agenciaForm.descricao}
                onChange={(e) => setAgenciaForm({ ...agenciaForm, descricao: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAgenciaDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingAgencia ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Unidade */}
      <Dialog open={showUnidadeDialog} onOpenChange={setShowUnidadeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnidade ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingUnidade) {
              updateUnidadeMutation.mutate({ id: editingUnidade.id, data: unidadeForm });
            } else {
              createUnidadeMutation.mutate(unidadeForm);
            }
          }} className="space-y-4">
            {currentUser?.role === "admin" && (
              <div>
                <Label>Agência *</Label>
                <Select
                  value={unidadeForm.agencia_id}
                  onValueChange={(value) => setUnidadeForm({ ...unidadeForm, agencia_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a agência" />
                  </SelectTrigger>
                  <SelectContent>
                    {minhasAgencias.map(agencia => (
                      <SelectItem key={agencia.id} value={agencia.id}>
                        {agencia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Nome da Unidade *</Label>
              <Input
                value={unidadeForm.nome}
                onChange={(e) => setUnidadeForm({ ...unidadeForm, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={unidadeForm.descricao}
                onChange={(e) => setUnidadeForm({ ...unidadeForm, descricao: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowUnidadeDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUnidade ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Convidar Usuário */}
      <Dialog open={showUsuarioDialog} onOpenChange={setShowUsuarioDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            inviteUsuarioMutation.mutate(usuarioForm);
          }} className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={usuarioForm.email}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, email: e.target.value })}
                placeholder="usuario@exemplo.com"
                required
              />
            </div>
            <div>
              <Label>Função *</Label>
              <Select
                value={usuarioForm.tipo}
                onValueChange={(value) => setUsuarioForm({ ...usuarioForm, tipo: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  {currentUser?.role === "admin" && (
                    <SelectItem value="Líder de Agência">Líder de Agência</SelectItem>
                  )}
                  {(currentUser?.role === "admin" || currentUser?.tipo_hierarquia === "Líder de Agência") && (
                    <SelectItem value="Líder de Unidade">Líder de Unidade</SelectItem>
                  )}
                  <SelectItem value="Corretor">Corretor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {usuarioForm.tipo && usuarioForm.tipo !== "Líder de Agência" && (
              <div>
                <Label>Agência *</Label>
                <Select
                  value={usuarioForm.agencia_id}
                  onValueChange={(value) => {
                    setUsuarioForm({ ...usuarioForm, agencia_id: value, unidade_id: "" });
                    setSelectedAgenciaForUnidade(value);
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a agência" />
                  </SelectTrigger>
                  <SelectContent>
                    {minhasAgencias.map(agencia => (
                      <SelectItem key={agencia.id} value={agencia.id}>
                        {agencia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {usuarioForm.tipo === "Corretor" && usuarioForm.agencia_id && (
              <div>
                <Label>Unidade (Opcional)</Label>
                <Select
                  value={usuarioForm.unidade_id}
                  onValueChange={(value) => setUsuarioForm({ ...usuarioForm, unidade_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade ou deixe em branco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Sem unidade (vínculo direto à agência)</SelectItem>
                    {minhasUnidades
                      .filter(u => u.agencia_id === usuarioForm.agencia_id)
                      .map(unidade => (
                        <SelectItem key={unidade.id} value={unidade.id}>
                          {unidade.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {usuarioForm.tipo === "Líder de Unidade" && usuarioForm.agencia_id && (
              <div>
                <Label>Unidade *</Label>
                <Select
                  value={usuarioForm.unidade_id}
                  onValueChange={(value) => setUsuarioForm({ ...usuarioForm, unidade_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {minhasUnidades
                      .filter(u => u.agencia_id === usuarioForm.agencia_id)
                      .map(unidade => (
                        <SelectItem key={unidade.id} value={unidade.id}>
                          {unidade.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowUsuarioDialog(false);
                  setUsuarioForm({ email: "", tipo: "", agencia_id: "", unidade_id: "" });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={inviteUsuarioMutation.isPending}>
                {inviteUsuarioMutation.isPending ? "Enviando..." : "Convidar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}