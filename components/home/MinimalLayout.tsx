import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";

interface MinimalLayoutProps {
  openInNewTab: { search: boolean; icon: boolean };
  searchEngines: any[] | null;
  selectedEngine: string | null;
}

export const MinimalLayout = ({ openInNewTab, searchEngines, selectedEngine }: MinimalLayoutProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-8 z-10">
      <SimpleTimeDisplay />
      <SearchEngine
        openInNewTab={openInNewTab.search}
        initialSearchEngines={searchEngines}
        initialSelectedEngine={selectedEngine}
      />
    </div>
  );
};
