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
      if (!agencia) {
        throw new Error("Agência não encontrada");
      }
      return base44.entities.Unidade.create({
        nome: data.nome,
        descricao: data.descricao || "",
        agencia_id: data.agencia_id,
        agencia_nome: agencia.nome,
        ativo: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      setShowUnidadeDialog(false);
      setEditingUnidade(null);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/50">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Organograma</h1>
              <p className="text-slate-400">Gerencie a estrutura organizacional</p>
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

        <div className="space-y-8">
          {minhasAgencias.map(agencia => {
            const unidadesDaAgencia = minhasUnidades.filter(u => u.agencia_id === agencia.id);
            const usuariosDaAgencia = meusUsuarios.filter(u => u.agencia_id === agencia.id);
            const liderAgencia = users.find(u => u.id === agencia.lider_agencia_id);

            return (
              <div key={agencia.id} className="relative">
                <Card className="border-2 border-green-400/30 bg-slate-800/50 backdrop-blur-sm shadow-xl shadow-green-500/10">
                  <CardHeader className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-b border-green-400/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500 rounded-xl blur-lg opacity-50"></div>
                          <Building className="relative w-10 h-10 text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-white shadow-lg">{agencia.nome}</CardTitle>
                          {agencia.descricao && (
                            <p className="text-sm text-slate-400 mt-1">{agencia.descricao}</p>
                          )}
                          {liderAgencia && (
                            <div className="mt-2 inline-flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-500/50">
                                {liderAgencia.full_name?.charAt(0) || liderAgencia.email?.charAt(0)}
                              </div>
                              <p className="text-sm text-blue-300 font-semibold">
                                {liderAgencia.full_name || liderAgencia.email}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {podeEditarHierarquia && agencia.lider_agencia_id === currentUser?.id && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleCreateUnidade(agencia.id)} className="border-green-400/30 text-green-400 hover:bg-green-500/20">
                            <Plus className="w-4 h-4 mr-1" />
                            Unidade
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditAgencia(agencia)} className="border-blue-400/30 text-blue-400 hover:bg-blue-500/20">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-400/30 text-red-400 hover:bg-red-500/20"
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
                  <CardContent className="pt-6 relative">
                    {/* Linha verde conectando líder da agência às unidades */}
                    {unidadesDaAgencia.length > 0 && (
                      <div className="absolute left-1/2 top-0 w-1 h-6 bg-gradient-to-b from-green-400 to-transparent shadow-lg shadow-green-400/50"></div>
                    )}
                    
                    {unidadesDaAgencia.length > 0 ? (
                      <div className="relative">
                        {/* Linha horizontal verde conectando as unidades */}
                        {unidadesDaAgencia.length > 1 && (
                          <div className="absolute left-0 right-0 top-8 h-1 bg-green-400 shadow-lg shadow-green-400/50" style={{ width: '80%', margin: '0 auto' }}></div>
                        )}
                        
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 relative">
                          {unidadesDaAgencia.map(unidade => {
                            const usuariosDaUnidade = usuariosDaAgencia.filter(u => u.unidade_id === unidade.id);
                            const liderUnidade = users.find(u => u.id === unidade.lider_unidade_id);

                            return (
                              <div key={unidade.id} className="relative">
                                {/* Linha vertical conectando à linha horizontal */}
                                <div className="absolute left-1/2 -top-8 w-1 h-8 bg-green-400 shadow-lg shadow-green-400/50"></div>
                                
                                <Card className="border border-purple-400/30 bg-slate-700/30 backdrop-blur-sm relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                                  <CardHeader className="pb-3 relative">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-2">
                                        <div className="relative">
                                          <div className="absolute inset-0 bg-purple-500 rounded-lg blur-md opacity-50"></div>
                                          <Users className="relative w-6 h-6 text-purple-400 mt-1" />
                                        </div>
                                        <div>
                                          <CardTitle className="text-lg text-white">{unidade.nome}</CardTitle>
                                          {unidade.descricao && (
                                            <p className="text-xs text-slate-400 mt-1">{unidade.descricao}</p>
                                          )}
                                          {liderUnidade && (
                                            <div className="mt-2 inline-flex items-center gap-2 bg-purple-500/20 px-2 py-1 rounded-full border border-purple-400/30">
                                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-purple-500/50">
                                                {liderUnidade.full_name?.charAt(0) || liderUnidade.email?.charAt(0)}
                                              </div>
                                              <p className="text-xs text-purple-300 font-semibold">
                                                {liderUnidade.full_name || liderUnidade.email}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {podeEditarHierarquia && (
                                        <div className="flex gap-1">
                                          <Button size="sm" variant="ghost" onClick={() => handleEditUnidade(unidade)} className="text-purple-400 hover:bg-purple-500/20">
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="text-red-400 hover:bg-red-500/20"
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
                                  <CardContent className="relative">
                                    {/* Linha conectando líder da unidade aos corretores */}
                                    {usuariosDaUnidade.length > 0 && (
                                      <div className="absolute left-1/2 top-0 w-1 h-4 bg-gradient-to-b from-green-400 to-transparent shadow-lg shadow-green-400/50"></div>
                                    )}
                                    
                                    <div className="space-y-2 mt-2">
                                      {usuariosDaUnidade.length > 0 ? (
                                        usuariosDaUnidade.map(usuario => (
                                          <div key={usuario.id} className="relative">
                                            <div className="flex items-center gap-2 text-sm bg-slate-800/50 p-2 rounded-lg border border-green-400/20 backdrop-blur-sm">
                                              <div className="relative">
                                                <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-60"></div>
                                                <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shadow-lg shadow-blue-500/50">
                                                  {usuario.full_name?.charAt(0) || usuario.email?.charAt(0)}
                                                </div>
                                              </div>
                                              <div>
                                                <p className="font-medium text-white">{usuario.full_name || usuario.email}</p>
                                                <p className="text-xs text-cyan-400">{usuario.tipo_hierarquia || "Corretor"}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-xs text-slate-500 italic text-center py-2">Nenhum corretor</p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma unidade criada</p>
                        {podeEditarHierarquia && (
                          <Button 
                            size="sm" 
                            className="mt-4 bg-green-600 hover:bg-green-700" 
                            onClick={() => handleCreateUnidade(agencia.id)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Primeira Unidade
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Corretores diretos da agência */}
                    {usuariosDaAgencia.filter(u => !u.unidade_id && u.tipo_hierarquia === "Corretor").length > 0 && (
                      <div className="mt-8 pt-6 border-t border-green-400/20 relative">
                        <div className="absolute left-1/2 -top-6 w-1 h-6 bg-gradient-to-b from-green-400 to-transparent shadow-lg shadow-green-400/50"></div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-4 text-center">Corretores Diretos</h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {usuariosDaAgencia.filter(u => !u.unidade_id && u.tipo_hierarquia === "Corretor").map(usuario => (
                            <div key={usuario.id} className="flex items-center gap-2 text-sm bg-slate-800/50 p-3 rounded-lg border border-green-400/20 backdrop-blur-sm">
                              <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-60"></div>
                                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/50">
                                  {usuario.full_name?.charAt(0) || usuario.email?.charAt(0)}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-white">{usuario.full_name || usuario.email}</p>
                                <p className="text-xs text-cyan-400">Corretor</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {minhasAgencias.length === 0 && (
            <Card className="border-2 border-dashed border-slate-600 bg-slate-800/30">
              <CardContent className="text-center py-12">
                <Building className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">Nenhuma agência encontrada</h3>
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
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{editingAgencia ? "Editar Agência" : "Nova Agência"}</DialogTitle>
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
              <Label className="text-slate-300">Nome da Agência *</Label>
              <Input
                value={agenciaForm.nome}
                onChange={(e) => setAgenciaForm({ ...agenciaForm, nome: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Descrição</Label>
              <Textarea
                value={agenciaForm.descricao}
                onChange={(e) => setAgenciaForm({ ...agenciaForm, descricao: e.target.value })}
                rows={3}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAgenciaDialog(false)} className="border-slate-600 text-slate-300">
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingAgencia ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Unidade */}
      <Dialog open={showUnidadeDialog} onOpenChange={setShowUnidadeDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{editingUnidade ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingUnidade) {
              updateUnidadeMutation.mutate({ id: editingUnidade.id, data: unidadeForm });
            } else {
              createUnidadeMutation.mutate(unidadeForm);
            }
          }} className="space-y-4">
            {(!editingUnidade || currentUser?.role === "admin") && (
              <div>
                <Label className="text-slate-300">Agência *</Label>
                <Select
                  value={unidadeForm.agencia_id}
                  onValueChange={(value) => setUnidadeForm({ ...unidadeForm, agencia_id: value })}
                  required
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione a agência" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {minhasAgencias.map(agencia => (
                      <SelectItem key={agencia.id} value={agencia.id} className="text-white">
                        {agencia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-slate-300">Nome da Unidade *</Label>
              <Input
                value={unidadeForm.nome}
                onChange={(e) => setUnidadeForm({ ...unidadeForm, nome: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Descrição</Label>
              <Textarea
                value={unidadeForm.descricao}
                onChange={(e) => setUnidadeForm({ ...unidadeForm, descricao: e.target.value })}
                rows={3}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowUnidadeDialog(false)} className="border-slate-600 text-slate-300">
                Cancelar
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                {editingUnidade ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Convidar Usuário */}
      <Dialog open={showUsuarioDialog} onOpenChange={setShowUsuarioDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Convidar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            inviteUsuarioMutation.mutate(usuarioForm);
          }} className="space-y-4">
            <div>
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                value={usuarioForm.email}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, email: e.target.value })}
                placeholder="usuario@exemplo.com"
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Função *</Label>
              <Select
                value={usuarioForm.tipo}
                onValueChange={(value) => setUsuarioForm({ ...usuarioForm, tipo: value })}
                required
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {currentUser?.tipo_hierarquia === "Líder de Agência" && (
                    <>
                      <SelectItem value="Líder de Unidade" className="text-white">Líder de Unidade</SelectItem>
                      <SelectItem value="Corretor" className="text-white">Corretor</SelectItem>
                    </>
                  )}
                  {currentUser?.tipo_hierarquia === "Líder de Unidade" && (
                    <SelectItem value="Corretor" className="text-white">Corretor</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {usuarioForm.tipo && usuarioForm.tipo !== "Líder de Agência" && (
              <div>
                <Label className="text-slate-300">Agência *</Label>
                <Select
                  value={usuarioForm.agencia_id}
                  onValueChange={(value) => {
                    setUsuarioForm({ ...usuarioForm, agencia_id: value, unidade_id: "" });
                  }}
                  required
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione a agência" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {minhasAgencias.map(agencia => (
                      <SelectItem key={agencia.id} value={agencia.id} className="text-white">
                        {agencia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {usuarioForm.tipo === "Corretor" && usuarioForm.agencia_id && (
              <div>
                <Label className="text-slate-300">Unidade (Opcional)</Label>
                <Select
                  value={usuarioForm.unidade_id}
                  onValueChange={(value) => setUsuarioForm({ ...usuarioForm, unidade_id: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione a unidade ou deixe em branco" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value={null} className="text-white">Sem unidade (vínculo direto à agência)</SelectItem>
                    {minhasUnidades
                      .filter(u => u.agencia_id === usuarioForm.agencia_id)
                      .map(unidade => (
                        <SelectItem key={unidade.id} value={unidade.id} className="text-white">
                          {unidade.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {usuarioForm.tipo === "Líder de Unidade" && usuarioForm.agencia_id && (
              <div>
                <Label className="text-slate-300">Unidade *</Label>
                <Select
                  value={usuarioForm.unidade_id}
                  onValueChange={(value) => setUsuarioForm({ ...usuarioForm, unidade_id: value })}
                  required
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {minhasUnidades
                      .filter(u => u.agencia_id === usuarioForm.agencia_id)
                      .map(unidade => (
                        <SelectItem key={unidade.id} value={unidade.id} className="text-white">
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
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={inviteUsuarioMutation.isPending} className="bg-green-600 hover:bg-green-700">
                {inviteUsuarioMutation.isPending ? "Enviando..." : "Convidar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}