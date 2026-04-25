/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";

import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import ImageIcon from "@mui/icons-material/Image";
import LockIcon from "@mui/icons-material/Lock";
import MicIcon from "@mui/icons-material/Mic";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
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

// ─── helpers ─────────────────────────────────────────────────────────────────
const categoryEmoji = {
  الطلبيات: "📦",
  الاشتراك: "💳",
  الطباعة: "🖨️",
  المحاسبة: "📊",
  المخزون: "🏭",
  التقنية: "⚙️",
};

const priorityBorder = { urgent: "#ea0606", high: "#fb8c00", normal: "#17c1e8", low: "#adb5bd" };

function formatTime(str) { return str; }

// ─── Attachment bubble ────────────────────────────────────────────────────────
function Attachment({ attachment, mine }) {
  if (attachment.type === "audio") {
    return (
      <Box sx={{
        display: "inline-flex", alignItems: "center", gap: 1,
        border: `1px solid ${mine ? "rgba(255,255,255,0.35)" : "#e2e8f0"}`,
        borderRadius: 3, px: 1.5, py: 0.8,
        background: mine ? "rgba(255,255,255,0.15)" : "#f1f5f9",
      }}>
        <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: mine ? "rgba(255,255,255,0.25)" : "#17c1e822", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <VolumeUpIcon sx={{ fontSize: 14, color: mine ? "#fff" : "#17c1e8" }} />
        </Box>
        <Box>
          <Box sx={{ fontSize: 11, fontWeight: 700, color: mine ? "#fff" : "#334155" }}>{attachment.name}</Box>
          <Box sx={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>{attachment.size}</Box>
        </Box>
      </Box>
    );
  }
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", gap: 1,
      border: `1px solid ${mine ? "rgba(255,255,255,0.35)" : "#e2e8f0"}`,
      borderRadius: 3, px: 1.5, py: 0.8,
      background: mine ? "rgba(255,255,255,0.15)" : "#f1f5f9",
    }}>
      <Box sx={{ width: 28, height: 28, borderRadius: 1.5, background: mine ? "rgba(255,255,255,0.25)" : "#17c1e822", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ImageIcon sx={{ fontSize: 14, color: mine ? "#fff" : "#17c1e8" }} />
      </Box>
      <Box>
        <Box sx={{ fontSize: 11, fontWeight: 700, color: mine ? "#fff" : "#334155" }}>{attachment.name}</Box>
        <Box sx={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>{attachment.size}</Box>
      </Box>
    </Box>
  );
}

// ─── Ticket card ──────────────────────────────────────────────────────────────
function TicketCard({ ticket, selected, onSelect }) {
  const status = ticketStatusConfig[ticket.status] || ticketStatusConfig.open;
  const priority = ticketPriorityConfig[ticket.priority] || ticketPriorityConfig.normal;
  const borderColor = priorityBorder[ticket.priority] || "#adb5bd";
  const emoji = categoryEmoji[ticket.category] || "🎫";

  return (
    <Box
      onClick={() => onSelect(ticket.id)}
      sx={{
        display: "flex", gap: 1.5, px: 2, py: 1.8,
        borderBottom: "1px solid #f1f5f9",
        borderRight: `3px solid ${selected ? borderColor : "transparent"}`,
        cursor: "pointer",
        background: selected ? `${borderColor}09` : "#fff",
        transition: "all 0.15s",
        "&:hover": { background: selected ? `${borderColor}09` : "#f8fafc" },
      }}
    >
      {/* Category avatar */}
      <Box sx={{
        width: 40, height: 40, borderRadius: 2.5, flexShrink: 0,
        background: selected ? `${borderColor}18` : "#f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>
        {emoji}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 0.5, mb: 0.3 }}>
          <Box sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b", lineHeight: 1.3, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ticket.subject}
          </Box>
          {ticket.unreadTenant > 0 && (
            <Box sx={{ minWidth: 18, height: 18, borderRadius: 9, background: "#ea0606", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {ticket.unreadTenant}
            </Box>
          )}
        </Box>
        <Box sx={{ fontSize: 11, color: "#94a3b8", mb: 0.8 }}>
          {ticket.id} · {ticket.lastMessageAt}
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          <Chip
            label={status.label}
            size="small"
            sx={{ height: 18, fontSize: 9, fontWeight: 700, px: 0.3, background: status.bg, color: status.color }}
          />
          <Chip
            label={priority.label}
            size="small"
            sx={{ height: 18, fontSize: 9, fontWeight: 700, px: 0.3, background: `${borderColor}18`, color: borderColor }}
          />
        </Box>
      </Box>
    </Box>
  );
}

// ─── Chat message ─────────────────────────────────────────────────────────────
function ChatMessage({ message }) {
  const mine = message.senderType === "tenant";
  const system = message.senderType === "system";

  if (system) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 1.5 }}>
        <Box sx={{
          display: "inline-flex", alignItems: "center", gap: 0.7,
          background: "#f1f5f9", borderRadius: 20,
          px: 1.5, py: 0.5,
        }}>
          <CheckCircleIcon sx={{ fontSize: 12, color: "#64748b" }} />
          <Box sx={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{message.body}</Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: "flex",
      flexDirection: mine ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: 1,
      mb: 1.5,
    }}>
      {/* Avatar */}
      {!mine && (
        <Avatar sx={{ width: 30, height: 30, background: "linear-gradient(135deg, #667eea, #764ba2)", flexShrink: 0, fontSize: 13 }}>
          <SupportAgentIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}

      {/* Bubble */}
      <Box sx={{ maxWidth: "68%" }}>
        {!mine && (
          <Box sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, mb: 0.4, pr: 0.5 }}>
            {message.senderName}
          </Box>
        )}
        <Box sx={{
          background: mine
            ? "linear-gradient(135deg, #17c1e8 0%, #0ea5c9 100%)"
            : "#ffffff",
          color: mine ? "#fff" : "#1e293b",
          borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          px: 1.8, py: 1.2,
          boxShadow: mine
            ? "0 4px 15px rgba(23,193,232,0.35)"
            : "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <Box sx={{ fontSize: 13, lineHeight: 1.7, wordBreak: "break-word" }}>
            {message.body}
          </Box>
          {message.attachments?.length > 0 && (
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.6 }}>
              {message.attachments.map((att) => (
                <Attachment key={att.id} attachment={att} mine={mine} />
              ))}
            </Box>
          )}
        </Box>
        <Box sx={{
          display: "flex",
          justifyContent: mine ? "flex-end" : "flex-start",
          alignItems: "center",
          gap: 0.4, mt: 0.4, px: 0.5,
        }}>
          <Box sx={{ fontSize: 10, color: "#94a3b8" }}>{formatTime(message.createdAt)}</Box>
          {mine && <DoneAllIcon sx={{ fontSize: 12, color: "#17c1e8" }} />}
        </Box>
      </Box>
    </Box>
  );
}

