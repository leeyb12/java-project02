package com.pknu26.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 피드백 화면용 답변 평가 DTO (프론트 응답)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerFeedbackDto {

    private String answerId;
    private String questionId;
    private String questionText;
    private String answerText;
    private Integer score;
    private List<String> strengths;      // 잘한 점
    private List<String> improvements;   // 고쳐야 할 점
    private String pronunciation;        // 발음/전달력
    private String behavior;             // 행동/표정
    private String videoUrl;             // 녹화본 재생 URL
}
