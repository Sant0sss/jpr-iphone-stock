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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pagseguro");
  const [cardBrand, setCardBrand] = useState<CardBrand>("VISA");
  const [installments, setInstallments] = useState<string>("1");
  const [entryOption, setEntryOption] = useState<string>("sem");
  const [entryType, setEntryType] = useState<string>("dinheiro");
  const [entryValue, setEntryValue] = useState<string>("0");
  const [phoneEntryValue, setPhoneEntryValue] = useState<string>("0");
  const [cashEntryValue, setCashEntryValue] = useState<string>("0");

  const basePrice = product.preco_numerico || 0;
  
  const normalPrice = basePrice * 1.08 + 800;
  const sealClubPrice = basePrice;
  const savings = normalPrice - sealClubPrice;

  // Calculate total entry value based on entry type
  const parsedEntryValue = entryType === "celular_dinheiro" 
    ? (parseFloat(phoneEntryValue) || 0) + (parseFloat(cashEntryValue) || 0)
    : parseFloat(entryValue) || 0;
  const hasEntry = entryOption === "com";
  
  const remainingNormalPrice = hasEntry ? Math.max(0, normalPrice - parsedEntryValue) : normalPrice;
  const remainingSealClubPrice = hasEntry ? Math.max(0, sealClubPrice - parsedEntryValue) : sealClubPrice;

  const installmentData = useMemo(() => {
    if (paymentMethod === "pix") {
      return { finalValue: remainingSealClubPrice, installmentValue: remainingSealClubPrice, rate: 0 };
    }
    return calculateInstallment(
      remainingSealClubPrice,
      parseInt(installments),
      paymentMethod,
      paymentMethod === "pagseguro" ? cardBrand : undefined
    );
  }, [remainingSealClubPrice, installments, paymentMethod, cardBrand]);

  // Build product name with storage and condition
  const condition = product.novo_seminovo || '';
  const productFullName = product.Armazenamento 
    ? `${product.produto || 'Produto'} ${product.Armazenamento}${condition ? ` ${condition}` : ''}`
    : `${product.produto || 'Produto'}${condition ? ` ${condition}` : ''}`;

  const handleCopy = () => {
    const normalInstallmentData = calculateInstallment(
      remainingNormalPrice,
      parseInt(installments),
      paymentMethod,
      paymentMethod === "pagseguro" ? cardBrand : undefined
    );

    let text = `${productFullName}\n\n`;

    if (paymentMethod === "pix") {
      // PIX Templates
      if (!hasEntry) {
        // PIX A) SEM ENTRADA
        text += `⚡ Pagamento via PIX

🟨 Valor normal:
💵 À vista no PIX: ${formatCurrency(remainingNormalPrice)}

🟦 Para membros SealClub:
💵 À vista no PIX: ${formatCurrency(remainingSealClubPrice)}

💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else if (entryType === "dinheiro") {
        // PIX B) ENTRADA EM DINHEIRO
        text += `⚡ Pagamento via PIX

Com a entrada de ${formatCurrency(parsedEntryValue)}, o restante no PIX fica:

🟨 Valor normal:
💵 À vista no PIX: ${formatCurrency(remainingNormalPrice)}

🟦 Para membros SealClub:
💵 À vista no PIX: ${formatCurrency(remainingSealClubPrice)}

💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else if (entryType === "celular") {
        // PIX C) ENTRADA COM CELULAR
        text += `⚡ Pagamento via PIX

Com o aparelho de entrada, o restante no PIX fica:

🟨 Valor normal:
💵 À vista no PIX: ${formatCurrency(remainingNormalPrice)}

🟦 Para membros SealClub:
💵 À vista no PIX: ${formatCurrency(remainingSealClubPrice)}

💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else {
        // PIX D) ENTRADA COM CELULAR + DINHEIRO
        text += `⚡ Pagamento via PIX

Com o aparelho de entrada + ${formatCurrency(parseFloat(cashEntryValue) || 0)}, o restante no PIX fica:

🟨 Valor normal:
💵 À vista no PIX: ${formatCurrency(remainingNormalPrice)}

🟦 Para membros SealClub:
💵 À vista no PIX: ${formatCurrency(remainingSealClubPrice)}

💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      }
    } else {
      // Card Templates
      if (!hasEntry) {
        // A) SEM ENTRADA
        text += `🟨 Valor normal:
💳 Parcelado em ${installments}x de ${formatCurrency(normalInstallmentData.installmentValue)}

🟦 Para membros SealClub:
💳 Parcelado em ${installments}x de ${formatCurrency(installmentData.installmentValue)}

💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else if (entryType === "dinheiro") {
        // B) ENTRADA EM DINHEIRO
        text += `Com a entrada de ${formatCurrency(parsedEntryValue)} fica:

🟨 Valor normal:
💳 Parcelado em ${installments}x de ${formatCurrency(normalInstallmentData.installmentValue)}

🟦 Para membros SealClub:
💳 Parcelado em ${installments}x de ${formatCurrency(installmentData.installmentValue)}

💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else if (entryType === "celular") {
        // C) ENTRADA COM CELULAR
        text += `Com o aparelho de entrada fica:

🟨 Valor normal:
💳 Parcelado em ${installments}x de ${formatCurrency(normalInstallmentData.installmentValue)}

🟦 Para membros SealClub:
💳 Parcelado em ${installments}x de ${formatCurrency(installmentData.installmentValue)}

💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else {
        // D) ENTRADA COM CELULAR + DINHEIRO
        text += `Com o aparelho de entrada + ${formatCurrency(parseFloat(cashEntryValue) || 0)} fica:

🟨 Valor normal:
💳 Parcelado em ${installments}x de ${formatCurrency(normalInstallmentData.installmentValue)}

🟦 Para membros SealClub:
💳 Parcelado em ${installments}x de ${formatCurrency(installmentData.installmentValue)}

💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      }
    }

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
          <DialogTitle className="text-xl">{productFullName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Tipo de Pagamento */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de pagamento</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="cursor-pointer">PIX</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pagseguro" id="pagseguro" />
                <Label htmlFor="pagseguro" className="cursor-pointer">PagSeguro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="link" />
                <Label htmlFor="link" className="cursor-pointer">Link de Pagamento</Label>
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

          {/* Número de Parcelas (não mostra para PIX) */}
          {paymentMethod !== "pix" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Número de parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(INSTALLMENT_RATES).filter(key => key !== 'debito').map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Entrada */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Entrada</Label>
            <Select value={entryOption} onValueChange={setEntryOption}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sem">Sem entrada</SelectItem>
                <SelectItem value="com">Com entrada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Entrada (só se escolher "Com entrada") */}
          {entryOption === "com" && (
            <>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Tipo de entrada</Label>
                <Select value={entryType} onValueChange={setEntryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celular">Celular</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="celular_dinheiro">Celular + Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos de entrada baseados no tipo */}
              {entryType === "celular_dinheiro" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Valor do celular de entrada</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={phoneEntryValue}
                      onChange={(e) => setPhoneEntryValue(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Valor em dinheiro</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={cashEntryValue}
                      onChange={(e) => setCashEntryValue(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Valor da entrada</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={entryValue}
                    onChange={(e) => setEntryValue(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </>
          )}

          {/* Resultado do Cálculo */}
          <div className="bg-accent/20 rounded-lg p-4 space-y-2">
            {paymentMethod === "pix" ? (
              <>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Método:</span>
                  <span className="font-semibold">⚡ PIX (À vista)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Valor SealClub:</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(remainingSealClubPrice)}</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Valores SealClub */}
          <div className="bg-primary/10 rounded-lg p-4 space-y-2 border border-primary/20">
            {hasEntry && (
              <div className="flex justify-between pb-2 border-b border-primary/20">
                <span className="text-sm text-muted-foreground">Valor da entrada:</span>
                <span className="font-semibold">{formatCurrency(parsedEntryValue)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{hasEntry ? "Valor restante normal:" : "Valor normal:"}</span>
              <span className="font-semibold">{formatCurrency(hasEntry ? remainingNormalPrice : normalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{hasEntry ? "Valor restante SealClub:" : "Para membros SealClub:"}</span>
              <span className="font-bold text-primary">{formatCurrency(hasEntry ? remainingSealClubPrice : sealClubPrice)}</span>
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
