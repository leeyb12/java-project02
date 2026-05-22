package com.pknu26.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {

    /** 질문 고유 ID (q_001 형식) */
    private String id;

    /** 질문 본문 */
    private String text;

    /** 카테고리 (general / technical / behavioral / situational) */
    private String category;

    /** 답변 제한 시간 (초, 기본 180) */
    private int timeLimit;

    /** 이력서 기반 생성 여부 */
    private boolean resumeBased;
}