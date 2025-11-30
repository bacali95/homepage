import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FieldConfig } from "./types";

interface FormFieldProps {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
}

export function FormField({ field, value, onChange }: FormFieldProps) {
  const fieldId = field.key;
  const commonProps = {
    id: fieldId,
    value: value || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange(e.target.value),
  };

  const renderField = () => {
    switch (field.type) {
      case "select":
        return (
          <Select {...commonProps}>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );
      case "email":
      case "password":
      case "number":
      case "text":
      default:
        return (
          <Input
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <div className={field.gridCols ? undefined : "w-full"}>
      <Label htmlFor={fieldId}>{field.label}</Label>
      {renderField()}
      {field.helpText && (
        <p className="text-sm text-muted-foreground mt-1">{field.helpText}</p>
      )}
    </div>
  );
}
