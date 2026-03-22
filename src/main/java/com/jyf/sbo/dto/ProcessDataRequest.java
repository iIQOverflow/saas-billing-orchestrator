package com.jyf.sbo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record ProcessDataRequest(
    @NotBlank(message = "action is required")
    String action,

    @NotNull(message = "dataPayload is required")
    Map<String, Object> dataPayload
) {
}
