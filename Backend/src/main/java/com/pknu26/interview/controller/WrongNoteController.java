package com.pknu26.interview.controller;

import com.pknu26.interview.dto.WrongNoteRequestDto;
import com.pknu26.interview.entity.WrongNote;
import com.pknu26.interview.service.WrongNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 면접 오답노트 API
 */
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/v1/interviews/wrong-notes")
@RequiredArgsConstructor
public class WrongNoteController {

    private final WrongNoteService wrongNoteService;

    /** 오답노트 담기 */
    @PostMapping
    public ResponseEntity<Map<String, Object>> add(@RequestBody WrongNoteRequestDto req) {
        WrongNote note = wrongNoteService.add(req);
        Map<String, Object> res = new HashMap<>();
        res.put("noteId", note.getNoteId());
        res.put("status", "ok");
        return ResponseEntity.ok(res);
    }

    /** 오답노트 목록 */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list() {
        return ResponseEntity.ok(wrongNoteService.list());
    }

    /** 오답노트 삭제 */
    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> delete(@PathVariable("noteId") String noteId) {
        wrongNoteService.delete(noteId);
        return ResponseEntity.noContent().build();
    }
}