// ─── New ticket dialog ────────────────────────────────────────────────────────
function NewTicketDialog({ open, onClose }) {
  const [category, setCategory] = useState("orders");
  const [priority, setPriority] = useState("normal");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #17c1e8, #0ea5c9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HeadsetMicIcon sx={{ fontSize: 18, color: "#fff" }} />
            </Box>
            <Box>
              <Box sx={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>تذكرة دعم جديدة</Box>
              <Box sx={{ fontSize: 11, color: "#94a3b8" }}>سيتم الرد خلال 24 ساعة</Box>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ background: "#f1f5f9" }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            size="small" label="عنوان المشكلة" fullWidth
            placeholder="اكتب وصفاً مختصراً للمشكلة..."
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>القسم</InputLabel>
              <Select value={category} onChange={(e) => setCategory(e.target.value)} label="القسم" sx={{ borderRadius: 2 }}>
                <MenuItem value="orders">📦 الطلبيات</MenuItem>
                <MenuItem value="subscription">💳 الاشتراك</MenuItem>
                <MenuItem value="printing">🖨️ الطباعة</MenuItem>
                <MenuItem value="accounting">📊 المحاسبة</MenuItem>
                <MenuItem value="inventory">🏭 المخزون</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>الأولوية</InputLabel>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)} label="الأولوية" sx={{ borderRadius: 2 }}>
                <MenuItem value="low">🟢 منخفضة</MenuItem>
                <MenuItem value="normal">🔵 عادية</MenuItem>
                <MenuItem value="high">🟠 عالية</MenuItem>
                <MenuItem value="urgent">🔴 عاجلة</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField
            size="small" label="تفاصيل المشكلة" fullWidth multiline rows={4}
            placeholder="اشرح المشكلة بالتفصيل حتى نتمكن من مساعدتك بشكل أسرع..."
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              icon={<ImageIcon sx={{ fontSize: "14px !important" }} />}
              label="إرفاق صورة"
              variant="outlined"
              clickable
              sx={{ fontSize: 11, borderRadius: 2, borderColor: "#e2e8f0", color: "#64748b" }}
            />
            <Chip
              icon={<MicIcon sx={{ fontSize: "14px !important" }} />}
              label="تسجيل صوتي"
              variant="outlined"
              clickable
              sx={{ fontSize: 11, borderRadius: 2, borderColor: "#e2e8f0", color: "#64748b" }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1, borderTop: "1px solid #f1f5f9" }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small" onClick={onClose}
          sx={{ px: 3, borderRadius: 2, background: "linear-gradient(135deg, #17c1e8, #0ea5c9)" }}>
          فتح التذكرة
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SupportCenter() {
  const [tickets, setTickets] = useState(supportTickets);
  const [selectedTicketId, setSelectedTicketId] = useState(supportTickets[0].id);
  const [composer, setComposer] = useState("");
  const [messagesByTicket, setMessagesByTicket] = useState(supportMessages);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");

  const messagesEndRef = useRef(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];
  const messages = messagesByTicket[selectedTicketId] || [];
  const stats = useMemo(() => getTicketStats(tickets), [tickets]);
  const isClosed = selectedTicket.status === "closed";

  const filteredTickets = useMemo(() => {
    const q = ticketSearch.trim();
    if (!q) return tickets;
    return tickets.filter((t) =>
      t.subject.includes(q) || t.id.includes(q) || t.category.includes(q)
    );
  }, [tickets, ticketSearch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addSystemMessage = (body) => {
    setMessagesByTicket((cur) => ({
      ...cur,
      [selectedTicketId]: [
        ...(cur[selectedTicketId] || []),
        { id: `sys-${Date.now()}`, senderType: "system", senderName: "النظام", body, createdAt: "الآن", attachments: [] },
      ],
    }));
  };

  const changeTicketStatus = (status) => {
    const label = ticketStatusConfig[status]?.label || status;
    setTickets((cur) => cur.map((t) =>
      t.id === selectedTicketId
        ? { ...t, status, lastMessageAt: "الآن", unreadOwner: status === "open" ? t.unreadOwner + 1 : t.unreadOwner }
        : t
    ));
    addSystemMessage(`تم تغيير حالة التذكرة إلى: ${label}`);
  };

  const addMessage = (attachmentType = null) => {
    const text = composer.trim() || (attachmentType === "audio" ? "تسجيل صوتي جديد" : attachmentType === "image" ? "صورة مرفقة" : "");
    if (!text || isClosed) return;
    const attachment = attachmentType ? {
      id: `att-${Date.now()}`,
      type: attachmentType,
      name: attachmentType === "audio" ? "voice-note.m4a" : "support-image.png",
      size: attachmentType === "audio" ? "00:18" : "310 KB",
    } : null;

    setMessagesByTicket((cur) => ({
      ...cur,
      [selectedTicketId]: [
        ...(cur[selectedTicketId] || []),
        { id: `msg-${Date.now()}`, senderType: "tenant", senderName: "أنت", body: text, createdAt: "الآن", attachments: attachment ? [attachment] : [] },
      ],
    }));
    setTickets((cur) => cur.map((t) =>
      t.id === selectedTicketId
        ? { ...t, status: "waiting_owner", lastMessageAt: "الآن", unreadOwner: t.unreadOwner + 1 }
        : t
    ));
    setComposer("");
  };

  const statusCfg = ticketStatusConfig[selectedTicket.status] || ticketStatusConfig.open;
  const emoji = categoryEmoji[selectedTicket.category] || "🎫";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* ── Page header ── */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
          <Box>
            <SoftTypography variant="h5" fontWeight="bold">مركز الدعم</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              تواصل مع فريق الدعم عبر نظام التذاكر · يدعم الصور والتسجيلات الصوتية
            </SoftTypography>
          </Box>
          <SoftButton
            variant="gradient" color="info" startIcon={<AddIcon />}
            onClick={() => setNewTicketOpen(true)}
            sx={{ borderRadius: 2.5, px: 2.5 }}
          >
            تذكرة جديدة
          </SoftButton>
        </Box>

        {/* ── Stats row ── */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: "مفتوحة", value: stats.open, color: "#17c1e8", bg: "#e3f8fd" },
            { label: "ردود جديدة", value: stats.unreadTenant, color: "#ea0606", bg: "#ffeaea" },
            { label: "في الانتظار", value: tickets.filter((t) => t.status === "waiting_tenant").length, color: "#fb8c00", bg: "#fff3e0" },
            { label: "مغلقة", value: tickets.filter((t) => t.status === "closed").length, color: "#8392ab", bg: "#f1f5f9" },
          ].map((s) => (
            <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 1, background: s.bg, borderRadius: 2.5, px: 2, py: 1 }}>
              <Box sx={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Box>
              <Box sx={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</Box>
            </Box>
          ))}
        </Box>

        {/* ── Main layout ── */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" }, gap: 2, minHeight: 620 }}>

          {/* ── Left: Ticket list ── */}
          <Card sx={{ overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 3 }}>
            {/* Search */}
            <Box sx={{ p: 1.5, borderBottom: "1px solid #f1f5f9" }}>
              <TextField
                size="small" fullWidth placeholder="بحث في التذاكر..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} /></InputAdornment>,
                  sx: { borderRadius: 2.5, background: "#f8fafc" },
                }}
              />
            </Box>

            {/* List */}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  selected={ticket.id === selectedTicketId}
                  onSelect={setSelectedTicketId}
                />
              ))}
              {filteredTickets.length === 0 && (
                <Box sx={{ textAlign: "center", py: 6, color: "#94a3b8", fontSize: 13 }}>
                  لا توجد تذاكر مطابقة
                </Box>
              )}
            </Box>
          </Card>

          {/* ── Right: Chat panel ── */}
          <Card sx={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 3 }}>

            {/* Chat header */}
            <Box sx={{
              px: 2.5, py: 1.8,
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {emoji}
                </Box>
                <Box>
                  <Box sx={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                    {selectedTicket.subject}
                  </Box>
                  <Box sx={{ fontSize: 11, color: "#94a3b8", mt: 0.2 }}>
                    {selectedTicket.id} · {selectedTicket.category}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={statusCfg.label}
                  size="small"
                  sx={{ height: 22, fontSize: 10, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color }}
                />
                {["closed", "resolved"].includes(selectedTicket.status) ? (
                  <Tooltip title="إعادة فتح التذكرة">
                    <IconButton size="small" onClick={() => changeTicketStatus("open")}
                      sx={{ background: "rgba(255,255,255,0.1)", color: "#fff", "&:hover": { background: "rgba(255,255,255,0.2)" } }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="إغلاق التذكرة">
                    <IconButton size="small" onClick={() => changeTicketStatus("closed")}
                      sx={{ background: "rgba(234,6,6,0.2)", color: "#ea0606", "&:hover": { background: "rgba(234,6,6,0.3)" } }}>
                      <LockIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Messages area */}
            <Box sx={{
              flex: 1, overflowY: "auto", p: 2,
              background: "radial-gradient(circle at 1px 1px, #e2e8f022 1px, transparent 0) 0 0 / 20px 20px, #f8fafc",
              minHeight: 400,
            }}>
              {/* Date separator */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <Box sx={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                <Box sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {selectedTicket.createdAt}
                </Box>
                <Box sx={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              </Box>

              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Closed notice */}
              {isClosed && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, background: "#ffeaea", borderRadius: 20, px: 2, py: 0.8 }}>
                    <LockIcon sx={{ fontSize: 13, color: "#ea0606" }} />
                    <Box sx={{ fontSize: 11, color: "#ea0606", fontWeight: 600 }}>التذكرة مغلقة — أعد فتحها للرد</Box>
                  </Box>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Composer */}
            <Box sx={{
              p: 1.5, borderTop: "1px solid #f1f5f9",
              background: "#fff",
              display: "flex", alignItems: "flex-end", gap: 1,
            }}>
              {/* Attach buttons */}
              <Tooltip title={isClosed ? "أعد فتح التذكرة أولاً" : "إرفاق صورة"}>
                <span>
                  <IconButton
                    size="small" disabled={isClosed}
                    onClick={() => addMessage("image")}
                    sx={{ color: "#94a3b8", "&:hover": { color: "#17c1e8", background: "#e3f8fd" } }}
                  >
                    <ImageIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={isClosed ? "أعد فتح التذكرة أولاً" : "تسجيل صوتي"}>
                <span>
                  <IconButton
                    size="small" disabled={isClosed}
                    onClick={() => addMessage("audio")}
                    sx={{ color: "#94a3b8", "&:hover": { color: "#17c1e8", background: "#e3f8fd" } }}
                  >
                    <MicIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Text input */}
              <TextField
                size="small" fullWidth multiline maxRows={4}
                disabled={isClosed}
                placeholder={isClosed ? "التذكرة مغلقة..." : "اكتب رسالتك هنا..."}
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addMessage(); } }}
                InputProps={{
                  sx: {
                    borderRadius: 3,
                    background: "#f8fafc",
                    "& fieldset": { border: "1px solid #e2e8f0" },
                    "&:hover fieldset": { borderColor: "#17c1e8" },
                    "&.Mui-focused fieldset": { borderColor: "#17c1e8" },
                  },
                }}
              />

              {/* Send button */}
              <IconButton
                disabled={isClosed}
                onClick={() => addMessage()}
                sx={{
                  width: 38, height: 38, flexShrink: 0,
                  background: isClosed ? "#e2e8f0" : "linear-gradient(135deg, #17c1e8, #0ea5c9)",
                  color: isClosed ? "#94a3b8" : "#fff",
                  borderRadius: 2.5,
                  "&:hover": { background: isClosed ? "#e2e8f0" : "linear-gradient(135deg, #0ea5c9, #0284a8)", transform: isClosed ? "none" : "scale(1.05)" },
                  transition: "all 0.2s",
                  boxShadow: isClosed ? "none" : "0 4px 12px rgba(23,193,232,0.35)",
                }}
              >
                <SendIcon sx={{ fontSize: 17 }} />
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
