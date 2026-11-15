import { Button } from "@ui-sdk/react/button";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

export interface SideNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}

export function SideNav({
  label,
  items,
}: {
  label: string;
  items: SideNavItem[];
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1 md:flex-col">
      {items.map(({ to, label: text, icon: Icon, active }) => (
        <Button
          key={to}
          data-variant="ghost"
          aria-current={active ? "page" : undefined}
          render={<Link to={to} />}
          className="justify-start md:w-full"
        >
          <Icon aria-hidden="true" />
          {text}
        </Button>
      ))}
    </nav>
  );
}
