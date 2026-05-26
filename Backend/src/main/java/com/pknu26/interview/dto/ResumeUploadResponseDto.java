package com.pknu26.interview.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeUploadResponseDto {

    /** 저장된 이력서 ID */
    private String resumeId;

    /** 추출된 전체 텍스트 */
    private String extractedText;

    /** Ollama가 파싱한 구조화 정보 */
    private ParsedInfoDto parsedInfo;

    private String name;
    private List<String> skills;
    private List<String> experience;
    private List<String> education;
}