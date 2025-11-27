import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  conditionFilter: string;
  onConditionFilterChange: (value: string) => void;
}

const ProductFilters = ({ 
  searchTerm, 
  onSearchChange, 
  dateFilter,
  onDateFilterChange,
  conditionFilter,
  onConditionFilterChange
}: ProductFiltersProps) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por modelo, cor ou revendedor..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        
        <div className="relative sm:w-[220px]">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/60 pointer-events-none z-10" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="pl-10 bg-card border-border"
            placeholder="Filtrar por data"
          />
        </div>
        
        <Select value={conditionFilter} onValueChange={onConditionFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px] bg-card border-border">
            <SelectValue placeholder="Filtrar condição" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="seminovo">Seminovo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductFilters;
