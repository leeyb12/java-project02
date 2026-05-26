package com.pknu26.interview.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.pknu26.interview.dto.InterviewRequestDto;
import com.pknu26.interview.dto.InterviewResponseDto;

@Mapper
public interface InterviewMapper {

    /** 면접 세션 저장 */
    void insertSession(InterviewRequestDto dto);

    /** 면접세션 저장 (세션 전용) */
    void insertInterviewSession(com.pknu26.interview.entity.InterviewSession session);

    /** 면접 질문 목록 저장 */
    void insertInterviewDetails(List<InterviewResponseDto> questions);

    /** 세션 ID로 면접 세션 조회 */
    com.pknu26.interview.entity.InterviewSession findSessionById(String sessionId);

    /** 세션 종료 처리 */
    void endSession(String sessionId);

    /** 세션 ID로 질문 목록 조회 */
    List<Object> selectAnswersBySessionId(String sessionId);
    List<InterviewResponseDto> selectQuestionsBySessionId(String sessionId);
}