package com.rishabh.connote.dto.request;

import jakarta.validation.constraints.NotBlank;

public record IdGenerationRequest(
        @NotBlank(message = "Carrier name is required")
        String carrierName
) {}