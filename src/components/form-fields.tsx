import type { ReactNode } from "react";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@ui-sdk/react/autocomplete";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@ui-sdk/react/field";
import { Input } from "@ui-sdk/react/input";
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "@ui-sdk/react/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select";
import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
import { Check, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

interface BaseFieldProps {
  label: string;
  description?: ReactNode;
  required?: boolean;
  className?: string;
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-muted">
      *
    </span>
  );
}

export function TextField({
  label,
  description,
  required,
  className,
  value,
  onValueChange,
  type,
  placeholder,
  mono,
  name,
}: BaseFieldProps & {
  value: string;
  onValueChange: (value: string) => void;
  type?: "text" | "url" | "email" | "password" | "number";
  placeholder?: string;
  mono?: boolean;
  name?: string;
}) {
  return (
    <Field name={name} className={className}>
      <FieldLabel>
        {label}
        {required && <RequiredMark />}
      </FieldLabel>
      <Input
        type={type}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        required={required}
        className={cn(mono && "font-mono")}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError match="valueMissing">{label} is required.</FieldError>
      <FieldError match="typeMismatch">
        Enter a valid {type === "url" ? "URL, including https://" : type}.
      </FieldError>
    </Field>
  );
}

export function NumberField({
  label,
  description,
  required,
  className,
  value,
  onValueChange,
  min,
  max,
}: BaseFieldProps & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  min: number;
  max: number;
}) {
  return (
    <Field className={className}>
      <FieldLabel>
        {label}
        {required && <RequiredMark />}
      </FieldLabel>
      <NumberInput
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        required={required}
      >
        <NumberInputGroup>
          <NumberInputDecrement aria-label="Decrease">
            <Minus aria-hidden="true" />
          </NumberInputDecrement>
          <NumberInputControl className="font-mono" />
          <NumberInputIncrement aria-label="Increase">
            <Plus aria-hidden="true" />
          </NumberInputIncrement>
        </NumberInputGroup>
      </NumberInput>
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError match="valueMissing">{label} is required.</FieldError>
    </Field>
  );
}

export function SelectField({
  label,
  description,
  required,
  className,
  value,
  onValueChange,
  options,
}: BaseFieldProps & {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field className={className}>
      <FieldLabel>
        {label}
        {required && <RequiredMark />}
      </FieldLabel>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => next && onValueChange(next)}
        required={required}
      >
        <SelectTrigger className="w-full justify-between">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
              <SelectItemIndicator>
                <Check aria-hidden="true" />
              </SelectItemIndicator>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

export function SwitchField({
  label,
  description,
  className,
  checked,
  onCheckedChange,
}: Omit<BaseFieldProps, "required"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Field className={cn("flex-row items-start gap-3", className)}>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 shrink-0"
      >
        <SwitchThumb />
      </Switch>
      <div className="min-w-0 space-y-0.5">
        <FieldLabel className="text-sm">{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </div>
    </Field>
  );
}

export function SuggestField({
  label,
  description,
  required,
  className,
  value,
  onValueChange,
  placeholder,
  suggestions,
}: BaseFieldProps & {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  suggestions: string[];
}) {
  return (
    <Field className={className}>
      <FieldLabel>
        {label}
        {required && <RequiredMark />}
      </FieldLabel>
      <Autocomplete
        value={value}
        onValueChange={onValueChange}
        required={required}
        items={suggestions}
      >
        <AutocompleteInput placeholder={placeholder} />
        <AutocompleteContent>
          <AutocompleteEmpty className="px-3 py-2 text-xs text-muted">
            No saved categories yet. Type a new one.
          </AutocompleteEmpty>
          <AutocompleteList>
            {suggestions.map((suggestion) => (
              <AutocompleteItem key={suggestion} value={suggestion}>
                {suggestion}
              </AutocompleteItem>
            ))}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError match="valueMissing">{label} is required.</FieldError>
    </Field>
  );
}
