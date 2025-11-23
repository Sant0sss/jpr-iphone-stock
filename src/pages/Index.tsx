import ProductList from "@/components/ProductList";
import { Smartphone } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-elegant">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background/10 rounded-lg">
              <Smartphone className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">JPR Store</h1>
              <p className="text-sm text-primary-foreground/80">Sistema de Inventário</p>
            </div>
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
