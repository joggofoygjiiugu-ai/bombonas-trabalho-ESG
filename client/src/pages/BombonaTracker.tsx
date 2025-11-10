import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const statusLabels: Record<string, { label: string; color: string }> = {
  galpao: { label: 'No Galpão', color: 'bg-blue-100 text-blue-800' },
  a_caminho: { label: 'A Caminho', color: 'bg-yellow-100 text-yellow-800' },
  no_local: { label: 'No Local', color: 'bg-purple-100 text-purple-800' },
  recolhida: { label: 'Recolhida', color: 'bg-orange-100 text-orange-800' },
  entregue_galpao: { label: 'Entregue ao Galpão', color: 'bg-green-100 text-green-800' },
};

const statusOrder = ['galpao', 'a_caminho', 'no_local', 'recolhida', 'entregue_galpao'];

export default function BombonaTracker() {
  const { numero } = useParams<{ numero: string }>();
  const [, navigate] = useLocation();
  const [newStatus, setNewStatus] = useState<string>('');
  const [localizacao, setLocalizacao] = useState<string>('');
  const [newAnotacao, setNewAnotacao] = useState<string>('');
  const [editingAnotacaoId, setEditingAnotacaoId] = useState<number | null>(null);
  const [editingAnotacaoContent, setEditingAnotacaoContent] = useState<string>('');

  // Queries
  const { data: bombona, isLoading: bombonaLoading } = trpc.bombonas.getByNumero.useQuery(
    { numero: numero || '' },
    { enabled: !!numero }
  );

  const { data: historico, isLoading: historicoLoading } = trpc.rastreamentos.getHistorico.useQuery(
    { bombonaId: bombona?.id || 0 },
    { enabled: !!bombona?.id }
  );

  const { data: anotacoes, isLoading: anotacoesLoading } = trpc.anotacoes.list.useQuery(
    { bombonaId: bombona?.id || 0 },
    { enabled: !!bombona?.id }
  );

  // Mutations
  const updateStatusMutation = trpc.bombonas.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Status atualizado com sucesso!');
      setNewStatus('');
      setLocalizacao('');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const addAnotacaoMutation = trpc.anotacoes.add.useMutation({
    onSuccess: () => {
      toast.success('Anotação adicionada!');
      setNewAnotacao('');
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar anotação: ${error.message}`);
    },
  });

  const updateAnotacaoMutation = trpc.anotacoes.update.useMutation({
    onSuccess: () => {
      toast.success('Anotação atualizada!');
      setEditingAnotacaoId(null);
      setEditingAnotacaoContent('');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar anotação: ${error.message}`);
    },
  });

  const deleteAnotacaoMutation = trpc.anotacoes.delete.useMutation({
    onSuccess: () => {
      toast.success('Anotação deletada!');
    },
    onError: (error) => {
      toast.error(`Erro ao deletar anotação: ${error.message}`);
    },
  });

  const handleUpdateStatus = () => {
    if (!bombona || !newStatus) {
      toast.error('Selecione um novo status');
      return;
    }

    updateStatusMutation.mutate({
      bombonaId: bombona.id,
      novoStatus: newStatus as any,
      localizacao: localizacao || undefined,
    });
  };

  const handleAddAnotacao = () => {
    if (!bombona || !newAnotacao.trim()) {
      toast.error('Digite uma anotação');
      return;
    }

    addAnotacaoMutation.mutate({
      bombonaId: bombona.id,
      conteudo: newAnotacao,
    });
  };

  const handleUpdateAnotacao = (anotacaoId: number) => {
    if (!editingAnotacaoContent.trim()) {
      toast.error('Digite uma anotação');
      return;
    }

    updateAnotacaoMutation.mutate({
      anotacaoId,
      conteudo: editingAnotacaoContent,
    });
  };

  const handleDeleteAnotacao = (anotacaoId: number) => {
    if (confirm('Tem certeza que deseja deletar esta anotação?')) {
      deleteAnotacaoMutation.mutate({ anotacaoId });
    }
  };

  if (bombonaLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!bombona) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Bombona não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(bombona.status as any);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">{bombona.numero}</CardTitle>
              <CardDescription>Rastreamento de bombona</CardDescription>
            </div>
            <Badge className={statusLabels[bombona.status as any]?.color}>
              {statusLabels[bombona.status as any]?.label}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historicoLoading ? (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : historico && historico.length > 0 ? (
              <div className="space-y-3">
                {historico.map((evento, index) => (
                  <div key={evento.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === historico.length - 1 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      {index < historico.length - 1 && <div className="w-0.5 h-12 bg-gray-300" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {statusLabels[evento.statusNovo as any]?.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(evento.createdAt), 'dd MMM yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      {evento.localizacao && (
                        <p className="text-sm text-gray-600">{evento.localizacao}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">Nenhum histórico de status</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Atualizar Status */}
      <Card>
        <CardHeader>
          <CardTitle>Atualizar Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo Status</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um novo status" />
              </SelectTrigger>
              <SelectContent>
                {statusOrder.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]?.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Localização (opcional)</label>
            <Textarea
              placeholder="Descreva a localização ou local da bombona"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleUpdateStatus}
            disabled={updateStatusMutation.isPending || !newStatus}
            className="w-full"
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar Status'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Anotações */}
      <Card>
        <CardHeader>
          <CardTitle>Anotações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nova Anotação */}
          <div className="space-y-2 pb-4 border-b">
            <label className="text-sm font-medium">Adicionar Anotação</label>
            <Textarea
              placeholder="Digite uma anotação sobre esta bombona..."
              value={newAnotacao}
              onChange={(e) => setNewAnotacao(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAddAnotacao}
              disabled={addAnotacaoMutation.isPending || !newAnotacao.trim()}
              className="w-full"
            >
              {addAnotacaoMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Anotação
                </>
              )}
            </Button>
          </div>

          {/* Lista de Anotações */}
          {anotacoesLoading ? (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : anotacoes && anotacoes.length > 0 ? (
            <div className="space-y-3">
              {anotacoes.map((anotacao) => (
                <div key={anotacao.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  {editingAnotacaoId === anotacao.id ? (
                    <>
                      <Textarea
                        value={editingAnotacaoContent}
                        onChange={(e) => setEditingAnotacaoContent(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateAnotacao(anotacao.id)}
                          disabled={updateAnotacaoMutation.isPending}
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAnotacaoId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">{anotacao.conteudo}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {format(new Date(anotacao.createdAt), 'dd MMM yyyy HH:mm', { locale: ptBR })}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingAnotacaoId(anotacao.id);
                              setEditingAnotacaoContent(anotacao.conteudo);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAnotacao(anotacao.id)}
                            disabled={deleteAnotacaoMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">Nenhuma anotação ainda</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
