package com.pknu26.interview.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ResumeRequestDto {

    /** 업로드된 이력서 ID */
    private String resumeId;

    /** 면접 카테고리 (general / technical / behavioral / situational) */
    private String category;

    /** 생성할 질문 수 */
    private int questionCount;

    /** 난이도 (easy / medium / hard) — 선택 */
    private String difficulty;

    /** 카메라 사용 여부 (기본값: true) */
    private Boolean useCamera = true;
}