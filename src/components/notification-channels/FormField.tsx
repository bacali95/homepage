import { SelectField, TextField } from "@/components/form-fields";

import { FieldConfig } from "./types";

interface FormFieldProps {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
}

export function FormField({ field, value, onChange }: FormFieldProps) {
  if (field.type === "select") {
    return (
      <SelectField
        label={field.label}
        value={value || field.options?.[0]?.value || ""}
        onValueChange={onChange}
        options={field.options ?? []}
        description={field.helpText}
      />
    );
  }

  return (
    <TextField
      label={field.label}
      type={field.type}
      value={value}
      onValueChange={onChange}
      placeholder={field.placeholder}
      description={field.helpText}
    />
  );
}
