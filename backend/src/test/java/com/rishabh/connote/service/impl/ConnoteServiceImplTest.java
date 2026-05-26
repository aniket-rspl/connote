package com.rishabh.connote.service.impl;

import com.rishabh.connote.dto.request.CarrierSetupRequest;
import com.rishabh.connote.entity.CarrierAccount;
import com.rishabh.connote.exception.OutOfRangeException;
import com.rishabh.connote.exception.ResourceAlreadyExistsException;
import com.rishabh.connote.exception.ResourceNotFoundException;
import com.rishabh.connote.repository.ConnoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import com.rishabh.connote.dto.response.CarrierSummaryResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConnoteServiceImplTest {

    @Mock
    private ConnoteRepository repository;

    @InjectMocks
    private ConnoteServiceImpl service;

    private CarrierAccount mockAccount;

    @BeforeEach
    void setUp() {
        mockAccount = new CarrierAccount();
        mockAccount.setCarrierName("Freightmate");
        mockAccount.setAccountNumber("123ABC");
        mockAccount.setDigits(10);
        mockAccount.setLastIdx(19604);
        mockAccount.setRangeStart(19000);
        mockAccount.setRangeEnd(20000);
    }

    @Test
    void shouldListCarriersSortedByName() {
        CarrierAccount accountB = new CarrierAccount();
        accountB.setCarrierName("Zebra");
        accountB.setAccountNumber("1");
        accountB.setLastIdx(10);
        accountB.setRangeStart(1);
        accountB.setRangeEnd(100);

        CarrierAccount accountA = new CarrierAccount();
        accountA.setCarrierName("Alpha");
        accountA.setAccountNumber("2");
        accountA.setLastIdx(20);
        accountA.setRangeStart(1);
        accountA.setRangeEnd(200);

        when(repository.findAll()).thenReturn(List.of(accountB, accountA));

        List<CarrierSummaryResponse> carriers = service.listCarriers();

        assertThat(carriers).hasSize(2);
        assertThat(carriers.get(0).carrierName()).isEqualTo("Alpha");
        assertThat(carriers.get(1).carrierName()).isEqualTo("Zebra");
        assertThat(carriers.get(0).lastIdx()).isEqualTo(20);
    }

    @Test
    void shouldSuccessfullySetupNewCarrier() {
        CarrierSetupRequest request = new CarrierSetupRequest(
                "NewCarrier", "9988", 8, 1000, 1000, 5000
        );
        when(repository.existsByCarrierNameIgnoreCase("NewCarrier")).thenReturn(false);
        when(repository.save(any(CarrierAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CarrierAccount saved = service.setupCarrierAccount(request);

        assertThat(saved.getCarrierName()).isEqualTo("NewCarrier");
        assertThat(saved.getAccountNumber()).isEqualTo("9988");
        verify(repository, times(1)).save(any(CarrierAccount.class));
    }

    @Test
    void shouldThrowExceptionWhenInitialIdxIsOutsideConfiguredRange() {
        CarrierSetupRequest request = new CarrierSetupRequest(
                "DelhiveryLogisicCo", "123FCD", 10, 10000, 12307, 15000
        );
        when(repository.existsByCarrierNameIgnoreCase("DelhiveryLogisicCo")).thenReturn(false);

        assertThatThrownBy(() -> service.setupCarrierAccount(request))
                .isInstanceOf(OutOfRangeException.class)
                .hasMessageContaining("Initial index must be between 12306 and 14999");

        verify(repository, never()).save(any(CarrierAccount.class));
    }

    @Test
    void shouldThrowExceptionWhenRangeStartIsGreaterThanRangeEnd() {
        CarrierSetupRequest request = new CarrierSetupRequest(
                "BadRange", "123", 8, 5000, 9000, 8000
        );
        when(repository.existsByCarrierNameIgnoreCase("BadRange")).thenReturn(false);

        assertThatThrownBy(() -> service.setupCarrierAccount(request))
                .isInstanceOf(OutOfRangeException.class)
                .hasMessageContaining("Range end must be greater than or equal to range start");

        verify(repository, never()).save(any(CarrierAccount.class));
    }

    @Test
    void shouldThrowExceptionWhenSetupCarrierAlreadyExists() {
        // Arrange
        CarrierSetupRequest request = new CarrierSetupRequest(
                "Freightmate", "123ABC", 10, 19604, 19000, 20000
        );
        when(repository.existsByCarrierNameIgnoreCase("Freightmate")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> service.setupCarrierAccount(request))
                .isInstanceOf(ResourceAlreadyExistsException.class)
                .hasMessageContaining("already exists");

        verify(repository, never()).save(any(CarrierAccount.class));
    }

    @Test
    void shouldSuccessfullyGenerateTrackingId() {
        when(repository.findByCarrierNameIgnoreCase("Freightmate")).thenReturn(Optional.of(mockAccount));

        String trackingId = service.generateId("Freightmate");

        assertThat(trackingId).isEqualTo("FREI123ABC00000196051");
        assertThat(mockAccount.getLastIdx()).isEqualTo(19605);
        verify(repository, times(1)).save(mockAccount);
    }

    @Test
    void shouldGenerateTrackingIdWithExpectedChecksum() {
        CarrierAccount account = new CarrierAccount();
        account.setCarrierName("NewCarrier");
        account.setAccountNumber("9988");
        account.setDigits(8);
        account.setLastIdx(999);
        account.setRangeStart(1000);
        account.setRangeEnd(5000);

        when(repository.findByCarrierNameIgnoreCase("NewCarrier")).thenReturn(Optional.of(account));

        String trackingId = service.generateId("NewCarrier");

        assertThat(trackingId).isEqualTo("NEWC9988000010003");
        assertThat(account.getLastIdx()).isEqualTo(1000);
    }

    @Test
    void shouldBuildPrefixFromFirstFourLettersIgnoringNonLetters() {
        CarrierAccount account = new CarrierAccount();
        account.setCarrierName("FreightmateCourierCo");
        account.setAccountNumber("123ABC");
        account.setDigits(10);
        account.setLastIdx(19604);
        account.setRangeStart(19000);
        account.setRangeEnd(20000);

        when(repository.findByCarrierNameIgnoreCase("FreightmateCourierCo")).thenReturn(Optional.of(account));

        String trackingId = service.generateId("FreightmateCourierCo");

        assertThat(trackingId).startsWith("FREI123ABC");
        assertThat(trackingId).hasSize(21);
    }

    @Test
    void shouldResolveCarrierByNameCaseInsensitively() {
        when(repository.findByCarrierNameIgnoreCase("freightmate")).thenReturn(Optional.of(mockAccount));

        String trackingId = service.generateId("freightmate");

        assertThat(trackingId).startsWith("FREI123ABC");
    }

    @Test
    void shouldThrowExceptionWhenNextIndexIsBelowRangeStart() {
        mockAccount.setLastIdx(18998);
        when(repository.findByCarrierNameIgnoreCase("Freightmate")).thenReturn(Optional.of(mockAccount));

        assertThatThrownBy(() -> service.generateId("Freightmate"))
                .isInstanceOf(OutOfRangeException.class)
                .hasMessageContaining("Max limit reached");

        verify(repository, never()).save(any());
    }

    @Test
    void shouldThrowExceptionWhenGeneratingIdForUnknownCarrier() {
        // Arrange
        when(repository.findByCarrierNameIgnoreCase("Unknown")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> service.generateId("Unknown"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Carrier not found");
    }

    @Test
    void shouldThrowExceptionWhenIndexExceedsRange() {
        // Arrange
        mockAccount.setLastIdx(20000); // Set to max range
        when(repository.findByCarrierNameIgnoreCase("Freightmate")).thenReturn(Optional.of(mockAccount));

        // Act & Assert
        assertThatThrownBy(() -> service.generateId("Freightmate"))
                .isInstanceOf(OutOfRangeException.class)
                .hasMessageContaining("Max limit reached");
    }
}