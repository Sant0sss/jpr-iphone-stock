import ProductList from "@/components/ProductList";
import sealStoreLogo from "@/assets/seal-store-logo.png";
import { Link } from "react-router-dom";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-elegant">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={sealStoreLogo} 
                alt="Seal Store Logo" 
                className="h-16 object-contain"
              />
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">SEAL STORE</h1>
                <p className="text-sm text-muted-foreground mt-1">Sistema de Inventário</p>
              </div>
            </div>
            <Link to="/calculator">
              <Button variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                Calculadora de Taxas
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Catálogo de Produtos</h2>
          <p className="text-muted-foreground">Consulte a disponibilidade e informações dos produtos</p>
        </div>
        
        <ProductList />
      </main>
    </div>
  );
};

export default Index;
