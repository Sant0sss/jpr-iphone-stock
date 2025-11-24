import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INSTALLMENT_RATES, calculateInstallment, formatCurrency } from "@/lib/installmentRates";
import { Link } from "react-router-dom";
import sealStoreLogo from "@/assets/seal-store-logo.png";

const Calculator = () => {
  const [productValue, setProductValue] = useState<string>("");
  const [tradeInValue, setTradeInValue] = useState<string>("");
  const [downPayment, setDownPayment] = useState<string>("");

  const baseValue = useMemo(() => {
    const product = parseFloat(productValue) || 0;
    const tradeIn = parseFloat(tradeInValue) || 0;
    const down = parseFloat(downPayment) || 0;
    return Math.max(0, product - tradeIn - down);
  }, [productValue, tradeInValue, downPayment]);

  const installmentTable = useMemo(() => {
    return Object.keys(INSTALLMENT_RATES).map((key) => {
      const installments = parseInt(key);
      const { finalValue, installmentValue, rate } = calculateInstallment(baseValue, installments);
      return {
        installments,
        rate,
        finalValue,
        installmentValue,
      };
    });
  }, [baseValue]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-elegant">
        <div className="container mx-auto px-4 py-8">
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <img 
              src={sealStoreLogo} 
              alt="Seal Store Logo" 
              className="h-16 object-contain"
            />
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">SEAL STORE</h1>
              <p className="text-sm text-muted-foreground mt-1">Calculadora de Taxas</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
              <CardTitle className="text-2xl text-foreground">Tabela de Parcelamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-foreground font-semibold">Parcelas</th>
                      <th className="text-left py-3 px-2 text-foreground font-semibold">Taxa</th>
                      <th className="text-right py-3 px-2 text-foreground font-semibold">Valor Final</th>
                      <th className="text-right py-3 px-2 text-foreground font-semibold">Parcela</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installmentTable.map((row) => (
                      <tr key={row.installments} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                        <td className="py-3 px-2 text-foreground font-medium">{row.installments}x</td>
                        <td className="py-3 px-2 text-muted-foreground">{row.rate.toFixed(2)}%</td>
                        <td className="py-3 px-2 text-right text-foreground">{formatCurrency(row.finalValue)}</td>
                        <td className="py-3 px-2 text-right text-primary font-semibold">{formatCurrency(row.installmentValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Calculator;
