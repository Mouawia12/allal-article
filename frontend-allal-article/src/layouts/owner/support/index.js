/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import ImageIcon from "@mui/icons-material/Image";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

import OwnerLayout from "examples/LayoutContainers/OwnerLayout";
import {
  getTicketStats,
  supportMessages,
  supportTickets,
  ticketPriorityConfig,
  ticketStatusConfig,
} from "data/mock/supportMock";

function Attachment({ attachment }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, border: "1px solid #dee2e6", borderRadius: 2, px: 1.1, py: 0.65, background: attachment.type === "image" ? attachment.preview : "#fff" }}>
      {attachment.type === "audio" ? <VolumeUpIcon sx={{ fontSize: 16, color: "#17c1e8" }} /> : <ImageIcon sx={{ fontSize: 16, color: "#17c1e8" }} />}
      <Box sx={{ fontSize: 11, color: "#344767", fontWeight: 700 }}>{attachment.name}</Box>
      <Box sx={{ fontSize: 10, color: "#8392ab" }}>{attachment.size}</Box>
    </Box>
  );
}

function QueueItem({ ticket, selected, onSelect }) {
  const status = ticketStatusConfig[ticket.status] || ticketStatusConfig.open;
  const priority = ticketPriorityConfig[ticket.priority] || ticketPriorityConfig.normal;

  return (
    <Box
      onClick={() => onSelect(ticket.id)}
      sx={{
        p: 1.6,
        borderBottom: "1px solid #f0f2f5",
        cursor: "pointer",
        background: selected ? "#f0f7ff" : "#fff",
        "&:hover": { background: "#f8f9fa" },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.4 }}>
        <Box sx={{ fontSize: 12, fontWeight: 800, color: "#344767" }}>{ticket.tenantName}</Box>
        {ticket.unreadOwner > 0 && (
          <Box sx={{ minWidth: 18, height: 18, borderRadius: "50%", background: "#ea0606", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
            {ticket.unreadOwner}
          </Box>
        )}
      </Box>
      <Box sx={{ fontSize: 13, fontWeight: 700, color: "#344767" }}>{ticket.subject}</Box>
      <Box sx={{ fontSize: 11, color: "#8392ab", my: 0.7 }}>{ticket.id} · {ticket.openedBy} · {ticket.lastMessageAt}</Box>
      <Box sx={{ display: "flex", gap: 0.7, flexWrap: "wrap" }}>
        <Chip label={status.label} size="small" sx={{ height: 22, fontSize: 10, background: status.bg, color: status.color, fontWeight: 700 }} />
        <Chip label={priority.label} size="small" sx={{ height: 22, fontSize: 10, color: priority.color, fontWeight: 700 }} />
      </Box>
    </Box>
  );
}

function Stat({ label, value, color }) {
  return (
    <Card sx={{ flex: 1, minWidth: 150, p: 2 }}>
      <Box sx={{ fontSize: 12, color: "#8392ab", fontWeight: 700 }}>{label}</Box>
      <Box sx={{ fontSize: 25, color, fontWeight: 800, lineHeight: 1.2 }}>{value}</Box>
    </Card>
  );
}

export default function OwnerSupport() {
  const [tickets, setTickets] = useState(supportTickets);
  const [selectedTicketId, setSelectedTicketId] = useState(supportTickets[0].id);
  const [composer, setComposer] = useState("");
  const [messagesByTicket, setMessagesByTicket] = useState(supportMessages);
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) || tickets[0];
  const messages = messagesByTicket[selectedTicketId] || [];
  const stats = useMemo(() => getTicketStats(tickets), [tickets]);
  const isClosed = selectedTicket.status === "closed";

  const addSystemMessage = (body) => {
    setMessagesByTicket((current) => ({
      ...current,
      [selectedTicketId]: [
        ...(current[selectedTicketId] || []),
        {
          id: `sys-${Date.now()}`,
          senderType: "system",
          senderName: "النظام",
          body,
          createdAt: "الآن",
          attachments: [],
        },
      ],
    }));
  };

  const changeTicketStatus = (status) => {
    const statusLabel = ticketStatusConfig[status]?.label || status;
    setTickets((current) => current.map((ticket) => (
      ticket.id === selectedTicketId
        ? { ...ticket, status, lastMessageAt: "الآن", unreadTenant: status === "waiting_tenant" || status === "closed" ? ticket.unreadTenant + 1 : ticket.unreadTenant }
        : ticket
    )));
    addSystemMessage(`تم تغيير حالة التذكرة إلى: ${statusLabel}`);
  };

  const addMessage = (attachmentType = null) => {
    const text = composer.trim() || (attachmentType === "audio" ? "تسجيل صوتي من الدعم" : attachmentType === "image" ? "صورة توضيحية من الدعم" : "");
    if (!text || isClosed) return;

    const attachment = attachmentType
      ? {
        id: `att-${Date.now()}`,
        type: attachmentType,
        name: attachmentType === "audio" ? "owner-voice-note.m4a" : "support-reply.png",
        size: attachmentType === "audio" ? "00:25" : "260 KB",
        preview: "#f0fde4",
      }
      : null;

    setMessagesByTicket((current) => ({
      ...current,
      [selectedTicketId]: [
        ...(current[selectedTicketId] || []),
        {
          id: `msg-${Date.now()}`,
          senderType: "owner",
          senderName: "مالك المنصة",
          body: text,
          createdAt: "الآن",
          attachments: attachment ? [attachment] : [],
        },
      ],
    }));
    setTickets((current) => current.map((ticket) => (
      ticket.id === selectedTicketId
        ? { ...ticket, status: "waiting_tenant", lastMessageAt: "الآن", unreadTenant: ticket.unreadTenant + 1 }
        : ticket
    )));
    setComposer("");
  };

  return (
    <OwnerLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <Box>
            <Box sx={{ fontSize: 21, fontWeight: 800, color: "#344767" }}>تذاكر الدعم</Box>
            <Box sx={{ fontSize: 13, color: "#8392ab" }}>شات مباشر مع المشتركين مع صور وتسجيلات صوتية وإشعارات متابعة</Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label="SLA: 4 ساعات" sx={{ background: "#e3f8fd", color: "#17c1e8", fontWeight: 800 }} />
            <Chip label="فريق الدعم" sx={{ background: "#f5ecff", color: "#7928ca", fontWeight: 800 }} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <Stat label="مفتوحة" value={stats.open} color="#17c1e8" />
          <Stat label="عاجلة/عالية" value={stats.urgent} color="#fb8c00" />
          <Stat label="رسائل جديدة" value={stats.unreadOwner} color="#ea0606" />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "360px 1fr" }, gap: 2 }}>
          <Card sx={{ overflow: "hidden" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #eee", fontSize: 14, fontWeight: 800, color: "#344767" }}>قائمة التذاكر</Box>
            {tickets.map((ticket) => (
              <QueueItem key={ticket.id} ticket={ticket} selected={ticket.id === selectedTicketId} onSelect={setSelectedTicketId} />
            ))}
          </Card>

          <Card sx={{ minHeight: 640, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
              <Box>
                <Box sx={{ fontSize: 15, fontWeight: 800, color: "#344767" }}>{selectedTicket.subject}</Box>
                <Box sx={{ fontSize: 11, color: "#8392ab" }}>{selectedTicket.tenantName} · {selectedTicket.id} · فتحها {selectedTicket.openedBy}</Box>
              </Box>
              <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                <Chip label={ticketStatusConfig[selectedTicket.status]?.label} size="small" sx={{ background: ticketStatusConfig[selectedTicket.status]?.bg, color: ticketStatusConfig[selectedTicket.status]?.color, fontWeight: 700 }} />
                <Chip label={ticketPriorityConfig[selectedTicket.priority]?.label} size="small" sx={{ color: ticketPriorityConfig[selectedTicket.priority]?.color, fontWeight: 700 }} />
                {["closed", "resolved"].includes(selectedTicket.status) ? (
                  <Box component="button" onClick={() => changeTicketStatus("open")} sx={{ border: "1px solid #17c1e8", background: "#fff", color: "#17c1e8", borderRadius: 1.5, px: 1.1, py: 0.45, cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
                    إعادة فتح
                  </Box>
                ) : (
                  <Box component="button" onClick={() => changeTicketStatus("closed")} sx={{ border: "1px solid #ea060644", background: "#ffeaea", color: "#ea0606", borderRadius: 1.5, px: 1.1, py: 0.45, cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
                    إغلاق
                  </Box>
                )}
              </Box>
            </Box>

            <Box sx={{ flex: 1, p: 2, overflowY: "auto", background: "#f8f9fa" }}>
              {messages.map((message) => {
                const mine = message.senderType === "owner";
                const system = message.senderType === "system";
                return (
                  <Box key={message.id} sx={{ display: "flex", justifyContent: system ? "center" : mine ? "flex-end" : "flex-start", mb: 1.5 }}>
                    <Box sx={{ maxWidth: system ? "90%" : "72%", background: system ? "#fff3e0" : mine ? "#1a73e8" : "#fff", color: mine && !system ? "#fff" : "#344767", borderRadius: 2, p: 1.4, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                      <Box sx={{ fontSize: 10, opacity: 0.75, mb: 0.4 }}>{message.senderName} · {message.createdAt}</Box>
                      <Box sx={{ fontSize: 13, lineHeight: 1.7 }}>{message.body}</Box>
                      {message.attachments?.length > 0 && (
                        <Box sx={{ mt: 1, display: "flex", gap: 0.7, flexWrap: "wrap" }}>
                          {message.attachments.map((attachment) => <Attachment key={attachment.id} attachment={attachment} />)}
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ p: 1.5, borderTop: "1px solid #eee", display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title={isClosed ? "أعد فتح التذكرة لإرسال رد" : "إرسال صورة"}><span><IconButton disabled={isClosed} onClick={() => addMessage("image")}><ImageIcon /></IconButton></span></Tooltip>
              <Tooltip title={isClosed ? "أعد فتح التذكرة لإرسال رد" : "إرسال تسجيل صوتي"}><span><IconButton disabled={isClosed} onClick={() => addMessage("audio")}><MicIcon /></IconButton></span></Tooltip>
              <TextField size="small" fullWidth disabled={isClosed} placeholder={isClosed ? "أعد فتح التذكرة لإرسال رد..." : "اكتب رداً للمشترك..."} value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addMessage(); }} />
              <IconButton disabled={isClosed} onClick={() => addMessage()} sx={{ background: isClosed ? "#dee2e6" : "#17c1e8", color: "#fff", "&:hover": { background: isClosed ? "#dee2e6" : "#0ea5c9" } }}>
                <SendIcon />
              </IconButton>
            </Box>
          </Card>
        </Box>
      </Box>
    </OwnerLayout>
  );
}
