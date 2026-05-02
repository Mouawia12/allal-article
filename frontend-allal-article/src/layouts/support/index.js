/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";

import Alert from "@mui/material/Alert";
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
import useSupportAudioRecorder from "hooks/useSupportAudioRecorder";
import { readSupportState, subscribeSupportState, updateSupportState } from "services";
import {
  audioBlobToSupportAttachment,
  imageFileToSupportAttachment,
} from "utils/supportAttachments";

const ticketStatusConfig = {
  open: { label: "مفتوحة", color: "#17c1e8", bg: "#e3f8fd" },
  waiting_owner: { label: "بانتظار الدعم", color: "#fb8c00", bg: "#fff3e0" },
  waiting_tenant: { label: "بانتظار ردك", color: "#7928ca", bg: "#f5ecff" },
  resolved: { label: "محلولة", color: "#82d616", bg: "#f0fde4" },
  closed: { label: "مغلقة", color: "#8392ab", bg: "#f8f9fa" },
};
const ticketPriorityConfig = {
  low: { label: "منخفضة", color: "#8392ab" },
  normal: { label: "عادية", color: "#17c1e8" },
  high: { label: "عالية", color: "#fb8c00" },
  urgent: { label: "عاجلة", color: "#ea0606" },
};
const getTicketStats = (tickets) => ({
  open: tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length,
  urgent: tickets.filter((t) => t.priority === "urgent" || t.priority === "high").length,
  unreadOwner: tickets.reduce((s, t) => s + (t.unreadOwner || 0), 0),
  unreadTenant: tickets.reduce((s, t) => s + (t.unreadTenant || 0), 0),
});

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

const categoryOptions = {
  orders: "الطلبيات",
  subscription: "الاشتراك",
  printing: "الطباعة",
  accounting: "المحاسبة",
  inventory: "المخزون",
};

function nextTicketId(tickets) {
  const next = tickets.reduce((max, ticket) => {
    const number = Number(String(ticket.id).match(/(\d+)$/)?.[1] || 0);
    return Math.max(max, number);
  }, 0) + 1;

  return `TCK-2026-${String(next).padStart(3, "0")}`;
}

