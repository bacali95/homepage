import { useState, useRef, useEffect } from "react";
import React from "react";
import { cn } from "@/lib/utils";

interface MenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}

export function Menu({ trigger, children, align = "right" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            className={cn(
              "absolute z-50 mt-2 min-w-[200px] rounded-md border p-1 shadow-lg",
              "bg-popover text-popover-foreground",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                const originalOnClick = child.props.onClick;
                return React.cloneElement(child, {
                  ...child.props,
                  onClick: (e?: React.MouseEvent) => {
                    if (originalOnClick) {
                      originalOnClick(e);
                    }
                    closeMenu();
                  },
                } as any);
              }
              return child;
            })}
          </div>
        </>
      )}
    </div>
  );
}

interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function MenuItem({
  children,
  onClick,
  disabled,
  className,
}: MenuItemProps) {
  return (
    <div
      onClick={(e) => {
        if (!disabled && onClick) {
          onClick();
        }
        e.stopPropagation();
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MenuTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function MenuTrigger({ children, className }: MenuTriggerProps) {
  return <div className={cn("flex items-center", className)}>{children}</div>;
}
