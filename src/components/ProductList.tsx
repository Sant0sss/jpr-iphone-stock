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
  const [stockFilter, setStockFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

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
      
      const matchesStock = 
        stockFilter === "all" ||
        (stockFilter === "available" && (
          product.estoque?.toLowerCase().includes('disponível') || 
          product.estoque?.toLowerCase().includes('disponivel')
        )) ||
        (stockFilter === "unavailable" && !(
          product.estoque?.toLowerCase().includes('disponível') || 
          product.estoque?.toLowerCase().includes('disponivel')
        ));
      
      const matchesDate = !dateFilter || (() => {
        if (!product.data) return false;
        // Normalizar ambas as datas para comparação
        // Se data do banco está em DD/MM/YYYY, converter para YYYY-MM-DD
        const dbDate = product.data.includes('/') 
          ? product.data.split('/').reverse().join('-') 
          : product.data;
        return dbDate === dateFilter;
      })();
      
      return matchesSearch && matchesStock && matchesDate;
    });
  }, [products, searchTerm, stockFilter, dateFilter]);

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
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
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
