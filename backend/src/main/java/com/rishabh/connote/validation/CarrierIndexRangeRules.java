package com.rishabh.connote.validation;

import java.util.Optional;

public final class CarrierIndexRangeRules {

    private CarrierIndexRangeRules() {
    }

    public static Optional<String> validate(int initialIdx, int rangeStart, int rangeEnd) {
        if (rangeStart > rangeEnd) {
            return Optional.of("Range end must be greater than or equal to range start.");
        }

        int minInitialIdx = rangeStart - 1;
        int maxInitialIdx = rangeEnd - 1;

        if (initialIdx < minInitialIdx || initialIdx > maxInitialIdx) {
            return Optional.of(String.format(
                    "Initial index must be between %d and %d (inclusive) so the first generated ID falls within range %d-%d.",
                    minInitialIdx,
                    maxInitialIdx,
                    rangeStart,
                    rangeEnd
            ));
        }

        return Optional.empty();
    }
}
