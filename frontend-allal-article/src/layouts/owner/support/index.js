/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import FilterListIcon from "@mui/icons-material/FilterList";
import ImageIcon from "@mui/icons-material/Image";
import LockIcon from "@mui/icons-material/Lock";
import MicIcon from "@mui/icons-material/Mic";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

import OwnerLayout from "examples/LayoutContainers/OwnerLayout";
import {
  getTicketStats,
  supportMessages,
  supportTickets,
  ticketPriorityConfig,
  ticketStatusConfig,
} from "data/mock/supportMock";

// ─── helpers ─────────────────────────────────────────────────────────────────
const categoryEmoji = {
  الطلبيات: "📦", الاشتراك: "💳", الطباعة: "🖨️",
  المحاسبة: "📊", المخزون: "🏭", التقنية: "⚙️",
};
const priorityBorder = { urgent: "#ea0606", high: "#fb8c00", normal: "#17c1e8", low: "#adb5bd" };
const tenantColors = ["#17c1e8", "#7928ca", "#fb8c00", "#82d616", "#ea0606", "#344767"];

function getTenantColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return tenantColors[Math.abs(hash) % tenantColors.length];
}
function getInitials(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

// ─── Attachment ───────────────────────────────────────────────────────────────
function Attachment({ attachment, mine }) {
  const isAudio = attachment.type === "audio";
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", gap: 1,
      border: `1px solid ${mine ? "rgba(255,255,255,0.3)" : "#e2e8f0"}`,
      borderRadius: 3, px: 1.5, py: 0.8,
      background: mine ? "rgba(255,255,255,0.15)" : "#f1f5f9",
    }}>
      <Box sx={{ width: 28, height: 28, borderRadius: isAudio ? "50%" : 1.5, background: mine ? "rgba(255,255,255,0.25)" : "#7928ca18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isAudio
          ? <VolumeUpIcon sx={{ fontSize: 14, color: mine ? "#fff" : "#7928ca" }} />
          : <ImageIcon sx={{ fontSize: 14, color: mine ? "#fff" : "#7928ca" }} />
        }
      </Box>
      <Box>
        <Box sx={{ fontSize: 11, fontWeight: 700, color: mine ? "#fff" : "#334155" }}>{attachment.name}</Box>
        <Box sx={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.65)" : "#94a3b8" }}>{attachment.size}</Box>
      </Box>
    </Box>
  );
}

