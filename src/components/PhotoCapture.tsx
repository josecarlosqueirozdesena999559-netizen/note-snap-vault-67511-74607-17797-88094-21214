import { Camera, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PhotoCaptureProps {
  onConfirm: (data: { file: File; data: ExtractedData; previewUrl: string; base64Image: string }) => void;
}

interface ExtractedData {
  empresa: string;
  numeroNota: string;
  dataEmissao: string;
  chaveAcesso: string;
  valorTotal: string;
  descontos?: string;
}

const PhotoCapture = ({ onConfirm }: PhotoCaptureProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCurrentFile(file);
      setShowPreview(true);
      setIsProcessing(true);

      try {
        // Enviar imagem para processamento com Gemini
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(
          'https://guyasjbhphdhzzynprzs.supabase.co/functions/v1/extract-invoice-data',
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', response.status, errorText);
          throw new Error(`Erro ao processar imagem: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setExtractedData(result.data);
        } else {
          throw new Error(result.error || 'Dados não extraídos corretamente');
        }
      } catch (error) {
        console.error('Erro ao processar nota fiscal:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        alert(`Erro ao processar a nota fiscal: ${errorMessage}\n\nTente novamente.`);
        handleCancel();
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Converter file para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleConfirm = async () => {
    if (currentFile && extractedData && previewUrl) {
      try {
        const base64Image = await fileToBase64(currentFile);
        onConfirm({ file: currentFile, data: extractedData, previewUrl, base64Image });
        handleCancel();
      } catch (error) {
        console.error('Erro ao converter imagem:', error);
        alert('Erro ao processar imagem. Tente novamente.');
      }
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setPreviewUrl(null);
    setCurrentFile(null);
    setExtractedData(null);
    setIsProcessing(false);
  };

  return (
    <>
      <Card className="md:hidden">
        <CardHeader>
          <CardTitle>Adicionar Nova Nota</CardTitle>
          <CardDescription>
            Tire uma foto da DANFE para processar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            id="camera-upload"
          />
          <label htmlFor="camera-upload">
            <Button variant="default" className="w-full" size="lg" asChild>
              <span>
                <Camera className="w-5 h-5 mr-2" />
                Tirar Foto da Nota Fiscal
              </span>
            </Button>
          </label>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Confirmar Nota Fiscal</DialogTitle>
            <DialogDescription className="text-sm">
              Verifique os dados extraídos e confirme se estão corretos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {previewUrl && (
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-48 md:max-h-64 object-contain bg-muted"
                />
              </div>
            )}

            {isProcessing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Processando nota fiscal...</p>
              </div>
            ) : extractedData ? (
              <div className="space-y-3 bg-muted/50 p-3 md:p-4 rounded-lg text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="font-semibold text-sm">{extractedData.empresa}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Número NF</p>
                    <p className="font-semibold text-sm">#{extractedData.numeroNota}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Emissão</p>
                    <p className="font-semibold text-sm">{new Date(extractedData.dataEmissao).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="font-semibold text-sm text-primary">R$ {extractedData.valorTotal}</p>
                  </div>
                  {extractedData.descontos && (
                    <div>
                      <p className="text-xs text-muted-foreground">Descontos</p>
                      <p className="font-semibold text-sm text-secondary">R$ {extractedData.descontos}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Chave de Acesso</p>
                  <p className="font-mono text-[10px] md:text-xs break-all bg-background p-2 rounded border">{extractedData.chaveAcesso}</p>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || !extractedData}
              className="w-full sm:w-auto"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoCapture;
