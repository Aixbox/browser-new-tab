import { useState } from "react";
import { 
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { 
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";

const ANIMATION_DURATION_MS = 750;

// 完全复制官方示例的简单数据
const initialItems = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

function Item({ id }: { id: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({
    id,
    transition: { duration: ANIMATION_DURATION_MS, easing: "ease" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0 : 1,
      }}
    >
      <motion.div
        layoutId={id}
        style={{
          width: "80px",
          height: "80px",
          backgroundColor: id,
          borderRadius: "12px",
          cursor: "grab",
        }}
        transition={{
          type: "spring",
          duration: isDragging 
            ? ANIMATION_DURATION_MS / 1000 
            : (ANIMATION_DURATION_MS / 1000) * 3
        }}
        {...attributes}
        {...listeners}
      />
    </div>
  );
}

export default function TestMinimal() {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  function handleDragStart({ active }: any) {
    setActiveId(active.id);
  }

  function handleDragOver({ active, over }: any) {
    if (!over) return;
    
    setItems((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function handleDragEnd() {
    setActiveId(null);
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ color: "white", marginBottom: "20px" }}>Minimal Test</h1>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 80px)",
              gap: "16px",
            }}
          >
            {items.map((id) => (
              <Item key={id} id={id} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
