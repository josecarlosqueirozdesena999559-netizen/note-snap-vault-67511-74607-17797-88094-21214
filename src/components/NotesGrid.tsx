import { FileText, Download, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface Note {
  id: string;
  number: string;
  date: string;
  status: "processing" | "ready";
  companyName?: string;
  accessKey?: string;
  pdfUrl?: string;
}

interface NotesGridProps {
  notes: Note[];
  onDownload?: (note: Note) => void;
}

const NotesGrid = ({ notes, onDownload }: NotesGridProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const getFilteredNotesByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return notes.filter((note) => {
      const noteDate = new Date(note.date);
      const daysDiff = Math.floor((today.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case "today":
          return daysDiff === 0;
        case "7days":
          return daysDiff <= 7;
        case "30days":
          return daysDiff <= 30;
        case "90days":
          return daysDiff <= 90;
        default:
          return true;
      }
    });
  };

  const filteredNotes = getFilteredNotesByDate()
    .filter((note) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        note.number.toLowerCase().includes(query) ||
        note.companyName?.toLowerCase().includes(query) ||
        note.accessKey?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Pesquisar nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por data" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as datas</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="90days">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base text-foreground truncate">
                    {note.companyName || "Empresa"}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">NF #{note.number}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(note.date).toLocaleDateString('pt-BR')}</p>
                  {note.accessKey && (
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-2 font-mono truncate">
                      {note.accessKey.slice(0, 20)}...
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t">
                {note.status === "processing" ? (
                  <div className="flex items-center justify-center py-2">
                    <span className="text-xs md:text-sm text-muted-foreground">Processando...</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full text-xs md:text-sm"
                    onClick={() => onDownload?.(note)}
                  >
                    <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-8 md:py-12">
          <FileText className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
          <p className="text-sm md:text-base text-muted-foreground">
            {searchQuery ? "Nenhuma nota encontrada" : "Nenhuma nota cadastrada ainda"}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotesGrid;
