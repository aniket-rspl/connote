export interface CarrierSetupRequest {
  carrierName: string;
  accountNumber: string;
  digits: number;
  initialIdx: number;
  rangeStart: number;
  rangeEnd: number;
}
