package com.allalarticle.backend.products.importing;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Base64;
import java.util.Locale;

/**
 * Extracts machine-readable content from uploaded files for AI processing.
 * Returns either plain text (PDF/Word/Excel/CSV/TXT) or a base64 data URL (images).
 */
@Component
public class FileTextExtractor {

    private static final int MAX_TEXT_CHARS = 60_000;
    private static final long MAX_FILE_BYTES = 15L * 1024L * 1024L;

    public ExtractedContent extract(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "الملف فارغ", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "حجم الملف يتجاوز الحد المسموح (15MB)", HttpStatus.BAD_REQUEST);
        }

        String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String lowerName = name.toLowerCase(Locale.ROOT);
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase(Locale.ROOT) : "";
        FileKind kind = detect(lowerName, contentType);

        try {
            byte[] bytes = file.getBytes();
            return switch (kind) {
                case PDF -> new ExtractedContent(kind, name, truncate(extractPdf(bytes)), null);
                case DOCX -> new ExtractedContent(kind, name, truncate(extractDocx(bytes)), null);
                case XLSX, XLS -> new ExtractedContent(kind, name, truncate(extractSpreadsheet(bytes)), null);
                case CSV, TXT -> new ExtractedContent(kind, name, truncate(new String(bytes)), null);
                case IMAGE -> new ExtractedContent(kind, name, null, toDataUrl(bytes, contentType));
            };
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "تعذر قراءة محتوى الملف: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    private FileKind detect(String name, String contentType) {
        if (name.endsWith(".pdf") || contentType.contains("pdf")) return FileKind.PDF;
        if (name.endsWith(".docx") || contentType.contains("officedocument.wordprocessingml")) return FileKind.DOCX;
        if (name.endsWith(".doc") || contentType.equals("application/msword")) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "صيغة .doc القديمة غير مدعومة، الرجاء تحويل الملف إلى .docx",
                    HttpStatus.BAD_REQUEST);
        }
        if (name.endsWith(".xlsx") || contentType.contains("officedocument.spreadsheetml")) return FileKind.XLSX;
        if (name.endsWith(".xls") || contentType.equals("application/vnd.ms-excel")) return FileKind.XLS;
        if (name.endsWith(".csv") || contentType.equals("text/csv")) return FileKind.CSV;
        if (name.endsWith(".txt") || contentType.startsWith("text/")) return FileKind.TXT;
        if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")
                || name.endsWith(".webp") || name.endsWith(".gif") || contentType.startsWith("image/")) {
            return FileKind.IMAGE;
        }
        throw new AppException(ErrorCode.BAD_REQUEST,
                "نوع الملف غير مدعوم. يقبل النظام: PDF, Word, Excel, CSV, TXT, صور.",
                HttpStatus.BAD_REQUEST);
    }

    private String extractPdf(byte[] bytes) throws Exception {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    private String extractDocx(byte[] bytes) throws Exception {
        try (InputStream in = new ByteArrayInputStream(bytes);
             XWPFDocument doc = new XWPFDocument(in);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }

    private String extractSpreadsheet(byte[] bytes) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (InputStream in = new ByteArrayInputStream(bytes);
             Workbook workbook = WorkbookFactory.create(in)) {
            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                Sheet sheet = workbook.getSheetAt(s);
                if (sheet == null) continue;
                sb.append("\n# ورقة: ").append(sheet.getSheetName()).append("\n");
                for (Row row : sheet) {
                    if (row == null) continue;
                    StringBuilder line = new StringBuilder();
                    short last = row.getLastCellNum();
                    for (int c = 0; c < last; c++) {
                        Cell cell = row.getCell(c);
                        if (c > 0) line.append(" | ");
                        line.append(cellToString(cell));
                    }
                    String text = line.toString().trim();
                    if (!text.isEmpty()) sb.append(text).append("\n");
                }
            }
        }
        return sb.toString();
    }

    private String cellToString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                    ? cell.getDateCellValue().toString()
                    : trimNumeric(cell.getNumericCellValue());
            case BOOLEAN -> Boolean.toString(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield cell.getStringCellValue(); }
                catch (Exception ignored) { yield trimNumeric(cell.getNumericCellValue()); }
            }
            default -> "";
        };
    }

    private String trimNumeric(double value) {
        if (value == Math.floor(value) && !Double.isInfinite(value)) {
            return Long.toString((long) value);
        }
        return Double.toString(value);
    }

    private String toDataUrl(byte[] bytes, String contentType) {
        String mime = (contentType == null || contentType.isBlank() || !contentType.startsWith("image/"))
                ? "image/png" : contentType;
        return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private String truncate(String text) {
        if (text == null) return "";
        String trimmed = text.replaceAll("[\\u0000-\\u0008\\u000B-\\u001F\\u007F]", " ").trim();
        return trimmed.length() <= MAX_TEXT_CHARS ? trimmed : trimmed.substring(0, MAX_TEXT_CHARS);
    }

    public enum FileKind {
        PDF, DOCX, XLSX, XLS, CSV, TXT, IMAGE
    }

    public record ExtractedContent(FileKind kind, String filename, String text, String imageDataUrl) {
        public boolean isImage() { return kind == FileKind.IMAGE; }
    }
}
