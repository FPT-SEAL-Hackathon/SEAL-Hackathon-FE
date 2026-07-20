import * as React from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLORS } from "@/components/shared/UIComponents";

interface Props {
  value: string;
  onChange: (value: string) => void;
  minDateTime?: Date | string;
  maxDateTime?: Date | string;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePickerField({ value, onChange, minDateTime, maxDateTime, placeholder = "Pick date & time", disabled }: Props) {
  const [open, setOpen] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState<Date | undefined>(undefined);
  const [clampedMessage, setClampedMessage] = React.useState<string | null>(null);

  const externalDate = React.useMemo(() => {
    return value ? parse(value.substring(0, 16), "yyyy-MM-dd'T'HH:mm", new Date()) : undefined;
  }, [value]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setDraftValue(externalDate);
      setClampedMessage(null);
    }
  };

  const parseBoundary = (b: string | Date) => {
    if (b instanceof Date) return b;
    return b.length === 10 ? parse(b, "yyyy-MM-dd", new Date()) : parse(b.substring(0, 16), "yyyy-MM-dd'T'HH:mm", new Date());
  };

  const minBoundaryDate = minDateTime ? parseBoundary(minDateTime) : undefined;
  const maxBoundaryDate = maxDateTime ? parseBoundary(maxDateTime) : undefined;

  let minDay = minBoundaryDate ? new Date(minBoundaryDate) : undefined;
  if (minDay) minDay.setHours(0, 0, 0, 0);
  
  let maxDay = maxBoundaryDate ? new Date(maxBoundaryDate) : undefined;
  if (maxDay) maxDay.setHours(23, 59, 59, 999);

