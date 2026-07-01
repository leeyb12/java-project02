package com.pknu26.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pknu26.interview.dto.AnswerFeedbackDto;
import com.pknu26.interview.entity.Answer;
import com.pknu26.interview.repository.AnswerMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 답변 저장(녹화본 + STT 텍스트) 및 Ollama 기반 AI 평가.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnswerService {

    private final AnswerMapper answerMapper;
    private final FileStorageService fileStorageService;
    private final OllamaService ollamaService;
    private final ObjectMapper objectMapper;

    /**
     * 답변 제출: 녹화본 저장 + AI 평가 후 DB 저장
     * @return 저장된 Answer (score 포함)
     */
    public Answer submit(String sessionId, String questionId, String questionText,
                         String answerText, String behavior, MultipartFile video) {
        String answerId = UUID.randomUUID().toString();

        // 1. 녹화본 저장
        String videoPath = fileStorageService.store(video, sessionId, answerId);

        // 2. AI 평가
        Evaluation eval = evaluate(questionText, answerText);

        // 3. DB 저장
        Answer answer = Answer.builder()
                .answerId(answerId)
                .sessionId(sessionId)
                .questionId(questionId)
                .questionText(questionText)
                .answerText(answerText)
                .videoPath(videoPath)
                .score(eval.score)
                .strengths(toJson(eval.strengths))
                .improvements(toJson(eval.improvements))
                .pronunciation(eval.pronunciation)
                .behavior(behavior)
                .build();
        answerMapper.insertAnswer(answer);

        log.info("[AnswerService] 답변 저장 완료 id={} score={}", answerId, eval.score);
        return answer;
    }

    /** 세션 종합 피드백 */
    public Map<String, Object> getFeedback(String sessionId) {
        List<Answer> answers = answerMapper.selectAnswersBySessionId(sessionId);

        List<AnswerFeedbackDto> list = new ArrayList<>();
        int total = 0;
        for (Answer a : answers) {
            int score = a.getScore() != null ? a.getScore() : 0;
            total += score;
            list.add(AnswerFeedbackDto.builder()
                    .answerId(a.getAnswerId())
                    .questionId(a.getQuestionId())
                    .questionText(a.getQuestionText())
                    .answerText(a.getAnswerText())
                    .score(score)
                    .strengths(fromJson(a.getStrengths()))
                    .improvements(fromJson(a.getImprovements()))
                    .pronunciation(a.getPronunciation())
                    .behavior(a.getBehavior())
                    .videoUrl(a.getVideoPath() != null
                            ? "/api/v1/interviews/answers/" + a.getAnswerId() + "/video" : null)
                    .build());
        }

        int overall = list.isEmpty() ? 0 : Math.round((float) total / list.size());

        Map<String, Object> res = new java.util.HashMap<>();
        res.put("sessionId", sessionId);
        res.put("overallScore", overall);
        res.put("answers", list);
        return res;
    }

    public Answer findById(String answerId) {
        return answerMapper.selectAnswerById(answerId);
    }

    /* ── AI 평가 ── */
    private record Evaluation(int score, List<String> strengths, List<String> improvements,
                              String pronunciation) {}

    private Evaluation evaluate(String questionText, String answerText) {
        if (answerText == null || answerText.isBlank()) {
            return new Evaluation(0,
                    Collections.emptyList(),
                    List.of("답변이 제출되지 않았습니다. 질문에 맞는 답변을 시도해 보세요."),
                    "답변 음성이 감지되지 않았습니다.");
        }

        String prompt = """
                너는 면접관이야. 아래 질문과 지원자의 답변을 평가해줘.
                반드시 아래 JSON 형식으로만 출력하고, 마크다운이나 다른 텍스트는 절대 포함하지 마.

                질문: %s
                답변: %s

                {"score": 0~100 사이 정수, "strengths": ["잘한 점 1~3개(한국어)"], "improvements": ["고쳐야 할 점 1~3개(한국어)"], "pronunciation": "발음/전달력에 대한 한 문장 한국어 평가"}
                """.formatted(questionText == null ? "" : questionText, answerText);

        try {
            String raw = ollamaService.generate(prompt);
            String json = raw
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("(?s)```\\s*", "")
                    .trim();
            JsonNode node = objectMapper.readTree(json);
            int score = clamp(node.path("score").asInt(0));
            return new Evaluation(
                    score,
                    toStringList(node.get("strengths")),
                    toStringList(node.get("improvements")),
                    node.path("pronunciation").asText(""));
        } catch (Exception e) {
            log.warn("[AnswerService] AI 평가 실패, 기본값 반환: {}", e.getMessage());
            return new Evaluation(60,
                    List.of("답변을 제출했습니다."),
                    List.of("AI 평가에 실패해 상세 피드백을 제공하지 못했습니다."),
                    "");
        }
    }

    private int clamp(int v) {
        return Math.max(0, Math.min(100, v));
    }

    private List<String> toStringList(JsonNode arr) {
        List<String> out = new ArrayList<>();
        if (arr != null && arr.isArray()) {
            arr.forEach(n -> out.add(n.asText()));
        }
        return out;
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list == null ? Collections.emptyList() : list);
        } catch (Exception e) {
            return "[]";
        }
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
