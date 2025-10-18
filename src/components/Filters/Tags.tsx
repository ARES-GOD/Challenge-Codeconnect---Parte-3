import { type FC } from "react";

interface Props {
  tags: string[];
  active: string[];
  onToggle: (tag: string) => void;
  onClearAll: () => void;
}

const Tags: FC<Props> = ({ tags, active, onToggle}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tags.map((tag) => {
        const isActive = active.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            className={[
              "px-3 py-1 rounded-full text-sm",
              isActive
                ? "bg-[#2A2F36] text-white ring-1 ring-[#6FFFB0]"
                : "bg-[#1A1F23] text-gray-300 hover:text-white"
            ].join(" ")}
          >
            {tag}
            {isActive && <span className="ml-1">×</span>}
          </button>
        );
      })}
    </div>
  );
};

export default Tags;
