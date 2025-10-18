// src/components/ProfileTabs.tsx
import React from "react";

type TabId = "mine" | "approved" | "shared";
interface Props {
  active: TabId;
  onChange: (id: TabId) => void;
  className?: string;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "mine",     label: "Mis proyectos" },
  { id: "approved", label: "Aprobados" },
  { id: "shared",   label: "Compartidos" },
];

export default function ProfileTabs({ active, onChange, className = "" }: Props) {
  return (
    <nav className={`w-full ${className}`}>
      <div className="border-t border-white/5 mb-4" />

      <ul className="flex items-center justify-center gap-10">
        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <li key={t.id}>
              {/* inline-flex => el ancho del botón = ancho del texto */}
              <button
                onClick={() => onChange(t.id)}
                className="group inline-flex flex-col items-center"
                aria-selected={isActive}
              >
                {/* Este span se ajusta al ancho del texto */}
                <span
                  className={[
                    "px-1 text-base font-medium transition-colors",
                    isActive
                      ? "text-emerald-400"
                      : "text-gray-300/80 group-hover:text-gray-200",
                  ].join(" ")}
                >
                  {t.label}
                </span>

                {/* Subrayado con w-full respecto al ancho del texto */}
                <span
                  className={[
                    "mt-2 h-[4px] rounded-full transition-all duration-200",
                    isActive
                      ? "w-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,.45)]"
                      : "w-0 bg-transparent",
                  ].join(" ")}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
