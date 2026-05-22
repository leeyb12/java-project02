package com.pknu26.interview.service;

import com.pknu26.interview.dto.InterviewRequestDto;
import com.pknu26.interview.dto.InterviewResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Service
public class InterviewService {

    private final WebClient ollamaWebClient;
    
    @Value("${ollama.model-name:llama3}")
    private String modelName;

    // 생성자 주입을 통해 OllamaConfig에서 만든 WebClient 빈(Bean)을 안전하게 가져옵니다.
    public InterviewService(WebClient ollamaWebClient) {
        this.ollamaWebClient = ollamaWebClient;
    }

    /**
     * 면접자의 답변을 처리하고 Ollama AI로부터 다음 꼬리 질문을 받아오는 핵심 비즈니스 로직
     */
    public InterviewResponseDto processInterview(InterviewRequestDto requestDto) {
        
        // 1. [비즈니스 로직 예외 처리] 입력값 검증 (방어적 프로그래밍)
        if (requestDto == null || requestDto.getUserMessage().trim().isEmpty()) {
            throw new IllegalArgumentException("면접 답변 내용이 유효하지 않습니다.");
        }

        // TODO: 2. [MyBatis 연동 영역] DB에 유저가 보낸 답변 저장 및 이전 대화 내역(Context) 조회
        // (현재 단계에서는 뼈대 구성을 위해 로그 생략 또는 임시 처리 가능)

        // 3. [AI 통신 영역] Ollama AI 엔진에게 전달할 JSON 바디 조립 (프롬프트 튜닝 포함)
        String prompt = String.format(
            "당신은 전문 면접관입니다. 다음 면접자의 답변을 듣고, 날카로운 심층 꼬리 질문을 1개만 제안해 주세요. \n[면접자 답변]: %s", 
            requestDto.getUserMessage()
        );

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", modelName);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false); // 단발성 응답을 위해 스트리밍 비활성화

        // 4. [HTTP 통신] 이전에 세팅한 WebClient 빈을 활용해 동기(block) 방식으로 AI 응답 수신
        Map<?, ?> aiRawResponse = ollamaWebClient.post()
                .uri("/api/generate")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block(); // 비동기 Mono를 동기식으로 전환하여 결과를 기다림

        // 5. [데이터 가공] AI가 뱉어낸 응답 값 가공
        String aiMessage = (aiRawResponse != null && aiRawResponse.containsKey("response")) 
                ? (String) aiRawResponse.get("response") 
                : "AI 면접관의 응답을 생성하지 못했습니다. 다시 시도해 주세요.";

        // 6. [결과 반환] 빌더 패턴을 활용하여 불변성(Immutable)을 보장하는 응답 DTO 생성
        return InterviewResponseDto.builder()
                .sessionId(requestDto.getSessionId())
                .aiMessage(aiMessage.trim())
                .status("PROCESSING") // 현재 면접이 진행 중임을 명시
                .build();
    }
}