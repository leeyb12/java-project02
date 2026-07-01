package com.pknu26.interview.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 면접 답변 + AI 평가 결과 (INTERVIEW_ANSWERS)
 * strengths/improvements는 DB에 JSON 배열 문자열로 저장합니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Answer {

    private String answerId;
    private String sessionId;
    private String questionId;
    private String questionText;
    private String answerText;
    private String videoPath;
    private Integer score;
    private String strengths;      // JSON 배열 문자열
    private String improvements;   // JSON 배열 문자열
    private String pronunciation;  // 발음/전달력 코멘트
    private String behavior;       // 행동/표정 코멘트
    private LocalDateTime createdAt;
}
