import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, QrCode, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const statusLabels: Record<string, { label: string; color: string }> = {
  galpao: { label: 'No Galpão', color: 'bg-blue-100 text-blue-800' },
  galpao_contaminada: { label: 'No Galpão (Contaminada)', color: 'bg-red-100 text-red-800' },
  galpao_descontaminada: { label: 'No Galpão (Descontaminada)', color: 'bg-green-100 text-green-800' },
  a_caminho: { label: 'A Caminho', color: 'bg-yellow-100 text-yellow-800' },
  no_local: { label: 'No Local', color: 'bg-purple-100 text-purple-800' },
  recolhida: { label: 'Recolhida', color: 'bg-orange-100 text-orange-800' },
  entregue_galpao: { label: 'Entregue ao Galpão', color: 'bg-green-100 text-green-800' },
};

export default function Home() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [searchNumero, setSearchNumero] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data: bombonas, isLoading: bombonaListLoading } = trpc.bombonas.list.useQuery();

  const createBombonaMutation = trpc.bombonas.create.useMutation({
    onSuccess: (bombona) => {
      toast.success(`Bombona ${bombona.numero} criada com sucesso!`);
      navigate(`/bombona/${bombona.numero}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar bombona: ${error.message}`);
    },
  });

  const handleQRCodeDetected = (qrCodeData: string) => {
    const numero = qrCodeData.trim();
    setShowQRScanner(false);
    navigate(`/bombona/${numero}`);
  };

  const handleSearchBombona = () => {
    if (!searchNumero.trim()) {
      toast.error('Digite o número da bombona');
      return;
    }
    setIsSearching(true);
    navigate(`/bombona/${searchNumero.trim()}`);
  };

  const handleCreateBombona = () => {
    createBombonaMutation.mutate({});
  };

  const handleLogout = () => {
    logout();
    toast.success('Desconectado com sucesso');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Rastreamento de Bombonas</CardTitle>
            <CardDescription>
              Gerencie e rastreie suas bombonas em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-6">
              Faça login para acessar o sistema de rastreamento
            </p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="w-full"
            size="lg"
          >
            Fazer Login
          </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Rastreamento de Bombonas</h1>
            <p className="text-sm text-gray-600">Bem-vindo, {user?.name || 'Usuário'}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-6 px-4">
        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ler QR Code */}
          <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <QrCode className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold mb-1">Ler QR Code</h3>
                  <p className="text-sm text-gray-600">Escaneie o QR Code de uma bombona</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ler QR Code</DialogTitle>
              </DialogHeader>
              <QRCodeScanner onQRCodeDetected={handleQRCodeDetected} />
            </DialogContent>
          </Dialog>

          {/* Pesquisar Bombona */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Pesquisar Bombona</h3>
                <Input
                  placeholder="Ex: B001"
                  value={searchNumero}
                  onChange={(e) => setSearchNumero(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchBombona()}
                />
              </div>
              <Button
                onClick={handleSearchBombona}
                disabled={!searchNumero.trim()}
                className="w-full"
              >
                Pesquisar
              </Button>
            </CardContent>
          </Card>

          {/* Criar Nova Bombona */}
          <Card>
            <CardContent className="pt-6 text-center">
              <Plus className="w-12 h-12 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold mb-1">Criar Bombona</h3>
              <p className="text-sm text-gray-600 mb-3">Registre uma nova bombona no sistema</p>
              <Button
                onClick={handleCreateBombona}
                disabled={createBombonaMutation.isPending}
                variant="default"
                className="w-full"
              >
                {createBombonaMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Bombonas */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Bombonas</CardTitle>
            <CardDescription>
              {bombonas?.length || 0} bombona(s) registrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bombonaListLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : bombonas && bombonas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bombonas.map((bombona) => (
                  <Card
                    key={bombona.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/bombona/${bombona.numero}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold">{bombona.numero}</h3>
                        <Badge className={statusLabels[bombona.status as any]?.color}>
                          {statusLabels[bombona.status as any]?.label}
                        </Badge>
                      </div>
                      {bombona.localizacao && (
                        <p className="text-sm text-gray-600 mb-2">
                          📍 {bombona.localizacao}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Criada em {format(new Date(bombona.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma bombona registrada ainda</p>
                <p className="text-sm text-gray-400">Clique em "Criar Bombona" para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
