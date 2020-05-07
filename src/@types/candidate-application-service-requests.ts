export interface CreateApplicationRequest {
  candidateId: string;
  parentRequisitionId: string;
  language: string;
}
export interface UpdateNonFcraRequest {
  requestedCopyOfBackgroundCheck: boolean;
  nonFcraAcknowledgementEsign: {
    signature: string;
    signedDateTime: string;
  };
  nonFcraStateNoticeEsign: {
    signature: string;
    signedDateTime: string;
  };
}

export interface UpdateAdditionalBackgroundInfoRequest {
  hasCriminalRecordWithinSevenYears: boolean;
  hasPreviouslyWorkedAtAmazon: boolean;
  mostRecentBuildingWorkedAtAmazon: string;
  mostRecentTimePeriodWorkedAtAmazon: string;
  previousLegalNames: string[];
  governmentIdType: GovernmentIdType;
  idNumber: string;
  dateOfBirth: string;
}

export enum GovernmentIdType {
  DRIVERS_LICENSE = "DRIVERS_LICENSE",
  PASSPORT = "PASSPORT"
}

export interface UpdateApplicationRequest {
  applicationId: string;
  payload: any;
  type: string;
}

export interface UpdateContingentOffer {
  offerAcceptedTime: string;
  offerAccepted: boolean;
}
