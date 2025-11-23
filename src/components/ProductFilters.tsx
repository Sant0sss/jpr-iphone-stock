import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  stockFilter: string;
  onStockFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
}

const ProductFilters = ({ 
  searchTerm, 
  onSearchChange, 
  stockFilter, 
  onStockFilterChange,
  dateFilter,
  onDateFilterChange
}: ProductFiltersProps) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por modelo, cor ou revendedor..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        
        <Select value={stockFilter} onValueChange={onStockFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px] bg-card border-border">
            <SelectValue placeholder="Filtrar estoque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os produtos</SelectItem>
            <SelectItem value="available">Apenas disponíveis</SelectItem>
            <SelectItem value="unavailable">Apenas indisponíveis</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value)}
          className="pl-10 bg-card border-border w-full sm:w-[300px]"
          placeholder="Filtrar por data"
        />
      </div>
    </div>
  );
};

export default ProductFilters;
