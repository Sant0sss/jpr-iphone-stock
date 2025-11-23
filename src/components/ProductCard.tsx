import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";

type Product = Database['public']['Tables']['produtos']['Row'];

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const isAvailable = product.estoque?.toLowerCase().includes('disponível') || 
                      product.estoque?.toLowerCase().includes('disponivel');
  
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
            <span className="text-sm font-medium text-muted-foreground">Preço:</span>
            <span className="text-lg font-bold text-primary">{product.preco}</span>
          </div>
        )}
        
        {product.data && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Atualizado em:</span>
            <span>{product.data}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
