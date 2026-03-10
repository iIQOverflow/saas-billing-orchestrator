package com.jerryfeng.sbo.dto;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
    Instant timestamp,
    int status,
    String error,
    String message,
    List<String> details,
    String path
) {
}
