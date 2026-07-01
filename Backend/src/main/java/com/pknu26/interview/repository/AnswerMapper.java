package com.pknu26.interview.repository;

import com.pknu26.interview.entity.Answer;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface AnswerMapper {

    /** 답변 저장 */
    void insertAnswer(Answer answer);

    /** 세션의 답변 목록 조회 (정렬: 생성순) */
    List<Answer> selectAnswersBySessionId(String sessionId);

    /** 답변 단건 조회 */
    Answer selectAnswerById(String answerId);
}
