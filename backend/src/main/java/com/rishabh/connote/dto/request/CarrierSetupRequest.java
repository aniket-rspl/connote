package com.rishabh.connote.dto.request;

import com.rishabh.connote.validation.ValidCarrierIndexRange;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@ValidCarrierIndexRange
public record CarrierSetupRequest(
        @NotBlank(message = "Carrier name is required")
        String carrierName,

        @NotBlank(message = "Account number is required")
        String accountNumber,

        @Min(value = 1, message = "Digits must be at least 1")
        int digits,

        @NotNull(message = "Initial index is required")
        Integer initialIdx,

        @NotNull(message = "Range start is required")
        Integer rangeStart,

        @NotNull(message = "Range end is required")
        Integer rangeEnd
) {}