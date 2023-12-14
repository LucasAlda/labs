import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { useContext, createContext, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";

type MenuContextType = {
  open?: string;
  setOpen: (val?: string) => void;
  basePath: string;
  onNavigate?: () => void;
};

const MenuContext = createContext<MenuContextType | null>(null);

const useMenuContext = () => useContext(MenuContext)!;

const Menu = ({
  children,
  basePath = "",
  onNavigate,
  orientation = "vertical",
  className,
}: {
  children: ReactNode;
  basePath?: string;
  className?: string;
  orientation?: "vertical" | "horizontal";
  onNavigate?: () => void;
}) => {
  const [open, setOpen] = useState<string>();
  return (
    <MenuContext.Provider
      value={{
        open,
        setOpen: setOpen,
        onNavigate,
        basePath,
      }}
    >
      <ToggleGroup.Root
        type="single"
        orientation={orientation}
        className={cn("flex items-start px-3", orientation === "vertical" ? "flex-col" : "flex-row", className)}
      >
        {children}
      </ToggleGroup.Root>
    </MenuContext.Provider>
  );
};

const MenuOption = ({
  children,
  path,
  icon,
  link = true,
  onClick,
  exact = false,
  className,
  count,
}: {
  children: ReactNode;
  active?: boolean;
  link?: boolean;
  onClick?: () => void;
  path: string;
  icon?: LucideIcon;
  exact?: boolean;
  className?: string;
  count?: number;
}) => {
  const router = useRouter();
  const { open, basePath, onNavigate, setOpen } = useMenuContext();
  const active = exact ? router.asPath === basePath + path : router.asPath.startsWith(basePath + path);
  const Icon = icon;

  return (
    <ToggleGroup.ToggleGroupItem
      value={path}
      onClick={() => {
        onNavigate?.();
        if (link) void router.push(basePath + path);
        onClick?.();
        if (open !== basePath) setOpen();
      }}
      className={cn(
        `trasition-[width] mb-1 flex w-full items-center rounded px-3 py-1.5 text-left text-sm font-medium outline-none duration-300 hover:ring-4 hover:ring-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-800 group-[.not-pinned:not(:hover)]/sidebar:sm:w-10 `,
        {
          "bg-blue-400  text-slate-900/80 ring-4 ring-slate-800": active,
          "text-slate-400 hover:bg-slate-700 focus-visible:bg-slate-700": !active,
        },
        className
      )}
    >
      {Icon && <Icon className={cn("mb-px mr-2 w-4 min-w-[1rem]", { "text-slate-400/90": !active })} />}
      <div className=" flex w-full items-center justify-between transition-colors duration-100 group-[.not-pinned:not(:hover)]/sidebar:sm:w-0 group-[.not-pinned:not(:hover)]/sidebar:sm:text-transparent">
        {children}
        {count && (
          <span
            className={cn("-mr-1 w-7 rounded-full border px-2 text-center text-xs transition-colors  duration-75", {
              "border-slate-700   bg-slate-700 text-white/60": !active,
              "border-slate-700/30 bg-slate-700/20 ": active,
            })}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </div>
    </ToggleGroup.ToggleGroupItem>
  );
};

const MenuDropdown = ({
  path,
  children,
  icon,
  label,
  className,
  notification,
}: {
  icon?: LucideIcon;
  path: string;
  children?: ReactNode;
  label: string;
  className?: string;
  notification?: boolean;
}) => {
  const router = useRouter();
  const context = useMenuContext();
  const inside = router.asPath.startsWith(context.basePath + path);
  const isOpen = context.open?.startsWith(context.basePath + path) ?? inside;
  const Icon = icon;

  return (
    <>
      <ToggleGroup.ToggleGroupItem
        value={context.basePath + path}
        onClick={() => context.setOpen(isOpen ? context.basePath : context.basePath + path)}
        className={cn(
          `mb-1 flex w-full items-center justify-between rounded px-3 py-1.5 text-left  text-sm font-medium outline-none hover:ring-4 hover:ring-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-800 group-[.not-pinned:not(:hover)]/sidebar:sm:w-10`,
          "text-slate-400 hover:bg-slate-700 focus-visible:bg-slate-700",
          inside &&
            "group-[.not-pinned:not(:hover)]/sidebar:bg-blue-400 group-[.not-pinned:not(:hover)]/sidebar:text-slate-900/80 group-[.not-pinned:not(:hover)]/sidebar:delay-0",
          className
        )}
        style={{ transition: "background-color 0.2s ease-in-out" }}
      >
        <div className="flex items-center">
          {Icon && (
            <Icon
              className={cn(
                "mr-2 w-4 text-slate-400/90",
                inside && "group-[.not-pinned:not(:hover)]/sidebar:text-slate-900"
              )}
            />
          )}
          <div className=" relative transition-colors duration-100 group-[.not-pinned:not(:hover)]/sidebar:sm:w-0 group-[.not-pinned:not(:hover)]/sidebar:sm:text-transparent">
            {label}{" "}
            {notification && <div className="absolute -right-1.5 top-0.5 h-1.5 w-1.5 rounded-full bg-red-400/90"></div>}
          </div>
        </div>
        <span className="transition-colors duration-100 group-[.not-pinned:not(:hover)]/sidebar:sm:w-0 group-[.not-pinned:not(:hover)]/sidebar:sm:text-transparent">
          {isOpen && <ChevronDown className="w-4" />}
          {!isOpen && <ChevronRight className="w-4" />}
        </span>
      </ToggleGroup.ToggleGroupItem>
      <AnimatePresence initial={false}>
        {isOpen && (
          <MenuContext.Provider value={{ ...context, basePath: context.basePath + path }}>
            <motion.section
              key="content"
              className="flex w-full overflow-hidden pl-4 group-[.not-pinned:not(:hover)]/sidebar:sm:max-h-0"
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { height: "auto" },
                collapsed: { height: 0 },
              }}
              transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            >
              <div className=" -mr-1 mb-2 mt-1 border-r border-slate-700" />
              <div className=" grow  whitespace-nowrap ">{children}</div>
            </motion.section>
          </MenuContext.Provider>
        )}
      </AnimatePresence>
    </>
  );
};

Menu.Option = MenuOption;
Menu.Dropdown = MenuDropdown;

export { Menu };
