package com.pknu26.interview.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.HashMap;
import java.util.Map;

/**
 * 로컬 Ollama AI 엔진과의 HTTP 통신을 전담하는 클라이언트 컴포넌트
 * 외부 연동 로직을 격리하여 서비스 계층이 스파게티 코드가 되는 것을 방지합니다.
 */
@Component
public class OllamaClient {

    private final WebClient ollamaWebClient;

    @Value("${ollama.model-name:llama3}")
    private String modelName;

    // OllamaConfig에서 빈으로 등록된 WebClient를 주입받습니다.
    public OllamaClient(WebClient ollamaWebClient) {
        this.ollamaWebClient = ollamaWebClient;
    }

    /**
     * Ollama API(/api/generate)를 호출하여 AI 면접관의 질문/피드백을 받아옵니다.
     *
     * @param prompt AI에게 던질 프롬프트 문장
     * @return AI가 생성한 답변 텍스트
     */
    public String generateResponse(String prompt) {
        // 1. 요청 바디 데이터 규격화
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", modelName);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false); // 단발성 응답을 위해 스트리밍 꺼짐

        try {
            // 2. WebClient를 활용한 동기식 HTTP POST 요청
            Map<?, ?> rawResponse = ollamaWebClient.post()
                    .uri("/api/generate")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(); // 결과를 받을 때까지 대기 (Timeout은 OllamaConfig 설정을 따름)

            // 3. 안전한 Null 체크 및 응답 데이터 파싱
            if (rawResponse != null && rawResponse.containsKey("response")) {
                return ((String) rawResponse.get("response")).trim();
            }
            
            return "AI 면접관의 응답 데이터 구조가 올바르지 않습니다.";

        } catch (Exception e) {
            // 4. 통신 장애 및 예외 발생 시 스파게티 코드가 되지 않도록 깔끔한 에러 메시지 반환
            return "Ollama AI 서버 통신 실패: " + e.getMessage();
        }
    }
}