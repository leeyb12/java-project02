package com.pknu26.interview.service;

import com.pknu26.interview.dto.InterviewRequestDto;
import com.pknu26.interview.dto.InterviewResponseDto;

public interface InterviewService {
    // 면접자의 답변을 처리하고 AI 응답을 반환하는 표준 규격 정의
    InterviewResponseDto processInterview(InterviewRequestDto requestDto);
}