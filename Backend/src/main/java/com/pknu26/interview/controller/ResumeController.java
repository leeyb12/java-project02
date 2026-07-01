package com.pknu26.interview.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pknu26.interview.dto.InterviewResponseDto;
import com.pknu26.interview.dto.QuestionDto;
import com.pknu26.interview.dto.ResumeRequestDto;
import com.pknu26.interview.dto.ResumeUploadResponseDto;
import com.pknu26.interview.entity.InterviewSession;
import com.pknu26.interview.entity.Resume;
import com.pknu26.interview.exception.CustomException;
import com.pknu26.interview.service.InterviewService;
import com.pknu26.interview.service.OllamaService;
import com.pknu26.interview.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.io.IOException;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final InterviewService interviewService;
    private final OllamaService ollamaService;
    private final ObjectMapper objectMapper;     // ② JSON 파싱용 — Spring이 자동 등록

    /* ── 이력서 업로드 ── */
    @PostMapping("/resume/upload")
    public ResponseEntity<ResumeUploadResponseDto> upload(   // ③ 올바른 DTO 클래스명
            @RequestParam("resume") MultipartFile file) throws IOException {
        return ResponseEntity.ok(resumeService.upload(file));
    }

    /* ── 이력서 기반 질문 생성 ── */
    @PostMapping("/resume/generate-questions")
    public ResponseEntity<List<QuestionDto>> generateQuestions(
            @RequestBody ResumeRequestDto req) {             // ④ 올바른 DTO 클래스명

        Resume resume = resumeService.findById(req.getResumeId());  // ⑤ null 체크는 ResumeService에서 처리

        String raw = ollamaService.generateQuestions(
                resume.getRawText(),
                req.getCategory(),
                req.getQuestionCount(),
                req.getDifficulty()
        );

        List<QuestionDto> questions = parseQuestionJson(raw);        // ⑥ 내부 메서드로 분리
        return ResponseEntity.ok(questions);
    }

    /* ── 면접 세션 생성 ── */
    @PostMapping("/sessions")
    public ResponseEntity<Map<String, Object>> createSession(@RequestBody ResumeRequestDto req) {
        String resumeText = "";
        if (req.getResumeId() != null && !req.getResumeId().isBlank()) {
            Resume resume = resumeService.findById(req.getResumeId());
            resumeText = resume.getRawText();
        }

        int questionCount = req.getQuestionCount() > 0 ? req.getQuestionCount() : 3;
        List<QuestionDto> questions;
        try {
            questions = parseQuestionJson(
                    ollamaService.generateQuestions(
                            resumeText,
                            req.getCategory(),
                            questionCount,
                            req.getDifficulty())
            );
        } catch (Exception e) {
            questions = getDefaultQuestions(req.getCategory(), questionCount, req.getResumeId() != null, req.getDifficulty());
        }

        InterviewSession session = interviewService.createSessionWithQuestions(
                req.getResumeId(),
                req.getCategory(),
                questionCount,
                questions,
                req.getUseCamera() // 웹캠 사용 여부 전달
        );

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("startedAt", session.getStartedAt().toString());
        response.put("useCamera", session.getUseCamera()); // 응답에도 포함
        return ResponseEntity.ok(response);
    }

    // 🔗 @PathVariable에 명시적으로 변수명 지정 ("sessionId")
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<InterviewSession> getSession(@PathVariable("sessionId") String sessionId) {
        InterviewSession session = interviewService.findSessionById(sessionId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    // 🔗 @PathVariable에 명시적으로 변수명 지정 ("sessionId")
    @PatchMapping("/sessions/{sessionId}/end")
    public ResponseEntity<Void> endSession(@PathVariable("sessionId") String sessionId) {
        interviewService.endSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    // 🔗 @PathVariable에 명시적으로 변수명 지정 ("sessionId")
    @GetMapping("/sessions/{sessionId}/questions")
    public ResponseEntity<List<InterviewResponseDto>> getSessionQuestions(@PathVariable("sessionId") String sessionId) {
        return ResponseEntity.ok(interviewService.getQuestionsBySessionId(sessionId));
    }

    // 답변 제출(POST /sessions/{id}/answers)과 피드백(GET /sessions/{id}/feedback),
    // 녹화본 재생은 AnswerController로 분리되었습니다.

    /* ── JSON 문자열 → List<QuestionDto> ── */
    private List<QuestionDto> parseQuestionJson(String raw) {
        try {
            // Ollama가 ```json ... ``` 마크다운 블록으로 감싸는 경우 제거
            String cleaned = raw
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("(?s)```\\s*", "")
                    .trim();

            return objectMapper.readValue(cleaned, new TypeReference<List<QuestionDto>>() {});
        } catch (Exception e) {
            throw CustomException.internalError("질문 JSON 파싱 실패: " + e.getMessage());
        }
    }

    private List<QuestionDto> getDefaultQuestions(String category, int count, boolean resumeBased, String difficulty) {
        List<QuestionDto> defaultQuestions = new ArrayList<>();
        String normalizedCategory = category == null || category.isBlank() ? "general" : category;
        String normalizedDifficulty = difficulty == null || difficulty.isBlank() ? "medium" : difficulty;
        String difficultyLabel = switch (normalizedDifficulty.toLowerCase()) {
            case "easy" -> "쉬운";
            case "hard" -> "어려운";
            default -> "보통";
        };

        for (int i = 1; i <= Math.max(count, 3); i++) {
            defaultQuestions.add(QuestionDto.builder()
                    .id("q_" + i)
                    .text(String.format("[%s][%s] 기본 질문 %d", normalizedCategory, difficultyLabel, i))
                    .category(normalizedCategory)
                    .timeLimit(180)
                    .resumeBased(resumeBased)
                    .build());
        }
        return defaultQuestions;
    }
}