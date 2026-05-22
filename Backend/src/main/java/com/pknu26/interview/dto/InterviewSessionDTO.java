package com.pknu26.interview.dto;

import java.sql.Timestamp;
import lombok.Data;

@Data
public class InterviewSessionDTO {
    private String sessionId;
    private String memberId;
    private String resumeContent;
    private String jobCategory;
    private String interviewType;
    private Integer questionCount;
    private Timestamp createdAt;
}