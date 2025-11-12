import { type SourceType } from "@/lib/api";

export interface FormData {
  name: string;
  url: string;
  repo: string;
  github_repo: string;
  source_type: SourceType;
  current_version: string;
  category: string;
  docker_image: string;
  k8s_namespace: string;
}

export interface FormSectionProps {
  formData: FormData;
  onFormDataChange: (data: Partial<FormData>) => void;
}
