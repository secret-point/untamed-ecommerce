import { AvailableFilter, Locale } from "./types/common";

export interface GetJobDetailRequest {
    locale: Locale;
    jobId: string;
}

export interface GetApplicationRequest {
    locale: Locale;
    applicationId: string;
}

export interface GetRequisitionRequest {
    requisitionId: string;
}

export interface GetScheduleListByJobIdRequest {
    locale: Locale,
    jobId: string,
    applicationId: string,
    filter?: AvailableFilter
}

export interface GetScheduleDetailRequest {
    locale: Locale,
    scheduleId: string
}
export interface CreateApplicationRequestDS {
    jobId: string;
    scheduleId?: string;
    dspEnabled?: boolean | null;
}

export interface CreateApplicationResponseDS {
    applicationId: string;
}

export interface CreateApplicationAndSkipScheduleRequestDS {
    jobId: string;
    scheduleId: string;
    dspEnabled?: boolean | null;
}

export interface UpdateApplicationRequestDS {
    applicationId: string;
    payload: any;
    type: string;
    isCsRequest?: boolean;
    dspEnabled?: boolean;
}

export interface UpdateWorkflowNameRequest {
    applicationId: string;
    workflowStepName: string;
}

export interface SelectedScheduleForUpdateApplication {
    jobId: string;
    scheduleDetails: string;
    scheduleId: string;
    jobScheduleSelectedTime?: string;
}