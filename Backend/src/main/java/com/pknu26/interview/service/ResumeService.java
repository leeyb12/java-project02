package com.pknu26.interview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pknu26.interview.dto.ParsedInfoDto;
import com.pknu26.interview.dto.ResumeUploadResponseDto;
import com.pknu26.interview.entity.Resume;
import com.pknu26.interview.exception.CustomException;
import com.pknu26.interview.repository.ResumeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeMapper resumeMapper;        // ResumeRepository → ResumeMapper
    private final OllamaService ollamaService;
    private final ObjectMapper objectMapper;        // Spring 자동 등록

    /* ── PDF 텍스트 추출 ── */
    public String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            return new PDFTextStripper().getText(doc);
        }
    }

    /* ── DOCX 텍스트 추출 ── */
    public String extractTextFromDocx(MultipartFile file) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(file.getInputStream());
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }

    /* ── 파일 종류에 따라 분기 ── */
    public String extractText(MultipartFile file) throws IOException {
        String name = file.getOriginalFilename().toLowerCase();
        if (name.endsWith(".pdf"))         return extractTextFromPdf(file);
        if (name.matches(".*\\.docx?$"))   return extractTextFromDocx(file);
        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }

    /* ── Ollama로 이력서 파싱 (이름/스킬/경력 추출) ── */
    public ParsedInfoDto parseResumeWithOllama(String resumeText) {
        String prompt = """
                다음 이력서에서 정보를 추출해줘. 반드시 아래 JSON 형식으로만 출력해. 다른 텍스트는 절대 포함하지 마.
                
                이력서: %s
                
                출력 형식:
                {"name":"이름","skills":["기술1","기술2"],"experience":["경력1"],"education":["학력1"]}
                """.formatted(resumeText);
        try {
            String raw = ollamaService.generate(prompt);
            String cleaned = raw
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("(?s)```\\s*", "")
                    .trim();
            return objectMapper.readValue(cleaned, ParsedInfoDto.class);
        } catch (Exception e) {
            log.warn("[ResumeService] 이력서 파싱 실패, 빈 객체 반환: {}", e.getMessage());
            return ParsedInfoDto.builder().build(); // 파싱 실패해도 업로드는 성공 처리
        }
    }

   /* ── 업로드 + 파싱 + 저장 통합 ── */
    public ResumeUploadResponseDto upload(MultipartFile file) throws IOException {
        // [디버깅 로그 1단계] 요청 정상 도착 확인
        System.out.println("====== [1단계] 프론트엔드 이력서 파일 요청 도착 완료 ======");
        validateFile(file);

        // [디버깅 로그 2단계] 텍스트 추출 시작
        System.out.println("====== [2단계] 파일에서 텍스트 추출 시작 ======");
        String text = extractText(file);
        if (text == null || text.isBlank()) {
            throw CustomException.badRequest("이력서에서 텍스트를 추출할 수 없습니다.");
        }
        System.out.println("====== [3단계] 텍스트 추출 성공! 글자수: " + text.length() + " ======");

        // [디버깅 로그 4단계] Ollama에게 AI 파싱 요청 (여기가 시간이 오래 걸리는 핵심 길목입니다)
        System.out.println("====== [4단계] Ollama(로컬 AI)에게 이력서 정보 파싱 요청 시작... ======");
        ParsedInfoDto parsed = parseResumeWithOllama(text);
        System.out.println("====== [5단계] Ollama 파싱 응답 완료! ======");

        Resume resume = Resume.builder()
                .id(UUID.randomUUID().toString())
                .fileName(file.getOriginalFilename())
                .rawText(text)
                .parsedInfoJson(toJson(parsed))  // parsedInfo → parsedInfoJson (String)
                .createdAt(LocalDateTime.now())
                .build();

        resumeMapper.insertResume(resume);       // .save() → .insertResume()
        log.info("[ResumeService] 이력서 저장 완료 id={}", resume.getId());
        System.out.println("====== [6단계] DB(MyBatis)에 이력서 데이터 저장 완료! ======");

        return ResumeUploadResponseDto.builder()
                .resumeId(resume.getId())
                .extractedText(text)
                .name(parsed.getName())          // parsed 안에서 이름을 꺼내서 바깥으로 추출
                .skills(parsed.getSkills())      // 스킬 배열 추출
                .experience(parsed.getExperience()) // 경력 배열 추출
                .education(parsed.getEducation())   // 학력 배열 추출
                .build();
    }

    /* ── ID로 이력서 조회 ── */
    public Resume findById(String resumeId) {
        if (resumeId == null || resumeId.isBlank()) {
            throw CustomException.badRequest("resumeId가 비어있습니다.");
        }
        Resume resume = resumeMapper.findById(resumeId);
        if (resume == null) {
            throw CustomException.notFound("이력서를 찾을 수 없습니다. id=" + resumeId);
        }
        return resume;
    }

    /* ── 파일 유효성 검사 ── */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw CustomException.badRequest("파일이 비어있습니다.");
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.matches("(?i).*\\.(pdf|docx?|txt)$")) {
            throw CustomException.badRequest("PDF, DOCX, DOC, TXT 파일만 업로드할 수 있습니다.");
        }
        if (file.getSize() > 10L * 1024 * 1024) {
            throw CustomException.badRequest("파일 크기는 10MB 이하여야 합니다.");
        }
    }

    /* ── 객체 → JSON 문자열 ── */
    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}