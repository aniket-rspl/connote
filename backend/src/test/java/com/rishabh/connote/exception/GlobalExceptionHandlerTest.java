package com.rishabh.connote.exception;

import com.rishabh.connote.controller.ConnoteController;
import com.rishabh.connote.dto.request.CarrierSetupRequest;
import com.rishabh.connote.dto.request.IdGenerationRequest;
import com.rishabh.connote.service.ConnoteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({ConnoteController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ConnoteService service;

    @Test
    void shouldReturn404WhenCarrierNotFound() throws Exception {
        when(service.generateId("Missing")).thenThrow(new ResourceNotFoundException("Carrier not found: Missing"));

        mockMvc.perform(post("/api/v1/connote/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new IdGenerationRequest("Missing"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Carrier not found: Missing"))
                .andExpect(jsonPath("$.path").value("/api/v1/connote/generate"));
    }

    @Test
    void shouldReturn409WhenCarrierAlreadyExists() throws Exception {
        CarrierSetupRequest request = new CarrierSetupRequest("FedEx", "1", 7, 1000, 1000, 5000);
        when(service.setupCarrierAccount(any())).thenThrow(
                new ResourceAlreadyExistsException("Carrier account setup failed. Carrier 'FedEx' already exists.")
        );

        mockMvc.perform(post("/api/v1/connote/setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Resource Conflict"));
    }

    @Test
    void shouldReturn400WhenIndexOutOfRange() throws Exception {
        when(service.generateId("FedEx")).thenThrow(
                new OutOfRangeException("Consignment Index out of range. Max limit reached.")
        );

        mockMvc.perform(post("/api/v1/connote/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new IdGenerationRequest("FedEx"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Consignment Index out of range. Max limit reached."));
    }

    @Test
    void shouldReturn400WhenRequestBodyFailsValidation() throws Exception {
        CarrierSetupRequest request = new CarrierSetupRequest("", "", 0, null, null, null);

        mockMvc.perform(post("/api/v1/connote/setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }
}
