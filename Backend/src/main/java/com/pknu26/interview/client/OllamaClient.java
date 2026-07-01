package com.pknu26.interview.client;

import com.pknu26.interview.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class OllamaClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ollama.api.url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model.name:gemma4:e2b}")
    private String model;

    @Value("${ollama.vision.model.name:llava}")
    private String visionModel;

    /**
     * Ollama /api/generate 엔드포인트 호출 (텍스트 전용)
     * @param prompt 전달할 프롬프트 문자열
     * @return Ollama 응답 문자열
     */
    public String generate(String prompt) {
        return call(model, prompt, null);
    }

    /**
     * Ollama /api/generate 엔드포인트 호출 (비전 모델 — 이미지 포함)
     * @param prompt      프롬프트 문자열
     * @param base64Image data URI 접두어(data:image/...;base64,)가 제거된 순수 base64 이미지
     * @return Ollama 응답 문자열
     */
    public String generateWithImage(String prompt, String base64Image) {
        return call(visionModel, prompt, base64Image);
    }

    private String call(String targetModel, String prompt, String base64Image) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", targetModel);
            body.put("prompt", prompt);
            body.put("stream", false);
            if (base64Image != null && !base64Image.isBlank()) {
                body.put("images", List.of(base64Image));
            }

            Map<?, ?> response = restTemplate.postForObject(
                    ollamaBaseUrl + "/api/generate",
                    body,
                    Map.class
            );

            if (response == null || !response.containsKey("response")) {
                throw CustomException.internalError("Ollama 응답이 비어있습니다.");
            }

            return (String) response.get("response");

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[OllamaClient] Ollama 호출 실패: {}", e.getMessage());
            throw CustomException.internalError("Ollama 서버 연결에 실패했습니다: " + e.getMessage());
        }
    }
}
