package com.pknu26.interview.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.pknu26.interview.dto.InterviewRequestDto;
import com.pknu26.interview.dto.InterviewResponseDto;

@Mapper
public interface InterviewMapper {

    // 세션 정보 저장
    int insertSession(InterviewRequestDto requestDto);

    // 생성된 질문들 일괄 저장
    int insertInterviewDetails(List<InterviewResponseDto> details);

    // 특정 세션의 질문 리스트 조회
    List<InterviewResponseDto> getQuestionBySessionId(String sessionId);

}
