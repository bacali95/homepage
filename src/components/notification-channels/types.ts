import { LucideIcon } from "lucide-react";

export type FieldType = "text" | "email" | "password" | "number" | "select";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  gridCols?: number;
}

export interface ChannelConfig {
  icon: LucideIcon;
  label: string;
  fields: FieldConfig[];
}
