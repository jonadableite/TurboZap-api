"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface OnThisPageProps {
  items: TocItem[];
}

export const OnThisPage = ({ items }: OnThisPageProps) => {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -35% 0%" }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden xl:block w-56 shrink-0">
      <div className="sticky top-24 py-6 pr-4">
        <div className="flex items-center gap-2 mb-5 text-sm font-medium text-muted-foreground">
          <List className="h-4 w-4" />
          <span>Nesta página</span>
        </div>
        <nav>
          <ul className="space-y-2.5 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 2) * 14}px` }}
              >
                <a
                  href={`#${item.id}`}
                  className={cn(
                    "block py-1.5 transition-colors rounded-md px-2 -mx-2",
                    activeId === item.id
                      ? "text-primary font-medium bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

