package com.pknu26.interview.mapper;

import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import java.util.Map;

@Mapper
public interface InterviewMapper {
    
    // 1. 왼쪽 과거 면접 목록 리스트 검색
    List<Map<String, Object>> selectSessionListByMemberId(String memberId);
    
    // 2. 우측 특정 대화방의 질문/답변 상세 내역 검색
    List<Map<String, Object>> selectInterviewDetailsBySessionId(String sessionId);
    
    // 3. 새로운 면접 세션방 생성
    int insertInterviewSession(Map<String, Object> sessionData);
    
    // 4. 대화 내역 추가 기록 (질문 및 답변)
    int insertInterviewDetail(Map<String, Object> detailData);
}