package com.pknu26.interview.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Resume {

    /** UUID 기반 이력서 ID */
    private String id;

    /** 원본 파일명 */
    private String fileName;

    /** 추출된 전체 텍스트 */
    private String rawText;

    /** Ollama 파싱 결과 JSON 문자열 */
    private String parsedInfoJson;

    /** 업로드 일시 */
    private LocalDateTime createdAt;
}