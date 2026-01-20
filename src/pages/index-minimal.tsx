import { useState, useCallback } from "react";
import { 
  DndContext,
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCenter,
  DragOverlay,
  defaultDropAnimation,
} from "@dnd-kit/core";
import { 
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableItem } from "@/components/draggable-item";
import builtinIcons from "@/json/index";
import type { GridItem } from "@/lib/grid-model";

const ANIMATION_DURATION_MS = 750;

// 完全模仿官方示例的最小化版本
export default function HomeMinimal() {
  // 初始化数据
  const initialItems = builtinIcons.map((item, index) => ({
    ...item,
    iconType: item.iconType as "logo" | "image" | "text",
    id: `${item.id}-${Date.now()}-${index}`,
  }));

  const initialIds = initialItems.map(item => item.id);
  const initialMap: Record<string, GridItem> = {};
  initialItems.forEach(item => {
    initialMap[item.id] = item;
  });

  const [itemIds, setItemIds] = useState<string[]>(initialIds);
  const [itemsMap] = useState<Record<string, GridItem>>(initialMap);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  // 完全模仿官方示例的 handlers
  const handleDragStart = useCallback((event: any) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: any) => {
    const { over, active } = event;
    if (!over || !active) return;
    
    setItemIds((itemIds) => {
      const oldIndex = itemIds.indexOf(active.id);
      const newIndex = itemIds.indexOf(over.id);
      
      if (oldIndex === newIndex) {
        return itemIds;
      }
      
      return arrayMove(itemIds, oldIndex, newIndex);
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setActiveId(null);
  }, []);

  const iconStyle = {
    size: 80,
    borderRadius: 12,
    opacity: 100,
    spacing: 16,
    showName: true,
    nameSize: 12,
    nameColor: '#ffffff',
    maxWidth: 1500,
    dockShowName: false,
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full w-full flex items-center justify-center p-8">
          <div style={{ maxWidth: '1500px', width: '100%' }}>
            <SortableContext items={itemIds} strategy={rectSortingStrategy}>
              <div
                className="grid w-full"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, 80px)`,
                  gap: '16px',
                }}
              >
                {itemIds.map((id) => {
                  const item = itemsMap[id];
                  if (!item || 'items' in item) return null;
                  
                  return (
                    <DraggableItem
                      key={id}
                      id={id}
                      item={item as any}
                      iconStyle={iconStyle}
                      openInNewTab={true}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </div>
        </div>

        <DragOverlay
          dropAnimation={{
            ...defaultDropAnimation,
            duration: ANIMATION_DURATION_MS / 2,
          }}
        >
          {activeId ? (
            <div className="opacity-50">
              Dragging: {activeId}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
