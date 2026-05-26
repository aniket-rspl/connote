package com.rishabh.connote.dto.response;

public record CarrierSummaryResponse(
        String carrierName,
        String accountNumber,
        int lastIdx,
        int rangeStart,
        int rangeEnd
) {}
