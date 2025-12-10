import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";

// Endpoint do n8n configurado como variável
const N8N_ENDPOINT = "https://primary-production-0878.up.railway.app/webhook/att-produtos";

/**
 * Componente para upload de arquivo Excel/CSV para atualização de preços
 * 
 * Funcionalidades:
 * - Botão "Atualizar Preços" que dispara o input de arquivo
 * - Input de arquivo escondido que aceita Excel (.xlsx, .xls) e CSV
 * - Upload automático ao selecionar arquivo
 * - Estados de loading, sucesso e erro
 * - Envio via POST multipart/form-data para o endpoint n8n
 */
const PriceUploader = () => {
  // Estado para controlar o loading durante o upload
  const [isUploading, setIsUploading] = useState(false);
  
  // Referência para o input de arquivo escondido
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Função chamada ao clicar no botão "Atualizar Preços"
   * Dispara o clique no input de arquivo escondido
   */
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Função chamada quando o usuário seleciona um arquivo
   * Faz o upload automático para o endpoint n8n
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Verifica se um arquivo foi selecionado
    if (!file) {
      return;
    }

    // Valida o tipo de arquivo (Excel ou CSV)
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)",
        variant: "destructive",
      });
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      event.target.value = '';
      return;
    }

    // Inicia o estado de loading
    setIsUploading(true);

    try {
      // Cria o FormData para envio multipart/form-data
      const formData = new FormData();
      formData.append('file', file);

      // Faz a requisição POST para o endpoint n8n
      const response = await fetch(N8N_ENDPOINT, {
        method: 'POST',
        body: formData,
        // Não definir Content-Type manualmente - o navegador define automaticamente
        // com o boundary correto para multipart/form-data
      });

      // Verifica se a requisição foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }

      // Sucesso - mostra notificação de sucesso
      toast({
        title: "Arquivo enviado com sucesso!",
        description: "O arquivo foi enviado e está sendo processado. Os preços serão atualizados em breve.",
      });

    } catch (error) {
      // Erro - mostra notificação de erro
      console.error("Erro ao enviar arquivo:", error);
      toast({
        title: "Falha ao enviar arquivo",
        description: error instanceof Error 
          ? error.message 
          : "Ocorreu um erro ao enviar o arquivo. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      // Finaliza o estado de loading
      setIsUploading(false);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Input de arquivo escondido */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Botão "Atualizar Preços" */}
      <Button
        onClick={handleButtonClick}
        disabled={isUploading}
        variant="default"
        className="gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando arquivo...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Atualizar Preços
          </>
        )}
      </Button>
    </div>
  );
};

export default PriceUploader;


