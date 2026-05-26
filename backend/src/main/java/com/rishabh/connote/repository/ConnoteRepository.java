package com.rishabh.connote.repository;

import com.rishabh.connote.entity.CarrierAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConnoteRepository extends JpaRepository<CarrierAccount, Long> {

    Optional<CarrierAccount> findByCarrierNameIgnoreCase(String carrierName);

    // Efficiently checks if a record exists without pulling the whole entity into memory
    boolean existsByCarrierNameIgnoreCase(String carrierName);
}