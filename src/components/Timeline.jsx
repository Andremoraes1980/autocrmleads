import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";

import { MessageSquare, MoveRight, Zap, Phone, Paperclip, Calendar } from "lucide-react";

// Ícones por tipo de evento
const icons = {
  mensagem: <MessageSquare size={18} className="text-muted-foreground" />,
  etapa: <MoveRight size={18} className="text-blue-500" />,
  ia: <Zap size={18} className="text-purple-500" />,
  ligacao: <Phone size={18} className="text-green-600" />,
  anexo: <Paperclip size={18} className="text-blue-700" />,
  agendamento: <Calendar size={18} className="text-yellow-500" />,
};

function formatarDataHora(dt) {
  const d = new Date(dt);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function Timeline({ eventos = [], usuarios = {} }) {
  return (
    <div className="relative px-4 py-8">
      {/* Linha vertical da timeline */}
      <div className="absolute left-6 top-0 w-1 h-full bg-muted rounded-xl z-0" />
      <div className="flex flex-col gap-7">
        {eventos.map((ev, idx) => (
          <div key={ev.id} className="relative flex items-start">
            {/* Ícone circular na linha */}
            <div className="absolute left-0 top-1.5 z-10">
              <Avatar className="bg-background border border-muted shadow w-9 h-9">
                <AvatarFallback>
                  {icons[ev.tipo] || <MoveRight size={18} />}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Card do evento */}
            <div className="ml-12 flex-1">
              <Card className="rounded-2xl shadow-sm border-muted bg-white">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatarDataHora(ev.data_hora)}
                      {" · "}
                      <b>{usuarios[ev.autor_id]?.nome || "Sistema"}</b>
                    </span>
                    {/* Badge por tipo (opcional) */}
                    {ev.tipo === "etapa" && (
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                        Mudança de etapa
                      </Badge>
                    )}
                    {ev.tipo === "mensagem" && (
                      <Badge variant="secondary" className="text-xs">Mensagem</Badge>
                    )}
                    {ev.tipo === "ia" && (
                      <Badge variant="outline" className="text-xs text-purple-500 border-purple-200 bg-purple-50">
                        IA
                      </Badge>
                    )}
                  </div>
                  <div className={`mt-2 whitespace-pre-line font-medium ${ev.tipo === "ia" ? "text-purple-600" : "text-gray-700"}`}>
                    {/* Detalhes do evento */}
                    {ev.tipo === "etapa" && (
                      <>Mudou para <b>{ev.etapa_nova}</b>{ev.etapa_anterior && <> (de <b>{ev.etapa_anterior}</b>)</>}</>
                    )}
                    {ev.tipo === "mensagem" && ev.detalhes}
                    {ev.tipo === "ia" && <>IA: {ev.detalhes}</>}
                    {ev.tipo === "anexo" && <>Enviou anexo: <a className="text-blue-600 underline" href={ev.link} target="_blank" rel="noopener noreferrer">{ev.link}</a></>}
                  </div>
                  {ev.extra && ev.extra.info && (
                    <div className="text-xs text-muted-foreground mt-1">{ev.extra.info}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
