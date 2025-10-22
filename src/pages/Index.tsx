import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Camera, Download, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">DANFE Manager</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>Entrar</Button>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <section className="py-20 text-center space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground">
            Gerencie suas Notas Fiscais
            <br />
            <span className="text-primary">de forma inteligente</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tire fotos das suas DANFEs, extraia informações automaticamente e tenha todos os PDFs organizados em um só lugar.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Começar Agora
            </Button>
          </div>
        </section>

        <section className="py-20 grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Capture Rápido</h3>
              <p className="text-muted-foreground">
                Tire uma foto da nota fiscal direto do celular e deixe a IA fazer o resto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Extração Automática</h3>
              <p className="text-muted-foreground">
                IA extrai automaticamente número, data e todas as informações importantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
                <Download className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">PDFs Prontos</h3>
              <p className="text-muted-foreground">
                PDFs com OCR prontos para download e uso no seu sistema
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="py-20 bg-muted/50 rounded-3xl px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-3xl font-bold text-foreground">Seus dados seguros</h3>
            <p className="text-lg text-muted-foreground">
              Todas as suas notas fiscais são armazenadas de forma segura e criptografada. 
              Acesse de qualquer lugar, a qualquer momento.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Criar Conta Grátis
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 DANFE Manager. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
