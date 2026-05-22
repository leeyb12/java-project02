package com.pknu26.interview.dto;

import lombok.Data;

@Data
public class InterviewDetailDTO {
    private Long detailId;
    private String sessionId;
    private String questionText;
    private String userAnswer;
    private String aiEvaluation;
    private Integer score;
    private Integer sortOrder;
}