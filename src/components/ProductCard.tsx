import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
import { useState } from "react";
import { Calculator } from "lucide-react";
import ProductInstallmentDialog from "./ProductInstallmentDialog";

type Product = Database['public']['Tables']['produtos']['Row'];

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const isNovo = product.novo_seminovo?.toLowerCase() === 'novo';
  
  return (
    <Card className="bg-gradient-card shadow-elegant hover:shadow-hover transition-all duration-300 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            {product.produto || 'Produto sem nome'}
          </CardTitle>
          <Badge 
            variant={isNovo ? "default" : "secondary"}
            className={isNovo ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}
          >
            {product.novo_seminovo || 'N/A'}
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

        <Button 
          onClick={() => setDialogOpen(true)} 
          className="w-full mt-3"
          variant="default"
        >
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Parcelamento
        </Button>
        
        {product.created_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <span>Atualizado em:</span>
            <span>{new Date(product.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </CardContent>

      <ProductInstallmentDialog 
        product={product}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
};

export default ProductCard;
