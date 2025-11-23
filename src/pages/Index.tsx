import ProductList from "@/components/ProductList";
import sealStoreLogo from "@/assets/seal-store-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-elegant">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <img 
              src={sealStoreLogo} 
              alt="Seal Store Logo" 
              className="h-12 object-contain bg-white/10 px-3 py-1 rounded"
            />
            <div>
              <h1 className="text-3xl font-bold">SEAL STORE</h1>
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
