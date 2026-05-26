package com.rishabh.connote.validation;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CarrierIndexRangeRulesTest {

    @Test
    void shouldAcceptValidRangeConfiguration() {
        assertThat(CarrierIndexRangeRules.validate(12306, 12307, 15000)).isEmpty();
        assertThat(CarrierIndexRangeRules.validate(999, 1000, 5000)).isEmpty();
    }

    @Test
    void shouldRejectInitialIdxBelowAllowedMinimum() {
        assertThat(CarrierIndexRangeRules.validate(10000, 12307, 15000))
                .hasValueSatisfying(msg -> assertThat(msg).contains("12306"));
    }

    @Test
    void shouldRejectWhenRangeStartIsGreaterThanRangeEnd() {
        assertThat(CarrierIndexRangeRules.validate(5000, 9000, 8000))
                .hasValueSatisfying(msg -> assertThat(msg).contains("Range end"));
    }

    @Test
    void shouldRejectInitialIdxAboveAllowedMaximum() {
        assertThat(CarrierIndexRangeRules.validate(15000, 12307, 15000))
                .hasValueSatisfying(msg -> assertThat(msg).contains("14999"));
    }

    @Test
    void shouldAcceptInitialIdxAtRangeBoundaries() {
        assertThat(CarrierIndexRangeRules.validate(12306, 12307, 15000)).isEmpty();
        assertThat(CarrierIndexRangeRules.validate(14999, 12307, 15000)).isEmpty();
    }
}
