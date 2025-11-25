import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

  const basePrice = product.preco_numerico || 0;
  
  const normalPrice = basePrice * 1.08 + 800;
  const sealClubPrice = basePrice;
  const savings = normalPrice - sealClubPrice;

  const installmentData = useMemo(() => {
    return calculateInstallment(
      sealClubPrice,
      parseInt(installments),
      paymentMethod,
      paymentMethod === "pagseguro" ? cardBrand : undefined
    );
  }, [sealClubPrice, installments, paymentMethod, cardBrand]);

  const handleCopy = () => {
    const text = `${product.produto || 'Produto'}

🟨 Valor normal:
💰 Valor à vista ${formatCurrency(normalPrice)}

🟦 Para membros SealClub:
💰 Valor à vista ${formatCurrency(sealClubPrice)}

💰 Economia imediata: ${formatCurrency(savings)}
na compra só por ser membro`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.produto || 'Produto'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Tipo de Pagamento */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de pagamento</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="link" />
                <Label htmlFor="link" className="cursor-pointer">Link de Pagamento</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pagseguro" id="pagseguro" />
                <Label htmlFor="pagseguro" className="cursor-pointer">PagSeguro</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Bandeira (só se PagSeguro) */}
          {paymentMethod === "pagseguro" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Bandeira</Label>
              <RadioGroup value={cardBrand} onValueChange={(value) => setCardBrand(value as CardBrand)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="VISA" id="visa" />
                  <Label htmlFor="visa" className="cursor-pointer">Visa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MASTER" id="master" />
                  <Label htmlFor="master" className="cursor-pointer">Master</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ELO" id="elo" />
                  <Label htmlFor="elo" className="cursor-pointer">Elo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="HIPER" id="hiper" />
                  <Label htmlFor="hiper" className="cursor-pointer">Hiper</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DEMAIS" id="demais" />
                  <Label htmlFor="demais" className="cursor-pointer">Demais</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Número de Parcelas */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Número de parcelas</Label>
            <Select value={installments} onValueChange={setInstallments}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(INSTALLMENT_RATES).map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resultado do Cálculo */}
          <div className="bg-accent/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Taxa aplicada:</span>
              <span className="font-semibold">{installmentData.rate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Parcela:</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(installmentData.installmentValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Total final:</span>
              <span className="font-semibold">{formatCurrency(installmentData.finalValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tipo de taxa:</span>
              <span className="font-medium">
                {paymentMethod === "link" ? "Link de Pagamento" : `PagSeguro - ${cardBrand}`}
              </span>
            </div>
          </div>

          {/* Valores SealClub */}
          <div className="bg-primary/10 rounded-lg p-4 space-y-2 border border-primary/20">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor normal:</span>
              <span className="font-semibold">{formatCurrency(normalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Para membros SealClub:</span>
              <span className="font-bold text-primary">{formatCurrency(sealClubPrice)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-primary/20">
              <span className="text-sm font-medium">Economia imediata:</span>
              <span className="font-bold text-success">{formatCurrency(savings)}</span>
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
