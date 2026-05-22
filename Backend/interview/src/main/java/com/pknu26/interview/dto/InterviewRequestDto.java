package com.pknu26.interview.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * AI 면접 시뮬레이터 - 면접 답변 요청 DTO
 * 스파게티 코드를 방지하고 계층 간 데이터 전송을 규격화합니다.
 */
@Getter
@Setter
@NoArgsConstructor
@ToString
public class InterviewRequestDto {

    // 1. 멀티 세션 대화 관리를 위한 핵심 ID (MyBatis chat_history 매핑용)
    @NotBlank(message = "세션 ID는 필수입니다.")
    private String sessionId;

    // 2. 면접자가 입력한 답변 내용 (Ollama LLM 모델에게 컨텍스트와 함께 던져질 데이터)
    @NotBlank(message = "답변 내용은 비어있을 수 없습니다.")
    private String userMessage;
}