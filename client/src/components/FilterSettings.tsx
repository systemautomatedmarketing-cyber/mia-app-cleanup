// src/components/FilterSettings.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { 
  UserFilterSettings, 
  DEFAULT_FILTER_SETTINGS,
  EXPERIENCE_LEVELS,
  PLATFORMS,
  SALES_TYPES,
  MAIN_GOALS,
} from "@shared/filters";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Filter } from "lucide-react";

interface FilterSettingsProps {
//  onFiltersChanged?: () => void;
// ✅ Accetta una funzione che riceve i nuovi settings
  onFiltersChanged?: (newSettings: UserFilterSettings) => void;
}

export function FilterSettings({ onFiltersChanged }: FilterSettingsProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserFilterSettings>(DEFAULT_FILTER_SETTINGS);
  const [expanded, setExpanded] = useState(false);

  // Carica settings da user quando disponibile
  useEffect(() => {
    if (user?.filterSettings) {
      setSettings({
        ...DEFAULT_FILTER_SETTINGS,
        ...user.filterSettings,
      });
    }
  }, [user?.filterSettings]);

  // Salva settings in Firestore
  const saveSettings = async () => {
    if (!user?.id) return;
    
    try {
      await updateDoc(doc(db, "users", user.id), {
        filterSettings: settings,
        updatedAt: new Date(),
      });
//      onFiltersChanged?.();
//    } catch (error) {
//      console.error("Errore salvataggio filtri:", error);
//    }

   // ✅ PASSA I NUOVI SETTINGS AL CALLBACK
      onFiltersChanged?.(settings);
    } catch (error) {
      console.error("Errore salvataggio filtri:", error);
    }
  };

  // Toggle enabled per una categoria
  const toggleEnabled = (key: keyof UserFilterSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key]?.enabled },
    }));
  };

  // Toggle valore selezionato in una categoria
  const toggleValue = (key: keyof UserFilterSettings, value: string) => {
    setSettings(prev => {
      const current = prev[key];
      const values = current?.values?.includes(value)
        ? current.values.filter((v: string) => v !== value)
        : [...(current?.values || []), value];
      
      return {
        ...prev,
        [key]: { ...current, values },
      };
    });
  };

  // Componente helper per renderizzare un gruppo di filtri
  const FilterGroup = ({ 
    label, 
    filterKey, 
    options,
    disabled = false 
  }: { 
    label: string; 
    filterKey: keyof UserFilterSettings; 
    options: string[];
    disabled?: boolean;
  }) => {
    const filter = settings[filterKey];
    
    return (
      <div className={`space-y-3 p-4 rounded-lg border ${disabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between">
          <Label className="font-medium">{label}</Label>
          <Switch
            checked={filter?.enabled}
            onCheckedChange={() => !disabled && toggleEnabled(filterKey)}
            disabled={disabled}
          />
        </div>
        
        {filter?.enabled && (
          <div className="grid grid-cols-2 gap-2 pl-6">
            {options.map((opt) => (
              <Label key={opt} className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                <Checkbox
                  checked={filter.values?.includes(opt)}
                  onCheckedChange={() => toggleValue(filterKey, opt)}
                />
                {opt}
              </Label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded} className="border rounded-xl">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4">
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtri Task
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="p-4 pt-0 space-y-4">
        {/* 🔴 ATTIVO ORA: Livello Esperienza */}
        <FilterGroup
          label="Livello Esperienza Social"
          filterKey="experienceLevel"
          options={EXPERIENCE_LEVELS}
        />
        
        {/* 🟡 PRONTO MA DISABILITATO: Piattaforma */}
        <FilterGroup
          label="Piattaforma"
          filterKey="platform"
          options={PLATFORMS}
          disabled={false} // {true} // ← Cambia a false quando i dati sono pronti
        />
        
        {/* 🟡 PRONTO MA DISABILITATO: Tipologia Vendita */}
        <FilterGroup
          label="Tipologia di Vendita"
          filterKey="salesType"
          options={SALES_TYPES}
          disabled={false} // {true}
        />
        
        {/* 🟡 PRONTO MA DISABILITATO: Obiettivo Principale */}
        <FilterGroup
          label="Obiettivo Principale"
          filterKey="mainGoal"
          options={MAIN_GOALS}
          disabled={false} // {true}
        />
        
        <Button onClick={saveSettings} className="w-full">
          Salva Preferenze Filtri
        </Button>
        
        <p className="text-xs text-slate-400 text-center">
          I filtri disabilitati non influenzeranno la visualizzazione dei task
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}