package com.pknu26.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

/**
 * AI 면접 시뮬레이터 - 면접 답변 응답 DTO
 * 가독성을 극대화하고 프론트엔드가 필요한 모든 메타데이터를 표준화하여 전달합니다.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class InterviewResponseDto {

    // 1. 대화 연속성 유지를 위한 세션 ID
    private String sessionId;

    // 2. Ollama AI 모델이 생성한 꼬리 질문 또는 면접 피드백 내용
    private String aiMessage;

    // 3. 현재 면접의 상태 제어 (예: "READY", "PROCESSING", "COMPLETED" 등)
    // 프론트엔드(React)에서 이 상태값을 보고 버튼 활성화/비활성화 및 UI를 변경합니다.
    private String status;

    // 4. 응답 생성 시간 (타임스탬프 기록용)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}