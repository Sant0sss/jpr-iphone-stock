import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import ProductFilters from "./ProductFilters";
import { Database } from "@/integrations/supabase/types";

type Product = Database['public']['Tables']['produtos']['Row'];

const ProductList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("all");

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      const matchesSearch = 
        product.produto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.cores?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.revendedor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = !dateFilter || (() => {
        if (!product.created_at) return false;
        const productDate = new Date(product.created_at).toISOString().split('T')[0];
        return productDate === dateFilter;
      })();
      
      const matchesCondition = 
        conditionFilter === "all" ||
        product.novo_seminovo?.toLowerCase() === conditionFilter.toLowerCase();
      
      return matchesSearch && matchesDate && matchesCondition;
    });
  }, [products, searchTerm, dateFilter, conditionFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Erro ao carregar produtos. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div>
      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        conditionFilter={conditionFilter}
        onConditionFilterChange={setConditionFilter}
      />
      
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
