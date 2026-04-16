"use client";
import Link from "next/link";
import { MenuType } from "./index";
import { ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const Navigation = ({ data }: { data: MenuType[] }) => {
  const pathName = usePathname();
  return (
    <nav className="hidden xl:block">
      <ul className="flex items-center">
        {data.map(({ href, id, label, subMenu }) => {
          // Check if current path matches parent or any submenu item
          const isActive =
            pathName === href ||
            subMenu?.some((item) => pathName === item.href);

          return (
            <li key={id} className="group/dropdown relative">
              <Link
                href={href}
                className={cn(
                  "inline-flex items-center gap-x-1 px-4 py-2 text-sm font-bold tracking-tight transition-all duration-300",
                  isActive ? "text-purple-600" : "text-slate-600 hover:text-purple-600",
                )}
              >
                {label}
                {subMenu?.length && <ChevronDown className="size-5" />}
              </Link>
              {subMenu?.length && (
                <ul className="absolute right-0 z-40 hidden min-w-54.25 rounded-2xl bg-white px-1.5 py-2 shadow-xl border border-slate-100 group-hover/dropdown:block">
                  {subMenu.map(({ href, id, label }) => (
                    <li key={id}>
                      <Link
                        href={href}
                        className={cn(
                          "flex rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-slate-50 hover:text-purple-600",
                          pathName === href
                            ? "bg-slate-50 text-purple-600 font-bold"
                            : "text-slate-600",
                        )}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
