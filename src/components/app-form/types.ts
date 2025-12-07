import { type SourceType } from "@/lib/api";

export interface FormData {
  name: string;
  url: string;
  repo: string;
  source_type: SourceType;
  current_version: string;
  category: string;
  docker_image: string;
  k8s_namespace: string;
  icon: string;
  enableVersionChecking: boolean;
  ping_enabled: boolean;
  ping_url: string;
  ping_frequency: string;
}

export interface FormSectionProps {
  formData: FormData;
  onFormDataChange: (data: Partial<FormData>) => void;
}
