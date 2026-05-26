package com.rishabh.connote.controller;

import com.rishabh.connote.dto.request.CarrierSetupRequest;
import com.rishabh.connote.dto.request.IdGenerationRequest;
import com.rishabh.connote.dto.response.CarrierSummaryResponse;
import com.rishabh.connote.entity.CarrierAccount;
import com.rishabh.connote.exception.GlobalExceptionHandler;
import com.rishabh.connote.service.ConnoteService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({ ConnoteController.class, GlobalExceptionHandler.class })
@AutoConfigureMockMvc
class ConnoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ConnoteService service;

    @Test
    void shouldReturn200AndCarrierListWhenGetCarriers() throws Exception {
        List<CarrierSummaryResponse> carriers = List.of(
                new CarrierSummaryResponse("DHL", "8899", 250000, 200000, 300000),
                new CarrierSummaryResponse("FedEx", "12345", 1000000, 1000000, 9999999)
        );
        when(service.listCarriers()).thenReturn(carriers);

        mockMvc.perform(get("/api/v1/connote/carriers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].carrierName").value("DHL"))
                .andExpect(jsonPath("$[1].carrierName").value("FedEx"));
    }

    @Test
    void shouldReturn200AndGeneratedIdWhenRequestIsValid() throws Exception {
        // Arrange
        IdGenerationRequest request = new IdGenerationRequest("Freightmate");
        String expectedTrackingId = "FREI123ABC00000196052";

        when(service.generateId("Freightmate")).thenReturn(expectedTrackingId);

        // Act & Assert
        mockMvc.perform(post("/api/v1/connote/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carrierName").value("Freightmate"))
                .andExpect(jsonPath("$.trackingId").value(expectedTrackingId));
    }

    @Test
    void shouldReturn400BadRequestWhenCarrierNameIsBlank() throws Exception {
        IdGenerationRequest request = new IdGenerationRequest("");

        mockMvc.perform(post("/api/v1/connote/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn201WhenCarrierSetupSucceeds() throws Exception {
        CarrierSetupRequest request = new CarrierSetupRequest(
                "Acme", "99X", 8, 999, 1000, 5000
        );
        CarrierAccount saved = new CarrierAccount();
        saved.setCarrierName("Acme");
        saved.setAccountNumber("99X");
        saved.setLastIdx(999);

        when(service.setupCarrierAccount(any())).thenReturn(saved);

        mockMvc.perform(post("/api/v1/connote/setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.carrierName").value("Acme"))
                .andExpect(jsonPath("$.lastIdx").value(999));
    }

    @Test
    void shouldReturn400WhenSetupRequestIsInvalid() throws Exception {
        CarrierSetupRequest request = new CarrierSetupRequest(
                "", "", 0, 10000, 12307, 15000
        );

        mockMvc.perform(post("/api/v1/connote/setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnEmptyListWhenNoCarriersExist() throws Exception {
        when(service.listCarriers()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/connote/carriers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}