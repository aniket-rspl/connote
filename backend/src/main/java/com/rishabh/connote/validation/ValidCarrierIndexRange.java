package com.rishabh.connote.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = CarrierIndexRangeValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCarrierIndexRange {

    String message() default "Invalid carrier index range configuration.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
