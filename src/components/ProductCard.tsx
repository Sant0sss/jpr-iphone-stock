import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { INSTALLMENT_RATES, calculateInstallment, formatCurrency } from "@/lib/installmentRates";

type Product = Database['public']['Tables']['produtos']['Row'];

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [selectedInstallments, setSelectedInstallments] = useState<string>("1");
  
  const isAvailable = product.estoque?.toLowerCase().includes('disponível') || 
                      product.estoque?.toLowerCase().includes('disponivel');

  const basePrice = product.preco_numerico || 0;
  
  const installmentData = useMemo(() => {
    const installments = parseInt(selectedInstallments);
    return calculateInstallment(basePrice, installments);
  }, [basePrice, selectedInstallments]);
  
  return (
    <Card className="bg-gradient-card shadow-elegant hover:shadow-hover transition-all duration-300 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            {product.produto || 'Produto sem nome'}
          </CardTitle>
          <Badge 
            variant={isAvailable ? "default" : "secondary"}
            className={isAvailable ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}
          >
            {isAvailable ? 'Disponível' : 'Indisponível'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {product.cores && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Cor:</span>
            <span className="text-sm text-foreground">{product.cores}</span>
          </div>
        )}
        
        {product.revendedor && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Revendedor:</span>
            <span className="text-sm text-foreground">{product.revendedor}</span>
          </div>
        )}
        
        {product.preco && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <span className="text-sm font-medium text-muted-foreground">Preço à vista:</span>
            <span className="text-lg font-bold text-primary">{product.preco}</span>
          </div>
        )}

        <div className="pt-3 border-t border-border/50 space-y-2">
          <div className="flex justify-between items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Parcelamento:</span>
            <Select value={selectedInstallments} onValueChange={setSelectedInstallments}>
              <SelectTrigger className="w-24 h-8 text-xs">
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

          {parseInt(selectedInstallments) > 1 && (
            <div className="bg-accent/20 rounded-md p-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Taxa aplicada:</span>
                <span className="text-foreground">{installmentData.rate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Parcela:</span>
                <span className="font-bold text-primary">{formatCurrency(installmentData.installmentValue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total final:</span>
                <span className="text-foreground">{formatCurrency(installmentData.finalValue)}</span>
              </div>
            </div>
          )}
        </div>
        
        {product.data && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <span>Atualizado em:</span>
            <span>{product.data}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
