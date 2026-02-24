import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface CategoryFilterBarProps {
  categories: string[];
  value: string;
  onChange: (category: string) => void;
}

export const CategoryFilterBar = ({ categories, value, onChange }: CategoryFilterBarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <h2 className="text-2xl font-display font-bold text-foreground">Browse by Category</h2>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Category: {value}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search category..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup>
                {categories.map((category) => (
                  <CommandItem
                    key={category}
                    value={category}
                    onSelect={(selectedValue) => {
                      const normalizedCategory = categories.find(
                        (item) => item.toLowerCase() === selectedValue.toLowerCase(),
                      );
                      onChange(normalizedCategory ?? category);
                      setOpen(false);
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${value === category ? "opacity-100" : "opacity-0"}`} />
                    {category}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
