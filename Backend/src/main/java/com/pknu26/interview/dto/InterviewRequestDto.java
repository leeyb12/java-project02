package com.pknu26.interview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * AI 면접 시뮬레이터 - 면접 답변 요청 DTO
 * 안전한 데이터 전송을 위해 불변성을 지향하도록 Setter를 제거했습니다.
 */
@Getter
@NoArgsConstructor
@ToString
public class InterviewRequestDto {

    // 1. 멀티 세션 대화 관리를 위한 핵심 ID (Oracle NUMBER와 매핑하기 위해 Long 사용 권장)
    @NotNull(message = "세션 ID는 필수입니다.")
    private Long sessionId; // String -> Long 변경

    // 2. 면접자가 입력한 답변 내용 (Ollama LLM 모델 전송용)
    @NotBlank(message = "답변 내용은 비어있을 수 없습니다.")
    private String userMessage;

    // 빌더 패턴을 적용하여 Setter 없이 안전하게 객체를 생성할 수 있도록 지원
    @Builder
    public InterviewRequestDto(Long sessionId, String userMessage) {
        this.sessionId = sessionId;
        this.userMessage = userMessage;
    }
}