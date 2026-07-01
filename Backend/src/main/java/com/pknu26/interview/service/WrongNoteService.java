package com.pknu26.interview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pknu26.interview.dto.WrongNoteRequestDto;
import com.pknu26.interview.entity.Answer;
import com.pknu26.interview.entity.WrongNote;
import com.pknu26.interview.repository.WrongNoteMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 오답노트 저장/조회/삭제
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WrongNoteService {

    private final WrongNoteMapper wrongNoteMapper;
    private final AnswerService answerService;
    private final ObjectMapper objectMapper;

    /** 오답노트 담기 — answerId가 있으면 저장된 답변 내용으로 채웁니다. */
    public WrongNote add(WrongNoteRequestDto req) {
        String questionId = req.getQuestionId();
        String questionText = req.getQuestionText();
        String answerText = req.getAnswerText();
        Integer score = req.getScore();
        String improvements = "[]";

        if (req.getAnswerId() != null && !req.getAnswerId().isBlank()) {
            Answer a = answerService.findById(req.getAnswerId());
            if (a != null) {
                questionId = a.getQuestionId();
                questionText = a.getQuestionText();
                answerText = a.getAnswerText();
                score = a.getScore();
                improvements = a.getImprovements() != null ? a.getImprovements() : "[]";
            }
        }

        WrongNote note = WrongNote.builder()
                .noteId(UUID.randomUUID().toString())
                .sessionId(req.getSessionId())
                .questionId(questionId)
                .questionText(questionText)
                .answerText(answerText)
                .improvements(improvements)
                .score(score)
                .build();
        wrongNoteMapper.insertWrongNote(note);
        log.info("[WrongNoteService] 오답노트 저장 id={}", note.getNoteId());
        return note;
    }

    /** 오답노트 목록 (improvements를 List로 파싱해 반환) */
    public List<Map<String, Object>> list() {
        return wrongNoteMapper.selectAllWrongNotes().stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    public void delete(String noteId) {
        wrongNoteMapper.deleteWrongNote(noteId);
    }

    private Map<String, Object> toMap(WrongNote n) {
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("noteId", n.getNoteId());
        m.put("sessionId", n.getSessionId());
        m.put("questionId", n.getQuestionId());
        m.put("questionText", n.getQuestionText());
        m.put("answerText", n.getAnswerText());
        m.put("score", n.getScore());
        m.put("improvements", fromJson(n.getImprovements()));
        m.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
        return m;
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
