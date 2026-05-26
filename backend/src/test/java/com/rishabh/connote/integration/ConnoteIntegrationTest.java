package com.rishabh.connote.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ConnoteIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldListSeedCarriers() throws Exception {
        mockMvc.perform(get("/api/v1/connote/carriers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$[?(@.carrierName == 'FedEx')]").exists())
                .andExpect(jsonPath("$[?(@.carrierName == 'DHL')]").exists());
    }

    @Test
    void shouldSetupCarrierAndGenerateTrackingId() throws Exception {
        String carrierName = "IntegrationTestCarrier";

        Map<String, Object> setupBody = Map.of(
                "carrierName", carrierName,
                "accountNumber", "INT1",
                "digits", 8,
                "initialIdx", 999,
                "rangeStart", 1000,
                "rangeEnd", 5000
        );

        mockMvc.perform(post("/api/v1/connote/setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.carrierName").value(carrierName))
                .andExpect(jsonPath("$.lastIdx").value(999));

        mockMvc.perform(post("/api/v1/connote/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("carrierName", carrierName))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carrierName").value(carrierName))
                .andExpect(jsonPath("$.trackingId").value("INTEINT1000010003"));
    }

    @Test
    void shouldRejectDuplicateCarrierSetup() throws Exception {
        Map<String, Object> setupBody = Map.of(
                "carrierName", "FedEx",
                "accountNumber", "99999",
                "digits", 7,
                "initialIdx", 1000000,
                "rangeStart", 1000000,
                "rangeEnd", 9999999
        );

        mockMvc.perform(post("/api/v1/connote/setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupBody)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Carrier account setup failed. Carrier 'FedEx' already exists."));
    }

    @Test
    void shouldGenerateIdForSeedCarrierCaseInsensitively() throws Exception {
        mockMvc.perform(post("/api/v1/connote/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("carrierName", "dhl"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carrierName").value("dhl"))
                .andExpect(jsonPath("$.trackingId").exists());
    }

    @Test
    void shouldReturn404ForUnknownCarrier() throws Exception {
        mockMvc.perform(post("/api/v1/connote/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("carrierName", "NoSuchCarrierXYZ"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Carrier not found: NoSuchCarrierXYZ"));
    }
}
