import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
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
  a_caminho: { label: 'A Caminho', color: 'bg-yellow-100 text-yellow-800' },
  no_local: { label: 'No Local', color: 'bg-purple-100 text-purple-800' },
  recolhida: { label: 'Recolhida', color: 'bg-orange-100 text-orange-800' },
  entregue_galpao: { label: 'Entregue ao Galpão', color: 'bg-green-100 text-green-800' },
};

export default function Home() {
  const [, navigate] = useLocation();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [searchNumero, setSearchNumero] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Queries
  const { data: bombonas, isLoading: bombonaListLoading } = trpc.bombonas.list.useQuery();

  // Mutations
  const createBombonaMutation = trpc.bombonas.create.useMutation({
    onSuccess: (bombona) => {
      toast.success(`Bombona ${bombona.numero} criada com sucesso!`);
      navigate(`/bombona/${bombona.numero}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar bombona: ${error.message}`);
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.reload();
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
    logoutMutation.mutate();
    toast.success('Desconectado com sucesso');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Rastreamento de Bombonas</h1>
            <p className="text-sm text-gray-600">Bem-vindo, Admin</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Ler QR Code */}
          <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <QrCode className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="font-semibold mb-2">Ler QR Code</h3>
                    <p className="text-sm text-gray-600">Escaneie o QR Code de uma bombona</p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ler QR Code</DialogTitle>
                <DialogDescription>
                  Aponte a câmera para o QR Code da bombona
                </DialogDescription>
              </DialogHeader>
              <QRCodeScanner onQRCodeDetected={handleQRCodeDetected} />
            </DialogContent>
          </Dialog>

          {/* Pesquisar Bombona */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pesquisar Bombona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Ex: B001"
                value={searchNumero}
                onChange={(e) => setSearchNumero(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchBombona()}
              />
              <Button
                onClick={handleSearchBombona}
                disabled={isSearching}
                className="w-full"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Pesquisando...
                  </>
                ) : (
                  'Pesquisar'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Criar Bombona */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Criar Bombona</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Registre uma nova bombona no sistema</p>
              <Button
                onClick={handleCreateBombona}
                disabled={createBombonaMutation.isPending}
                className="w-full"
                size="lg"
              >
                {createBombonaMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Todas as Bombonas */}
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
              <div className="space-y-3">
                {bombonas.map((bombona) => (
                  <div
                    key={bombona.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/bombona/${bombona.numero}`)}
                  >
                    <div>
                      <p className="font-semibold">{bombona.numero}</p>
                      <p className="text-sm text-gray-600">
                        Criada em {format(new Date(bombona.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline">{bombona.status || 'galpao'}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Nenhuma bombona registrada ainda</p>
                <p className="text-sm text-gray-400">Clique em "Criar Bombona" para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