  const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const handleDateSelect = (d: Date | undefined) => {
    if (d) {
      let newH = draftValue ? draftValue.getHours() : 0;
      let newM = draftValue ? draftValue.getMinutes() : 0;
      let clamped = false;
      
      if (minBoundaryDate && isSameDay(d, minBoundaryDate)) {
         if (newH < minBoundaryDate.getHours()) { newH = minBoundaryDate.getHours(); newM = minBoundaryDate.getMinutes(); clamped = true; }
         else if (newH === minBoundaryDate.getHours() && newM < minBoundaryDate.getMinutes()) { newM = minBoundaryDate.getMinutes(); clamped = true; }
      }
      if (maxBoundaryDate && isSameDay(d, maxBoundaryDate)) {
         if (newH > maxBoundaryDate.getHours()) { newH = maxBoundaryDate.getHours(); newM = maxBoundaryDate.getMinutes(); clamped = true; }
         else if (newH === maxBoundaryDate.getHours() && newM > maxBoundaryDate.getMinutes()) { newM = maxBoundaryDate.getMinutes(); clamped = true; }
      }

      d.setHours(newH, newM);
      setDraftValue(new Date(d));
      if (clamped) {
         setClampedMessage(`Time adjusted to the earliest allowed value: ${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
      } else {
         setClampedMessage(null);
      }
    } else {
      setDraftValue(undefined);
      setClampedMessage(null);
    }
  };

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    if (!draftValue) return;
    const newDate = new Date(draftValue);
    let h = draftValue.getHours();
    let m = draftValue.getMinutes();
    let clamped = false;
    
    if (type === "hour") {
       h = parseInt(val, 10);
       let newMinM = 0; let newMaxM = 59;
       if (minBoundaryDate && isSameDay(newDate, minBoundaryDate) && h === minBoundaryDate.getHours()) newMinM = minBoundaryDate.getMinutes();
       if (maxBoundaryDate && isSameDay(newDate, maxBoundaryDate) && h === maxBoundaryDate.getHours()) newMaxM = maxBoundaryDate.getMinutes();
       if (m < newMinM) { m = newMinM; clamped = true; }
       if (m > newMaxM) { m = newMaxM; clamped = true; }
    }
    if (type === "minute") m = parseInt(val, 10);
    
    newDate.setHours(h, m);
    setDraftValue(newDate);
    if (clamped) {
       setClampedMessage(`Time adjusted to the earliest allowed value: ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    } else {
       setClampedMessage(null);
    }
  };

  const handleApply = () => {
    if (draftValue) {
       onChange(format(draftValue, "yyyy-MM-dd'T'HH:mm:00"));
    } else {
       onChange("");
    }
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-[42px] rounded-xl px-3 outline-none transition-all",
            !externalDate && "text-muted-foreground"
          )}
          style={{
            fontSize: 13,
            border: `1px solid ${COLORS.border}`,
            background: disabled ? "var(--surface-bg)" : COLORS.bg,
            color: externalDate ? COLORS.textPrimary : COLORS.textSecondary,
          }}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" style={{ color: COLORS.textSecondary }} />
          {externalDate ? format(externalDate, "PPP HH:mm") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={draftValue}
          onSelect={handleDateSelect}
          initialFocus
          disabled={(d) => {
            if (minDay && d < minDay) return true;
            if (maxDay && d > maxDay) return true;
            return false;
          }}
        />
        {draftValue && (
          <div className="p-3 border-t flex flex-col gap-3 bg-gray-50/50" style={{ borderColor: COLORS.border }}>
             {clampedMessage && (
               <div className="text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded" style={{ border: '1px solid #fed7aa' }}>
                 {clampedMessage}
               </div>
             )}
             <div className="flex items-center gap-2 justify-center">
               <Clock size={14} className="text-muted-foreground mr-1" />
               <select 
                 className="px-2 py-1 rounded text-sm outline-none cursor-pointer"
                 style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                 value={String(draftValue.getHours()).padStart(2, "0")}
                 onChange={(e) => handleTimeChange("hour", e.target.value)}
               >
                 {Array.from({length: 24}).map((_, i) => {
                   let minH = 0; let maxH = 23;
                   if (minBoundaryDate && isSameDay(draftValue, minBoundaryDate)) minH = minBoundaryDate.getHours();
                   if (maxBoundaryDate && isSameDay(draftValue, maxBoundaryDate)) maxH = maxBoundaryDate.getHours();
                   const isValid = i >= minH && i <= maxH;
                   return <option key={i} value={String(i).padStart(2, "0")} disabled={!isValid}>{String(i).padStart(2, "0")}</option>;
                 })}
               </select>
               <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>:</span>
               <select 
                 className="px-2 py-1 rounded text-sm outline-none cursor-pointer"
                 style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                 value={String(draftValue.getMinutes()).padStart(2, "0")}
                 onChange={(e) => handleTimeChange("minute", e.target.value)}
               >
                 {Array.from({length: 60}).map((_, i) => {
                   let minM = 0; let maxM = 59;
                   if (minBoundaryDate && isSameDay(draftValue, minBoundaryDate) && draftValue.getHours() === minBoundaryDate.getHours()) minM = minBoundaryDate.getMinutes();
                   if (maxBoundaryDate && isSameDay(draftValue, maxBoundaryDate) && draftValue.getHours() === maxBoundaryDate.getHours()) maxM = maxBoundaryDate.getMinutes();
                   const isValid = i >= minM && i <= maxM;
                   return <option key={i} value={String(i).padStart(2, "0")} disabled={!isValid}>{String(i).padStart(2, "0")}</option>;
                 })}
               </select>
             </div>
          </div>
        )}
        <div className="p-2 flex items-center justify-between border-t bg-white rounded-b-md" style={{ borderColor: COLORS.border }}>
          <button 
            type="button"
            onClick={handleClear} 
            className="text-[12px] font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setOpen(false)} 
              className="text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
              style={{ color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleApply} 
              disabled={!draftValue} 
              className="text-[12px] font-medium text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
              style={{ background: COLORS.primary }}
            >
              Apply
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
