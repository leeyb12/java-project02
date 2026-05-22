package com.pknu26.interview.dto;

import org.springframework.web.multipart.MultipartFile;

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
    private String jobCategory;  // 지원 직무
    private String resumeContent;  // PDF에서 추출된 텍스트 내용
    private MultipartFile file;  // 프론트에서 넘어온 실제 PDF 파일  
}
