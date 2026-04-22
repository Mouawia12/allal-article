/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import ImageIcon from "@mui/icons-material/Image";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import {
  getTicketStats,
  supportMessages,
  supportTickets,
  ticketPriorityConfig,
  ticketStatusConfig,
} from "data/mock/supportMock";

function Attachment({ attachment }) {
  if (attachment.type === "audio") {
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, border: "1px solid #dee2e6", borderRadius: 2, px: 1.2, py: 0.7, background: "#fff" }}>
        <VolumeUpIcon sx={{ fontSize: 16, color: "#17c1e8" }} />
        <Box sx={{ fontSize: 11, color: "#344767", fontWeight: 700 }}>{attachment.name}</Box>
        <Box sx={{ fontSize: 10, color: "#8392ab" }}>{attachment.size}</Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, border: "1px solid #dee2e6", borderRadius: 2, px: 1.2, py: 0.7, background: attachment.preview || "#f8f9fa" }}>
      <ImageIcon sx={{ fontSize: 16, color: "#17c1e8" }} />
      <Box sx={{ fontSize: 11, color: "#344767", fontWeight: 700 }}>{attachment.name}</Box>
      <Box sx={{ fontSize: 10, color: "#8392ab" }}>{attachment.size}</Box>
    </Box>
  );
}

function TicketCard({ ticket, selected, onSelect }) {
  const status = ticketStatusConfig[ticket.status] || ticketStatusConfig.open;
  const priority = ticketPriorityConfig[ticket.priority] || ticketPriorityConfig.normal;

  return (
    <Box
      onClick={() => onSelect(ticket.id)}
      sx={{
        p: 1.5,
        borderBottom: "1px solid #f0f2f5",
        cursor: "pointer",
        background: selected ? "#f0f7ff" : "#fff",
        "&:hover": { background: "#f8f9fa" },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.6 }}>
        <Box sx={{ fontSize: 12, fontWeight: 800, color: "#344767" }}>{ticket.id}</Box>
        {ticket.unreadTenant > 0 && (
          <Box sx={{ minWidth: 18, height: 18, borderRadius: "50%", background: "#ea0606", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
            {ticket.unreadTenant}
          </Box>
        )}
      </Box>
      <Box sx={{ fontSize: 13, fontWeight: 700, color: "#344767", mb: 0.5 }}>{ticket.subject}</Box>
      <Box sx={{ fontSize: 11, color: "#8392ab", mb: 1 }}>{ticket.category} · آخر رد {ticket.lastMessageAt}</Box>
      <Box sx={{ display: "flex", gap: 0.7, flexWrap: "wrap" }}>
        <Chip label={status.label} size="small" sx={{ height: 22, fontSize: 10, background: status.bg, color: status.color, fontWeight: 700 }} />
        <Chip label={priority.label} size="small" sx={{ height: 22, fontSize: 10, color: priority.color, fontWeight: 700 }} />
      </Box>
    </Box>
  );
}

function NewTicketDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontWeight: 800 }}>فتح تذكرة دعم</Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <TextField size="small" label="عنوان المشكلة" fullWidth />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <Select size="small" defaultValue="orders">
              <MenuItem value="orders">الطلبيات</MenuItem>
              <MenuItem value="subscription">الاشتراك</MenuItem>
              <MenuItem value="printing">الطباعة</MenuItem>
              <MenuItem value="accounting">المحاسبة</MenuItem>
            </Select>
            <Select size="small" defaultValue="normal">
              <MenuItem value="low">منخفضة</MenuItem>
              <MenuItem value="normal">عادية</MenuItem>
              <MenuItem value="high">عالية</MenuItem>
              <MenuItem value="urgent">عاجلة</MenuItem>
            </Select>
          </Box>
          <TextField size="small" label="اكتب التفاصيل" fullWidth multiline rows={4} />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip icon={<ImageIcon />} label="إرفاق صورة" variant="outlined" />
            <Chip icon={<MicIcon />} label="إرسال تسجيل صوتي" variant="outlined" />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Box component="button" onClick={onClose} sx={{ border: "1px solid #dee2e6", background: "#fff", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 12, color: "#8392ab", fontWeight: 700 }}>إلغاء</Box>
        <Box component="button" onClick={onClose} sx={{ border: "none", background: "linear-gradient(135deg, #17c1e8, #0ea5c9)", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 12, color: "#fff", fontWeight: 800 }}>فتح التذكرة</Box>
      </DialogActions>
    </Dialog>
  );
}

