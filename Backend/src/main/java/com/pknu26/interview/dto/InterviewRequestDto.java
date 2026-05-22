package com.pknu26.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewRequestDto {
    private String sessionId;  // 세션 고유 Id(UUID 등)
    private String memberId;  // 사용자 ID
    private String jobCategory;  
}