// ─── Attachment bubble ────────────────────────────────────────────────────────
function Attachment({ attachment, mine }) {
  if (attachment.type === "audio") {
    return (
      <Box
        sx={{
          display: "inline-flex", alignItems: "center", gap: 1,
          border: `1px solid ${mine ? "rgba(255,255,255,0.35)" : "#e2e8f0"}`,
          borderRadius: 3, px: 1.5, py: 0.8,
          background: mine ? "rgba(255,255,255,0.15)" : "#f1f5f9",
          maxWidth: 280,
        }}
      >
        {!attachment.dataUrl && (
          <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: mine ? "rgba(255,255,255,0.25)" : "#17c1e822", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <VolumeUpIcon sx={{ fontSize: 14, color: mine ? "#fff" : "#17c1e8" }} />
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
          <Box sx={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>{attachment.size}</Box>
        </Box>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        display: "inline-flex", flexDirection: attachment.dataUrl ? "column" : "row",
        alignItems: attachment.dataUrl ? "stretch" : "center", gap: 1,
        border: `1px solid ${mine ? "rgba(255,255,255,0.35)" : "#e2e8f0"}`,
        borderRadius: 3, px: 1.2, py: 1,
        background: mine ? "rgba(255,255,255,0.15)" : "#f1f5f9",
        maxWidth: 280,
      }}
    >
      {attachment.dataUrl ? (
        <Box
          component="img"
          src={attachment.dataUrl}
          alt={attachment.name}
          sx={{ width: 240, maxWidth: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 2 }}
        />
      ) : (
        <Box sx={{ width: 28, height: 28, borderRadius: 1.5, background: mine ? "rgba(255,255,255,0.25)" : "#17c1e822", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ImageIcon sx={{ fontSize: 14, color: mine ? "#fff" : "#17c1e8" }} />
        </Box>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontSize: 11, fontWeight: 700, color: mine ? "#fff" : "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.name}</Box>
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
function NewTicketDialog({ open, onClose, onCreate }) {
  const imageInputRef = useRef(null);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("orders");
  const [priority, setPriority] = useState("normal");
  const [attachments, setAttachments] = useState([]);
  const [mediaError, setMediaError] = useState("");

  const appendAttachment = (attachment) => {
    setAttachments((current) => [...current, attachment]);
    setMediaError("");
  };

  const handleAudioComplete = async (blob, durationSeconds) => {
    appendAttachment(await audioBlobToSupportAttachment(blob, "ticket", durationSeconds));
  };

  const ticketRecorder = useSupportAudioRecorder({
    onComplete: handleAudioComplete,
    onError: setMediaError,
  });

  const addImageFromFile = async (file) => {
    try {
      appendAttachment(await imageFileToSupportAttachment(file, "ticket"));
    } catch (error) {
      setMediaError(error.message || "تعذر إرفاق الصورة");
    }
  };

  const handleImageInput = (event) => {
    const file = event.target.files?.[0];
    if (file) addImageFromFile(file);
    event.target.value = "";
  };

  const resetAndClose = () => {
    if (ticketRecorder.isRecording) ticketRecorder.stop({ discard: true });
    setSubject("");
    setDetails("");
    setCategory("orders");
    setPriority("normal");
    setAttachments([]);
    setMediaError("");
    onClose();
  };

  const handleCreate = () => {
    const cleanSubject = subject.trim();
    const cleanDetails = details.trim();
    if (!cleanSubject || !cleanDetails) return;

    try {
      onCreate({
        subject: cleanSubject,
        body: cleanDetails,
        category: categoryOptions[category] || "التقنية",
        priority,
        attachments,
      });
      resetAndClose();
    } catch (error) {
      setMediaError(error.message || "تعذر فتح التذكرة");
    }
  };

  return (
    <Dialog open={open} onClose={resetAndClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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
          <IconButton size="small" onClick={resetAndClose} sx={{ background: "#f1f5f9" }} aria-label="إغلاق نافذة التذكرة"><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            size="small" label="عنوان المشكلة" fullWidth
            placeholder="اكتب وصفاً مختصراً للمشكلة..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
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
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          {mediaError && (
            <Alert severity="error" onClose={() => setMediaError("")}>
              {mediaError}
            </Alert>
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              aria-label="اختيار صورة للتذكرة"
              hidden
              onChange={handleImageInput}
            />
            <Chip
              icon={<ImageIcon sx={{ fontSize: "14px !important" }} />}
              label="إرفاق صورة"
              variant="outlined"
              clickable
              onClick={() => imageInputRef.current?.click()}
              sx={{ fontSize: 11, borderRadius: 2, borderColor: "#e2e8f0", color: "#64748b" }}
            />
            <Chip
              icon={<MicIcon sx={{ fontSize: "14px !important" }} />}
              label={ticketRecorder.isRecording ? "إيقاف وإرسال" : "تسجيل صوتي"}
              variant="outlined"
              clickable
              aria-label={ticketRecorder.isRecording ? "إيقاف تسجيل صوت للتذكرة وإرساله" : "بدء تسجيل صوت للتذكرة"}
              onClick={ticketRecorder.toggle}
              color={ticketRecorder.isRecording ? "error" : "default"}
              sx={{
                fontSize: 11,
                borderRadius: 2,
                borderColor: ticketRecorder.isRecording ? "#ea0606" : "#e2e8f0",
                color: ticketRecorder.isRecording ? "#ea0606" : "#64748b",
              }}
            />
          </Box>
          {attachments.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
              {attachments.map((attachment) => (
                <Chip
                  key={attachment.id}
                  label={attachment.name}
                  size="small"
                  onDelete={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}
                  sx={{ maxWidth: 220, borderRadius: 2 }}
                />
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1, borderTop: "1px solid #f1f5f9" }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={resetAndClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small" onClick={handleCreate}
          disabled={!subject.trim() || !details.trim()}
          sx={{ px: 3, borderRadius: 2, background: "linear-gradient(135deg, #17c1e8, #0ea5c9)" }}>
          فتح التذكرة
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SupportCenter() {
  const [tickets, setTickets] = useState(() => readSupportState().tickets);
  const [selectedTicketId, setSelectedTicketId] = useState(() => readSupportState().tickets[0]?.id || null);
  const [composer, setComposer] = useState("");
  const [messagesByTicket, setMessagesByTicket] = useState(() => readSupportState().messagesByTicket);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [mediaError, setMediaError] = useState("");

  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;
  const messages = messagesByTicket[selectedTicketId] || [];
  const stats = useMemo(() => getTicketStats(tickets), [tickets]);
  const isClosed = selectedTicket?.status === "closed";

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

  useEffect(() => subscribeSupportState((state) => {
    setTickets(state.tickets);
    setMessagesByTicket(state.messagesByTicket);
    setSelectedTicketId((current) =>
      state.tickets.some((ticket) => ticket.id === current)
        ? current
        : state.tickets[0]?.id || null
    );
  }), []);

  const changeTicketStatus = (status) => {
    if (!selectedTicketId) return;
    const label = ticketStatusConfig[status]?.label || status;
    updateSupportState((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === selectedTicketId
          ? { ...t, status, lastMessageAt: "الآن", unreadOwner: status === "open" ? (t.unreadOwner || 0) + 1 : t.unreadOwner }
          : t
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
            ? { ...t, status: "waiting_owner", lastMessageAt: "الآن", unreadOwner: (t.unreadOwner || 0) + 1 }
            : t
        ),
        messagesByTicket: {
          ...state.messagesByTicket,
          [selectedTicketId]: [
            ...(state.messagesByTicket[selectedTicketId] || []),
            { id: `msg-${Date.now()}`, senderType: "tenant", senderName: "أنت", body: text, createdAt: "الآن", attachments: attachment ? [attachment] : [] },
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
      const attachment = await imageFileToSupportAttachment(file, "tenant");
      addMessage({ attachment, fallbackBody: "صورة مرفقة" });
    } catch (error) {
      setMediaError(error.message || "تعذر إرسال الصورة");
    }
  };

  const handleComposerImageInput = (event) => {
    const file = event.target.files?.[0];
    if (file) sendImageFile(file);
    event.target.value = "";
  };

  const tenantRecorder = useSupportAudioRecorder({
    onComplete: async (blob, durationSeconds) => {
      const attachment = await audioBlobToSupportAttachment(blob, "tenant", durationSeconds);
      addMessage({ attachment, fallbackBody: "تسجيل صوتي جديد" });
    },
    onError: setMediaError,
  });

  const createTicket = ({ subject, body, category, priority, attachments = [] }) => {
    const currentState = readSupportState();
    const id = nextTicketId(currentState.tickets);
    const ticket = {
      id,
      tenantName: "مؤسستك",
      subject,
      category,
      priority,
      status: "waiting_owner",
      openedBy: "أنت",
      assignedTo: "فريق الدعم",
      createdAt: "الآن",
      lastMessageAt: "الآن",
      unreadOwner: 1,
      unreadTenant: 0,
    };
    const firstMessage = {
      id: `msg-${Date.now()}`,
      senderType: "tenant",
      senderName: "أنت",
      body,
      createdAt: "الآن",
      attachments,
    };

    updateSupportState((state) => ({
      tickets: [ticket, ...state.tickets],
      messagesByTicket: { ...state.messagesByTicket, [id]: [firstMessage] },
    }));
    setSelectedTicketId(id);
  };

  const statusCfg = ticketStatusConfig[selectedTicket?.status] || ticketStatusConfig.open;
  const emoji = categoryEmoji[selectedTicket?.category] || "🎫";

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
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" },
          gap: 2,
          height: { xs: "auto", lg: "calc(100vh - 280px)" },
          minHeight: { lg: 620 },
          minWidth: 0,
        }}>

          {/* ── Left: Ticket list ── */}
          <Card sx={{
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
            height: { xs: 420, lg: "100%" },
            minHeight: 0,
          }}>
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
            <Box sx={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
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
          <Card sx={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 3,
            height: { xs: 620, lg: "100%" },
            minHeight: 0,
          }}>

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
                    {selectedTicket?.subject ?? "—"}
                  </Box>
                  <Box sx={{ fontSize: 11, color: "#94a3b8", mt: 0.2 }}>
                    {selectedTicket?.id ?? "—"} · {selectedTicket?.category ?? "—"}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={statusCfg.label}
                  size="small"
                  sx={{ height: 22, fontSize: 10, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color }}
                />
                {["closed", "resolved"].includes(selectedTicket?.status) ? (
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
              flex: "1 1 auto",
              minHeight: 0,
              overflowY: "auto",
              overscrollBehavior: "contain",
              p: 2,
              background: "radial-gradient(circle at 1px 1px, #e2e8f022 1px, transparent 0) 0 0 / 20px 20px, #f8fafc",
            }}>
              {/* Date separator */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <Box sx={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                <Box sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {selectedTicket?.createdAt ?? "—"}
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
                  aria-label="اختيار صورة من جهاز المشترك"
                  hidden
                  onChange={handleComposerImageInput}
                />
                {/* Attach buttons */}
                <Tooltip title={isClosed ? "أعد فتح التذكرة أولاً" : "إرفاق صورة من الجهاز"}>
                  <span>
                    <IconButton
                      size="small" disabled={isClosed}
                      aria-label="إرفاق صورة من جهاز المشترك"
                      onClick={() => imageInputRef.current?.click()}
                      sx={{ color: "#94a3b8", "&:hover": { color: "#17c1e8", background: "#e3f8fd" } }}
                    >
                      <ImageIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={isClosed ? "أعد فتح التذكرة أولاً" : tenantRecorder.isRecording ? "إيقاف وإرسال التسجيل" : "تسجيل صوتي"}>
                  <span>
                    <IconButton
                      size="small" disabled={isClosed}
                      aria-label={tenantRecorder.isRecording ? "إيقاف تسجيل صوت من المشترك وإرساله" : "بدء تسجيل صوت من المشترك"}
                      onClick={tenantRecorder.toggle}
                      sx={{
                        color: tenantRecorder.isRecording ? "#ea0606" : "#94a3b8",
                        background: tenantRecorder.isRecording ? "#ffeaea" : "transparent",
                        "&:hover": {
                          color: tenantRecorder.isRecording ? "#ea0606" : "#17c1e8",
                          background: tenantRecorder.isRecording ? "#ffdede" : "#e3f8fd",
                        },
                      }}
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
                  aria-label="إرسال رسالة من المشترك"
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
            </Box>
          </Card>
        </Box>
      </SoftBox>

      <NewTicketDialog open={newTicketOpen} onClose={() => setNewTicketOpen(false)} onCreate={createTicket} />
      <Footer />
    </DashboardLayout>
  );
}
