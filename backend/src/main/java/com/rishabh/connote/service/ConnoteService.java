package com.rishabh.connote.service;

import com.rishabh.connote.dto.request.CarrierSetupRequest;
import com.rishabh.connote.dto.response.CarrierSummaryResponse;
import com.rishabh.connote.entity.CarrierAccount;

import java.util.List;

public interface ConnoteService {
    String generateId(String carrierName);
    CarrierAccount setupCarrierAccount(CarrierSetupRequest request);
    List<CarrierSummaryResponse> listCarriers();
}