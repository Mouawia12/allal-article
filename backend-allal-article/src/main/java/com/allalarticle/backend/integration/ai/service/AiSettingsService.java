package com.allalarticle.backend.integration.ai.service;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.integration.ai.dto.AiConnectionTestRequest;
import com.allalarticle.backend.integration.ai.dto.AiConnectionTestResponse;
import com.allalarticle.backend.integration.ai.dto.AiModelOptionResponse;
import com.allalarticle.backend.integration.ai.dto.AiModelsRefreshRequest;
import com.allalarticle.backend.integration.ai.dto.AiModelsRefreshResponse;
import com.allalarticle.backend.integration.ai.dto.AiSettingsRequest;
import com.allalarticle.backend.integration.ai.dto.AiSettingsResponse;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@Service
public class AiSettingsService {

    private static final String SETTINGS_KEY = "ai.integration";
    private static final String DEFAULT_PROVIDER = "openai";
    private static final String DEFAULT_IMAGE_MODEL = "gpt-image-2";
    private static final String DEFAULT_IMAGE_PROMPT = "Remove the background from this product image. Keep the product exactly as it appears - preserve all text, logos, colors, and fine details. Make the background pure white or transparent. Do not modify the product itself in any way.";
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<AiModelOptionResponse>> MODEL_LIST_TYPE = new TypeReference<>() {};
    private static final Set<String> SUPPORTED_PROVIDERS = Set.of("openai", "deepseek");
    private static final Pattern DATED_SNAPSHOT = Pattern.compile(".*-\\d{4}-\\d{2}-\\d{2}$");

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final SecretCodec secretCodec;
    private final OpenAiConnectionClient openAiClient;
    private final String envOpenAiApiKey;
    private final String defaultOpenAiModel;

