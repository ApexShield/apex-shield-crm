import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Users, UserPlus, Network, Link2, Crown } from "lucide-react";

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
    // Usuários sem líder (topo da hierarquia - CEOs/Líderes de Agência)
    const usuariosTopo = allUsers.filter(u => 
      (!u.lider_id && !u.lider_email) && 
      (u.tipo_hierarquia === "Líder de Agência" || !u.tipo_hierarquia)
    );
    
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

  // Verificar se usuário pode editar
  const podeEditar = currentUser?.role === "admin" || currentUser?.tipo_hierarquia === "Líder de Agência";

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

  // Componente para renderizar card de usuário no organograma
  const UserCard = ({ usuario, onClick }) => {
    const corPorTipo = {
      "Líder de Agência": "from-emerald-400 to-green-500",
      "Líder de Unidade": "from-blue-400 to-blue-500",
      "Corretor": "from-cyan-300 to-blue-400"
    };

    const cor = corPorTipo[usuario.tipo_hierarquia] || "from-slate-400 to-slate-500";
    const labelTipo = usuario.tipo_hierarquia || "Usuário";

    return (
      <div 
        onClick={podeEditar ? onClick : undefined}
        className={`${podeEditar ? 'cursor-pointer hover:scale-105' : ''} transition-transform duration-200`}
      >
        <div className={`bg-gradient-to-br ${cor} rounded-xl p-4 shadow-lg min-w-[180px] border-2 border-white/30`}>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg mb-2 shadow-md">
              {usuario.full_name?.charAt(0) || usuario.email?.charAt(0)}
            </div>
            <p className="font-bold text-white text-sm mb-1">{usuario.full_name || usuario.email}</p>
            <p className="text-xs text-white/80 font-medium">{labelTipo}</p>
          </div>
        </div>
      </div>
    );
  };

  // Componente recursivo para renderizar árvore
  const OrgTree = ({ usuario }) => {
    const subordinados = usuario.subordinados || [];
    
    return (
      <div className="flex flex-col items-center">
        <UserCard 
          usuario={usuario} 
          onClick={() => {
            if (podeEditar) {
              setUsuarioParaVincular(usuario);
              setShowVincularDialog(true);
            }
          }}
        />
        
        {subordinados.length > 0 && (
          <>
            {/* Linha vertical */}
            <div className="w-0.5 h-12 bg-gradient-to-b from-white/40 to-white/20" />
            
            {/* Subordinados */}
            <div className="flex gap-8 relative">
              {/* Linha horizontal conectando subordinados */}
              {subordinados.length > 1 && (
                <div 
                  className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{ 
                    width: `calc(100% - ${180 / subordinados.length}px)`,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
              )}
              
              {subordinados.map((sub) => (
                <div key={sub.id} className="relative pt-12">
                  {/* Linha vertical para cada subordinado */}
                  <div className="absolute top-0 left-1/2 w-0.5 h-12 bg-gradient-to-b from-white/30 to-white/20 -translate-x-1/2" />
                  <OrgTree usuario={sub} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 p-6 overflow-x-auto">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Organograma da Empresa</h1>
              <p className="text-indigo-200">Hierarquia organizacional</p>
            </div>
          </div>
          
          {podeEditar && (
            <Button onClick={() => setShowConviteDialog(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold shadow-lg">
              <UserPlus className="w-5 h-5 mr-2" />
              Convidar Usuário
            </Button>
          )}
        </div>

        {!podeEditar && (
          <div className="mb-6 bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
            <p className="text-blue-200 text-sm flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Visualização apenas. Apenas Administradores e Líderes de Agência podem fazer alterações.
            </p>
          </div>
        )}

        {/* Organograma Visual */}
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-12 min-w-fit">
          {hierarquia.length > 0 ? (
            <div className="flex flex-col items-center gap-8">
              {hierarquia.map(usuario => (
                <OrgTree key={usuario.id} usuario={usuario} />
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-white/20 bg-white/5">
              <div className="text-center py-16 px-8">
                <Users className="w-20 h-20 mx-auto mb-6 text-white/40" />
                <h3 className="text-2xl font-semibold text-white mb-3">Nenhuma hierarquia configurada</h3>
                <p className="text-indigo-200 mb-6 max-w-md mx-auto">
                  Comece criando líderes de agência e construindo a estrutura organizacional da empresa.
                </p>
                {podeEditar && (
                  <Button onClick={() => setShowConviteDialog(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Criar Primeiro Líder
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Usuários sem vínculo ou com problemas */}
        {podeEditar && allUsers.filter(u => 
          (u.lider_id || u.lider_email) && 
          !allUsers.find(l => l.id === u.lider_id || l.email === u.lider_email)
        ).length > 0 && (
          <div className="mt-8 bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-4 flex items-center gap-2">
              ⚠️ Usuários com Vínculo Quebrado
            </h3>
            <p className="text-yellow-200/80 text-sm mb-4">
              Estes usuários estão vinculados a líderes que não existem mais. Clique para corrigir.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allUsers
                .filter(u => (u.lider_id || u.lider_email) && !allUsers.find(l => l.id === u.lider_id || l.email === u.lider_email))
                .map(usuario => (
                  <div 
                    key={usuario.id} 
                    onClick={() => {
                      setUsuarioParaVincular(usuario);
                      setShowVincularDialog(true);
                    }}
                    className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800/70 p-4 rounded-lg cursor-pointer transition-all border border-yellow-400/20"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {usuario.full_name?.charAt(0) || usuario.email?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{usuario.full_name || usuario.email}</p>
                      <p className="text-xs text-yellow-200/70 truncate">{usuario.tipo_hierarquia || "Sem função"}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialog Convidar Usuário */}
      {podeEditar && (
        <Dialog open={showConviteDialog} onOpenChange={setShowConviteDialog}>
          <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-indigo-500/30">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Convidar Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              inviteUsuarioMutation.mutate(conviteForm);
            }} className="space-y-4">
              <div>
                <Label className="text-indigo-200 font-semibold">Email *</Label>
                <Input
                  type="email"
                  value={conviteForm.email}
                  onChange={(e) => setConviteForm({ ...conviteForm, email: e.target.value })}
                  placeholder="usuario@exemplo.com"
                  required
                  className="bg-slate-700/50 border-indigo-500/30 text-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <Label className="text-indigo-200 font-semibold">Função na Hierarquia *</Label>
                <Select
                  value={conviteForm.tipo_hierarquia}
                  onValueChange={(value) => setConviteForm({ ...conviteForm, tipo_hierarquia: value })}
                  required
                >
                  <SelectTrigger className="bg-slate-700/50 border-indigo-500/30 text-white">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-indigo-500/30">
                    <SelectItem value="Líder de Agência" className="text-white">Líder de Agência (CEO)</SelectItem>
                    <SelectItem value="Líder de Unidade" className="text-white">Líder de Unidade (Diretor)</SelectItem>
                    <SelectItem value="Corretor" className="text-white">Corretor (Analista)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-indigo-300 mt-2">Você pode vincular a um líder depois do convite</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowConviteDialog(false);
                    setConviteForm({ email: "", tipo_hierarquia: "" });
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={inviteUsuarioMutation.isPending} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold">
                  {inviteUsuarioMutation.isPending ? "Enviando..." : "Enviar Convite"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Vincular Usuário */}
      {podeEditar && (
        <Dialog open={showVincularDialog} onOpenChange={setShowVincularDialog}>
          <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-indigo-500/30 max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Editar Usuário na Hierarquia</DialogTitle>
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
            }} className="space-y-5">
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 p-4 rounded-xl">
                <p className="text-sm text-indigo-200 mb-1">Editando:</p>
                <p className="font-bold text-white text-lg">{usuarioParaVincular.full_name || usuarioParaVincular.email}</p>
                <p className="text-xs text-indigo-300">{usuarioParaVincular.email}</p>
              </div>
              
              <div>
                <Label className="text-indigo-200 font-semibold mb-2 block">Função na Hierarquia *</Label>
                <Select name="tipo_hierarquia" defaultValue={usuarioParaVincular.tipo_hierarquia || ""} required>
                  <SelectTrigger className="bg-slate-700/50 border-indigo-500/30 text-white">
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-indigo-500/30">
                    <SelectItem value="Líder de Agência" className="text-white">🟢 Líder de Agência (CEO)</SelectItem>
                    <SelectItem value="Líder de Unidade" className="text-white">🔵 Líder de Unidade (Diretor)</SelectItem>
                    <SelectItem value="Corretor" className="text-white">🔷 Corretor (Analista)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-indigo-200 font-semibold mb-2 block">Reporta para (Líder Superior)</Label>
                <Select name="lider_id" defaultValue={usuarioParaVincular.lider_id || ""}>
                  <SelectTrigger className="bg-slate-700/50 border-indigo-500/30 text-white">
                    <SelectValue placeholder="Sem líder (topo da hierarquia)" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-indigo-500/30">
                    <SelectItem value={null} className="text-white">⭐ Sem líder (CEO - topo da hierarquia)</SelectItem>
                    {allUsers
                      .filter(u => u.id !== usuarioParaVincular.id)
                      .map(usuario => (
                        <SelectItem key={usuario.id} value={usuario.id} className="text-white">
                          {usuario.full_name || usuario.email} - {usuario.tipo_hierarquia || "Sem função"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-indigo-300 mt-2">
                  Líderes de Agência ficam no topo. Líderes de Unidade reportam para Líderes de Agência. Corretores reportam para Líderes de Unidade.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowVincularDialog(false);
                    setUsuarioParaVincular(null);
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={vincularUsuarioMutation.isPending} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold">
                  {vincularUsuarioMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}