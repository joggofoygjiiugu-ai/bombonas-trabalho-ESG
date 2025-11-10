import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Camera } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QRCodeScannerProps {
  onQRCodeDetected: (qrCode: string) => void;
  isLoading?: boolean;
}

export function QRCodeScanner({ onQRCodeDetected, isLoading }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const animationFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // Inicia a câmera
  const startScanning = async () => {
    try {
      setError(null);
      const constraints: MediaStreamConstraints = {
        video: { facingMode: 'environment' },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream as any;
        setIsScanning(true);
        setPermission('granted');
        scanFrame();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível acessar a câmera';
      setError(errorMessage);
      setPermission('denied');
    }
  };

  // Para a câmera
  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Processa cada frame da câmera
  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isScanning) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        onQRCodeDetected(code.data);
        stopScanning();
        return;
      }
    } catch (err) {
      console.error('Erro ao processar QR Code:', err);
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Limpa recursos ao desmontar
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Leitor de QR Code
        </CardTitle>
        <CardDescription>
          Aponte a câmera para o QR Code da bombona
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video"
            style={{ display: isScanning ? 'block' : 'none' }}
          />
          {!isScanning && (
            <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Câmera não iniciada</p>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              disabled={isLoading}
              className="flex-1"
            >
              Iniciar Câmera
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="outline"
              className="flex-1"
            >
              Parar
            </Button>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center">
          {isScanning ? 'Procurando QR Code...' : 'Clique em "Iniciar Câmera" para começar'}
        </p>
      </CardContent>
    </Card>
  );
}
