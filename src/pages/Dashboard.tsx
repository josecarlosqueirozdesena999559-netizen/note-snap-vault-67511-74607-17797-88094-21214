import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhotoCapture from "@/components/PhotoCapture";
import NotesGrid from "@/components/NotesGrid";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  number: string;
  date: string;
  status: "processing" | "ready";
  companyName?: string;
  accessKey?: string;
  pdfUrl?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    fetchNotes();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotes: Note[] = (data || []).map(note => ({
        id: note.id,
        number: note.title || 'N/A',
        date: new Date(note.created_at).toISOString().split('T')[0],
        status: note.photo_url ? 'ready' : 'processing',
        companyName: note.content || 'Empresa',
        accessKey: note.title,
        pdfUrl: note.photo_url || undefined,
      }));

      setNotes(formattedNotes);
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async ({ file, data, previewUrl, base64Image }: any) => {
    if (!user) return;

    const toastId = toast({
      title: "Processando...",
      description: "Salvando nota fiscal",
    });

    try {
      // Salvar nota no banco
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: data.chaveAcesso,
          content: `${data.empresa} - NF #${data.numeroNota} - R$ ${data.valorTotal}${data.descontos ? ` (Desconto: R$ ${data.descontos})` : ''}`,
        })
        .select()
        .single();

      if (noteError) {
        console.error('Erro ao salvar nota:', noteError);
        throw new Error('Erro ao salvar nota no banco de dados');
      }

      toast({
        title: "Gerando PDF...",
        description: "Aguarde enquanto processamos a DANFE",
      });

      // Gerar e salvar PDF/imagem
      const response = await fetch(
        `https://guyasjbhphdhzzynprzs.supabase.co/functions/v1/generate-invoice-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            noteId: noteData.id,
            imageData: base64Image,
            chaveAcesso: data.chaveAcesso,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na geração do PDF:', errorData);
        throw new Error(errorData.error || 'Erro ao gerar PDF');
      }

      const result = await response.json();

      // Atualizar nota com URL da foto/PDF
      if (result.success) {
        const updateData: any = {};
        if (result.photoUrl) updateData.photo_url = result.photoUrl;
        if (result.pdfUrl) updateData.photo_url = result.pdfUrl;
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('notes')
            .update(updateData)
            .eq('id', noteData.id);

          if (updateError) {
            console.error('Erro ao atualizar nota:', updateError);
            throw new Error('Erro ao atualizar nota com PDF');
          }
        }
      }

      toast({
        title: "Sucesso!",
        description: "Nota fiscal salva com sucesso",
      });

      // Recarregar notas
      await fetchNotes();

    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (note: Note) => {
    if (note.pdfUrl) {
      window.open(note.pdfUrl, '_blank');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground hidden sm:block">
              DANFE Manager
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-6">
        <PhotoCapture onConfirm={handleFileUpload} />

        <div className="mt-4 md:mt-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Notas Fiscais
            </h2>
            <div className="text-xs md:text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {notes.length} nota{notes.length !== 1 ? "s" : ""}
            </div>
          </div>
          <NotesGrid notes={notes} onDownload={handleDownload} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
