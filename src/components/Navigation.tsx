import { Link, useLocation } from "react-router-dom";
import { Package, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();

  const tabs = [
    {
      name: "Sistema de Inventário",
      path: "/",
      icon: Package,
    },
    {
      name: "Calculadora de Taxas",
      path: "/calculator",
      icon: Calculator,
    },
  ];

  return (
    <nav className="border-b border-border bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative",
                  "hover:text-primary",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
