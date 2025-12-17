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
import { Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Calculator = () => {
  const [productName, setProductName] = useState<string>("");
  const [storage, setStorage] = useState<string>("");
  const [condition, setCondition] = useState<string>("Novo");
  const [productValue, setProductValue] = useState<string>("");
  const [tradeInValue, setTradeInValue] = useState<string>("");
  const [downPayment, setDownPayment] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('link');
  const [cardBrand, setCardBrand] = useState<CardBrand>('VISA');
  const [selectedInstallments, setSelectedInstallments] = useState<string>("12");
  const [copied, setCopied] = useState(false);

  // Função helper para normalizar valores brasileiros (vírgula -> ponto)
  const parseBrazilianNumber = (value: string): number => {
    if (!value || value.trim() === "") return 0;
    const cleaned = value.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
    if (cleaned.includes(",")) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      return parseFloat(normalized) || 0;
    }
    return parseFloat(cleaned) || 0;
  };

  // Preço SealClub = Valor do Produto inserido
  const sealClubPrice = useMemo(() => {
    return parseBrazilianNumber(productValue);
  }, [productValue]);

  // Preço Normal = (Valor do Produto * 0.08) + 500 + Valor do Produto
  const normalPrice = useMemo(() => {
    return sealClubPrice + (sealClubPrice * 0.08) + 500;
  }, [sealClubPrice]);

  // Economia = Preço Normal - Preço SealClub
  const savings = useMemo(() => {
    return normalPrice - sealClubPrice;
  }, [normalPrice, sealClubPrice]);

  const tradeIn = useMemo(() => parseBrazilianNumber(tradeInValue), [tradeInValue]);
  const down = useMemo(() => parseBrazilianNumber(downPayment), [downPayment]);

  // Valor base para cálculo (após entradas)
  const baseSealClubValue = useMemo(() => {
    return Math.max(0, sealClubPrice - tradeIn - down);
  }, [sealClubPrice, tradeIn, down]);

  const baseNormalValue = useMemo(() => {
    return Math.max(0, normalPrice - tradeIn - down);
  }, [normalPrice, tradeIn, down]);

  const installmentTable = useMemo(() => {
    if (paymentMethod === 'pix') return [];
    
    const installments = Array.from({ length: 18 }, (_, i) => i + 1);
    return installments.map((installmentCount) => {
      const sealClubCalc = calculateInstallment(
        baseSealClubValue, 
        installmentCount,
        paymentMethod,
        paymentMethod === 'pagseguro' ? cardBrand : undefined
      );
      const normalCalc = calculateInstallment(
        baseNormalValue, 
        installmentCount,
        paymentMethod,
        paymentMethod === 'pagseguro' ? cardBrand : undefined
      );
      return {
        installments: installmentCount,
        rate: sealClubCalc.rate,
        finalValueSealClub: sealClubCalc.finalValue,
        installmentValueSealClub: sealClubCalc.installmentValue,
        finalValueNormal: normalCalc.finalValue,
        installmentValueNormal: normalCalc.installmentValue,
      };
    });
  }, [baseSealClubValue, baseNormalValue, paymentMethod, cardBrand]);

  const handleCopy = () => {
    const productFullName = `${productName || '[Nome do produto]'} ${storage || '[Armazenamento]'} ${condition}`;
    
    const hasTradeIn = tradeIn > 0;
    const hasDownPayment = down > 0;
    
    let text = `${productFullName}\n\n`;
    
    if (paymentMethod === 'pix') {
      // PIX Templates
      if (!hasTradeIn && !hasDownPayment) {
        // PIX A) SEM ENTRADA
        text += `🟨 Valor normal:\n💵 À vista no PIX: ${formatCurrency(baseNormalValue)}\n\n🟦 Para membros SealClub:\n💵 À vista no PIX: ${formatCurrency(baseSealClubValue)}\n\n💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else if (hasDownPayment && !hasTradeIn) {
        // PIX B) ENTRADA EM DINHEIRO
        text += `Com a entrada de ${formatCurrency(down)}, o restante no PIX fica:\n\n🟨 Valor normal:\n💵 À vista no PIX: ${formatCurrency(baseNormalValue)}\n\n🟦 Para membros SealClub:\n💵 À vista no PIX: ${formatCurrency(baseSealClubValue)}\n\n💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else if (hasTradeIn && !hasDownPayment) {
        // PIX C) ENTRADA COM CELULAR
        text += `Com o aparelho de entrada, o restante no PIX fica:\n\n🟨 Valor normal:\n💵 À vista no PIX: ${formatCurrency(baseNormalValue)}\n\n🟦 Para membros SealClub:\n💵 À vista no PIX: ${formatCurrency(baseSealClubValue)}\n\n💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else {
        // PIX D) ENTRADA COM CELULAR + DINHEIRO
        text += `Com o aparelho de entrada + ${formatCurrency(down)}, o restante no PIX fica:\n\n🟨 Valor normal:\n💵 À vista no PIX: ${formatCurrency(baseNormalValue)}\n\n🟦 Para membros SealClub:\n💵 À vista no PIX: ${formatCurrency(baseSealClubValue)}\n\n💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      }
    } else {
      // Card Templates (Link de Pagamento / PagSeguro)
      const parcelas = parseInt(selectedInstallments);
      const selectedRow = installmentTable.find(row => row.installments === parcelas);
      
      if (!selectedRow) return;
      
      const parcelaNormal = selectedRow.installmentValueNormal;
      const parcelaSealClub = selectedRow.installmentValueSealClub;
      
      if (!hasTradeIn && !hasDownPayment) {
        // CARTÃO A) SEM ENTRADA
        text += `🟨 Valor normal:\n💳 Parcelado em ${parcelas}x de ${formatCurrency(parcelaNormal)}\n\n🟦 Para membros SealClub:\n💳 Parcelado em ${parcelas}x de ${formatCurrency(parcelaSealClub)}\n\n💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else if (hasDownPayment && !hasTradeIn) {
        // CARTÃO B) ENTRADA EM DINHEIRO
        text += `Com a entrada de ${formatCurrency(down)} fica:\n\n🟨 Valor normal:\n💳 Parcelado em ${parcelas}x de ${formatCurrency(parcelaNormal)}\n\n🟦 Para membros SealClub:\n💳 Parcelado em ${parcelas}x de ${formatCurrency(parcelaSealClub)}\n\n💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else if (hasTradeIn && !hasDownPayment) {
        // CARTÃO C) ENTRADA COM CELULAR
        text += `Com o aparelho de entrada fica:\n\n🟨 Valor normal:\n💳 Parcelado em ${parcelas}x de ${formatCurrency(parcelaNormal)}\n\n🟦 Para membros SealClub:\n💳 Parcelado em ${parcelas}x de ${formatCurrency(parcelaSealClub)}\n\n💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      } else {
        // CARTÃO D) ENTRADA COM CELULAR + DINHEIRO
        text += `Com o aparelho de entrada + ${formatCurrency(down)} fica:\n\n🟨 Valor normal:\n💳 Parcelado em ${parcelas}x de ${formatCurrency(parcelaNormal)}\n\n🟦 Para membros SealClub:\n💳 Parcelado em ${parcelas}x de ${formatCurrency(parcelaSealClub)}\n\n💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro`;
      }
    }
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Texto copiado!",
      description: "O texto foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
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
                  <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                      <TabsTrigger value="link">Link de Pagamento</TabsTrigger>
                      <TabsTrigger value="pagseguro">PagSeguro</TabsTrigger>
                      <TabsTrigger value="pix">PIX</TabsTrigger>
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
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Dados do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName" className="text-foreground">Nome do Produto</Label>
                  <Input
                    id="productName"
                    type="text"
                    placeholder="iPhone 15 Pro Max"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage" className="text-foreground">Armazenamento</Label>
                  <Input
                    id="storage"
                    type="text"
                    placeholder="256GB"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition" className="text-foreground">Condição</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger id="condition" className="bg-card border-border">
                    <SelectValue placeholder="Selecione a condição" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Seminovo">Seminovo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productValue" className="text-foreground">Valor do Produto - Preço SealClub (R$)</Label>
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
                <Label htmlFor="downPayment" className="text-foreground">Valor de Entrada em Dinheiro (R$)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  placeholder="0.00"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="text-lg"
                />
              </div>

              {paymentMethod !== 'pix' && (
                <div className="space-y-2">
                  <Label htmlFor="installments" className="text-foreground">Número de Parcelas</Label>
                  <Select value={selectedInstallments} onValueChange={setSelectedInstallments}>
                    <SelectTrigger id="installments" className="bg-card border-border">
                      <SelectValue placeholder="Selecione as parcelas" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preço Normal:</span>
                  <span className="text-xl font-semibold text-yellow-500">{formatCurrency(normalPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preço SealClub:</span>
                  <span className="text-xl font-semibold text-primary">{formatCurrency(sealClubPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Economia:</span>
                  <span className="text-xl font-semibold text-green-500">{formatCurrency(savings)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-lg text-muted-foreground">Valor Base (após entradas):</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(baseSealClubValue)}</span>
                </div>
              </div>

              <Button 
                onClick={handleCopy} 
                className="w-full mt-4"
                variant="default"
              >
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copiado!" : "📋 Copiar Texto"}
              </Button>
            </CardContent>
          </Card>

          {paymentMethod !== 'pix' ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">Tabela de Parcelamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-foreground font-semibold">Parcelas</th>
                        <th className="text-left py-3 px-2 text-foreground font-semibold">Taxa</th>
                        <th className="text-right py-3 px-2 text-yellow-500 font-semibold">Parcela Normal</th>
                        <th className="text-right py-3 px-2 text-primary font-semibold">Parcela SealClub</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installmentTable.map((row) => (
                        <tr 
                          key={row.installments} 
                          className={`border-b border-border/50 hover:bg-accent/50 transition-colors ${
                            row.installments === parseInt(selectedInstallments) ? 'bg-primary/10' : ''
                          }`}
                        >
                          <td className="py-3 px-2 text-foreground font-medium">{row.installments}x</td>
                          <td className="py-3 px-2 text-muted-foreground">{row.rate.toFixed(2)}%</td>
                          <td className="py-3 px-2 text-right text-yellow-500">{formatCurrency(row.installmentValueNormal)}</td>
                          <td className="py-3 px-2 text-right text-primary font-semibold">{formatCurrency(row.installmentValueSealClub)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">⚡ Pagamento PIX (À Vista)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-muted-foreground mb-2">🟨 Valor Normal</p>
                  <p className="text-3xl font-bold text-yellow-500">{formatCurrency(baseNormalValue)}</p>
                </div>
                <div className="p-6 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-sm text-muted-foreground mb-2">🟦 Para membros SealClub</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(baseSealClubValue)}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-sm text-muted-foreground mb-1">💰 Economia imediata</p>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(savings)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Calculator;
