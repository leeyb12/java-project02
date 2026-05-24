package com.pknu26.interview.repository;

import com.pknu26.interview.entity.Resume;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ResumeMapper {

    /** 이력서 저장 */
    void insertResume(Resume resume);

    /** ID로 이력서 조회 */
    Resume findById(String id);
}