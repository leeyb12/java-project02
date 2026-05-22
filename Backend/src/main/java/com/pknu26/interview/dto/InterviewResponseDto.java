package com.pknu26.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewResponseDto {
    private Long detailId;  // 질문 상세 PK
    private String sessionId;  // 세션 ID
    private String questionText;  // AI가 생성한 면접 질문
    private String userAnswer;  // 사용자의 답변
    private String aiEvaluation;  // AI의 피드백
    private Integer score;  // 점수
    private Integer sortOrder;  // 질문 순서
}
