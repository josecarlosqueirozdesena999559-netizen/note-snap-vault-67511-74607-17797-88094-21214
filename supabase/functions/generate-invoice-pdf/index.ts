import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { noteId, imageData, chaveAcesso } = await req.json();
    
    if (!noteId || !imageData || !chaveAcesso) {
      return new Response(
        JSON.stringify({ error: 'noteId, imageData e chaveAcesso são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const danfApiKey = Deno.env.get('DANF_API_KEY');
    const iLoveApiKey = Deno.env.get('ILOVEAPI_KEY');
    
    if (!danfApiKey || !iLoveApiKey) {
      console.error('API keys não configuradas');
      return new Response(
        JSON.stringify({ error: 'API keys não configuradas. Configure DANF_API_KEY e ILOVEAPI_KEY.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Gerando PDF DANFE para nota:', noteId, 'Chave:', chaveAcesso);

    // Validar e extrair base64 da imagem
    let base64Data: string;
    if (imageData.includes(',')) {
      base64Data = imageData.split(',')[1];
    } else {
      base64Data = imageData;
    }

    // Validar se é base64 válido
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Dados da imagem inválidos');
    }

    console.log('Tamanho do base64:', base64Data.length);

    // Converter base64 para Blob de forma segura
    let binaryData: Uint8Array;
    try {
      const binaryString = atob(base64Data);
      binaryData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryData[i] = binaryString.charCodeAt(i);
      }
    } catch (decodeError) {
      console.error('Erro ao decodificar base64:', decodeError);
      throw new Error('Falha ao processar imagem: dados corrompidos');
    }
    
    // Salvar imagem original
    const imageFileName = `note_${noteId}_${Date.now()}.jpg`;
    const imageFilePath = `invoices/${imageFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('notes')
      .upload(imageFilePath, binaryData, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload da imagem:', uploadError);
      throw uploadError;
    }

    const { data: imageUrlData } = supabase.storage
      .from('notes')
      .getPublicUrl(imageFilePath);

    let pdfUrl: string | undefined = undefined;
    
    // Gerar PDF DANFE usando a chave de acesso extraída
    console.log('Chamando DANF API com chave de acesso:', chaveAcesso);
    
    try {
      console.log('Iniciando fetch para DANF API...');
      const danfResponse = await fetch('https://api.danf.com.br/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${danfApiKey}`,
        },
        body: JSON.stringify({
          chave_acesso: chaveAcesso,
        }),
      });

      if (!danfResponse.ok) {
        const errorText = await danfResponse.text();
        console.error('Erro na API DANF:', danfResponse.status, errorText);
        // Lançar erro para ser capturado no bloco catch principal
        throw new Error(`API DANF retornou erro ${danfResponse.status}: ${errorText.substring(0, 100)}...`);
      }

      const danfResult = await danfResponse.json();
      console.log('PDF DANFE gerado:', danfResult);

      // Processar PDF retornado
      if (danfResult.pdf_base64) {
        const pdfData = Uint8Array.from(atob(danfResult.pdf_base64), c => c.charCodeAt(0));
        
        // Processar PDF com OCR usando ILovePDF
        console.log('Iniciando OCR do PDF...');
        
        try {
          // 1. Iniciar tarefa OCR
          console.log('Iniciando fetch para ILovePDF start task...');
          const startTaskResponse = await fetch('https://api.ilovepdf.com/v1/start/pdfa', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${iLoveApiKey}`,
            },
          });

          if (!startTaskResponse.ok) {
            throw new Error(`Erro ao iniciar tarefa OCR: ${startTaskResponse.status}`);
          }

          const taskData = await startTaskResponse.json();
          const serverUrl = taskData.server;
          const taskId = taskData.task;

          console.log('Tarefa OCR iniciada:', taskId);

          // 2. Upload do PDF
          const formData = new FormData();
          formData.append('task', taskId);
          formData.append('file', new Blob([pdfData], { type: 'application/pdf' }), 'invoice.pdf');

          console.log('Iniciando fetch para ILovePDF upload...');
          const uploadResponse = await fetch(`${serverUrl}/v1/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iLoveApiKey}`,
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Erro no upload: ${uploadResponse.status}`);
          }

          console.log('PDF enviado para OCR');

          // 3. Processar OCR
          console.log('Iniciando fetch para ILovePDF process...');
          const processResponse = await fetch(`${serverUrl}/v1/process`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iLoveApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              task: taskId,
              tool: 'pdfa',
            }),
          });

          if (!processResponse.ok) {
            throw new Error(`Erro no processamento OCR: ${processResponse.status}`);
          }

          console.log('OCR processado');

          // 4. Download do PDF processado
          console.log('Iniciando fetch para ILovePDF download...');
          const downloadResponse = await fetch(`${serverUrl}/v1/download/${taskId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${iLoveApiKey}`,
            },
          });

          if (!downloadResponse.ok) {
            throw new Error(`Erro no download: ${downloadResponse.status}`);
          }

          const processedPdfData = new Uint8Array(await downloadResponse.arrayBuffer());
          console.log('PDF com OCR baixado');

          // 5. Salvar PDF processado no storage
          const pdfFileName = `danfe_ocr_${noteId}_${Date.now()}.pdf`;
          const pdfFilePath = `invoices/${pdfFileName}`;

          const { error: pdfUploadError } = await supabase.storage
            .from('notes')
            .upload(pdfFilePath, processedPdfData, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (pdfUploadError) {
            console.error('Erro ao salvar PDF processado:', pdfUploadError);
            throw pdfUploadError;
          }

          const { data: pdfUrlData } = supabase.storage
            .from('notes')
            .getPublicUrl(pdfFilePath);
          pdfUrl = pdfUrlData.publicUrl;
          console.log('PDF com OCR salvo:', pdfUrl);

        } catch (ocrError) {
          console.error('Erro no processamento OCR:', ocrError);
          // Se o OCR falhar, tentamos salvar o PDF original da DANF API
          
          const pdfFileName = `danfe_${noteId}_${Date.now()}.pdf`;
          const pdfFilePath = `invoices/${pdfFileName}`;

          const { error: pdfUploadError } = await supabase.storage
            .from('notes')
            .upload(pdfFilePath, pdfData, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (!pdfUploadError) {
            const { data: pdfUrlData } = supabase.storage
              .from('notes')
              .getPublicUrl(pdfFilePath);
            pdfUrl = pdfUrlData.publicUrl;
            console.log('PDF sem OCR salvo (fallback):', pdfUrl);
          } else {
            console.error('Erro ao salvar PDF original (fallback):', pdfUploadError);
            // Se nem o fallback funcionar, lançamos o erro original do OCR
            throw ocrError;
          }
        }
      } else if (danfResult.pdf_url) {
        pdfUrl = danfResult.pdf_url;
      } else {
        // Se a DANF API não retornar base64 nem URL, consideramos falha
        throw new Error('API DANF não retornou dados de PDF válidos.');
      }
    } catch (apiError) {
      console.error('Erro ao gerar DANFE:', apiError);
      // Se a geração do DANFE falhar, lançamos o erro para o bloco catch principal
      throw apiError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        photoUrl: imageUrlData.publicUrl,
        pdfUrl: pdfUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro fatal no processamento da nota:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});