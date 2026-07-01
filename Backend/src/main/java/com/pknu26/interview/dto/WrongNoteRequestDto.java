package com.pknu26.interview.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 오답노트 담기 요청 DTO
 */
@Data
@NoArgsConstructor
public class WrongNoteRequestDto {
    private String sessionId;
    private String questionId;
    private String answerId;   // 답변 ID로 담으면 서버가 내용 채움 (선택)
    private String questionText;
    private String answerText;
    private Integer score;
}
