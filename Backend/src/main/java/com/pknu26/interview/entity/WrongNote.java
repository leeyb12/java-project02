package com.pknu26.interview.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 오답노트 (WRONG_NOTE)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WrongNote {

    private String noteId;
    private String sessionId;
    private String questionId;
    private String questionText;
    private String answerText;
    private String improvements;   // JSON 배열 문자열
    private Integer score;
    private LocalDateTime createdAt;
}
