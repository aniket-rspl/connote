package com.rishabh.connote.controller;

import com.rishabh.connote.dto.request.CarrierSetupRequest;
import com.rishabh.connote.dto.request.IdGenerationRequest;
import com.rishabh.connote.dto.response.CarrierSummaryResponse;
import com.rishabh.connote.dto.response.IdGenerationResponse;
import com.rishabh.connote.entity.CarrierAccount;
import com.rishabh.connote.service.ConnoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/connote")
@CrossOrigin(origins = "http://localhost:4200")
public class ConnoteController {

    // Note: We inject the Interface, not the Implementation class!
    private final ConnoteService service;

    public ConnoteController(ConnoteService service) {
        this.service = service;
    }

    @GetMapping("/carriers")
    public ResponseEntity<List<CarrierSummaryResponse>> listCarriers() {
        return ResponseEntity.ok(service.listCarriers());
    }

    @PostMapping("/setup")
    public ResponseEntity<CarrierAccount> setupCarrier(@Valid @RequestBody CarrierSetupRequest request) {
        CarrierAccount savedAccount = service.setupCarrierAccount(request);
        return new ResponseEntity<>(savedAccount, HttpStatus.CREATED);
    }

    @PostMapping("/generate")
    public ResponseEntity<IdGenerationResponse> generateTrackingId(@Valid @RequestBody IdGenerationRequest request) {
        String trackingId = service.generateId(request.carrierName());

        IdGenerationResponse response = new IdGenerationResponse(
                request.carrierName(),
                trackingId
        );

        return ResponseEntity.ok(response);
    }
}