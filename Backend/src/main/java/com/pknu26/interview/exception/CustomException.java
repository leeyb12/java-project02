package com.pknu26.interview.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CustomException extends RuntimeException {

    private final HttpStatus status;
    private final String message;

    public CustomException(HttpStatus status, String message) {
        super(message);
        this.status = status;
        this.message = message;
    }

    /* 자주 쓰는 팩토리 메서드 */

    public static CustomException notFound(String message) {
        return new CustomException(HttpStatus.NOT_FOUND, message);
    }

    public static CustomException badRequest(String message) {
        return new CustomException(HttpStatus.BAD_REQUEST, message);
    }

    public static CustomException internalError(String message) {
        return new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
}