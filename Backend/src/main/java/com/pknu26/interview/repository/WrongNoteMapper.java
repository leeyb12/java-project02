package com.pknu26.interview.repository;

import com.pknu26.interview.entity.WrongNote;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface WrongNoteMapper {

    /** 오답노트 저장 */
    void insertWrongNote(WrongNote note);

    /** 오답노트 전체 조회 (최신순) */
    List<WrongNote> selectAllWrongNotes();

    /** 오답노트 삭제 */
    void deleteWrongNote(String noteId);
}
