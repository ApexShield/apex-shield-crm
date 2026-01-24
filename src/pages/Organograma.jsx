import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, UserPlus, Network, Link2 } from "lucide-react";

export default function Organograma() {
  const queryClient = useQueryClient();
  const [showConviteDialog, setShowConviteDialog] = useState(false);
  const [showVincularDialog, setShowVincularDialog] = useState(false);
  const [usuarioParaVincular, setUsuarioParaVincular] = useState(null);
  
  const [conviteForm, setConviteForm] = useState({
    email: "",
    tipo_hierarquia: ""
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list()
  });

  // Construir hierarquia de usuários
  const hierarquia = useMemo(() => {
    // Usuários sem líder (topo da hierarquia)
    const usuariosTopo = allUsers.filter(u => !u.lider_id && !u.lider_email);
    
    // Função recursiva para construir a árvore
    const construirArvore = (usuario) => {
      const subordinados = allUsers.filter(u => 
        u.lider_id === usuario.id || u.lider_email === usuario.email
      );
      
      return {
        ...usuario,
        subordinados: subordinados.map(s => construirArvore(s))
      };
    };
    
    return usuariosTopo.map(u => construirArvore(u));
  }, [allUsers]);

  // Mutations
  const inviteUsuarioMutation = useMutation({
    mutationFn: async (data) => {
      try {
        await base44.users.inviteUser(data.email, "user");
      } catch (error) {
        console.log("Usuário já existe ou convite já enviado:", error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowConviteDialog(false);
      setConviteForm({ email: "", tipo_hierarquia: "" });
      alert("Convite enviado! O usuário poderá fazer login e será vinculado à hierarquia.");
    }
  });

  const vincularUsuarioMutation = useMutation({
    mutationFn: async ({ usuarioId, liderId, liderEmail, tipoHierarquia }) => {
      const usuario = allUsers.find(u => u.id === usuarioId);
      if (!usuario) throw new Error("Usuário não encontrado");
      
      // Atualizar usuário com novo líder
      await base44.entities.User.update(usuarioId, {
        lider_id: liderId || null,
        lider_email: liderEmail || null,
        tipo_hierarquia: tipoHierarquia || usuario.tipo_hierarquia
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowVincularDialog(false);
      setUsuarioParaVincular(null);
      alert("Vínculo atualizado com sucesso!");
    }
  });

  // Componente para renderizar um usuário e seus subordinados
  const UserNode = ({ usuario, nivel = 0 }) => {
    const corPorTipo = {
      "Líder de Agência": "from-blue-500 to-blue-600",
      "Líder de Unidade": "from-purple-500 to-purple-600",
      "Corretor": "from-cyan-400 to-blue-500"
    };

    const cor = corPorTipo[usuario.tipo_hierarquia] || "from-slate-400 to-slate-500";

    return (
      <div className="relative">
        {/* Usuário */}
        <Card className="border border-slate-600 bg-slate-800/50 backdrop-blur-sm mb-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cor} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {usuario.full_name?.charAt(0) || usuario.email?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{usuario.full_name || usuario.email}</p>
                  <p className="text-sm text-slate-400">{usuario.tipo_hierarquia || "Sem função"}</p>
                  <p className="text-xs text-slate-500">{usuario.email}</p>
                </div>
              </div>
              {currentUser?.role === "admin" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setUsuarioParaVincular(usuario);
                    setShowVincularDialog(true);
                  }}
                  className="border-green-400/30 text-green-400 hover:bg-green-500/20"
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  Vincular
                </Button>
              )}
            </div>
          </CardHeader>
          {usuario.subordinados && usuario.subordinados.length > 0 && (
            <CardContent>
              <div className="space-y-3 pl-8 border-l-2 border-green-400/30">
                {usuario.subordinados.map(sub => (
                  <UserNode key={sub.id} usuario={sub} nivel={nivel + 1} />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  };

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
              <p className="text-slate-400">Hierarquia de usuários</p>
            </div>
          </div>
          
          {currentUser?.role === "admin" && (
            <Button onClick={() => setShowConviteDialog(true)} className="bg-green-600 hover:bg-green-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar Usuário
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {hierarquia.length > 0 ? (
            hierarquia.map(usuario => (
              <UserNode key={usuario.id} usuario={usuario} />
            ))
          ) : (
            <Card className="border-2 border-dashed border-slate-600 bg-slate-800/30">
              <CardContent className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">Nenhum usuário encontrado</h3>
                <p className="text-slate-500 mb-4">Convide usuários para começar a construir a hierarquia</p>
                {currentUser?.role === "admin" && (
                  <Button onClick={() => setShowConviteDialog(true)} className="bg-green-600 hover:bg-green-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convidar Primeiro Usuário
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Usuários com vínculo quebrado */}
          {allUsers.filter(u => (u.lider_id || u.lider_email) && !allUsers.find(l => l.id === u.lider_id || l.email === u.lider_email)).length > 0 && (
            <Card className="border border-yellow-500/30 bg-slate-800/50">
              <CardHeader>
                <h3 className="text-lg font-semibold text-yellow-400">⚠️ Usuários com Vínculo Quebrado</h3>
                <p className="text-sm text-slate-400">Estes usuários estão vinculados a líderes que não existem mais</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allUsers
                    .filter(u => (u.lider_id || u.lider_email) && !allUsers.find(l => l.id === u.lider_id || l.email === u.lider_email))
                    .map(usuario => (
                      <div key={usuario.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold">
                            {usuario.full_name?.charAt(0) || usuario.email?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{usuario.full_name || usuario.email}</p>
                            <p className="text-xs text-slate-400">{usuario.email}</p>
                          </div>
                        </div>
                        {currentUser?.role === "admin" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setUsuarioParaVincular(usuario);
                              setShowVincularDialog(true);
                            }}
                            className="border-green-400/30 text-green-400 hover:bg-green-500/20"
                          >
                            <Link2 className="w-4 h-4 mr-1" />
                            Corrigir Vínculo
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog Convidar Usuário */}
      <Dialog open={showConviteDialog} onOpenChange={setShowConviteDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Convidar Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            inviteUsuarioMutation.mutate(conviteForm);
          }} className="space-y-4">
            <div>
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                value={conviteForm.email}
                onChange={(e) => setConviteForm({ ...conviteForm, email: e.target.value })}
                placeholder="usuario@exemplo.com"
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Função (Opcional)</Label>
              <Select
                value={conviteForm.tipo_hierarquia}
                onValueChange={(value) => setConviteForm({ ...conviteForm, tipo_hierarquia: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Deixe em branco ou selecione" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="Líder de Agência" className="text-white">Líder de Agência</SelectItem>
                  <SelectItem value="Líder de Unidade" className="text-white">Líder de Unidade</SelectItem>
                  <SelectItem value="Corretor" className="text-white">Corretor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 mt-1">Você pode vincular o usuário depois</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowConviteDialog(false);
                  setConviteForm({ email: "", tipo_hierarquia: "" });
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

      {/* Dialog Vincular Usuário */}
      <Dialog open={showVincularDialog} onOpenChange={setShowVincularDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Vincular Usuário à Hierarquia</DialogTitle>
          </DialogHeader>
          {usuarioParaVincular && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const liderId = formData.get("lider_id");
              const tipoHierarquia = formData.get("tipo_hierarquia");
              
              const lider = allUsers.find(u => u.id === liderId);
              
              vincularUsuarioMutation.mutate({
                usuarioId: usuarioParaVincular.id,
                liderId: liderId || null,
                liderEmail: lider?.email || null,
                tipoHierarquia: tipoHierarquia
              });
            }} className="space-y-4">
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <p className="text-sm text-slate-300">Configurando:</p>
                <p className="font-semibold text-white">{usuarioParaVincular.full_name || usuarioParaVincular.email}</p>
                <p className="text-xs text-slate-400">{usuarioParaVincular.email}</p>
              </div>
              
              <div>
                <Label className="text-slate-300">Função *</Label>
                <Select name="tipo_hierarquia" defaultValue={usuarioParaVincular.tipo_hierarquia || ""} required>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="Líder de Agência" className="text-white">Líder de Agência</SelectItem>
                    <SelectItem value="Líder de Unidade" className="text-white">Líder de Unidade</SelectItem>
                    <SelectItem value="Corretor" className="text-white">Corretor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Líder (Opcional)</Label>
                <Select name="lider_id" defaultValue={usuarioParaVincular.lider_id || ""}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Sem líder (topo da hierarquia)" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value={null} className="text-white">Sem líder (topo da hierarquia)</SelectItem>
                    {allUsers
                      .filter(u => u.id !== usuarioParaVincular.id)
                      .map(usuario => (
                        <SelectItem key={usuario.id} value={usuario.id} className="text-white">
                          {usuario.full_name || usuario.email} - {usuario.tipo_hierarquia || "Sem função"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-1">Deixe em branco para colocar no topo da hierarquia</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowVincularDialog(false);
                    setUsuarioParaVincular(null);
                  }}
                  className="border-slate-600 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={vincularUsuarioMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {vincularUsuarioMutation.isPending ? "Salvando..." : "Salvar Vínculo"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}