export default function SupportCenter() {
  const [tickets, setTickets] = useState(supportTickets);
  const [selectedTicketId, setSelectedTicketId] = useState(supportTickets[0].id);
  const [composer, setComposer] = useState("");
  const [messagesByTicket, setMessagesByTicket] = useState(supportMessages);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
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
        ? { ...ticket, status, lastMessageAt: "الآن", unreadOwner: status === "open" ? ticket.unreadOwner + 1 : ticket.unreadOwner }
        : ticket
    )));
    addSystemMessage(`تم تغيير حالة التذكرة إلى: ${statusLabel}`);
  };

  const addMessage = (attachmentType = null) => {
    const text = composer.trim() || (attachmentType === "audio" ? "تسجيل صوتي جديد" : attachmentType === "image" ? "صورة مرفقة" : "");
    if (!text || isClosed) return;

    const attachment = attachmentType
      ? {
        id: `att-${Date.now()}`,
        type: attachmentType,
        name: attachmentType === "audio" ? "voice-note.m4a" : "support-image.png",
        size: attachmentType === "audio" ? "00:18" : "310 KB",
        preview: "#e3f8fd",
      }
      : null;

    setMessagesByTicket((current) => ({
      ...current,
      [selectedTicketId]: [
        ...(current[selectedTicketId] || []),
        {
          id: `msg-${Date.now()}`,
          senderType: "tenant",
          senderName: "أنت",
          body: text,
          createdAt: "الآن",
          attachments: attachment ? [attachment] : [],
        },
      ],
    }));
    setTickets((current) => current.map((ticket) => (
      ticket.id === selectedTicketId
        ? { ...ticket, status: "waiting_owner", lastMessageAt: "الآن", unreadOwner: ticket.unreadOwner + 1 }
        : ticket
    )));
    setComposer("");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap" mb={3}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">الدعم</SoftTypography>
            <SoftTypography variant="caption" color="secondary">افتح تذكرة وتواصل مع مالك المنصة عبر شات يدعم الصور والتسجيلات الصوتية</SoftTypography>
          </SoftBox>
          <Box component="button" onClick={() => setNewTicketOpen(true)} sx={{ border: "none", background: "linear-gradient(135deg, #17c1e8, #0ea5c9)", color: "#fff", borderRadius: 2, px: 2, py: 1, cursor: "pointer", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 0.7 }}>
            <AddIcon sx={{ fontSize: 16 }} /> تذكرة جديدة
          </Box>
        </SoftBox>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" }, gap: 2 }}>
          <Card sx={{ overflow: "hidden" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #eee", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Box><Box sx={{ fontSize: 20, fontWeight: 800, color: "#17c1e8" }}>{stats.open}</Box><Box sx={{ fontSize: 11, color: "#8392ab" }}>تذاكر مفتوحة</Box></Box>
              <Box><Box sx={{ fontSize: 20, fontWeight: 800, color: "#ea0606" }}>{stats.unreadTenant}</Box><Box sx={{ fontSize: 11, color: "#8392ab" }}>ردود جديدة</Box></Box>
            </Box>
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} selected={ticket.id === selectedTicketId} onSelect={setSelectedTicketId} />
            ))}
          </Card>

          <Card sx={{ minHeight: 620, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
              <Box>
                <Box sx={{ fontSize: 15, fontWeight: 800, color: "#344767" }}>{selectedTicket.subject}</Box>
                <Box sx={{ fontSize: 11, color: "#8392ab" }}>{selectedTicket.id} · {selectedTicket.category} · {selectedTicket.createdAt}</Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label={ticketStatusConfig[selectedTicket.status]?.label} size="small" sx={{ background: ticketStatusConfig[selectedTicket.status]?.bg, color: ticketStatusConfig[selectedTicket.status]?.color, fontWeight: 700 }} />
                {["closed", "resolved"].includes(selectedTicket.status) ? (
                  <Box component="button" onClick={() => changeTicketStatus("open")} sx={{ border: "1px solid #17c1e8", background: "#fff", color: "#17c1e8", borderRadius: 1.5, px: 1.2, py: 0.5, cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
                    إعادة فتح
                  </Box>
                ) : (
                  <Box component="button" onClick={() => changeTicketStatus("closed")} sx={{ border: "1px solid #ea060644", background: "#ffeaea", color: "#ea0606", borderRadius: 1.5, px: 1.2, py: 0.5, cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
                    إغلاق التذكرة
                  </Box>
                )}
              </Box>
            </Box>

            <Box sx={{ flex: 1, p: 2, background: "#f8f9fa", overflowY: "auto" }}>
              {messages.map((message) => {
                const mine = message.senderType === "tenant";
                const system = message.senderType === "system";
                return (
                  <Box key={message.id} sx={{ display: "flex", justifyContent: system ? "center" : mine ? "flex-end" : "flex-start", mb: 1.5 }}>
                    <Box sx={{ maxWidth: system ? "90%" : "72%", background: system ? "#fff3e0" : mine ? "#17c1e8" : "#fff", color: mine && !system ? "#fff" : "#344767", borderRadius: 2, p: 1.4, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
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
              <Tooltip title={isClosed ? "أعد فتح التذكرة لإرسال رسالة" : "إرفاق صورة"}><span><IconButton disabled={isClosed} onClick={() => addMessage("image")}><ImageIcon /></IconButton></span></Tooltip>
              <Tooltip title={isClosed ? "أعد فتح التذكرة لإرسال رسالة" : "تسجيل صوتي"}><span><IconButton disabled={isClosed} onClick={() => addMessage("audio")}><MicIcon /></IconButton></span></Tooltip>
              <TextField size="small" fullWidth disabled={isClosed} placeholder={isClosed ? "أعد فتح التذكرة لإرسال رسالة..." : "اكتب رسالة للدعم..."} value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addMessage(); }} />
              <IconButton disabled={isClosed} onClick={() => addMessage()} sx={{ background: isClosed ? "#dee2e6" : "#17c1e8", color: "#fff", "&:hover": { background: isClosed ? "#dee2e6" : "#0ea5c9" } }}>
                <SendIcon />
              </IconButton>
            </Box>
          </Card>
        </Box>
      </SoftBox>
      <NewTicketDialog open={newTicketOpen} onClose={() => setNewTicketOpen(false)} />
      <Footer />
    </DashboardLayout>
  );
}
