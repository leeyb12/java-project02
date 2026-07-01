package com.pknu26.interview.service;

import com.pknu26.interview.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 녹화본(webm/mp4) 파일을 로컬 디스크에 저장/조회합니다.
 */
@Slf4j
@Service
public class FileStorageService {

    private final Path root;

    public FileStorageService(@Value("${app.upload.dir:./uploads}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    /**
     * 녹화본 저장
     * @return 저장된 파일의 절대 경로 문자열
     */
    public String store(MultipartFile file, String sessionId, String answerId) {
        if (file == null || file.isEmpty()) return null;
        try {
            Path dir = root.resolve(safe(sessionId));
            Files.createDirectories(dir);

            String ext = resolveExtension(file);
            Path target = dir.resolve(safe(answerId) + ext);
            file.transferTo(target.toFile());

            log.info("[FileStorage] 녹화본 저장: {}", target);
            return target.toString();
        } catch (IOException e) {
            log.error("[FileStorage] 저장 실패: {}", e.getMessage());
            throw CustomException.internalError("녹화본 저장에 실패했습니다: " + e.getMessage());
        }
    }

    /** 저장 경로로 파일 로드 */
    public Path load(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            throw CustomException.notFound("녹화본 경로가 없습니다.");
        }
        Path path = Paths.get(storedPath).toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw CustomException.notFound("녹화본 파일을 찾을 수 없습니다.");
        }
        return path;
    }

    private String resolveExtension(MultipartFile file) {
        String type = file.getContentType();
        if (type != null && type.contains("mp4")) return ".mp4";
        return ".webm";
    }

    /** 경로 조작 방지용 간단 정제 */
    private String safe(String s) {
        if (s == null || s.isBlank()) return "unknown";
        return s.replaceAll("[^a-zA-Z0-9_-]", "_");
    }
}
