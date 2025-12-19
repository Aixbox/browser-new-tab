"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GlobeIcon, PlusIcon } from "@radix-ui/react-icons";

interface SearchEngine {
  id: string;
  name: string;
  url: string;
  logo: string;
}

// 可拖拽的搜索引擎项
const DraggableSearchItem = ({ engine, onSelect }: { 
  engine: SearchEngine; 
  onSelect: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: engine.id });

  const [hasError, setHasError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleError = () => {
    if (!useProxy) {
      setUseProxy(true);
    } else {
      setHasError(true);
    }
  };

  const imageUrl = useProxy ? `/api/icon?url=${encodeURIComponent(engine.logo)}` : engine.logo;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex flex-col items-center p-3 rounded-xl cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors group"
      onClick={() => onSelect(engine.id)}
    >
      <div className="w-12 h-12 mb-2 flex items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
        {engine.logo === "default" || hasError ? (
          <GlobeIcon className="w-6 h-6 text-white" />
        ) : (
          <img 
            src={imageUrl}
            alt={engine.name}
            className="w-8 h-8 rounded"
            onError={handleError}
          />
        )}
      </div>
      <span className="text-xs text-white/90 text-center font-medium leading-tight">
        {engine.name}
      </span>
    </div>
  );
};

// 添加新引擎的占位符
const AddEngineItem = ({ onClick }: { onClick: () => void }) => {
  return (
    <div
      className="flex flex-col items-center p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border-2 border-dashed border-white/30 hover:border-white/50"
      onClick={onClick}
    >
      <div className="w-12 h-12 mb-2 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
        <PlusIcon className="w-6 h-6 text-white/60" />
      </div>
      <span className="text-xs text-white/60 text-center font-medium">
        添加
      </span>
    </div>
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
  { 
    id: "github", 
    name: "GitHub", 
    url: "https://github.com/search?q=",
    logo: "https://github.com/favicon.ico"
  },
  { 
    id: "stackoverflow", 
    name: "Stack Overflow", 
    url: "https://stackoverflow.com/search?q=",
    logo: "https://stackoverflow.com/favicon.ico"
  },
];

export const DraggableSearchGrid = () => {
  const [searchEngines, setSearchEngines] = useState<SearchEngine[]>(defaultSearchEngines);
  const [selectedEngine, setSelectedEngine] = useState("google");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px的拖拽距离才开始拖拽，避免误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSearchEngines((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleEngineSelect = (engineId: string) => {
    setSelectedEngine(engineId);
    // 这里可以触发搜索或其他操作
    console.log('Selected engine:', engineId);
  };

  const handleAddEngine = () => {
    // 这里可以打开添加引擎的对话框
    console.log('Add new engine');
  };

  return (
    <div className="w-full max-w-2xl">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={searchEngines} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
            {searchEngines.map((engine) => (
              <DraggableSearchItem
                key={engine.id}
                engine={engine}
                onSelect={handleEngineSelect}
              />
            ))}
            <AddEngineItem onClick={handleAddEngine} />
          </div>
        </SortableContext>
      </DndContext>
      
      {/* 当前选中的引擎显示 */}
      <div className="mt-6 text-center">
        <p className="text-sm text-white/60">
          当前选中: <span className="text-white font-medium">
            {searchEngines.find(e => e.id === selectedEngine)?.name}
          </span>
        </p>
      </div>
    </div>
  );
};