package com.pknu26.interview.controller;

import com.pknu26.interview.entity.Answer;
import com.pknu26.interview.service.AnswerService;
import com.pknu26.interview.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 답변 제출 / 피드백 / 녹화본 재생 API
 */
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class AnswerController {

    private final AnswerService answerService;
    private final FileStorageService fileStorageService;

    /** 답변 제출 (녹화본 + STT 텍스트) → 저장 + AI 평가 */
    @PostMapping("/sessions/{sessionId}/answers")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @PathVariable("sessionId") String sessionId,
            @RequestParam(value = "questionId", required = false) String questionId,
            @RequestParam(value = "questionText", required = false) String questionText,
            @RequestParam(value = "answerText", required = false) String answerText,
            @RequestParam(value = "behavior", required = false) String behavior,
            @RequestParam(value = "video", required = false) MultipartFile video) {

        Answer answer = answerService.submit(
                sessionId, questionId, questionText, answerText, behavior, video);

        Map<String, Object> response = new HashMap<>();
        response.put("answerId", answer.getAnswerId());
        response.put("uploadedAt", LocalDateTime.now().toString());
        response.put("score", answer.getScore());
        return ResponseEntity.ok(response);
    }

    /** 세션 종합 피드백 (잘한 점 / 고쳐야 할 점 포함) */
    @GetMapping("/sessions/{sessionId}/feedback")
    public ResponseEntity<Map<String, Object>> getFeedback(
            @PathVariable("sessionId") String sessionId) {
        return ResponseEntity.ok(answerService.getFeedback(sessionId));
    }

    /** 녹화본 스트리밍 */
    @GetMapping("/answers/{answerId}/video")
    public ResponseEntity<Resource> getVideo(@PathVariable("answerId") String answerId) {
        Answer answer = answerService.findById(answerId);
        if (answer == null || answer.getVideoPath() == null) {
            return ResponseEntity.notFound().build();
        }
        Path path = fileStorageService.load(answer.getVideoPath());
        Resource resource = new FileSystemResource(path);

        String contentType = path.toString().endsWith(".mp4") ? "video/mp4" : "video/webm";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(resource);
    }
}
