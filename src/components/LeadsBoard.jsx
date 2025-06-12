import React, { useState } from "react";
import { DndContext, useSensor, useSensors, MouseSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import CardLead from "./CardLead"; // importa seu componente
import "./LeadsBoard.css";         // se quiser customizar o layout do board

// Wrapper para cada card com drag
const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "10px",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
    className={attributes["aria-pressed"]? "card dragging":"card"}
    >
      {children}
    </div>
  );
};

const LeadsBoard = () => {
  const [leads, setLeads] = useState([
    { id: "1", nome: "João", veiculo: "Civic", temperaturaInicial: "frio" },
    { id: "2", nome: "Maria", veiculo: "Gol", temperaturaInicial: "morno" },
    { id: "3", nome: "Pedro", veiculo: "Fiesta", temperaturaInicial: "quente" },
  ]);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = leads.findIndex((l) => l.id === active.id);
      const newIndex = leads.findIndex((l) => l.id === over.id);

      setLeads((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="leads-board">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableItem key={lead.id} id={lead.id}>
              <CardLead {...lead} />
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default LeadsBoard;