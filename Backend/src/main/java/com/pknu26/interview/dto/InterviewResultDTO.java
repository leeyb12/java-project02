package com.pknu26.interview.dto;

import lombok.Data;

@Data
public class InterviewResultDTO {
    private String sessionId;
    private String interviewType;
    private String jobCategory;
    private Long detailId;
    private String questionText;
    private String userAnswer;
    private String aiEvaluation;
    private Integer score;
}