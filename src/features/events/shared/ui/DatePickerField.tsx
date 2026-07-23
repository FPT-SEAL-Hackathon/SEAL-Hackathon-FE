import * as React from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLORS } from "@/components/shared/UIComponents";

interface Props {
  value: string;
  onChange: (value: string) => void;
  minDate?: Date | string;
  maxDate?: Date | string;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePickerField({ value, onChange, minDate, maxDate, placeholder = "Pick a date", disabled }: Props) {
  const [open, setOpen] = React.useState(false);
  const date = value ? parse(value.substring(0, 10), "yyyy-MM-dd", new Date()) : undefined;

  const handleSelect = (d: Date | undefined) => {
    if (d) {
      onChange(format(d, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  let minBoundary: Date | undefined;
  if (minDate) {
    minBoundary = typeof minDate === 'string' ? parse(minDate.substring(0, 10), "yyyy-MM-dd", new Date()) : new Date(minDate);
    minBoundary.setHours(0, 0, 0, 0);
  }
  
  let maxBoundary: Date | undefined;
  if (maxDate) {
    maxBoundary = typeof maxDate === 'string' ? parse(maxDate.substring(0, 10), "yyyy-MM-dd", new Date()) : new Date(maxDate);
    maxBoundary.setHours(23, 59, 59, 999);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-[42px] rounded-xl px-3 outline-none transition-all",
            !date && "text-muted-foreground"
          )}
          style={{
            fontSize: 13,
            border: `1px solid ${COLORS.border}`,
            background: disabled ? "var(--surface-bg)" : COLORS.bg,
            color: date ? COLORS.textPrimary : COLORS.textSecondary,
          }}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" style={{ color: COLORS.textSecondary }} />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          disabled={(d) => {
            if (minBoundary && d < minBoundary) return true;
            if (maxBoundary && d > maxBoundary) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
