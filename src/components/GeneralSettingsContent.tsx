import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import { Monitor, Moon, Sun } from "lucide-react";

import { SectionCard } from "@/components/primitives";
import { useTheme, type Theme } from "@/lib/use-theme";

export function GeneralSettingsContent() {
  const { theme, setTheme } = useTheme();

  return (
    <SectionCard title="Appearance" description="Choose your preferred theme">
      <Field>
        <FieldLabel>Theme</FieldLabel>
        <SegmentedControl
          value={theme}
          onValueChange={(value) => value && setTheme(value as Theme)}
          className="w-fit"
        >
          <SegmentedControlIndicator />
          <SegmentedControlItem value="light" className="gap-1.5">
            <Sun aria-hidden="true" />
            Light
          </SegmentedControlItem>
          <SegmentedControlItem value="dark" className="gap-1.5">
            <Moon aria-hidden="true" />
            Dark
          </SegmentedControlItem>
          <SegmentedControlItem value="system" className="gap-1.5">
            <Monitor aria-hidden="true" />
            System
          </SegmentedControlItem>
        </SegmentedControl>
        <FieldDescription>
          System follows your device&apos;s light or dark setting.
        </FieldDescription>
      </Field>
    </SectionCard>
  );
}
