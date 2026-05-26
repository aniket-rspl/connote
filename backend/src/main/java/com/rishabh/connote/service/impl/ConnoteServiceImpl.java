package com.rishabh.connote.service.impl;

import com.rishabh.connote.dto.request.CarrierSetupRequest;
import com.rishabh.connote.dto.response.CarrierSummaryResponse;
import com.rishabh.connote.entity.CarrierAccount;
import com.rishabh.connote.exception.OutOfRangeException;
import com.rishabh.connote.exception.ResourceAlreadyExistsException;
import com.rishabh.connote.exception.ResourceNotFoundException;
import com.rishabh.connote.repository.ConnoteRepository;
import com.rishabh.connote.service.ConnoteService;
import com.rishabh.connote.validation.CarrierIndexRangeRules;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class ConnoteServiceImpl implements ConnoteService {

    private final ConnoteRepository repository;

    public ConnoteServiceImpl(ConnoteRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public CarrierAccount setupCarrierAccount(CarrierSetupRequest request) {
        if (repository.existsByCarrierNameIgnoreCase(request.carrierName())) {
            throw new ResourceAlreadyExistsException(
                    "Carrier account setup failed. Carrier '" + request.carrierName() + "' already exists."
            );
        }

        CarrierIndexRangeRules.validate(request.initialIdx(), request.rangeStart(), request.rangeEnd())
                .ifPresent(message -> {
                    throw new OutOfRangeException(message);
                });

        CarrierAccount newAccount = new CarrierAccount();
        newAccount.setCarrierName(request.carrierName());
        newAccount.setAccountNumber(request.accountNumber());
        newAccount.setDigits(request.digits());
        newAccount.setLastIdx(request.initialIdx());
        newAccount.setRangeStart(request.rangeStart());
        newAccount.setRangeEnd(request.rangeEnd());

        return repository.save(newAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarrierSummaryResponse> listCarriers() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(CarrierAccount::getCarrierName, String.CASE_INSENSITIVE_ORDER))
                .map(acc -> new CarrierSummaryResponse(
                        acc.getCarrierName(),
                        acc.getAccountNumber(),
                        acc.getLastIdx(),
                        acc.getRangeStart(),
                        acc.getRangeEnd()
                ))
                .toList();
    }

    @Override
    @Transactional
    public String generateId(String carrierName) {
        CarrierAccount acc = repository.findByCarrierNameIgnoreCase(carrierName)
                .orElseThrow(() -> new ResourceNotFoundException("Carrier not found: " + carrierName));

        int nextIdx = acc.getLastIdx() + 1;

        if (nextIdx < acc.getRangeStart() || nextIdx > acc.getRangeEnd()) {
            throw new OutOfRangeException("Consignment Index out of range. Max limit reached.");
        }

        String prefix = generatePrefix(acc.getCarrierName(), acc.getAccountNumber());
        String generatedId = calculateChecksum(prefix, nextIdx, acc.getDigits());

        acc.setLastIdx(nextIdx);
        repository.save(acc);

        return generatedId;
    }

    //In problem Statement there is no rule defined for generating prefix
    //So I'm using first 4 letters of carrierName in upper case
    //for example, Carrier: FreightmateCourierCo, Prefix would be: FREI
    private String generatePrefix(String carrierName, String accountNumber) {
        StringBuilder prefix = new StringBuilder(4);
        for (int i = 0; i < carrierName.length() && prefix.length() < 4; i++) {
            char c = carrierName.charAt(i);
            if (Character.isLetter(c)) {
                prefix.append(Character.toUpperCase(c));
            }
        }
        return prefix.append(accountNumber).toString();
    }

    private String calculateChecksum(String prefix, int index, int digits) {
        char[] arr = new char[digits];
        int temp = index;

        int sumOdd = 0, sumEven = 0;
        boolean odd = true;

        for (int i = digits - 1; i >= 0; i--) {
            int d = temp % 10;
            arr[i] = (char) ('0' + d);
            temp /= 10;

            if (odd) {
                sumOdd += d;
            } else {
                sumEven += d;
            }
            odd = !odd;
        }

        int total = sumOdd * 3 + sumEven * 7;
        int checkSum = (10 - (total % 10)) % 10;

        return prefix + new String(arr) + checkSum;
    }
}