// ─── Queue item ───────────────────────────────────────────────────────────────
function QueueItem({ ticket, selected, onSelect }) {
  const status = ticketStatusConfig[ticket.status] || ticketStatusConfig.open;
  const priority = ticketPriorityConfig[ticket.priority] || ticketPriorityConfig.normal;
  const borderColor = priorityBorder[ticket.priority] || "#adb5bd";
  const emoji = categoryEmoji[ticket.category] || "🎫";
  const tenantColor = getTenantColor(ticket.tenantName);

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
      {/* Tenant avatar */}
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <Avatar sx={{ width: 40, height: 40, background: tenantColor, fontSize: 13, fontWeight: 700, borderRadius: 2.5 }}>
          {getInitials(ticket.tenantName)}
        </Avatar>
        {ticket.unreadOwner > 0 && (
          <Box sx={{
            position: "absolute", top: -4, left: -4,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "#ea0606", color: "#fff",
            fontSize: 9, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff",
          }}>
            {ticket.unreadOwner}
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 0.5, mb: 0.2 }}>
          <Box sx={{ fontSize: 12, fontWeight: 800, color: tenantColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ticket.tenantName}
          </Box>
          <Box sx={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>{ticket.lastMessageAt}</Box>
        </Box>
        <Box sx={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", mb: 0.7 }}>
          {ticket.subject}
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          <Chip label={status.label} size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700, px: 0.2, background: status.bg, color: status.color }} />
          <Chip label={priority.label} size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700, px: 0.2, background: `${borderColor}18`, color: borderColor }} />
          <Box sx={{ fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center" }}>{emoji}</Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Chat message ─────────────────────────────────────────────────────────────
function ChatMessage({ message, tenantName }) {
  const mine = message.senderType === "owner";
  const system = message.senderType === "system";
  const tenantColor = getTenantColor(tenantName);

  if (system) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 1.5 }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.7, background: "#f1f5f9", borderRadius: 20, px: 1.5, py: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 12, color: "#64748b" }} />
          <Box sx={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{message.body}</Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: mine ? "row-reverse" : "row", alignItems: "flex-end", gap: 1, mb: 1.5 }}>
      {/* Avatar */}
      {!mine ? (
        <Avatar sx={{ width: 30, height: 30, background: tenantColor, fontSize: 11, fontWeight: 700, flexShrink: 0, borderRadius: 2 }}>
          {getInitials(message.senderName)}
        </Avatar>
      ) : (
        <Avatar sx={{ width: 30, height: 30, background: "linear-gradient(135deg, #7928ca, #6366f1)", flexShrink: 0, fontSize: 13 }}>
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
            ? "linear-gradient(135deg, #7928ca 0%, #6366f1 100%)"
            : "#ffffff",
          color: mine ? "#fff" : "#1e293b",
          borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          px: 1.8, py: 1.2,
          boxShadow: mine
            ? "0 4px 15px rgba(121,40,202,0.3)"
            : "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <Box sx={{ fontSize: 13, lineHeight: 1.7, wordBreak: "break-word" }}>{message.body}</Box>
          {message.attachments?.length > 0 && (
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.6 }}>
              {message.attachments.map((att) => (
                <Attachment key={att.id} attachment={att} mine={mine} />
              ))}
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", alignItems: "center", gap: 0.4, mt: 0.4, px: 0.5 }}>
          <Box sx={{ fontSize: 10, color: "#94a3b8" }}>{message.createdAt}</Box>
          {mine && <DoneAllIcon sx={{ fontSize: 12, color: "#7928ca" }} />}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OwnerSupport() {
  const [tickets, setTickets] = useState(supportTickets);
  const [selectedTicketId, setSelectedTicketId] = useState(supportTickets[0].id);
  const [composer, setComposer] = useState("");
  const [messagesByTicket, setMessagesByTicket] = useState(supportMessages);
  const [ticketSearch, setTicketSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const messagesEndRef = useRef(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];
  const messages = messagesByTicket[selectedTicketId] || [];
  const stats = useMemo(() => getTicketStats(tickets), [tickets]);
  const isClosed = selectedTicket.status === "closed";

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch = !ticketSearch.trim() || t.tenantName.includes(ticketSearch) || t.subject.includes(ticketSearch) || t.id.includes(ticketSearch);
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [tickets, ticketSearch, filterStatus]);

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
        ? { ...t, status, lastMessageAt: "الآن", unreadTenant: ["waiting_tenant", "closed", "resolved"].includes(status) ? t.unreadTenant + 1 : t.unreadTenant }
        : t
    ));
    addSystemMessage(`تم تغيير حالة التذكرة إلى: ${label}`);
  };

  const addMessage = (attachmentType = null) => {
    const text = composer.trim() || (attachmentType === "audio" ? "تسجيل صوتي من الدعم" : attachmentType === "image" ? "صورة توضيحية من الدعم" : "");
    if (!text || isClosed) return;
    const attachment = attachmentType ? {
      id: `att-${Date.now()}`,
      type: attachmentType,
      name: attachmentType === "audio" ? "owner-voice.m4a" : "support-reply.png",
      size: attachmentType === "audio" ? "00:25" : "260 KB",
    } : null;

    setMessagesByTicket((cur) => ({
      ...cur,
      [selectedTicketId]: [
        ...(cur[selectedTicketId] || []),
        { id: `msg-${Date.now()}`, senderType: "owner", senderName: "فريق الدعم", body: text, createdAt: "الآن", attachments: attachment ? [attachment] : [] },
      ],
    }));
    setTickets((cur) => cur.map((t) =>
      t.id === selectedTicketId
        ? { ...t, status: "waiting_tenant", lastMessageAt: "الآن", unreadTenant: t.unreadTenant + 1 }
        : t
    ));
    setComposer("");
  };

  const statusCfg = ticketStatusConfig[selectedTicket.status] || ticketStatusConfig.open;
  const priorityCfg = ticketPriorityConfig[selectedTicket.priority] || ticketPriorityConfig.normal;
  const tenantColor = getTenantColor(selectedTicket.tenantName);
  const emoji = categoryEmoji[selectedTicket.category] || "🎫";

  return (
    <OwnerLayout>
      <Box sx={{ p: 3 }}>

        {/* ── Header ── */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <Box>
            <Box sx={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>مركز الدعم</Box>
            <Box sx={{ fontSize: 13, color: "#64748b", mt: 0.3 }}>
              شات مباشر مع المشتركين · يدعم الصور والتسجيلات الصوتية
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip label="SLA: 4 ساعات" sx={{ background: "#e3f8fd", color: "#17c1e8", fontWeight: 700, borderRadius: 2 }} />
            <Chip
              icon={<SupportAgentIcon sx={{ fontSize: "15px !important" }} />}
              label="فريق الدعم"
              sx={{ background: "#f5ecff", color: "#7928ca", fontWeight: 700, borderRadius: 2 }}
            />
          </Box>
        </Box>

        {/* ── Stats ── */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: "مفتوحة", value: stats.open, color: "#17c1e8", bg: "#e3f8fd" },
            { label: "عاجلة/عالية", value: stats.urgent, color: "#fb8c00", bg: "#fff3e0" },
            { label: "رسائل جديدة", value: stats.unreadOwner, color: "#ea0606", bg: "#ffeaea" },
            { label: "بانتظار المشترك", value: tickets.filter((t) => t.status === "waiting_tenant").length, color: "#7928ca", bg: "#f5ecff" },
          ].map((s) => (
            <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 1, background: s.bg, borderRadius: 2.5, px: 2, py: 1, cursor: "pointer" }}
              onClick={() => setFilterStatus(s.label === "مفتوحة" ? "open" : s.label === "بانتظار المشترك" ? "waiting_tenant" : "all")}
            >
              <Box sx={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Box>
              <Box sx={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</Box>
            </Box>
          ))}
        </Box>

        {/* ── Grid ── */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "340px 1fr" }, gap: 2, minHeight: 640 }}>

          {/* ── Left: ticket queue ── */}
          <Card sx={{ overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 3 }}>
            {/* Search + filter */}
            <Box sx={{ p: 1.5, display: "flex", gap: 1, borderBottom: "1px solid #f1f5f9" }}>
              <TextField
                size="small" fullWidth placeholder="بحث..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} /></InputAdornment>,
                  sx: { borderRadius: 2.5, background: "#f8fafc" },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  displayEmpty
                  startAdornment={<FilterListIcon fontSize="small" sx={{ color: "#94a3b8", mr: 0.5 }} />}
                  sx={{ borderRadius: 2.5, background: "#f8fafc", fontSize: 12 }}
                >
                  <MenuItem value="all">الكل</MenuItem>
                  <MenuItem value="open">مفتوحة</MenuItem>
                  <MenuItem value="waiting_owner">بانتظاري</MenuItem>
                  <MenuItem value="waiting_tenant">بانتظار المشترك</MenuItem>
                  <MenuItem value="resolved">محلولة</MenuItem>
                  <MenuItem value="closed">مغلقة</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Count */}
            <Box sx={{ px: 2, py: 1, fontSize: 11, color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>
              {filteredTickets.length} تذكرة
            </Box>

            {/* List */}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {filteredTickets.map((ticket) => (
                <QueueItem
                  key={ticket.id}
                  ticket={ticket}
                  selected={ticket.id === selectedTicketId}
                  onSelect={setSelectedTicketId}
                />
              ))}
              {filteredTickets.length === 0 && (
                <Box sx={{ textAlign: "center", py: 6, color: "#94a3b8", fontSize: 13 }}>لا توجد تذاكر مطابقة</Box>
              )}
            </Box>
          </Card>

          {/* ── Right: chat panel ── */}
          <Card sx={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 3 }}>

            {/* Chat header */}
            <Box sx={{
              px: 2.5, py: 1.8,
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {/* Tenant avatar */}
                <Avatar sx={{ width: 42, height: 42, background: tenantColor, fontSize: 14, fontWeight: 700, borderRadius: 2.5, flexShrink: 0 }}>
                  {getInitials(selectedTicket.tenantName)}
                </Avatar>
                <Box>
                  <Box sx={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{selectedTicket.tenantName}</Box>
                  <Box sx={{ display: "flex", gap: 0.8, mt: 0.3, alignItems: "center" }}>
                    <Box sx={{ fontSize: 11, color: "#94a3b8" }}>{selectedTicket.id}</Box>
                    <Box sx={{ fontSize: 11, color: "#94a3b8" }}>·</Box>
                    <Box sx={{ fontSize: 11, color: "#94a3b8" }}>{emoji} {selectedTicket.category}</Box>
                    <Box sx={{ fontSize: 11, color: "#94a3b8" }}>·</Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                      <PersonIcon sx={{ fontSize: 11, color: "#94a3b8" }} />
                      <Box sx={{ fontSize: 11, color: "#94a3b8" }}>{selectedTicket.openedBy}</Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Actions */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={statusCfg.label}
                  size="small"
                  sx={{ height: 22, fontSize: 10, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color }}
                />
                <Chip
                  label={priorityCfg.label}
                  size="small"
                  sx={{ height: 22, fontSize: 10, fontWeight: 700, background: `${priorityBorder[selectedTicket.priority] || "#adb5bd"}18`, color: priorityBorder[selectedTicket.priority] || "#adb5bd" }}
                />
                {["closed", "resolved"].includes(selectedTicket.status) ? (
                  <Tooltip title="إعادة فتح">
                    <IconButton size="small" onClick={() => changeTicketStatus("open")}
                      sx={{ background: "rgba(255,255,255,0.1)", color: "#fff", "&:hover": { background: "rgba(255,255,255,0.2)" } }}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="وضع علامة محلول">
                      <IconButton size="small" onClick={() => changeTicketStatus("resolved")}
                        sx={{ background: "rgba(130,214,22,0.15)", color: "#82d616", "&:hover": { background: "rgba(130,214,22,0.25)" } }}>
                        <TaskAltIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="إغلاق التذكرة">
                      <IconButton size="small" onClick={() => changeTicketStatus("closed")}
                        sx={{ background: "rgba(234,6,6,0.15)", color: "#ea0606", "&:hover": { background: "rgba(234,6,6,0.25)" } }}>
                        <LockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{
              flex: 1, overflowY: "auto", p: 2.5,
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
                <ChatMessage key={msg.id} message={msg} tenantName={selectedTicket.tenantName} />
              ))}

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
            <Box sx={{ p: 1.5, borderTop: "1px solid #f1f5f9", background: "#fff", display: "flex", alignItems: "flex-end", gap: 1 }}>
              <Tooltip title={isClosed ? "أعد فتح التذكرة أولاً" : "إرسال صورة"}>
                <span>
                  <IconButton size="small" disabled={isClosed} onClick={() => addMessage("image")}
                    sx={{ color: "#94a3b8", "&:hover": { color: "#7928ca", background: "#f5ecff" } }}>
                    <ImageIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={isClosed ? "أعد فتح التذكرة أولاً" : "تسجيل صوتي"}>
                <span>
                  <IconButton size="small" disabled={isClosed} onClick={() => addMessage("audio")}
                    sx={{ color: "#94a3b8", "&:hover": { color: "#7928ca", background: "#f5ecff" } }}>
                    <MicIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <TextField
                size="small" fullWidth multiline maxRows={4}
                disabled={isClosed}
                placeholder={isClosed ? "التذكرة مغلقة..." : "اكتب رداً على المشترك..."}
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addMessage(); } }}
                InputProps={{
                  sx: {
                    borderRadius: 3, background: "#f8fafc",
                    "& fieldset": { border: "1px solid #e2e8f0" },
                    "&:hover fieldset": { borderColor: "#7928ca" },
                    "&.Mui-focused fieldset": { borderColor: "#7928ca" },
                  },
                }}
              />

              <IconButton
                disabled={isClosed}
                onClick={() => addMessage()}
                sx={{
                  width: 38, height: 38, flexShrink: 0,
                  background: isClosed ? "#e2e8f0" : "linear-gradient(135deg, #7928ca, #6366f1)",
                  color: isClosed ? "#94a3b8" : "#fff",
                  borderRadius: 2.5,
                  "&:hover": { background: isClosed ? "#e2e8f0" : "linear-gradient(135deg, #6b21a8, #4f46e5)", transform: isClosed ? "none" : "scale(1.05)" },
                  transition: "all 0.2s",
                  boxShadow: isClosed ? "none" : "0 4px 12px rgba(121,40,202,0.35)",
                }}
              >
                <SendIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Box>
          </Card>
        </Box>
      </Box>
    </OwnerLayout>
  );
}
