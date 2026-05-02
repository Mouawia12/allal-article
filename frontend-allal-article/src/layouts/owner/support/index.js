/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";

import Alert from "@mui/material/Alert";
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
import useSupportAudioRecorder from "hooks/useSupportAudioRecorder";
import { readSupportState, subscribeSupportState, updateSupportState } from "services";
import {
  audioBlobToSupportAttachment,
  imageFileToSupportAttachment,
} from "utils/supportAttachments";

// ─── Config ───────────────────────────────────────────────────────────────────
const ticketStatusConfig = {
  open:           { label: "مفتوحة",          color: "#17c1e8", bg: "#e3f8fd" },
  waiting_owner:  { label: "بانتظاري",         color: "#fb8c00", bg: "#fff3e0" },
  waiting_tenant: { label: "بانتظار المشترك",  color: "#7928ca", bg: "#f5ecff" },
  resolved:       { label: "محلولة",           color: "#82d616", bg: "#f0fde4" },
  closed:         { label: "مغلقة",            color: "#8392ab", bg: "#f8f9fa" },
};

const ticketPriorityConfig = {
  urgent: { label: "عاجل" },
  high:   { label: "عالي" },
  normal: { label: "عادي" },
  low:    { label: "منخفض" },
};

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
  if (attachment.type === "audio") {
    return (
      <Box sx={{
        display: "inline-flex", alignItems: "center", gap: 1,
        border: `1px solid ${mine ? "rgba(255,255,255,0.3)" : "#e2e8f0"}`,
        borderRadius: 3, px: 1.5, py: 0.8,
        background: mine ? "rgba(255,255,255,0.15)" : "#f1f5f9",
        maxWidth: 280,
      }}>
        {!attachment.dataUrl && (
          <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: mine ? "rgba(255,255,255,0.25)" : "#7928ca18", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <VolumeUpIcon sx={{ fontSize: 14, color: mine ? "#fff" : "#7928ca" }} />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ fontSize: 11, fontWeight: 700, color: mine ? "#fff" : "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.name}</Box>
          {attachment.dataUrl && (
            <Box
              component="audio"
              controls
              src={attachment.dataUrl}
              aria-label={`تشغيل ${attachment.name}`}
              sx={{ width: 240, display: "block", mt: 0.5 }}
            />
          )}
          <Box sx={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.65)" : "#94a3b8" }}>{attachment.size}</Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: "inline-flex",
      flexDirection: attachment.dataUrl ? "column" : "row",
      alignItems: attachment.dataUrl ? "stretch" : "center",
      gap: 1,
      border: `1px solid ${mine ? "rgba(255,255,255,0.3)" : "#e2e8f0"}`,
      borderRadius: 3, px: 1.2, py: 1,
      background: mine ? "rgba(255,255,255,0.15)" : "#f1f5f9",
      maxWidth: 280,
    }}>
      {attachment.dataUrl ? (
        <Box
          component="img"
          src={attachment.dataUrl}
          alt={attachment.name}
          sx={{ width: 240, maxWidth: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 2 }}
        />
      ) : (
        <Box sx={{ width: 28, height: 28, borderRadius: 1.5, background: mine ? "rgba(255,255,255,0.25)" : "#7928ca18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ImageIcon sx={{ fontSize: 14, color: mine ? "#fff" : "#7928ca" }} />
        </Box>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontSize: 11, fontWeight: 700, color: mine ? "#fff" : "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.name}</Box>
        <Box sx={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.65)" : "#94a3b8" }}>{attachment.size}</Box>
      </Box>
    </Box>
  );
}

// ─── Queue item ───────────────────────────────────────────────────────────────
function QueueItem({ ticket, selected, onSelect }) {
  const status = ticketStatusConfig[ticket.status] || ticketStatusConfig.open;
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
      {!mine ? (
        <Avatar sx={{ width: 30, height: 30, background: tenantColor, fontSize: 11, fontWeight: 700, flexShrink: 0, borderRadius: 2 }}>
          {getInitials(message.senderName)}
        </Avatar>
      ) : (
        <Avatar sx={{ width: 30, height: 30, background: "linear-gradient(135deg, #7928ca, #6366f1)", flexShrink: 0, fontSize: 13 }}>
          <SupportAgentIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}

      <Box sx={{ maxWidth: "68%" }}>
        {!mine && (
          <Box sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, mb: 0.4, pr: 0.5 }}>{message.senderName}</Box>
        )}
        <Box sx={{
          background: mine ? "linear-gradient(135deg, #7928ca 0%, #6366f1 100%)" : "#ffffff",
          color: mine ? "#fff" : "#1e293b",
          borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          px: 1.8, py: 1.2,
          boxShadow: mine ? "0 4px 15px rgba(121,40,202,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
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
  const [tickets, setTickets] = useState(() => readSupportState().tickets);
  const [selectedTicketId, setSelectedTicketId] = useState(() => readSupportState().tickets[0]?.id || null);
  const [composer, setComposer] = useState("");
  const [messagesByTicket, setMessagesByTicket] = useState(() => readSupportState().messagesByTicket);
  const [ticketSearch, setTicketSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mediaError, setMediaError] = useState("");
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;
  const messages = selectedTicketId ? (messagesByTicket[selectedTicketId] || []) : [];
  const isClosed = selectedTicket?.status === "closed";

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    urgent: tickets.filter((t) => ["urgent", "high"].includes(t.priority)).length,
    unreadOwner: tickets.reduce((s, t) => s + (t.unreadOwner || 0), 0),
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch = !ticketSearch.trim() || t.tenantName?.includes(ticketSearch) || t.subject?.includes(ticketSearch);
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [tickets, ticketSearch, filterStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => subscribeSupportState((state) => {
    setTickets(state.tickets);
    setMessagesByTicket(state.messagesByTicket);
    setSelectedTicketId((current) =>
      state.tickets.some((ticket) => ticket.id === current)
        ? current
        : state.tickets[0]?.id || null
    );
  }), []);

  const selectTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
    updateSupportState((state) => ({
      ...state,
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, unreadOwner: 0 } : ticket
      ),
    }));
  };

  const changeTicketStatus = (status) => {
    const label = ticketStatusConfig[status]?.label || status;
    updateSupportState((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === selectedTicketId ? { ...t, status, lastMessageAt: "الآن" } : t
      ),
      messagesByTicket: {
        ...state.messagesByTicket,
        [selectedTicketId]: [
          ...(state.messagesByTicket[selectedTicketId] || []),
          { id: `sys-${Date.now()}`, senderType: "system", senderName: "النظام", body: `تم تغيير حالة التذكرة إلى: ${label}`, createdAt: "الآن", attachments: [] },
        ],
      },
    }));
  };

  const addMessage = ({ attachment = null, fallbackBody = "" } = {}) => {
    const text = composer.trim() || fallbackBody;
    if (!text || isClosed || !selectedTicketId) return;

    try {
      updateSupportState((state) => ({
        tickets: state.tickets.map((t) =>
          t.id === selectedTicketId
            ? { ...t, status: "waiting_tenant", lastMessageAt: "الآن", unreadTenant: (t.unreadTenant || 0) + 1 }
            : t
        ),
        messagesByTicket: {
          ...state.messagesByTicket,
          [selectedTicketId]: [
            ...(state.messagesByTicket[selectedTicketId] || []),
            { id: `msg-${Date.now()}`, senderType: "owner", senderName: "فريق الدعم", body: text, createdAt: "الآن", attachments: attachment ? [attachment] : [] },
          ],
        },
      }));
      setComposer("");
      setMediaError("");
    } catch (error) {
      setMediaError(error.message || "تعذر حفظ الرسالة");
    }
  };

  const sendImageFile = async (file) => {
    if (!file || isClosed || !selectedTicketId) return;
    try {
      const attachment = await imageFileToSupportAttachment(file, "owner");
      addMessage({ attachment, fallbackBody: "صورة توضيحية من الدعم" });
    } catch (error) {
      setMediaError(error.message || "تعذر إرسال الصورة");
    }
  };

  const handleImageInput = (event) => {
    const file = event.target.files?.[0];
    if (file) sendImageFile(file);
    event.target.value = "";
  };

  const ownerRecorder = useSupportAudioRecorder({
    onComplete: async (blob, durationSeconds) => {
      const attachment = await audioBlobToSupportAttachment(blob, "owner", durationSeconds);
      addMessage({ attachment, fallbackBody: "تسجيل صوتي من الدعم" });
    },
    onError: setMediaError,
  });

  const statusCfg = ticketStatusConfig[selectedTicket?.status] ?? ticketStatusConfig.open;
  const priorityBorderColor = selectedTicket ? (priorityBorder[selectedTicket.priority] || "#adb5bd") : "#adb5bd";
  const tenantColor = selectedTicket ? getTenantColor(selectedTicket.tenantName) : "#8392ab";

  return (
    <OwnerLayout>
      <Box sx={{ p: 3 }}>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <Box>
            <Box sx={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>مركز الدعم</Box>
            <Box sx={{ fontSize: 13, color: "#64748b", mt: 0.3 }}>شات مباشر مع المشتركين</Box>
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

        <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: "مفتوحة", value: stats.open, color: "#17c1e8", bg: "#e3f8fd" },
            { label: "عاجلة/عالية", value: stats.urgent, color: "#fb8c00", bg: "#fff3e0" },
            { label: "رسائل جديدة", value: stats.unreadOwner, color: "#ea0606", bg: "#ffeaea" },
            { label: "بانتظار المشترك", value: tickets.filter((t) => t.status === "waiting_tenant").length, color: "#7928ca", bg: "#f5ecff" },
          ].map((s) => (
            <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 1, background: s.bg, borderRadius: 2.5, px: 2, py: 1 }}>
              <Box sx={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Box>
              <Box sx={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</Box>
            </Box>
          ))}
        </Box>

        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "340px 1fr" },
          gap: 2,
          height: { xs: "auto", lg: "calc(100vh - 230px)" },
          minHeight: { lg: 640 },
          minWidth: 0,
        }}>

          {/* Ticket queue */}
          <Card sx={{
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
            height: { xs: 420, lg: "100%" },
            minHeight: 0,
          }}>
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

            <Box sx={{ px: 2, py: 1, fontSize: 11, color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>
              {filteredTickets.length} تذكرة
            </Box>

            <Box sx={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
              {filteredTickets.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8, color: "#94a3b8", fontSize: 13 }}>
                  لا توجد تذاكر دعم بعد
                </Box>
              ) : filteredTickets.map((ticket) => (
                <QueueItem
                  key={ticket.id}
                  ticket={ticket}
                  selected={ticket.id === selectedTicketId}
                  onSelect={selectTicket}
                />
              ))}
            </Box>
          </Card>

          {/* Chat panel */}
          <Card sx={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 3,
            height: { xs: 620, lg: "100%" },
            minHeight: 0,
          }}>
            {!selectedTicket ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>
                اختر تذكرة لعرض المحادثة
              </Box>
            ) : (
              <>
                <Box sx={{
                  px: 2.5, py: 1.8,
                  background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap",
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ width: 42, height: 42, background: tenantColor, fontSize: 14, fontWeight: 700, borderRadius: 2.5, flexShrink: 0 }}>
                      {getInitials(selectedTicket.tenantName)}
                    </Avatar>
                    <Box>
                      <Box sx={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{selectedTicket.tenantName}</Box>
                      <Box sx={{ display: "flex", gap: 0.8, mt: 0.3, alignItems: "center" }}>
                        <Box sx={{ fontSize: 11, color: "#94a3b8" }}>{selectedTicket.id}</Box>
                        <Box sx={{ fontSize: 11, color: "#94a3b8" }}>·</Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                          <PersonIcon sx={{ fontSize: 11, color: "#94a3b8" }} />
                          <Box sx={{ fontSize: 11, color: "#94a3b8" }}>{selectedTicket.openedBy}</Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Chip label={statusCfg.label} size="small"
                      sx={{ height: 22, fontSize: 10, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color }} />
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

                <Box sx={{
                  flex: "1 1 auto",
                  minHeight: 0,
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  p: 2.5,
                  background: "radial-gradient(circle at 1px 1px, #e2e8f022 1px, transparent 0) 0 0 / 20px 20px, #f8fafc",
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                    <Box sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{selectedTicket.createdAt}</Box>
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

                <Box sx={{ p: 1.5, borderTop: "1px solid #f1f5f9", background: "#fff" }}>
                  {mediaError && (
                    <Alert severity="error" onClose={() => setMediaError("")} sx={{ mb: 1 }}>
                      {mediaError}
                    </Alert>
                  )}
                  <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      aria-label="اختيار صورة من جهاز الدعم"
                      hidden
                      onChange={handleImageInput}
                    />
                    <Tooltip title={isClosed ? "أعد فتح التذكرة أولاً" : "إرفاق صورة من الجهاز"}>
                      <span>
                        <IconButton size="small" disabled={isClosed} onClick={() => imageInputRef.current?.click()}
                          aria-label="إرفاق صورة من جهاز الدعم"
                          sx={{ color: "#94a3b8", "&:hover": { color: "#7928ca", background: "#f5ecff" } }}>
                          <ImageIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={isClosed ? "أعد فتح التذكرة أولاً" : ownerRecorder.isRecording ? "إيقاف وإرسال التسجيل" : "تسجيل صوتي"}>
                      <span>
                        <IconButton size="small" disabled={isClosed} onClick={ownerRecorder.toggle}
                          aria-label={ownerRecorder.isRecording ? "إيقاف تسجيل صوت من الدعم وإرساله" : "بدء تسجيل صوت من الدعم"}
                          sx={{
                            color: ownerRecorder.isRecording ? "#ea0606" : "#94a3b8",
                            background: ownerRecorder.isRecording ? "#ffeaea" : "transparent",
                            "&:hover": {
                              color: ownerRecorder.isRecording ? "#ea0606" : "#7928ca",
                              background: ownerRecorder.isRecording ? "#ffdede" : "#f5ecff",
                            },
                          }}>
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
                      aria-label="إرسال رسالة من الدعم"
                      onClick={() => addMessage()}
                      sx={{
                        width: 38, height: 38, flexShrink: 0,
                        background: isClosed ? "#e2e8f0" : "linear-gradient(135deg, #7928ca, #6366f1)",
                        color: isClosed ? "#94a3b8" : "#fff",
                        borderRadius: 2.5,
                        "&:hover": { background: isClosed ? "#e2e8f0" : "linear-gradient(135deg, #6b21a8, #4f46e5)" },
                        transition: "all 0.2s",
                        boxShadow: isClosed ? "none" : "0 4px 12px rgba(121,40,202,0.35)",
                      }}
                    >
                      <SendIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Box>
                </Box>
              </>
            )}
          </Card>
        </Box>
      </Box>
    </OwnerLayout>
  );
}
