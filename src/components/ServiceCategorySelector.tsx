import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getServiceCategories } from "@/lib/serviceCategoryService";
import type { ServiceCategory } from "@/lib/serviceCategoryService";

interface ServiceCategorySelectorProps {
  value?: string;
  onSelect: (categoryId: string) => void;
  className?: string;
}

export function ServiceCategorySelector({
  value,
  onSelect,
  className,
}: ServiceCategorySelectorProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await getServiceCategories();
      if (data) {
        setCategories(data);
      }
      setLoading(false);
    };
    loadCategories();
  }, []);

  return (
    <div className={className}>
      <Select value={value} onValueChange={onSelect} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.icon && <span className="mr-2">{category.icon}</span>}
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
