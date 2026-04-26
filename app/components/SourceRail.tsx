import type { SourceDrawerTab } from "@/app/components/types";

type SourceRailProps = {
  sourceDrawerTab: SourceDrawerTab;
  onOpenUrls: () => void;
  onOpenFiles: () => void;
};

export function SourceRail({ sourceDrawerTab, onOpenUrls, onOpenFiles }: SourceRailProps) {
  return (
    <aside className="source-rail" aria-label="Source drawer controls">
      <button
        className={sourceDrawerTab === "urls" ? "rail-button rail-button-active" : "rail-button"}
        onClick={onOpenUrls}
        aria-label="Open URL import drawer"
      >
        URL
      </button>
      <button
        className={sourceDrawerTab === "files" ? "rail-button rail-button-active" : "rail-button"}
        onClick={onOpenFiles}
        aria-label="Open file import drawer"
      >
        File
      </button>
      <span className="rail-pulse" />
    </aside>
  );
}
