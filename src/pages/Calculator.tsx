import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateInstallment, formatCurrency, PaymentMethod, CardBrand } from "@/lib/installmentRates";
import sealStoreLogo from "@/assets/seal-store-logo.png";
import Navigation from "@/components/Navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type TaxType = 'credito' | 'debito' | 'pix';

const Calculator = () => {
  const [productValue, setProductValue] = useState<string>("");
  const [tradeInValue, setTradeInValue] = useState<string>("");
  const [downPayment, setDownPayment] = useState<string>("");
  const [taxType, setTaxType] = useState<TaxType>('credito');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('link');
  const [cardBrand, setCardBrand] = useState<CardBrand>('VISA');

  const baseValue = useMemo(() => {
    const product = parseFloat(productValue) || 0;
    const tradeIn = parseFloat(tradeInValue) || 0;
    const down = parseFloat(downPayment) || 0;
    return Math.max(0, product - tradeIn - down);
  }, [productValue, tradeInValue, downPayment]);

  const installmentTable = useMemo(() => {
    if (taxType === 'pix') {
      return [{ installments: 1, rate: 0, finalValue: baseValue, installmentValue: baseValue }];
    }
    
    if (taxType === 'debito') {
      const debitRate = 1.05;
      const finalValue = baseValue * (1 + debitRate / 100);
      return [{ installments: 1, rate: debitRate, finalValue, installmentValue: finalValue }];
    }
    
    const installments = Array.from({ length: 18 }, (_, i) => i + 1);
    return installments.map((installmentCount) => {
      const { finalValue, installmentValue, rate } = calculateInstallment(
        baseValue, 
        installmentCount,
        paymentMethod,
        paymentMethod === 'pagseguro' ? cardBrand : undefined
      );
      return {
        installments: installmentCount,
        rate,
        finalValue,
        installmentValue,
      };
    });
  }, [baseValue, taxType, paymentMethod, cardBrand]);

  const handleCopy = () => {
    const parsedProductValue = parseFloat(productValue) || 0;
    const parsedTradeIn = parseFloat(tradeInValue) || 0;
    const parsedDownPayment = parseFloat(downPayment) || 0;
    
    let text = `Simulacao de Pagamento\n\n`;
    text += `Valor do Produto: ${formatCurrency(parsedProductValue)}\n`;
    
    if (parsedTradeIn > 0) {
      text += `Valor do Aparelho Usado: ${formatCurrency(parsedTradeIn)}\n`;
    }
    if (parsedDownPayment > 0) {
      text += `Valor de Entrada: ${formatCurrency(parsedDownPayment)}\n`;
    }
    
    text += `Valor Base: ${formatCurrency(baseValue)}\n\n`;
    
    if (taxType === 'pix') {
      text += `Pagamento via PIX\n`;
      text += `A vista: ${formatCurrency(baseValue)}\n`;
      text += `Taxa: 0%`;
    } else if (taxType === 'debito') {
      text += `Pagamento via Debito\n`;
      text += `Valor Final: ${formatCurrency(installmentTable[0].finalValue)}\n`;
      text += `Taxa: 1,05%`;
    } else {
      text += `Pagamento via Credito (${paymentMethod === 'pagseguro' ? `PagSeguro - ${cardBrand}` : 'Link de Pagamento'})\n\n`;
      text += `Parcelamento:\n`;
      installmentTable.forEach((row) => {
        text += `${row.installments}x de ${formatCurrency(row.installmentValue)} (Taxa: ${row.rate.toFixed(2)}% - Total: ${formatCurrency(row.finalValue)})\n`;
      });
    }
    
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Simulação copiada para a área de transferência.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-elegant">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <img 
              src={sealStoreLogo} 
              alt="Seal Store Logo" 
              className="h-16 object-contain"
            />
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">SEAL STORE</h1>
              <p className="text-sm text-muted-foreground mt-1">Sistema de Gestão</p>
            </div>
          </div>
        </div>
      </header>

      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground mb-3 block text-sm font-medium">Tipo de Taxa</Label>
                  <Tabs value={taxType} onValueChange={(value) => setTaxType(value as TaxType)}>
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                      <TabsTrigger value="credito">Crédito</TabsTrigger>
                      <TabsTrigger value="debito">Débito</TabsTrigger>
                      <TabsTrigger value="pix">PIX</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {taxType === 'credito' && (
                  <>
                    <div>
                      <Label className="text-foreground mb-3 block text-sm font-medium">Método de Pagamento</Label>
                      <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                          <TabsTrigger value="pagseguro">PagSeguro</TabsTrigger>
                          <TabsTrigger value="link">Link de Pagamento</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {paymentMethod === 'pagseguro' && (
                      <div>
                        <Label htmlFor="cardBrand" className="text-foreground">Bandeira do Cartão</Label>
                        <Select value={cardBrand} onValueChange={(value) => setCardBrand(value as CardBrand)}>
                          <SelectTrigger id="cardBrand" className="bg-card border-border mt-2">
                            <SelectValue placeholder="Selecione a bandeira" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="VISA">VISA</SelectItem>
                            <SelectItem value="MASTER">MASTER</SelectItem>
                            <SelectItem value="ELO">ELO</SelectItem>
                            <SelectItem value="HIPER">HIPER</SelectItem>
                            <SelectItem value="DEMAIS">DEMAIS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Dados do Financiamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productValue" className="text-foreground">Valor do Produto (R$)</Label>
                <Input
                  id="productValue"
                  type="number"
                  placeholder="0.00"
                  value={productValue}
                  onChange={(e) => setProductValue(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeInValue" className="text-foreground">Valor do Aparelho Usado (R$)</Label>
                <Input
                  id="tradeInValue"
                  type="number"
                  placeholder="0.00"
                  value={tradeInValue}
                  onChange={(e) => setTradeInValue(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="downPayment" className="text-foreground">Valor de Entrada (R$)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  placeholder="0.00"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-lg text-muted-foreground">Valor Base:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(baseValue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">
                {taxType === 'pix' ? 'Valor PIX' : taxType === 'debito' ? 'Valor Débito' : 'Tabela de Parcelamento'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {taxType === 'credito' && (
                        <th className="text-left py-3 px-2 text-foreground font-semibold">Parcelas</th>
                      )}
                      <th className="text-left py-3 px-2 text-foreground font-semibold">Taxa</th>
                      <th className="text-right py-3 px-2 text-foreground font-semibold">Valor Final</th>
                      {taxType === 'credito' && (
                        <th className="text-right py-3 px-2 text-foreground font-semibold">Parcela</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {installmentTable.map((row) => (
                      <tr key={row.installments} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                        {taxType === 'credito' && (
                          <td className="py-3 px-2 text-foreground font-medium">{row.installments}x</td>
                        )}
                        <td className="py-3 px-2 text-muted-foreground">{row.rate.toFixed(2)}%</td>
                        <td className="py-3 px-2 text-right text-foreground">{formatCurrency(row.finalValue)}</td>
                        {taxType === 'credito' && (
                          <td className="py-3 px-2 text-right text-primary font-semibold">{formatCurrency(row.installmentValue)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border">
                <Button onClick={handleCopy} className="w-full" variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Calculator;