    public AiSettingsService(
            JdbcTemplate jdbc,
            ObjectMapper objectMapper,
            SecretCodec secretCodec,
            OpenAiConnectionClient openAiClient,
            @Value("${ai.openai.api-key:}") String envOpenAiApiKey,
            @Value("${ai.openai.model:gpt-4o}") String defaultOpenAiModel) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.secretCodec = secretCodec;
        this.openAiClient = openAiClient;
        this.envOpenAiApiKey = envOpenAiApiKey;
        this.defaultOpenAiModel = hasText(defaultOpenAiModel) ? defaultOpenAiModel.trim() : "gpt-4o";
    }

    @Transactional(readOnly = true)
    public AiSettingsResponse getSettings() {
        return responseFrom(readSettingsMap());
    }

    @Transactional
    public AiSettingsResponse save(AiSettingsRequest request) {
        Map<String, Object> settings = new LinkedHashMap<>(readSettingsMap());

        String provider = normalizeProvider(firstNonBlank(request.provider(), stringValue(settings.get("provider"), DEFAULT_PROVIDER)));
        settings.put("provider", provider);
        settings.put("model", firstNonBlank(request.model(), stringValue(settings.get("model"), defaultOpenAiModel)));
        settings.put("imageModel", firstNonBlank(request.imageModel(), stringValue(settings.get("imageModel"), DEFAULT_IMAGE_MODEL)));
        settings.put("extractionEnabled", booleanValue(request.extractionEnabled(), booleanValue(settings.get("extractionEnabled"), true)));
        settings.put("imageProcessEnabled", booleanValue(request.imageProcessEnabled(), booleanValue(settings.get("imageProcessEnabled"), true)));
        settings.put("imageProcessingPrompt", firstNonBlank(
                request.imageProcessingPrompt(),
                stringValue(settings.get("imageProcessingPrompt"), DEFAULT_IMAGE_PROMPT)));

        if (Boolean.TRUE.equals(request.clearOpenAiApiKey())) {
            settings.remove("openAiApiKeyEncrypted");
            settings.remove("openAiApiKeyLast4");
        } else if (hasText(request.openAiApiKey())) {
            String apiKey = request.openAiApiKey().trim();
            settings.put("openAiApiKeyEncrypted", secretCodec.encrypt(apiKey));
            settings.put("openAiApiKeyLast4", last4(apiKey));
        }

        saveSettingsMap(settings);
        return responseFrom(settings);
    }

    @Transactional(readOnly = true)
    public AiConnectionTestResponse testConnection(AiConnectionTestRequest request) {
        Map<String, Object> settings = readSettingsMap();
        String provider = normalizeProvider(firstNonBlank(request.provider(), stringValue(settings.get("provider"), DEFAULT_PROVIDER)));
        if (!DEFAULT_PROVIDER.equals(provider)) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "اختبار الاتصال مدعوم حالياً مع OpenAI فقط", HttpStatus.BAD_REQUEST);
        }

        String model = firstNonBlank(request.model(), stringValue(settings.get("model"), defaultOpenAiModel));
        String apiKey = resolveOpenAiApiKey(settings, request.openAiApiKey());
        if (!hasText(apiKey)) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "مفتاح OpenAI غير مضبوط في البيئة أو إعدادات النظام", HttpStatus.BAD_REQUEST);
        }

        openAiClient.verifyModel(apiKey, model);
        return new AiConnectionTestResponse(true, DEFAULT_PROVIDER, model, "تم الاتصال بـ OpenAI بنجاح");
    }

    @Transactional
    public AiModelsRefreshResponse refreshOpenAiModels(AiModelsRefreshRequest request) {
        Map<String, Object> settings = new LinkedHashMap<>(readSettingsMap());
        String apiKey = resolveOpenAiApiKey(settings, request != null ? request.openAiApiKey() : null);
        if (!hasText(apiKey)) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "مفتاح OpenAI غير مضبوط في البيئة أو إعدادات النظام", HttpStatus.BAD_REQUEST);
        }

        List<OpenAiConnectionClient.OpenAiModel> models = openAiClient.listModels(apiKey);
        List<AiModelOptionResponse> textModels = filterTextModels(models);
        List<AiModelOptionResponse> imageModels = filterImageModels(models);

        if (textModels.isEmpty()) textModels = fallbackTextModels();
        if (imageModels.isEmpty()) imageModels = fallbackImageModels();

        String refreshedAt = Instant.now().toString();
        settings.put("availableTextModels", textModels);
        settings.put("availableImageModels", imageModels);
        settings.put("modelsRefreshedAt", refreshedAt);
        saveSettingsMap(settings);

        return new AiModelsRefreshResponse(textModels, imageModels, refreshedAt);
    }

    @Transactional(readOnly = true)
    public String resolveOpenAiApiKey() {
        String apiKey = resolveOpenAiApiKey(readSettingsMap(), null);
        if (!hasText(apiKey)) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "مفتاح OpenAI غير مضبوط في البيئة أو إعدادات النظام", HttpStatus.BAD_REQUEST);
        }
        return apiKey;
    }

    @Transactional(readOnly = true)
    public String currentImageModel() {
        return stringValue(readSettingsMap().get("imageModel"), DEFAULT_IMAGE_MODEL);
    }

    @Transactional(readOnly = true)
    public boolean currentImageProcessEnabled() {
        return booleanValue(readSettingsMap().get("imageProcessEnabled"), true);
    }

    @Transactional(readOnly = true)
    public String currentImageProcessingPrompt() {
        return stringValue(readSettingsMap().get("imageProcessingPrompt"), DEFAULT_IMAGE_PROMPT);
    }

    private Map<String, Object> readSettingsMap() {
        String schema = tenantSchema();
        try {
            String json = jdbc.queryForObject(
                    String.format("SELECT value_json::text FROM \"%s\".settings WHERE key = ?", schema),
                    String.class, SETTINGS_KEY);
            if (!hasText(json)) return new LinkedHashMap<>();
            return new LinkedHashMap<>(objectMapper.readValue(json, MAP_TYPE));
        } catch (EmptyResultDataAccessException e) {
            return new LinkedHashMap<>();
        } catch (Exception e) {
            log.warn("Failed to read AI settings: {}", e.getMessage());
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "تعذر تحميل إعدادات الذكاء الاصطناعي", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void saveSettingsMap(Map<String, Object> settings) {
        String schema = tenantSchema();
        try {
            String json = objectMapper.writeValueAsString(settings);
            boolean encrypted = hasText(stringValue(settings.get("openAiApiKeyEncrypted"), null));
            jdbc.update(String.format("""
                INSERT INTO "%s".settings (key, group_name, value_json, is_encrypted)
                VALUES (?, 'ai', ?::jsonb, ?)
                ON CONFLICT (key) DO UPDATE
                    SET value_json = EXCLUDED.value_json,
                        is_encrypted = EXCLUDED.is_encrypted,
                        updated_at = now()
                """, schema), SETTINGS_KEY, json, encrypted);
        } catch (Exception e) {
            log.warn("Failed to save AI settings: {}", e.getMessage());
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "تعذر حفظ إعدادات الذكاء الاصطناعي", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private AiSettingsResponse responseFrom(Map<String, Object> settings) {
        String provider = normalizeProvider(stringValue(settings.get("provider"), DEFAULT_PROVIDER));
        String model = stringValue(settings.get("model"), defaultOpenAiModel);
        String imageModel = stringValue(settings.get("imageModel"), DEFAULT_IMAGE_MODEL);
        boolean extractionEnabled = booleanValue(settings.get("extractionEnabled"), true);
        boolean imageProcessEnabled = booleanValue(settings.get("imageProcessEnabled"), true);
        String imagePrompt = stringValue(settings.get("imageProcessingPrompt"), DEFAULT_IMAGE_PROMPT);
        List<AiModelOptionResponse> textModels = modelOptions(settings.get("availableTextModels"), fallbackTextModels(), model);
        List<AiModelOptionResponse> imageModels = modelOptions(settings.get("availableImageModels"), fallbackImageModels(), imageModel);
        String modelsRefreshedAt = stringValue(settings.get("modelsRefreshedAt"), null);

        String encryptedKey = stringValue(settings.get("openAiApiKeyEncrypted"), null);
        String source = "none";
        String masked = "";
        if (hasText(encryptedKey)) {
            source = "tenant";
            masked = "sk-••••" + stringValue(settings.get("openAiApiKeyLast4"), "");
        } else if (hasText(envOpenAiApiKey)) {
            source = "environment";
            masked = maskKey(envOpenAiApiKey);
        }

        return new AiSettingsResponse(
                provider,
                model,
                imageModel,
                extractionEnabled,
                imageProcessEnabled,
                imagePrompt,
                !"none".equals(source),
                masked,
                source,
                textModels,
                imageModels,
                modelsRefreshedAt);
    }

    private List<AiModelOptionResponse> filterTextModels(List<OpenAiConnectionClient.OpenAiModel> models) {
        return models.stream()
                .filter(model -> isTextModel(model.id()))
                .filter(model -> !DATED_SNAPSHOT.matcher(model.id()).matches())
                .map(this::toTextOption)
                .sorted(modelComparator(this::textModelRank))
                .limit(80)
                .toList();
    }

    private List<AiModelOptionResponse> filterImageModels(List<OpenAiConnectionClient.OpenAiModel> models) {
        return models.stream()
                .filter(model -> isImageModel(model.id()))
                .filter(model -> !DATED_SNAPSHOT.matcher(model.id()).matches())
                .map(this::toImageOption)
                .sorted(modelComparator(this::imageModelRank))
                .limit(30)
                .toList();
    }

    private boolean isTextModel(String id) {
        String value = id != null ? id.toLowerCase() : "";
        if (value.isBlank()) return false;
        if (value.contains("image") || value.contains("audio") || value.contains("realtime")
                || value.contains("transcribe") || value.contains("tts") || value.contains("whisper")
                || value.contains("embedding") || value.contains("moderation") || value.contains("dall-e")
                || value.contains("sora") || value.contains("search")) {
            return false;
        }
        return value.startsWith("gpt-")
                || value.startsWith("o1")
                || value.startsWith("o3")
                || value.startsWith("o4")
                || value.startsWith("ft:gpt-");
    }

    private boolean isImageModel(String id) {
        String value = id != null ? id.toLowerCase() : "";
        return value.startsWith("gpt-image-") || value.equals("dall-e-3") || value.equals("dall-e-2");
    }

    private AiModelOptionResponse toTextOption(OpenAiConnectionClient.OpenAiModel model) {
        return new AiModelOptionResponse(model.id(), model.id(), textFamily(model.id()), model.created(), model.ownedBy());
    }

    private AiModelOptionResponse toImageOption(OpenAiConnectionClient.OpenAiModel model) {
        return new AiModelOptionResponse(model.id(), model.id(), imageFamily(model.id()), model.created(), model.ownedBy());
    }

    private Comparator<AiModelOptionResponse> modelComparator(java.util.function.ToIntFunction<String> ranker) {
        return Comparator
                .comparingInt((AiModelOptionResponse model) -> ranker.applyAsInt(model.id()))
                .thenComparing((AiModelOptionResponse model) -> model.created() != null ? -model.created() : 0L)
                .thenComparing(AiModelOptionResponse::id);
    }

    private int textModelRank(String id) {
        String value = id != null ? id.toLowerCase() : "";
        if (value.equals("gpt-5.5")) return 0;
        if (value.startsWith("gpt-5.5")) return 1;
        if (value.equals("gpt-5.4")) return 2;
        if (value.startsWith("gpt-5.4-mini")) return 3;
        if (value.startsWith("gpt-5.4-nano")) return 4;
        if (value.startsWith("gpt-5")) return 10;
        if (value.startsWith("gpt-4.1")) return 20;
        if (value.startsWith("gpt-4o")) return 30;
        if (value.startsWith("o4")) return 40;
        if (value.startsWith("o3")) return 50;
        if (value.startsWith("o1")) return 60;
        if (value.startsWith("ft:")) return 70;
        return 90;
    }

    private int imageModelRank(String id) {
        String value = id != null ? id.toLowerCase() : "";
        if (value.equals("gpt-image-2")) return 0;
        if (value.startsWith("gpt-image-2")) return 1;
        if (value.equals("gpt-image-1.5")) return 2;
        if (value.equals("gpt-image-1")) return 3;
        if (value.equals("gpt-image-1-mini")) return 4;
        if (value.equals("dall-e-3")) return 20;
        if (value.equals("dall-e-2")) return 30;
        return 90;
    }

    private String textFamily(String id) {
        String value = id != null ? id.toLowerCase() : "";
        if (value.startsWith("gpt-5")) return "GPT-5";
        if (value.startsWith("gpt-4")) return "GPT-4";
        if (value.startsWith("o")) return "Reasoning";
        if (value.startsWith("ft:")) return "Fine-tuned";
        return "Text";
    }

    private String imageFamily(String id) {
        String value = id != null ? id.toLowerCase() : "";
        if (value.startsWith("gpt-image")) return "GPT Image";
        if (value.startsWith("dall-e")) return "DALL-E";
        return "Image";
    }

    private List<AiModelOptionResponse> modelOptions(Object raw,
                                                     List<AiModelOptionResponse> fallback,
                                                     String selectedModel) {
        List<AiModelOptionResponse> options = new ArrayList<>();
        try {
            if (raw != null) {
                options.addAll(objectMapper.convertValue(raw, MODEL_LIST_TYPE));
            }
        } catch (Exception ignored) {
            options.clear();
        }
        if (options.isEmpty()) options.addAll(fallback);
        if (hasText(selectedModel) && options.stream().noneMatch(option -> selectedModel.equals(option.id()))) {
            options.add(0, new AiModelOptionResponse(selectedModel, selectedModel, "Selected", null, null));
        }
        return options;
    }

    private List<AiModelOptionResponse> fallbackTextModels() {
        return List.of(
                new AiModelOptionResponse("gpt-5.5", "gpt-5.5", "GPT-5", null, "openai"),
                new AiModelOptionResponse("gpt-5.4", "gpt-5.4", "GPT-5", null, "openai"),
                new AiModelOptionResponse("gpt-5.4-mini", "gpt-5.4-mini", "GPT-5", null, "openai"),
                new AiModelOptionResponse("gpt-5.4-nano", "gpt-5.4-nano", "GPT-5", null, "openai"),
                new AiModelOptionResponse("gpt-4o", "gpt-4o", "GPT-4", null, "openai"),
                new AiModelOptionResponse("gpt-4o-mini", "gpt-4o-mini", "GPT-4", null, "openai"));
    }

    private List<AiModelOptionResponse> fallbackImageModels() {
        return List.of(
                new AiModelOptionResponse("gpt-image-2", "gpt-image-2", "GPT Image", null, "openai"),
                new AiModelOptionResponse("gpt-image-1.5", "gpt-image-1.5", "GPT Image", null, "openai"),
                new AiModelOptionResponse("gpt-image-1", "gpt-image-1", "GPT Image", null, "openai"),
                new AiModelOptionResponse("gpt-image-1-mini", "gpt-image-1-mini", "GPT Image", null, "openai"),
                new AiModelOptionResponse("dall-e-3", "dall-e-3", "DALL-E", null, "openai"));
    }

    private String resolveOpenAiApiKey(Map<String, Object> settings, String explicitKey) {
        if (hasText(explicitKey)) return explicitKey.trim();

        String encryptedKey = stringValue(settings.get("openAiApiKeyEncrypted"), null);
        if (hasText(encryptedKey)) {
            try {
                return secretCodec.decrypt(encryptedKey);
            } catch (Exception e) {
                throw new AppException(ErrorCode.INTERNAL_ERROR,
                        "تعذر قراءة مفتاح OpenAI المحفوظ", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return hasText(envOpenAiApiKey) ? envOpenAiApiKey.trim() : null;
    }

    private String tenantSchema() {
        String schema = TenantContext.get();
        if (!hasText(schema)) throw new IllegalStateException("No tenant context");
        return schema;
    }

    private String normalizeProvider(String provider) {
        String value = hasText(provider) ? provider.trim().toLowerCase() : DEFAULT_PROVIDER;
        if (!SUPPORTED_PROVIDERS.contains(value)) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "مزود الذكاء الاصطناعي غير مدعوم", HttpStatus.BAD_REQUEST);
        }
        return value;
    }

    private static boolean booleanValue(Boolean value, boolean fallback) {
        return value != null ? value : fallback;
    }

    private static boolean booleanValue(Object value, boolean fallback) {
        return value instanceof Boolean b ? b : fallback;
    }

    private static String stringValue(Object value, String fallback) {
        return value instanceof String s && hasText(s) ? s.trim() : fallback;
    }

    private static String firstNonBlank(String first, String fallback) {
        return hasText(first) ? first.trim() : fallback;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String last4(String value) {
        String clean = value.trim();
        return clean.length() <= 4 ? clean : clean.substring(clean.length() - 4);
    }

    private static String maskKey(String value) {
        String clean = value.trim();
        if (clean.length() <= 8) return "••••";
        String prefix = clean.startsWith("sk-proj-") ? "sk-proj-" : clean.substring(0, Math.min(3, clean.length()));
        return prefix + "••••" + last4(clean);
    }
}
