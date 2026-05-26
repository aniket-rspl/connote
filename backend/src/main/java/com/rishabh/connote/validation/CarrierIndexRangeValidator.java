package com.rishabh.connote.validation;

import com.rishabh.connote.dto.request.CarrierSetupRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CarrierIndexRangeValidator implements ConstraintValidator<ValidCarrierIndexRange, CarrierSetupRequest> {

    @Override
    public boolean isValid(CarrierSetupRequest request, ConstraintValidatorContext context) {
        if (request == null
                || request.initialIdx() == null
                || request.rangeStart() == null
                || request.rangeEnd() == null) {
            return true;
        }

        return CarrierIndexRangeRules
                .validate(request.initialIdx(), request.rangeStart(), request.rangeEnd())
                .map(message -> {
                    context.disableDefaultConstraintViolation();
                    context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
                    return false;
                })
                .orElse(true);
    }
}
