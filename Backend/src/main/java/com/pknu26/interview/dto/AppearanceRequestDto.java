package com.pknu26.interview.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 복장 분석 요청 DTO
 * 프론트엔드에서 웹캠 프레임 1장을 base64로 캡처해 전송합니다.
 */
@Data
@NoArgsConstructor
public class AppearanceRequestDto {

    /** 어떤 질문에 대한 스냅샷인지 (선택) */
    private String questionId;

    /** data URI 또는 순수 base64 JPEG 이미지 */
    private String imageBase64;
}
