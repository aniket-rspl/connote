package com.rishabh.connote.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "carrier_accounts")
public class CarrierAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "carrier_name", nullable = false, unique = true)
    private String carrierName;

    @Column(name = "account_number", nullable = false)
    private String accountNumber;

    @Column(nullable = false)
    private int digits;

    @Column(name = "last_idx", nullable = false)
    private int lastIdx;

    @Column(name = "range_start", nullable = false)
    private int rangeStart;

    @Column(name = "range_end", nullable = false)
    private int rangeEnd;

    @Version
    private Long version;
}