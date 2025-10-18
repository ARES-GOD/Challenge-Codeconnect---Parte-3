import { type FC, useState, useEffect } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClearAll: () => void;
}

const Navbar: FC<Props> = ({ value, onChange, onClearAll }) => {
  const [local, setLocal] = useState(value);

  // Mantén sincronía si el store cambia desde fuera
  useEffect(() => setLocal(value), [value]);

  // (opcional) debounce suave
  useEffect(() => {
    const t = setTimeout(() => onChange(local), 250);
    return () => clearTimeout(t);
  }, [local]); // eslint-disable-line

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-[#1A1F23] border border-gray-700 rounded-lg px-4 py-3 focus-within:border-blue-500 transition-colors">
        <svg className="w-5 h-5 mr-3 text-gray-400" viewBox="0 0 24 24" fill="none">
          <path d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Digita lo que buscas"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
        />
        {local && (
          <button className="ml-2 text-gray-400 hover:text-gray-300" onClick={() => setLocal("")}>
            ✕
          </button>
        )}
      </div>

      <button
        onClick={onClearAll}
        className="absolute right-0 -bottom-7 text-sm text-gray-400 hover:text-gray-300"
      >
        Limpiar todo
      </button>
    </div>
  );
};

export default Navbar;
