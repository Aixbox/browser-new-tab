"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { Button, buttonVariants } from "./ui/button";
import { MagnifyingGlassIcon, ChevronDownIcon, PlusIcon, GlobeIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu";

interface SearchEngine {
  id: string;
  name: string;
  url: string;
  logo: string;
}

// Logo显示组件
const LogoDisplay = ({ logo, name }: { logo: string; name: string }) => {
  const [hasError, setHasError] = useState(false);

  if (logo === "default" || hasError) {
    return (
      <div className="w-6 h-6 mb-1 flex items-center justify-center bg-white/10 rounded">
        <GlobeIcon className="w-4 h-4 text-white" />
      </div>
    );
  }

  return (
    <img 
      src={logo} 
      alt={name}
      className="w-6 h-6 mb-1"
      onError={() => setHasError(true)}
    />
  );
};

// 小尺寸Logo显示组件
const SmallLogoDisplay = ({ logo, name }: { logo: string; name: string }) => {
  const [hasError, setHasError] = useState(false);

  if (logo === "default" || hasError) {
    return <GlobeIcon className="w-6 h-6 text-white" />;
  }

  return (
    <img 
      src={logo} 
      alt={name}
      className="w-6 h-6"
      onError={() => setHasError(true)}
    />
  );
};

const defaultSearchEngines: SearchEngine[] = [
  { 
    id: "google", 
    name: "Google", 
    url: "https://www.google.com/search?q=",
    logo: "https://www.google.com/favicon.ico"
  },
  { 
    id: "bing", 
    name: "Bing", 
    url: "https://www.bing.com/search?q=",
    logo: "https://www.bing.com/favicon.ico"
  },
  { 
    id: "duckduckgo", 
    name: "DuckDuckGo", 
    url: "https://duckduckgo.com/?q=",
    logo: "https://duckduckgo.com/favicon.ico"
  },
  { 
    id: "baidu", 
    name: "百度", 
    url: "https://www.baidu.com/s?wd=",
    logo: "https://www.baidu.com/favicon.ico"
  },
];

export const SearchEngine = () => {
  const [query, setQuery] = useState("");
  const [selectedEngine, setSelectedEngine] = useState("google");
  const [searchEngines, setSearchEngines] = useState<SearchEngine[]>(defaultSearchEngines);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAddingEngine, setIsAddingEngine] = useState(false);
  const [editingEngine, setEditingEngine] = useState<SearchEngine | null>(null);
  const [newEngine, setNewEngine] = useState({ name: "", url: "", logo: "" });
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 获取搜索建议
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/suggestions?q=${encodeURIComponent(searchQuery)}&engine=${selectedEngine}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.slice(0, 8)); // 最多显示8个建议
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 防抖获取建议
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && !isPanelOpen) {
        fetchSuggestions(query);
      } else {
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedEngine, isPanelOpen]);

  // 点击外部关闭面板和建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果右键菜单打开，不关闭面板
      if (contextMenuOpen) return;
      
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
        setIsAddingEngine(false);
        setEditingEngine(null);
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenuOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = selectedSuggestionIndex >= 0 ? suggestions[selectedSuggestionIndex] : query;
    if (!searchQuery.trim()) return;
    
    const engine = searchEngines.find(e => e.id === selectedEngine);
    if (engine) {
      window.open(engine.url + encodeURIComponent(searchQuery.trim()), '_blank');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      case 'Tab':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          setQuery(suggestions[selectedSuggestionIndex]);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
    }
  };

  // 选择建议
  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  const handleAddEngine = () => {
    if (!newEngine.name.trim() || !newEngine.url.trim()) return;
    
    const id = newEngine.name.toLowerCase().replace(/\s+/g, '-');
    
    // 如果没有提供logo URL，尝试从搜索URL中提取域名来生成favicon URL
    let logoUrl = newEngine.logo.trim();
    if (!logoUrl) {
      try {
        const url = new URL(newEngine.url.trim());
        logoUrl = `${url.protocol}//${url.hostname}/favicon.ico`;
      } catch {
        logoUrl = "default"; // 使用默认图标标识
      }
    }
    
    const engine: SearchEngine = {
      id,
      name: newEngine.name.trim(),
      url: newEngine.url.trim(),
      logo: logoUrl
    };
    
    setSearchEngines([...searchEngines, engine]);
    setNewEngine({ name: "", url: "", logo: "" });
    setIsAddingEngine(false);
  };

  const handleRemoveEngine = (id: string) => {
    if (searchEngines.length <= 1) return; // 至少保留一个
    
    const updatedEngines = searchEngines.filter(e => e.id !== id);
    setSearchEngines(updatedEngines);
    
    // 如果删除的是当前选中的，切换到第一个
    if (selectedEngine === id) {
      setSelectedEngine(updatedEngines[0].id);
    }
  };

  const handleEditEngine = (engine: SearchEngine) => {
    setEditingEngine(engine);
    setNewEngine({ 
      name: engine.name, 
      url: engine.url, 
      logo: engine.logo === "default" ? "" : engine.logo 
    });
    setIsAddingEngine(false);
  };

  const handleUpdateEngine = () => {
    if (!editingEngine || !newEngine.name.trim() || !newEngine.url.trim()) return;
    
    // 如果没有提供logo URL，尝试从搜索URL中提取域名来生成favicon URL
    let logoUrl = newEngine.logo.trim();
    if (!logoUrl) {
      try {
        const url = new URL(newEngine.url.trim());
        logoUrl = `${url.protocol}//${url.hostname}/favicon.ico`;
      } catch {
        logoUrl = "default";
      }
    }
    
    const updatedEngines = searchEngines.map(e => 
      e.id === editingEngine.id 
        ? { ...e, name: newEngine.name.trim(), url: newEngine.url.trim(), logo: logoUrl }
        : e
    );
    
    setSearchEngines(updatedEngines);
    setEditingEngine(null);
    setNewEngine({ name: "", url: "", logo: "" });
  };

  const currentEngine = searchEngines.find(e => e.id === selectedEngine);

  return (
    <div className="relative w-full max-w-md" ref={panelRef}>
      <form onSubmit={handleSubmit} className="relative">
        {/* 搜索引擎选择器 */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
          <button
            type="button"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded transition-colors"
          >
            <SmallLogoDisplay logo={currentEngine?.logo || "default"} name={currentEngine?.name || ""} />
            <ChevronDownIcon className={cn(
              "w-3 h-3 text-white/60 transition-transform",
              isPanelOpen && "rotate-180"
            )} />
          </button>
        </div>

        {/* 搜索输入框 */}
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search the web..."
          autoCapitalize="off"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          className="pl-14 pr-16"
        />

        {/* 搜索按钮 */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <button
            type="submit"
            className={cn(
              buttonVariants({
                variant: "iconButton",
                size: "icon-xl",
              }),
              "h-11 w-11"
            )}
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-current" />
          </button>
        </div>
      </form>

      {/* 搜索建议下拉列表 */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && !isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full bg-primary/20 backdrop-blur-md border-2 border-white/50 rounded-lg overflow-hidden z-30"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  "px-4 py-3 cursor-pointer transition-colors text-white",
                  selectedSuggestionIndex === index
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                )}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedSuggestionIndex(index)}
              >
                <div className="flex items-center gap-3">
                  <MagnifyingGlassIcon className="w-4 h-4 text-white/60 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 搜索引擎管理面板 */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-primary/20 backdrop-blur-xs border-2 border-white/50 rounded-lg p-4 z-20"
          >
            {/* 搜索引擎网格 */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {searchEngines.map((engine) => (
                <ContextMenu 
                  key={engine.id}
                  onOpenChange={(open) => setContextMenuOpen(open)}
                >
                  <ContextMenuTrigger>
                    <div
                      className={cn(
                        "flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors",
                        selectedEngine === engine.id 
                          ? "bg-primary/30 text-white" 
                          : "hover:bg-white/10 text-white/80"
                      )}
                      onClick={() => {
                        if (!contextMenuOpen) {
                          setSelectedEngine(engine.id);
                          setIsPanelOpen(false);
                        }
                      }}
                    >
                      <LogoDisplay logo={engine.logo} name={engine.name} />
                      <span className="text-[10px] font-medium text-center leading-tight">{engine.name}</span>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="bg-primary/20 backdrop-blur-xs border-2 border-white/50 text-white">
                    <ContextMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEngine(engine);
                        setContextMenuOpen(false);
                      }}
                    >
                      <Pencil1Icon className="w-4 h-4 mr-2" />
                      编辑
                    </ContextMenuItem>
                    <ContextMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveEngine(engine.id);
                        setContextMenuOpen(false);
                      }}
                      disabled={searchEngines.length <= 1}
                      className={cn(
                        "text-destructive focus:text-destructive",
                        searchEngines.length <= 1 && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      删除
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              
              {/* 添加按钮 */}
              <div
                className="flex flex-col items-center p-2 rounded-lg cursor-pointer hover:bg-white/10 text-white/60 border-2 border-dashed border-white/30"
                onClick={() => {
                  setIsAddingEngine(true);
                  setEditingEngine(null);
                  setNewEngine({ name: "", url: "", logo: "" });
                }}
              >
                <PlusIcon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">添加</span>
              </div>
            </div>

            {/* 添加/编辑搜索引擎表单 */}
            {(isAddingEngine || editingEngine) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-white/20 pt-4 space-y-3"
              >
                <div className="text-sm font-medium text-white mb-2">
                  {editingEngine ? "编辑搜索引擎" : "添加搜索引擎"}
                </div>
                <Input
                  placeholder="搜索引擎名称"
                  value={newEngine.name}
                  onChange={(e) => setNewEngine({...newEngine, name: e.target.value})}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="搜索URL (包含 %s 或以 ?q= 结尾)"
                  value={newEngine.url}
                  onChange={(e) => setNewEngine({...newEngine, url: e.target.value})}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Logo URL (可选)"
                  value={newEngine.logo}
                  onChange={(e) => setNewEngine({...newEngine, logo: e.target.value})}
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={editingEngine ? handleUpdateEngine : handleAddEngine}
                    disabled={!newEngine.name.trim() || !newEngine.url.trim()}
                    className="h-8 px-3 text-sm"
                  >
                    {editingEngine ? "保存" : "添加"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingEngine(false);
                      setEditingEngine(null);
                      setNewEngine({ name: "", url: "", logo: "" });
                    }}
                    className="h-8 px-3 text-sm"
                  >
                    取消
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};