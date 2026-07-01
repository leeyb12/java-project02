package com.pknu26.interview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pknu26.interview.client.OllamaClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 웹캠 스냅샷을 Ollama 비전 모델로 분석하여 면접 복장을 평가합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppearanceService {

    private final OllamaClient ollamaClient;
    private final ObjectMapper objectMapper;

    private static final String CLOTHING_PROMPT = """
            너는 면접 복장 평가관이야. 첨부된 이미지 속 지원자의 복장을 면접 관점에서 평가해줘.
            반드시 아래 JSON 형식으로만 출력하고, 마크다운 블록이나 다른 텍스트는 절대 포함하지 마.
            {"attire":"복장 종류(예: 정장, 비즈니스 캐주얼, 캐주얼, 부적절)","neatness":1~5 사이 정수(단정함),"appropriateness":"적절" 또는 "보통" 또는 "부적절","comment":"한 문장 한국어 평가"}
            """;

    /**
     * 복장 분석
     * @param imageBase64 data URI(data:image/...;base64,) 또는 순수 base64 JPEG
     * @return {attire, neatness, appropriateness, comment} 형태의 Map (실패 시 fallback)
     */
    public Map<String, Object> analyzeClothing(String imageBase64) {
        String base64 = stripDataUri(imageBase64);
        if (base64 == null || base64.isBlank()) {
            return fallback("이미지가 비어있습니다.");
        }
        try {
            String raw = ollamaClient.generateWithImage(CLOTHING_PROMPT, base64);
            String json = raw
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("(?s)```\\s*", "")
                    .trim();
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("[AppearanceService] 복장 분석 실패: {}", e.getMessage());
            return fallback("복장 분석에 실패했습니다.");
        }
    }

    /** data URI 접두어 제거 — Ollama는 순수 base64만 허용 */
    private String stripDataUri(String s) {
        if (s == null) return null;
        if (s.startsWith("data:")) {
            int comma = s.indexOf(',');
            if (comma > 0) return s.substring(comma + 1);
        }
        return s;
    }

    private Map<String, Object> fallback(String comment) {
        Map<String, Object> m = new HashMap<>();
        m.put("attire", "분석 불가");
        m.put("neatness", null);
        m.put("appropriateness", "알 수 없음");
        m.put("comment", comment);
        return m;
    }
}
