import { Save, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

import { CHANNEL_CONFIGS } from "./config";
import { FormField } from "./FormField";
import { FieldConfig } from "./types";

interface ChannelCardProps {
  channel: {
    channel_type: string;
    configured: boolean;
  };
  config: Record<string, any>;
  enabled: boolean;
  isExpanded: boolean;
  onConfigChange: (key: string, value: string) => void;
  onEnabledChange: (enabled: boolean) => void;
  onToggleExpanded: () => void;
  onSave: () => void;
  onTest: () => void;
  isSaving: boolean;
  isTesting: boolean;
}

export function ChannelCard({
  channel,
  config,
  enabled,
  isExpanded,
  onConfigChange,
  onEnabledChange,
  onToggleExpanded,
  onSave,
  onTest,
  isSaving,
  isTesting,
}: ChannelCardProps) {
  const channelConfig = CHANNEL_CONFIGS[channel.channel_type];
  if (!channelConfig) return null;

  const Icon = channelConfig.icon;
  const fields = channelConfig.fields;

  // Group consecutive fields that should be in a grid
  const renderFields = () => {
    const result: React.ReactNode[] = [];
    let currentGroup: FieldConfig[] = [];

    fields.forEach((field, index) => {
      const hasGridCols = field.gridCols === 2;
      const nextField = fields[index + 1];
      const nextHasGridCols = nextField?.gridCols === 2;

      if (hasGridCols) {
        currentGroup.push(field);
        if (!nextHasGridCols) {
          // End of grid group
          result.push(
            <div
              key={`group-${index}`}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {currentGroup.map((f) => (
                <FormField
                  key={f.key}
                  field={f}
                  value={config[f.key] || ""}
                  onChange={(value) => onConfigChange(f.key, value)}
                />
              ))}
            </div>
          );
          currentGroup = [];
        }
      } else {
        // Single field
        result.push(
          <FormField
            key={field.key}
            field={field}
            value={config[field.key] || ""}
            onChange={(value) => onConfigChange(field.key, value)}
          />
        );
      }
    });

    // Handle remaining group
    if (currentGroup.length > 0) {
      result.push(
        <div
          key="group-final"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {currentGroup.map((f) => (
            <FormField
              key={f.key}
              field={f}
              value={config[f.key] || ""}
              onChange={(value) => onConfigChange(f.key, value)}
            />
          ))}
        </div>
      );
    }

    return result;
  };

  const header = (
    <div className="flex items-center gap-2 sm:gap-3">
      <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h3 className="text-xl sm:text-2xl font-semibold">
            {channelConfig.label}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {channel.configured && (
              <Badge
                variant="default"
                className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
              >
                Configured
              </Badge>
            )}
            {enabled && (
              <Badge variant="default" className="text-xs">
                Enabled
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div
        className="flex items-center gap-2 sm:gap-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-xs sm:text-sm whitespace-nowrap">Enable</span>
        </label>
      </div>
    </div>
  );

  return (
    <CollapsibleCard
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}
      header={header}
    >
      <div className="space-y-4">{renderFields()}</div>

      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
        <Button
          variant="outline"
          onClick={onTest}
          disabled={isTesting || isSaving}
          className="w-full sm:w-auto"
        >
          <Send className="mr-2 h-4 w-4" />
          {isTesting ? "Sending..." : "Test"}
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving || isTesting}
          className="w-full sm:w-auto"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </CollapsibleCard>
  );
}
