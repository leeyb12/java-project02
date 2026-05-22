package com.pknu26.interview.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
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
}