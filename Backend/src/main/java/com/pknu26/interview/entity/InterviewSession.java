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
public class InterviewSession {

    /** UUID 기반 세션 ID */
    private String id;

    /** 연결된 이력서 ID (이력서 없이 시작하면 null) */
    private String resumeId;

    /** 면접 카테고리 */
    private String category;

    /** 요청 질문 수 */
    private int questionCount;

    /** 세션 상태 (active / ended) */
    private String status;

    /** 세션 시작 일시 */
    private LocalDateTime startedAt;

    /** 세션 종료 일시 */
    private LocalDateTime endedAt;
}