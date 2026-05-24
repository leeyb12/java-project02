package com.pknu26.interview.client;

import com.pknu26.interview.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class OllamaClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:qwen3.5:9b}")
    private String model;

    /**
     * Ollama /api/generate 엔드포인트 호출
     * @param prompt 전달할 프롬프트 문자열
     * @return Ollama 응답 문자열
     */
    public String generate(String prompt) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("prompt", prompt);
            body.put("stream", false);

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