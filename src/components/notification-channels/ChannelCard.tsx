import { Button } from "@ui-sdk/react/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react/collapsible";
import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
import { ChevronDown, Save, Send } from "lucide-react";

import { Card } from "@/components/primitives";

import type { NotificationChannelType } from "../../../generated/client/enums";
import type {
  EmailChannelConfig,
  TelegramChannelConfig,
} from "../../../server/notifications/channels/notification-channel.interface";
import { CHANNEL_CONFIGS } from "./config";
import { FormField } from "./FormField";
import { FieldConfig } from "./types";

interface ChannelCardProps {
  channelType: NotificationChannelType;
  configured: boolean;
  config: EmailChannelConfig | TelegramChannelConfig;
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
  channelType,
  configured,
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
  const channelConfig = CHANNEL_CONFIGS[channelType];
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
              key={`group-${field.key}`}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {currentGroup.map((f) => (
                <FormField
                  key={f.key}
                  field={f}
                  value={
                    (config as unknown as Record<string, string>)[
                      f.key
                    ]?.toString() || ""
                  }
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
            value={
              (config as unknown as Record<string, string>)[
                field.key
              ]?.toString() || ""
            }
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
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {currentGroup.map((f) => (
            <FormField
              key={f.key}
              field={f}
              value={
                (config as unknown as Record<string, string>)[
                  f.key
                ]?.toString() || ""
              }
              onChange={(value) => onConfigChange(f.key, value)}
            />
          ))}
        </div>
      );
    }

    return result;
  };

  return (
    <Card>
      <Collapsible
        open={isExpanded}
        onOpenChange={(open) => {
          if (open !== isExpanded) onToggleExpanded();
        }}
      >
        <div className="flex items-center gap-3 px-4 py-2">
          <CollapsibleTrigger className="w-full flex-1 gap-3 rounded-md py-1">
            <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" />
            <span className="font-medium">{channelConfig.label}</span>
            {configured && (
              <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[0.6875rem] font-medium text-accent">
                Configured
              </span>
            )}
            <ChevronDown
              aria-hidden="true"
              className="ml-auto size-4 text-muted transition-transform duration-150 in-data-open:rotate-180"
            />
          </CollapsibleTrigger>
          <Switch
            aria-label={`Enable ${channelConfig.label} notifications`}
            checked={enabled}
            onCheckedChange={onEnabledChange}
          >
            <SwitchThumb />
          </Switch>
        </div>
        <CollapsiblePanel>
          <div className="space-y-4 border-t border-line p-4">
            {renderFields()}
            <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row">
              <Button onClick={onTest} disabled={isTesting || isSaving}>
                <Send aria-hidden="true" />
                {isTesting ? "Sending…" : "Test"}
              </Button>
              <Button
                data-variant="solid"
                onClick={onSave}
                disabled={isSaving || isTesting}
              >
                <Save aria-hidden="true" />
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </CollapsiblePanel>
      </Collapsible>
    </Card>
  );
}
