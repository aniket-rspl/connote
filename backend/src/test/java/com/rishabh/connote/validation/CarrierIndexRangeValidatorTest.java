package com.rishabh.connote.validation;

import com.rishabh.connote.dto.request.CarrierSetupRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CarrierIndexRangeValidatorTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void shouldPassForValidCarrierSetupRequest() {
        CarrierSetupRequest request = new CarrierSetupRequest(
                "Acme", "99X", 8, 999, 1000, 5000
        );

        Set<ConstraintViolation<CarrierSetupRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test
    void shouldFailWhenInitialIdxIsOutsideRange() {
        CarrierSetupRequest request = new CarrierSetupRequest(
                "Acme", "99X", 8, 10000, 12307, 15000
        );

        Set<ConstraintViolation<CarrierSetupRequest>> violations = validator.validate(request);

        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .anyMatch(msg -> msg.contains("Initial index must be between"));
    }

    @Test
    void shouldFailWhenRangeStartExceedsRangeEnd() {
        CarrierSetupRequest request = new CarrierSetupRequest(
                "Acme", "99X", 8, 5000, 9000, 8000
        );

        Set<ConstraintViolation<CarrierSetupRequest>> violations = validator.validate(request);

        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .anyMatch(msg -> msg.contains("Range end"));
    }
}
