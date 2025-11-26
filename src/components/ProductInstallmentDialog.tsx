import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { calculateInstallment, formatCurrency, PaymentMethod, CardBrand, INSTALLMENT_RATES } from "@/lib/installmentRates";
import { toast } from "@/hooks/use-toast";

type Product = Database['public']['Tables']['produtos']['Row'];

interface ProductInstallmentDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductInstallmentDialog = ({ product, open, onOpenChange }: ProductInstallmentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("link");
  const [cardBrand, setCardBrand] = useState<CardBrand>("VISA");
  const [installments, setInstallments] = useState<string>("1");
  const [entryOption, setEntryOption] = useState<string>("sem");
  const [entryType, setEntryType] = useState<string>("dinheiro");
  const [entryValue, setEntryValue] = useState<string>("0");

  // Valores direto do banco de dados
  const parcelado12 = product.parcelado12 || 'R$ 0,00';
  const totalValue = product.Total || 'R$ 0,00';
  const normalPrice = product['Fora do Clube C/NF'] || 'R$ 0,00';
  const sealClubPrice = product.preco || 'R$ 0,00';
  const savings = product.Economia || 'R$ 0,00';

  const handleCopy = () => {
    let text = `${product.produto || 'Produto'}\n\n`;

    text += `🟨 Valor normal:
💳 Parcelado em 12x de ${parcelado12}

🟦 Para membros SealClub:
💳 Parcelado em 12x de ${parcelado12}

💰 Economia imediata: ${savings} na compra só por ser membro`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.produto || 'Produto'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Resultado - Valores do Banco */}
          <div className="bg-accent/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Parcela (12x):</span>
              <span className="text-lg font-bold text-primary">{parcelado12}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Total final:</span>
              <span className="font-semibold">{totalValue}</span>
            </div>
          </div>

          {/* Valores SealClub */}
          <div className="bg-primary/10 rounded-lg p-4 space-y-2 border border-primary/20">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor normal (Fora do Clube):</span>
              <span className="font-semibold">{normalPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Para membros SealClub:</span>
              <span className="font-bold text-primary">{sealClubPrice}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-primary/20">
              <span className="text-sm font-medium">Economia imediata:</span>
              <span className="font-bold text-success">{savings}</span>
            </div>
          </div>

          {/* Botão Copiar */}
          <Button onClick={handleCopy} className="w-full" size="lg">
            <Copy className="mr-2 h-4 w-4" />
            COPIAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductInstallmentDialog;
