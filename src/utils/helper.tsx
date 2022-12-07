import React from "react";
import "moment/locale/es";
import { MessageBannerType } from "@amzn/stencil-react-components/message-banner";
import Cookies from "js-cookie";
import { isArray, isBoolean } from "lodash";
import capitalize from "lodash/capitalize";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import pick from "lodash/pick";
import range from "lodash/range";
import set from "lodash/set";
import moment from "moment";
import queryString from "query-string";
import { UpdateApplicationRequest } from "../@types/candidate-application-service-requests";
import { postAdobeMetrics } from "../actions/AdobeActions/adobeActions";
import { boundGetApplication, boundUpdateApplicationDS } from "../actions/ApplicationActions/boundApplicationActions";
import { boundUpdateStepConfigAction } from "../actions/BGC_Actions/boundBGCActions";
import { boundUpdateCandidateInfoError } from "../actions/CandidateActions/boundCandidateActions";
import { boundGetNheTimeSlotsDs, boundGetNheTimeSlotsThroughNheDs } from "../actions/NheActions/boundNheAction";
import {
    boundGetScheduleListByJobId,
    boundUpdateScheduleFilters
} from "../actions/ScheduleActions/boundScheduleActions";
import { boundUpdateSelfIdStepConfig } from "../actions/SelfIdentitifactionActions/boundSelfIdentificationActions";
import { boundResetBannerMessage, boundSetBannerMessage } from "../actions/UiActions/boundUi";
import { onCompleteTaskHelper } from "../actions/WorkflowActions/workflowActions";
import { PAGE_ROUTES } from "../components/pageRoutes";
import { METRIC_NAME } from "../constants/adobe-analytics";
import { countryConfig, countryConfigType, CS_DOMAIN_LIST } from "../countryExpansionConfig";
import { initLogger, log, logError } from "../helpers/log-helper";
import { get3rdPartyFromQueryParams, jobIdSanitizer, requisitionIdSanitizer } from "../helpers/utils";
import { initScheduleMXState, initScheduleState } from "../reducers/bgc.reducer";
import store, { history } from "../store/store";
import { ApiError } from "./api/types";
import {
    GetScheduleListByJobIdRequest,
    SelectedScheduleForUpdateApplication,
    UpdateApplicationRequestDS
} from "./apiTypes";
import {
    AdditionalBGCFormConfig,
    CountrySelectOptions,
    HVH_LOCALE,
    IdNumberBgcFormConfig,
    initScheduleStateFilters,
    MXAdditionalBGCFormConfig,
    MXCountrySelectOptions,
    NameRegexValidator,
    newBBUIPathName,
    SelfIdDisabilityRadioItem,
    SelfIdDisabilityValidValues,
    SelfIdentificationConfigStepCountryMap,
    SelfIdEthnicBackgroundItemsMap,
    SelfIdGenderRadioItemsMap,
    SelfIdMilitarySpouseRadioItem,
    SelfIdPronounsItemsMap,
    SelfIdProtectedVeteranRadioItem,
    SelfIdVeteranStatusRadioItem,
    UserIdValidator,
    ValueToI18nKeyMap
} from "./constants/common";
import {
    BGC_STEPS,
    BGC_VENDOR_TYPE,
    CountryCode,
    DAYS_OF_WEEK,
    FCRA_DISCLOSURE_TYPE,
    FEATURE_FLAG,
    INFO_CARD_STEP_STATUS,
    QUERY_PARAMETER_NAME,
    SELF_IDENTIFICATION_STEPS,
    UPDATE_APPLICATION_API_TYPE
} from "./enums/common";
import { translate, translate as t } from "./translator";
import {
    AdditionalBackgroundInfoRequest,
    Address,
    AlertMessage,
    ApiErrorMessage,
    Application,
    BgcMXStepConfig,
    BgcStepConfig,
    Candidate,
    CandidateInfoErrorState,
    CandidatePatchRequest,
    DayHoursFilter,
    DetailedRadioButtonItem,
    DetailedRadioErrorType,
    EnvConfig,
    ErrorMessage,
    FeatureFlag,
    FeatureFlagList,
    FeatureFlagsMapByCountry,
    FormInputItem,
    GetNheTimeSlotRequestDs,
    GetNheTimeSlotRequestThroughNheDS,
    Job,
    Locale,
    NHETimeSlot,
    NonFcraFormErrorStatus,
    QueryParamItem,
    Range,
    Schedule,
    SchedulePreference,
    ScheduleStateFilters,
    SelfIdentificationConfig,
    SelfIdentificationDisabilityStatus,
    SelfIdentificationInfo,
    SelfIdentificationVeteranStatus,
    SelfIdEqualOpportunityStatus,
    TimeRangeHoursData
} from "./types/common";

const {
    BACKGROUND_CHECK,
    CONTINGENT_OFFER,
    JOB_CONFIRMATION,
    NHE,
    REVIEW_SUBMIT,
    SELF_IDENTIFICATION
} = PAGE_ROUTES;

export const reloadAppPageWithSchedule = (applicationData: Application, queryParams: any) => {
    const attachedScheduleId = applicationData.jobScheduleSelected?.scheduleId;
    if(!attachedScheduleId) {
        // goto error page, application has loaded but there is no schedule bound to it
        return routeToAppPageWithPath(PAGE_ROUTES.APPLICATIONID_NULL);
    }
    const mergedQueryParams = {
        ...queryParams,
        scheduleId:attachedScheduleId,
    };
    const mergedQueryParamItems = Object.values(QUERY_PARAMETER_NAME)
        .filter(paramName=>mergedQueryParams[paramName])
        .map(paramName=>({
            paramName,
            paramValue:mergedQueryParams[paramName],
        }));

    return routeToAppPageWithPath(PAGE_ROUTES.SELF_IDENTIFICATION, mergedQueryParamItems);
}

export const routeToAppPageWithPath =
    ( pathname: string, queryParams?: QueryParamItem[] ) => {
        //get current query params and append new query parameters
        //If new parameter has same value as existing one, it will update its value
        let newQueryParam = '';
        let currentQueryParams = parseSearchParamFromHash(window.location.hash);

        //Allow to receive an array of query parameters at once
        queryParams && queryParams.forEach(queryParam => {
            const { paramValue, paramName } = queryParam;
            if(!!paramName && !!paramValue) {
                currentQueryParams = {
                    ...currentQueryParams,
                    [paramName]: paramValue
                }
            }
        })

        newQueryParam = parseObjectToQueryString(currentQueryParams);

        history.push({ pathname: `/${pathname}`, search: newQueryParam });
    };

export const getQueryFromSearchAndHash = (searchOverride?: string, hashOverride?: string) => {
    const search = searchOverride || window.location.search;
    const hash = hashOverride || window.location.hash;

    const hashParam = hash.split("?").slice(1).join("&");
    const urlParams = search.length > 0
        ? `${search}&${hashParam}`
        : `?${hashParam}`;

    const queryParams = parseQueryParamsArrayToSingleItem(queryString.parse(urlParams));
    return !isEmpty(queryParams) ? queryString.stringify(queryParams) : "";
};

export const parseSearchParamFromHash = ( hashURL: string ): { [key: string]: string } => {
    let url = hashURL.split("#")[1];

    if(!url) return {};

    url = url.split("?")[1];

    if(!url) return {};

    return url.split('&')
        .reduce(( result: { [key: string]: string }, param ) => {
            const [key, value] = param.split("=");
            result[key] = decodeURIComponent(value);
            return result;
        }, {});
};

export const parseObjectToQueryString = ( obj: { [key: string]: any } ): string => {
    const str = [];

    for(const p in obj)
        if(obj.hasOwnProperty(p)) {
            let value;
            value = typeof obj[p] === 'object' ? JSON.stringify(obj[p]) : obj[p];
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(value));
        }

    return str.join("&");
}

export const getLocale = (): Locale => {
    const locale: string = Cookies.get(HVH_LOCALE) || '';

    return locale ? locale as Locale : getDefaultLocale();
};

export const getDefaultLocale = (): Locale => {
    const countryCode = "{{Country}}" as CountryCode;

    switch (countryCode){
        case CountryCode.MX:
            return Locale.esMX
        default:
            return Locale.enUS
    }
}

export const parseSearchParamFromLocationSearch = (): {[key: string]: string} => {
    const searchParams = new URLSearchParams(window.location.search);
    const searchParamObject: {[key: string]: string} = {};

    searchParams.forEach((value, key) => {
        searchParamObject[key] = value;
    });

    return searchParamObject;
};

export const getAllQueryParamsFromURL = (): {[key: string]: string} => {
    const urlHashParams = parseSearchParamFromHash(window.location.hash);
    const urlSearchParams = parseSearchParamFromLocationSearch();

    return {
        ...urlHashParams,
        ...urlSearchParams
    };
};

export const getQueryParamStringFromURLFor3rdParty = (notationOverride?: string): string => {
    const allQueryParams = getAllQueryParamsFromURL();
    let queryString = '';

    // These keys are 3rd Party params we allowed to pass with redirectUrl after login.
    const includedKeyList = ["cmpid", "ccuid", "ccid", "etd", "piq_uuid", "pandocampaignid", "pandocandidateid", "piq_source", "ikey", "akey", "tid"];

    Object.keys(allQueryParams).forEach((key) => {
        if (includedKeyList.includes(key)) {
            queryString += `&${key}=${allQueryParams[key] || ''}`;
        }
    });

    if(notationOverride){
        return `${notationOverride}${queryString.substring(1)}`;
    } else {
        return queryString;
    }
};

export const renderScheduleFullAddress = ( schedule: Schedule ): string => {
    const state = schedule.state || '';
    const city = schedule.city || '';
    const address = schedule.address || '';
    const postalCode = schedule.postalCode || '';

    const stateAndPostal = `${state ? `${state}${postalCode ? ` ${postalCode}` : ''}` : `${postalCode}`}`;

    return `${address}${city && address && `, `}${city}${stateAndPostal && (city || address) && `, `}${stateAndPostal}`;
}

export const populateTimeRangeHourData = ( startTime: string, isThisEndTime?: boolean ): TimeRangeHoursData[] => {
    const hoursData: TimeRangeHoursData[] = [];
    const startPos = isThisEndTime ? parseInt(startTime) + 1 : 0;

    range(startPos, 24, 60 / 60).map(( i ) => {
        const dateTime = moment("1990-01-01T00:00:00.000Z").utc().add("h", i);
        hoursData.push({
            time: dateTime.format("hh:mm A"),
            hours: i,
        });
    });

    if(isThisEndTime) {
        hoursData.push({
            time: "11:59 PM",
            hours: -1,
        });
    }

    return hoursData;
};

export const mapScheduleStateFilterToApiSchedulePreference = ( daysHoursFilters: DayHoursFilter[] ): SchedulePreference => {
    const filterPreference: SchedulePreference = {};

    daysHoursFilters
        .filter(filter => filter.isActive)
        .forEach(filter => {
            filterPreference[filter.day] = {
                startTime: filter.startTime,
                endTime: filter.endTime
            }
        });

    return filterPreference;
}

export const handleApplyScheduleFilters = ( scheduleFilters: ScheduleStateFilters ) => {
    const queryParams = parseSearchParamFromHash(window.location.hash);
    const { applicationId, jobId } = queryParams;
    const schedulePreferences: SchedulePreference = mapScheduleStateFilterToApiSchedulePreference(scheduleFilters.daysHoursFilter) || {};
    const range: Range = {
        HOURS_PER_WEEK: {
            maximumValue: parseInt(scheduleFilters.maxHoursPerWeek.toString()),
            minimumValue: 0
        }
    }
    const request: GetScheduleListByJobIdRequest = {
        jobId,
        applicationId,
        locale: getLocale(),
        filter: {
            filter: {
                range,
                schedulePreferences,
                eq: {},
                in: {},
            },
            locale: getLocale(),
            pageFactor: 1,
            isCRSJobsDisplayed: true,
            seasonalOnly: false,
            sortBy: scheduleFilters.sortKey.toString()
        }
    }
    boundGetScheduleListByJobId(request);
}

export const handleResetScheduleFilters = () => {
    boundUpdateScheduleFilters({
        ...initScheduleStateFilters,
        daysHoursFilter: getDaysHoursDefaultFilters()
    });
    const queryParams = parseSearchParamFromHash(window.location.hash);
    const { applicationId, jobId } = queryParams;
    const request: GetScheduleListByJobIdRequest = {
        jobId,
        applicationId,
        locale: getLocale()
    }
    boundGetScheduleListByJobId(request);
}

export const getDaysHoursDefaultFilters = (): DayHoursFilter[]  => {
    const result: DayHoursFilter[] = [];
    Object.values(DAYS_OF_WEEK).forEach(day => {
        const dayHoursFilter: DayHoursFilter = {
            day,
            isActive: true,
            startTime: "00:00",
            endTime: "23:59",
            dayTranslationKey: `BB-DayName-${capitalize(day.toString())}`
        }
        result.push(dayHoursFilter);
    });

    return result;
}

export const sanitizeApplicationData = (applicationData: Application) => {
    const workflowStepName = applicationData?.workflowStepName as any;
    if(workflowStepName){
        const sanitizedWorkflowStepName =  workflowStepName.replaceAll("\"", "");
        applicationData.workflowStepName = sanitizedWorkflowStepName;
    }
    return applicationData
}

export const getCurrentStepNameFromHash = ()=>{
    return window.location.hash.split('?')[0].replace('#/', '').split('/')[0];
}

export const checkIfIsLegacy = () => {
    const hashParam = window.location.hash.split("?").slice(1).join("&");
    const queryParams = parseQueryParamsArrayToSingleItem(queryString.parse(window.location.search || hashParam));
    const isLegacy = !queryParams.jobId;
    return isLegacy;
}

export const checkIfIsCSRequest = (override?: boolean) => {
    if(isBoolean(override)){
        return override
    }
    const { origin } = window.location;
    const isCSRequest = CS_DOMAIN_LIST.includes(origin);
    return isCSRequest;
}

export const handleSubmitJobConfirmation = (applicationDetail: Application, jobDetail: Job, scheduleDetail: Schedule) => {
    if(applicationDetail && scheduleDetail && jobDetail){
        const queryParamItem: QueryParamItem = {
            paramName: QUERY_PARAMETER_NAME.SCHEDULE_ID,
            paramValue: scheduleDetail?.scheduleId
        }
        const selectedSchedule: SelectedScheduleForUpdateApplication = {
            jobId: jobDetail.jobId,
            scheduleId: scheduleDetail.scheduleId,
            scheduleDetails: JSON.stringify(scheduleDetail),
        }
        const dspEnabled = applicationDetail?.dspEnabled;
        const updateApplicationRequest: UpdateApplicationRequestDS = {
            applicationId: applicationDetail.applicationId,
            payload: selectedSchedule,
            type: UPDATE_APPLICATION_API_TYPE.JOB_CONFIRM,
            isCsRequest: checkIfIsCSRequest(),
            dspEnabled
        }
        boundUpdateApplicationDS(updateApplicationRequest, (applicationData: Application)=>{
            onCompleteTaskHelper(applicationData);
            // Stay at the current page but add new urlParams, wait work flow to do the routing
            routeToAppPageWithPath(JOB_CONFIRMATION, [queryParamItem]);
        });
    }
}

export const handleAcceptOffer = ( applicationData: Application ) => {
    boundResetBannerMessage();
    const updateApplicationRequest: UpdateApplicationRequestDS = {
        applicationId: applicationData.applicationId,
        payload: {
            extendedTimeStamp: new Date().toISOString()
        },
        type: UPDATE_APPLICATION_API_TYPE.CONTINGENT_OFFER,
        isCsRequest: checkIfIsCSRequest(),
        dspEnabled: !!applicationData?.dspEnabled
    }
    boundUpdateApplicationDS(updateApplicationRequest, (applicationDetail: Application) => {
        onCompleteTaskHelper(applicationDetail);
    });
}


export const createUpdateApplicationRequest = (application: Application, apiType: UPDATE_APPLICATION_API_TYPE, payload: any): UpdateApplicationRequestDS => {
    const updateApplicationRequest: UpdateApplicationRequestDS = {
        applicationId: application.applicationId,
        payload,
        type: apiType,
        isCsRequest: checkIfIsCSRequest(),
        dspEnabled: !!application?.dspEnabled
    }
    return updateApplicationRequest;
}

export const validateName = (name: string): boolean => {
    return new RegExp(NameRegexValidator).test(name);
}

export const validateUserIdFormat = (userId: string): boolean => {
    return new RegExp(UserIdValidator).test(userId);
}

export const handleUInitiateMXBGCStep = ( applicationData: Application, candidateData: Candidate ) => {
    const isDspEnabled = applicationData?.dspEnabled;
    const applicationAdditionalBgcInfo = applicationData.additionalBackgroundInfo;
    const isNonFcraCompleted = !isEmpty(applicationData?.consentsMap?.BGCMedicalDrugTestConsent?.acknowledgementsElectronicSignature?.signature);
    let isAdditionalBgcCompleted: boolean;
    const { NON_FCRA, ADDITIONAL_BGC } = BGC_STEPS;
    const { ACTIVE, COMPLETED } = INFO_CARD_STEP_STATUS;

    if(isDspEnabled) {
        isAdditionalBgcCompleted = isAdditionalBgcInfoValid(candidateData?.additionalBackgroundInfo);
    }
    else {
        isAdditionalBgcCompleted = isAdditionalBgcInfoValid(candidateData?.additionalBackgroundInfo) && isAdditionalBgcInfoValid(applicationAdditionalBgcInfo);
    }

    let stepConfig: BgcMXStepConfig = { ...initScheduleMXState.stepConfig as BgcMXStepConfig }

    if(isNonFcraCompleted) {
        stepConfig = {
            ...stepConfig,
            completedSteps: [...stepConfig.completedSteps, NON_FCRA],
            [NON_FCRA]: {
                status: COMPLETED,
                editMode: false
            },
            [ADDITIONAL_BGC]: {
                status: ACTIVE,
                editMode: false
            }
        }
    }

    // Click next of additional background information form will complete task.
    // Prevent user from edit additional background information before isFcraCompleted and isNonFcraCompleted.
    if(isNonFcraCompleted && isAdditionalBgcCompleted) {
        stepConfig = {
            ...stepConfig,
            completedSteps: [...stepConfig.completedSteps, ADDITIONAL_BGC],
            [ADDITIONAL_BGC]: {
                status: COMPLETED,
                editMode: false
            }
        }
    }

    const request: BgcMXStepConfig = stepConfig;

    boundUpdateStepConfigAction(request);
}

export const handleUInitiateBGCStep = ( applicationData: Application, candidateData: Candidate ) => {
    const isDspEnabled = applicationData?.dspEnabled;
    const applicationAdditionalBgcInfo = applicationData.additionalBackgroundInfo;
    const isNonFcraCompleted = !isEmpty(applicationData?.nonFcraQuestions);
    const isFcraCompleted = !isEmpty(applicationData?.fcraQuestions);
    let isAdditionalBgcCompleted: boolean;
    const { FCRA, NON_FCRA, ADDITIONAL_BGC } = BGC_STEPS;
    const { ACTIVE, COMPLETED, LOCKED } = INFO_CARD_STEP_STATUS;
    const countryCode = candidateData?.additionalBackgroundInfo?.address?.countryCode;
    const shouldPrefillBgcInfo = shouldPrefillAdditionalBgcInfo(countryCode);

    isAdditionalBgcCompleted = isAdditionalBgcInfoValid(candidateData?.additionalBackgroundInfo) &&
      isAdditionalBgcInfoValid(applicationAdditionalBgcInfo) && shouldPrefillBgcInfo;

    if (isDspEnabled) {
        isAdditionalBgcCompleted = isAdditionalBgcInfoValid(candidateData?.additionalBackgroundInfo) &&
          shouldPrefillBgcInfo;
    }

    let stepConfig: BgcStepConfig = { ...initScheduleState.stepConfig as BgcStepConfig }

    if(isFcraCompleted) {
        stepConfig = {
            ...stepConfig,
            completedSteps: [FCRA],
            [FCRA]: {
                status: COMPLETED,
                editMode: false
            }
        }
    }
    if(isNonFcraCompleted) {
        stepConfig = {
            ...stepConfig,
            completedSteps: [...stepConfig.completedSteps, NON_FCRA],
            [NON_FCRA]: {
                status: COMPLETED,
                editMode: false
            },
            [ADDITIONAL_BGC]: {
                status: ACTIVE,
                editMode: false
            }
        }
    }
    else {
        stepConfig = {
            ...stepConfig,
            [NON_FCRA]: {
                status: isFcraCompleted ? ACTIVE : LOCKED,
                editMode: false
            }
        }
    }

    // Click next of additional background information form will complete task.
    // Prevent user from edit additional background information before isFcraCompleted and isNonFcraCompleted.
    if(isFcraCompleted && isNonFcraCompleted && isAdditionalBgcCompleted) {
        stepConfig = {
            ...stepConfig,
            completedSteps: [...stepConfig.completedSteps, ADDITIONAL_BGC],
            [ADDITIONAL_BGC]: {
                status: COMPLETED,
                editMode: false
            }
        }
    }

    const request: BgcStepConfig = stepConfig;

    boundUpdateStepConfigAction(request);
}

export const verifyBasicInfo =
    (candidate: CandidatePatchRequest, formError: CandidateInfoErrorState, formConfig: FormInputItem[]): {hasError: boolean; formError: CandidateInfoErrorState} => {
        let hasError = false;

        formConfig
            .forEach(itemConfig => {
                let isValid: boolean;
                const { dataKey, required, regex } = itemConfig;
                const value = get(candidate,itemConfig.dataKey);
                if(itemConfig.id === IdNumberBgcFormConfig.id) {
                    isValid = isSSNValid(candidate, required || false, regex || "");
                }
                else if(itemConfig.dataKey.includes("mostRecentBuildingWorkedAtAmazon") || itemConfig.dataKey.includes("mostRecentTimePeriodWorkedAtAmazon")) {
                    const hasWorkedAtAmazonPreviously = get(candidate, "additionalBackgroundInfo.hasPreviouslyWorkedAtAmazon");
                    if(hasWorkedAtAmazonPreviously === true) {
                        isValid = validateInput(value, required || false, regex || '');
                    }
                    else {
                        isValid = true;
                    }
                }
                else if(itemConfig.dataKey.includes("convictionDetails")) {
                    const hasCriminalRecordWithinSevenYears = get(candidate, "additionalBackgroundInfo.hasCriminalRecordWithinSevenYears");

                    if(hasCriminalRecordWithinSevenYears === true) {
                        isValid = validateInput(value, required || false, regex || '');
                    }
                    else {
                        isValid = true;
                    }
                }
                else if(itemConfig.dataKey.includes("hasCriminalRecordWithinSevenYears") || itemConfig.dataKey.includes("hasPreviouslyWorkedAtAmazon")) {
                    isValid = typeof value === "boolean";
                }
                else if(itemConfig.dataKey.includes("previousLegalNames")) {

                    isValid = true;

                    if(value && value.length) {
                        value.forEach((name: string, index: number) => {
                            const isNameValid = validateInput(name, required || false, regex || '');
                            set(formError, `${dataKey}${index}`, !isNameValid);

                            if(!isNameValid) {
                                isValid = false;
                            }
                        })
                    }
                }
                else {
                    isValid = validateInput(value, required || false, regex || '');
                }

                set(formError, dataKey, !isValid);
                if(!isValid && !hasError) hasError = true;
            });

        return {
            hasError,
            formError
        }
    }

export const isSSNValid = (patchCandidate: CandidatePatchRequest, required: boolean, regex: string): boolean => {

    if(!patchCandidate) {
        return false;
    }

    const states = store.getState();

    const candidate = states.candidate?.results?.candidateData || null;
    const newSSN = get(patchCandidate, "additionalBackgroundInfo.idNumber");
    const noSSN = get(patchCandidate, "additionalBackgroundInfo.isWithoutSSN");
    const oldSNN = get(candidate, IdNumberBgcFormConfig.dataKey);

    if (noSSN === true && newSSN === ''){
        return true;
    }

    if(newSSN && newSSN.includes("***") && newSSN === oldSNN){
        return true;
    }
    else if( newSSN && validateInput(newSSN, required, regex)){
        return true;
    }
    else {
        return false;
    }
}

export const isDOBOverEighteen = (dateOfBirth: string) => {
    if(!dateOfBirth){
        return false;
    }
    const date = new Date(dateOfBirth);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate() + 1;

    const now = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    const dob = year * 10000 + month * 100 + day * 1; // Coerces strings to integers

    return now - dob > 180000;
}

export const isDOBLessThan100 = (dateOfBirth: string): boolean => {
    if(!dateOfBirth) {
        return false;
    }

    const today = moment();
    const diff = today.diff(moment(dateOfBirth), 'year');

    return diff <= 100;
}

export const validateInput = (value: string, required: boolean, regex: string) => {
    if(!required && (!value || value?.length === 0)) return true;

    if(required && (!value || value?.length === 0)) return false;

    return new RegExp(regex).test(value.trim());
}

export const resetUnchangedFieldFromPatch = (parentObject: Object, formConfig: FormInputItem[], patchObject?: Object): Object => {
    if(isEmpty(patchObject)) return {};

    const changedField: string[] = formConfig
        .filter(config => config.edited === true)
        .map(config => {
            if(get(patchObject, config.dataKey) === get(parentObject, config.dataKey)) {
                config.edited = false
            }
            return config;
        })
        .filter(config => config.edited === true)
        .map(config => config.dataKey);

    const newPatchObject: Partial<Object> = pick(patchObject, changedField);

    return newPatchObject as Object;
}

export const handleSubmitNonFcraBGC =
    ( applicationData: Application, ackEsign: string, noticeEsign: string, requestedCopyOfBGC: boolean, stepConfig: BgcStepConfig, bgcVendorType: BGC_VENDOR_TYPE ) => {
        if(applicationData) {
            const updateApplicationPayload = {
                nonFcraQuestions: {
                    nonFcraAcknowledgementEsign: {
                        signature: ackEsign.trim(),
                    },
                    nonFcraStateNoticeEsign: {
                        signature: noticeEsign.trim(),
                    },
                    requestedCopyOfBackgroundCheck: requestedCopyOfBGC,
                    bgcVendorType
                }
            }

            const updateApplicationRequest = createUpdateApplicationRequest(applicationData, UPDATE_APPLICATION_API_TYPE.NON_FCRA_BGC, updateApplicationPayload);
            boundUpdateApplicationDS(updateApplicationRequest, () => {
                handleUpdateNonFCRABGCStep(stepConfig);
            })
        }
    }

export const handleMXSubmitNonFcraBGC =
    ( applicationData: Application, ackEsign: string, requestedCopyOfBGC: boolean, stepConfig: BgcMXStepConfig, bgcVendorType: BGC_VENDOR_TYPE ) => {
        if(applicationData) {
            const updateApplicationPayload = {
                consentsMap: {
                    BGCMedicalDrugTestConsent: {
                        consentVendorType: bgcVendorType,
                        isConsentDisclosureAccepted: true,
                        acknowledgementsElectronicSignature: {
                            signature: ackEsign.trim(),
                            timestamp: new Date().toISOString()
                        }
                    }
                }
            }

            const updateApplicationRequest = createUpdateApplicationRequest(applicationData, UPDATE_APPLICATION_API_TYPE.CONSENTS_MAP, updateApplicationPayload);
            boundUpdateApplicationDS(updateApplicationRequest, () => {
                handleMXUpdateNonFCRABGCStep(stepConfig);
            })
        }
    }

export const handleUpdateNonFCRABGCStep = (stepConfig: BgcStepConfig) => {
    const { completedSteps } = stepConfig;
    const request: BgcStepConfig = {
        ...stepConfig,
        completedSteps: [...completedSteps, BGC_STEPS.NON_FCRA],
        [BGC_STEPS.NON_FCRA]: {
            status: INFO_CARD_STEP_STATUS.COMPLETED,
            editMode: false
        },
        [BGC_STEPS.ADDITIONAL_BGC]: {
            status: INFO_CARD_STEP_STATUS.ACTIVE,
            editMode: false
        }
    }
    boundUpdateStepConfigAction(request);
}

export const handleMXUpdateNonFCRABGCStep = (stepConfig: BgcMXStepConfig) => {
    const { completedSteps } = stepConfig;
    const request: BgcMXStepConfig = {
        ...stepConfig,
        completedSteps: [...completedSteps, BGC_STEPS.NON_FCRA],
        [BGC_STEPS.NON_FCRA]: {
            status: INFO_CARD_STEP_STATUS.COMPLETED,
            editMode: false
        },
        [BGC_STEPS.ADDITIONAL_BGC]: {
            status: INFO_CARD_STEP_STATUS.ACTIVE,
            editMode: false
        }
    }
    boundUpdateStepConfigAction(request);
}

export const validateNonFcraSignatures = ( nonFcraAckEsign: string, nonFcraNoticeEsign: string ): NonFcraFormErrorStatus => {
    let errorStatus: NonFcraFormErrorStatus = {
        hasError: false,
        ackESignHasError: !validateName(nonFcraAckEsign),
        noticeESignHasError: !validateName(nonFcraNoticeEsign),
        mismatchError: nonFcraNoticeEsign !== nonFcraAckEsign,
    }

    errorStatus.hasError = errorStatus.ackESignHasError || errorStatus.noticeESignHasError === true || errorStatus.mismatchError === true;

    return errorStatus
}

export const validateMXNonFcraSignatures = ( applicationData: Application, nonFcraAckEsign: string ): NonFcraFormErrorStatus => {
    let errorStatus: NonFcraFormErrorStatus = {
        hasError: false,
        ackESignHasError: false,
    }

    if(!validateName(nonFcraAckEsign)) {
        errorStatus = {
            ...errorStatus,
            hasError: true,
            ackESignHasError: true
        }
    }

    return errorStatus
}

export const bgcShouldDisplayContinue = (stepConfig: BgcStepConfig): boolean => {
    const { FCRA, NON_FCRA, ADDITIONAL_BGC } = BGC_STEPS;
    const { COMPLETED } = INFO_CARD_STEP_STATUS;
    const fcraStatus = stepConfig[FCRA];
    const nonFcraStatus = stepConfig[NON_FCRA];
    const addBgcStatus = stepConfig[ADDITIONAL_BGC];

    return fcraStatus.status === COMPLETED && !fcraStatus.editMode &&
        nonFcraStatus.status === COMPLETED && !nonFcraStatus.editMode &&
        addBgcStatus.status === COMPLETED && !addBgcStatus.editMode
}

export const bgcMXShouldDisplayContinue = (stepConfig: BgcMXStepConfig): boolean => {
    const { NON_FCRA, ADDITIONAL_BGC } = BGC_STEPS;
    const { COMPLETED } = INFO_CARD_STEP_STATUS;
    const nonFcraStatus = stepConfig[NON_FCRA];
    const addBgcStatus = stepConfig[ADDITIONAL_BGC];

    return nonFcraStatus.status === COMPLETED && !nonFcraStatus.editMode &&
        addBgcStatus.status === COMPLETED && !addBgcStatus.editMode
}

export const handleSubmitFcraBGC = ( applicationData: Application, stepConfig: BgcStepConfig, eSignature: string, fcraResponse?: FCRA_DISCLOSURE_TYPE ) => {
    const updateApplicationPayload = {
        fcraQuestions: {
            bgcDisclosureEsign: {
                signature: eSignature
            },
            bgcDisclosure: fcraResponse
        }
    }

    const { FCRA_BGC } = UPDATE_APPLICATION_API_TYPE;

    const updateApplicationRequest = createUpdateApplicationRequest(applicationData, FCRA_BGC, updateApplicationPayload);
    boundUpdateApplicationDS(updateApplicationRequest, () => {
        handleUpdateFcraBGCStep(stepConfig);
        routeToAppPageWithPath(BACKGROUND_CHECK);
    })
}

export const handleWithdrawFcraBGC = ( applicationData: Application, fcraResponse?: FCRA_DISCLOSURE_TYPE ) => {
    const updateApplicationPayload = {
        fcraQuestions: {
            bgcDisclosureEsign: {},
            bgcDisclosure: fcraResponse
        }
    };

    const { FCRA_BGC } = UPDATE_APPLICATION_API_TYPE;

    const updateApplicationRequest = createUpdateApplicationRequest(applicationData, FCRA_BGC, updateApplicationPayload);
    boundUpdateApplicationDS(updateApplicationRequest, () => {
        onCompleteTaskHelper(applicationData);
    });
};

export const handleUpdateFcraBGCStep = (stepConfig: BgcStepConfig) => {
    const { completedSteps } = stepConfig;
    const request: BgcStepConfig = {
        ...stepConfig,
        completedSteps: [...completedSteps, BGC_STEPS.FCRA],
        [BGC_STEPS.FCRA]: {
            status: INFO_CARD_STEP_STATUS.COMPLETED,
            editMode: false
        },
        [BGC_STEPS.NON_FCRA]: {
            status: INFO_CARD_STEP_STATUS.ACTIVE,
            editMode: false
        }
    }

    boundUpdateStepConfigAction(request);
}

export const handleSubmitAdditionalBgc =
    ( candidateData: Candidate, applicationData: Application, candidatePatchRequest: CandidatePatchRequest, formError: CandidateInfoErrorState, stepConfig: BgcStepConfig ) => {
        const { ADDITIONAL_BGC } = UPDATE_APPLICATION_API_TYPE;

        if(candidatePatchRequest.additionalBackgroundInfo?.address) {
            const countryName = candidatePatchRequest.additionalBackgroundInfo.address?.country || "";
            candidatePatchRequest.additionalBackgroundInfo.address.countryCode = getCountryCodeByCountryName(countryName);
        }

        const patch: CandidatePatchRequest = { ...candidatePatchRequest };
        const verifyInfo = verifyBasicInfo(patch, formError, AdditionalBGCFormConfig);
        boundUpdateCandidateInfoError(verifyInfo.formError);
        const dob = get(candidatePatchRequest, "additionalBackgroundInfo.dateOfBirth");
        const isOver18 = isDOBOverEighteen(dob);
        const isDateValid = isDOBLessThan100(dob);
        if(!verifyInfo.hasError && isOver18 && isDateValid) {
            //Bound update additional info all
            const payload = {
                candidate: candidatePatchRequest.additionalBackgroundInfo
            }
            const request: UpdateApplicationRequestDS =
                createUpdateApplicationRequest(applicationData, ADDITIONAL_BGC, payload);
            boundUpdateApplicationDS(request, (applicationData: Application) => {
                onCompleteTaskHelper(applicationData);
                handleUpdateAdditionalBGCStep(stepConfig);
            })
        }
    }

export const handleMXSubmitAdditionalBgc =
    ( candidateData: Candidate, applicationData: Application, candidatePatchRequest: CandidatePatchRequest, formError: CandidateInfoErrorState, stepConfig: BgcMXStepConfig ) => {
        const { ADDITIONAL_BGC } = UPDATE_APPLICATION_API_TYPE;

        if(candidatePatchRequest.additionalBackgroundInfo?.address) {
            const countryName = candidatePatchRequest.additionalBackgroundInfo.address?.country || "";
            candidatePatchRequest.additionalBackgroundInfo.address.countryCode = getMXCountryCodeByCountryName(countryName);
        }

        const patch: CandidatePatchRequest = { ...candidatePatchRequest };
        const verifyInfo = verifyBasicInfo(patch, formError, MXAdditionalBGCFormConfig);
        boundUpdateCandidateInfoError(verifyInfo.formError);
        const dob = get(candidatePatchRequest, "additionalBackgroundInfo.dateOfBirth");
        const isOver18 = isDOBOverEighteen(dob);
        if(!verifyInfo.hasError && isOver18) {
            //Bound update additional info all
            const payload = {
                candidate: candidatePatchRequest.additionalBackgroundInfo
            }
            const request: UpdateApplicationRequestDS =
                createUpdateApplicationRequest(applicationData, ADDITIONAL_BGC, payload);
            boundUpdateApplicationDS(request, (applicationData: Application) => {
                onCompleteTaskHelper(applicationData);
                handleMXUpdateAdditionalBGCStep(stepConfig);
            })
        }
    }

export const handleUpdateAdditionalBGCStep = (stepConfig: BgcStepConfig) => {
    const { completedSteps } = stepConfig;
    const request: BgcStepConfig = {
        ...stepConfig,
        completedSteps: [...completedSteps, BGC_STEPS.FCRA, BGC_STEPS.ADDITIONAL_BGC],
        [BGC_STEPS.NON_FCRA]: {
            status: INFO_CARD_STEP_STATUS.COMPLETED,
            editMode: false
        }
    }

    boundUpdateStepConfigAction(request);
}

export const handleMXUpdateAdditionalBGCStep = (stepConfig: BgcMXStepConfig) => {
    const { completedSteps } = stepConfig;
    const request: BgcMXStepConfig = {
        ...stepConfig,
        completedSteps: [...completedSteps, BGC_STEPS.ADDITIONAL_BGC],
        [BGC_STEPS.NON_FCRA]: {
            status: INFO_CARD_STEP_STATUS.COMPLETED,
            editMode: false
        }
    }

    boundUpdateStepConfigAction(request);
}

export const loadingStatusHelper = () => {
    const states = store.getState();
    const loadingStates = states ? [states.candidate, states.job, states.appConfig, states.application, states.schedule, states.workflow, states.nhe] : [];
    let loadingCount = 0;

    loadingStates.forEach(loading => {
        if(loading.loading === true){
            loadingCount++;
        }
    });
    return loadingCount > 1;
}

export const fetchNheTimeSlotDs = (schedule: Schedule, applicationId: string, requisitionService: boolean) => {
    let { siteId } = schedule;
    if(siteId.startsWith("SITE-")){
        siteId = siteId.replace("SITE-", "");
    }

    if (requisitionService){
        const request: GetNheTimeSlotRequestDs = {
            requisitionServiceScheduleDetails: {
                scheduleId: schedule.scheduleId,
                locationCode: siteId,
                hireStartDate: schedule.hireStartDate,
                contingencyTurnAroundDays: schedule.contingencyTat
            }
        }

        boundGetNheTimeSlotsDs(request);
    } else {
        const request: GetNheTimeSlotRequestThroughNheDS = {
            locationCode: siteId,
            applicationId
        }

        boundGetNheTimeSlotsThroughNheDs(request);
    }
}

export const renderNheTimeSlotFullAddress = ( nheTimeSlot: NHETimeSlot ): string => {
    const timeRange = nheTimeSlot.timeRange || '';
    const state = nheTimeSlot.location.state || '';
    const city = nheTimeSlot.location.city || '';
    const address = nheTimeSlot.location.streetAddress || '';
    const postalCode = nheTimeSlot.location.postalCode || '';

    const stateAndPostal = `${state ? `${state}${postalCode ? ` ${postalCode}` : ''}` : `${postalCode}`}`;

    return `${timeRange} ${address}${city && address && `, `}${city}${stateAndPostal && (city || address) && `, `}${stateAndPostal}`;
}

export const getPageName = () => {
    const hash = window.location.hash || '';
    return hash.split('?')[0]?.split('/')[1] || '';
}

export const  handleConfirmNHESelection = (applicationData: Application, nheTimeSlot: NHETimeSlot) => {
    const payload = {
        nheAppointment: nheTimeSlot
    }
    const { NHE } = UPDATE_APPLICATION_API_TYPE;

    if (applicationData) {
        const request: UpdateApplicationRequest = createUpdateApplicationRequest(applicationData, NHE, payload);
        boundUpdateApplicationDS(request, (applicationData: Application)=>{
            onCompleteTaskHelper(applicationData);
        });
        postAdobeMetrics({ name: METRIC_NAME.SELECT_NHE, values: {
            NHE: {
                apptID: nheTimeSlot.timeSlotId,
                date: nheTimeSlot.dateWithoutFormat,
                hours: nheTimeSlot.timeRange
            }
          }
        });
    }
}

export const handleSubmitSelfIdEqualOpportunity =
  (applicationData: Application, equalOpportunityStatus: SelfIdEqualOpportunityStatus, stepConfig: SelfIdentificationConfig) => {
      const payload = {
          selfIdentificationInfo: equalOpportunityStatus
      };

      const { EQUAL_OPPORTUNITY_FORM } = UPDATE_APPLICATION_API_TYPE;
      const { EQUAL_OPPORTUNITY, VETERAN_FORM, DISABILITY_FORM } = SELF_IDENTIFICATION_STEPS;

      const request: UpdateApplicationRequest = createUpdateApplicationRequest(applicationData, EQUAL_OPPORTUNITY_FORM, payload);
      boundUpdateApplicationDS(request, () => {
          handleUpdateSelfIdStep(stepConfig, EQUAL_OPPORTUNITY, VETERAN_FORM);
      });
  };

export const handleSubmitSelfIdDisabilityStatus =
  (applicationData: Application, disabilityStatus: SelfIdentificationDisabilityStatus, stepConfig: SelfIdentificationConfig) => {
      const payload = {
          selfIdentificationInfo: disabilityStatus
      };

      const { DISABILITY_FORM } = UPDATE_APPLICATION_API_TYPE;

      const request: UpdateApplicationRequest = createUpdateApplicationRequest(applicationData, DISABILITY_FORM, payload);
      boundUpdateApplicationDS(request, (applicationResponse: Application) => {
          onCompleteTaskHelper(applicationResponse);
          handleUpdateSelfIdStep(stepConfig, SELF_IDENTIFICATION_STEPS.DISABILITY_FORM);
      });
  };

export const handleSubmitSelfIdVeteranStatus =
  (applicationData: Application, veteranStatus: SelfIdentificationVeteranStatus, stepConfig: SelfIdentificationConfig) => {
      const payload = { selfIdentificationInfo: veteranStatus };

      const { VETERAN_STATUS_FORM } = UPDATE_APPLICATION_API_TYPE;
      const { DISABILITY_FORM, VETERAN_FORM } = SELF_IDENTIFICATION_STEPS;

      const request: UpdateApplicationRequest = createUpdateApplicationRequest(applicationData, VETERAN_STATUS_FORM, payload);
      boundUpdateApplicationDS(request, () => {
          handleUpdateSelfIdStep(stepConfig, VETERAN_FORM, DISABILITY_FORM);
      });
  };

export const handleUpdateSelfIdStep =
  (stepConfig: SelfIdentificationConfig, currentStep: SELF_IDENTIFICATION_STEPS, nextStep?: SELF_IDENTIFICATION_STEPS) => {
      const { completedSteps } = stepConfig;
      const request: SelfIdentificationConfig = {
          ...stepConfig,
          completedSteps: [...completedSteps, currentStep],
          [currentStep]: {
              status: INFO_CARD_STEP_STATUS.COMPLETED,
              editMode: false
          }
      };

      if (nextStep) {
          request[nextStep] = {
              status: INFO_CARD_STEP_STATUS.ACTIVE,
              editMode: false
          };
      }

      boundUpdateSelfIdStepConfig(request);
  };

export const isSelfIdEqualOpportunityStepCompleted = (selfIdInfo: SelfIdentificationInfo, countryCode?: CountryCode) => {
    const { gender, ethnicity, pronoun } = selfIdInfo;
    const country = countryCode ? countryCode : getCountryCode();
    switch (country) {
        case CountryCode.US:
            return !!gender && !!ethnicity;
        case CountryCode.MX:
            return !!gender && !!ethnicity && !!pronoun;

        default:
            return !!gender && !!ethnicity;
    }
}

export const isSelfIdDisabilityStepCompleted = (selfIdInfo: SelfIdentificationInfo, countryCode?: CountryCode) => {
    const { disability } = selfIdInfo;
    const country = countryCode ? countryCode : getCountryCode();
    switch (country) {
        case CountryCode.US:
            return !!disability && SelfIdDisabilityValidValues.includes(disability);
        case CountryCode.MX:
            return !!disability && SelfIdDisabilityValidValues.includes(disability);

        default:
            return !!disability && SelfIdDisabilityValidValues.includes(disability);
    }
}

export const isSelfIdVeteranStepCompleted = (selfIdInfo: SelfIdentificationInfo, countryCode?: CountryCode) => {
    const { protectedVeteran, veteran, militarySpouse } = selfIdInfo;
    const country = countryCode ? countryCode : getCountryCode();
    switch (country) {
        case CountryCode.US:
            return !!protectedVeteran && !!veteran && !!militarySpouse;

        default:
            return !!protectedVeteran && !!veteran && !!militarySpouse;
    }
}

export const GetSelfIdentificationConfigStep = (countryCode?: CountryCode): SelfIdentificationConfig => {
    const country = countryCode ? countryCode : getCountryCode();
    return SelfIdentificationConfigStepCountryMap[country];
}

export const handleInitiateSelfIdentificationStep = ( selfIdentificationInfo: SelfIdentificationInfo, country?: CountryCode) => {
    const countryCode= country ? country: getCountryCode();
    const isEqualOpportunityCompleted = isSelfIdEqualOpportunityStepCompleted(selfIdentificationInfo, country);
    const isDisabilityCompleted = isSelfIdDisabilityStepCompleted(selfIdentificationInfo, country);
    const isVeteranCompleted = isSelfIdVeteranStepCompleted(selfIdentificationInfo, country);

    const { EQUAL_OPPORTUNITY, VETERAN_FORM, DISABILITY_FORM } = SELF_IDENTIFICATION_STEPS;
    const { ACTIVE, COMPLETED, LOCKED } = INFO_CARD_STEP_STATUS;

    let stepConfig: SelfIdentificationConfig = { ...GetSelfIdentificationConfigStep(countryCode) };

    if(isEqualOpportunityCompleted) {
        stepConfig = {
            ...stepConfig,
            completedSteps: [EQUAL_OPPORTUNITY],
            [EQUAL_OPPORTUNITY]: {
                status: COMPLETED,
                editMode: false
            },
            [DISABILITY_FORM]: {
                status: countryCode === CountryCode.MX ? ACTIVE : LOCKED,
                editMode: countryCode === CountryCode.MX
            }
        }
    }

    if(countryCode=== CountryCode.US) {
        if(isVeteranCompleted) {
            stepConfig = {
                ...stepConfig,
                completedSteps: [...stepConfig.completedSteps, VETERAN_FORM],
                [VETERAN_FORM]: {
                    status: COMPLETED,
                    editMode: false
                },
                [DISABILITY_FORM]: {
                    status: ACTIVE,
                    editMode: false
                }
            }
        }
        else if(isEqualOpportunityCompleted) {
            stepConfig = {
                ...stepConfig,
                [VETERAN_FORM]: {
                    status:  ACTIVE,
                    editMode: false
                }
            }
        }
    }

    if(isDisabilityCompleted) {
        stepConfig = {
            ...stepConfig,
            completedSteps: [...stepConfig.completedSteps, DISABILITY_FORM],
            [DISABILITY_FORM]: {
                status: COMPLETED,
                editMode: false
            }
        }
    }

    const request: SelfIdentificationConfig = stepConfig;

    boundUpdateSelfIdStepConfig(request);
}

export const SelfShouldDisplayContinue = (stepConfig: SelfIdentificationConfig): boolean => {
    const { DISABILITY_FORM, VETERAN_FORM, EQUAL_OPPORTUNITY } = SELF_IDENTIFICATION_STEPS;
    const { COMPLETED } = INFO_CARD_STEP_STATUS;
    const equalOpportunity = stepConfig[EQUAL_OPPORTUNITY];
    const veteran = stepConfig[VETERAN_FORM];
    const disability = stepConfig[DISABILITY_FORM];

    if(getCountryCode() === CountryCode.MX) {
        return equalOpportunity?.status === COMPLETED && !equalOpportunity.editMode &&
          disability?.status === COMPLETED && !disability.editMode;
    }

    return equalOpportunity?.status === COMPLETED && !equalOpportunity.editMode && veteran?.status === COMPLETED &&
      !veteran.editMode && disability?.status === COMPLETED && !disability.editMode;
}

export interface DateFormatOption {
    displayFormat?: string;
    defaultDateFormat?: string;
    locale?: Locale;
}

export const capitalizeAndReformat = (str: string): string => {
    return str ? str.replace(/(^\w|\s\w)/g, (c) => c.toUpperCase()).replace(/º/, "") : "";
};

export const formatDate = (dateStr?: string, option: DateFormatOption = {}) => {
    return capitalizeAndReformat(moment(dateStr, option.defaultDateFormat).locale(option.locale || getLocale()).format(
        option.displayFormat || "Do MMM YYYY"
    ));
};

export const formatNheTimeSlotTitle = (date: string) => {
    const res = formatDate(date, {
      defaultDateFormat: "DD/MM/yyyy",
      displayFormat: "dddd, MMM Do YYYY",
    });

    return capitalizeAndReformat(res);
};

export const goToCandidateDashboard = () => {
    const state = store.getState();

    if (state) {
        const { appConfig } = state;
        const envConfig = appConfig?.results?.envConfig;

        const isCandidateDashboardEnabled = envConfig?.featureList?.CANDIDATE_DASHBOARD?.isAvailable;
        const queryParamsInSession = window.sessionStorage.getItem("query-params");
        const queryParams = queryParamsInSession ? JSON.parse(queryParamsInSession) : {};

        const CSDomain = envConfig?.CSDomain;
        const dashboardUrl = envConfig?.dashboardUrl || '';

        const queryStringFor3rdParty = get3rdPartyFromQueryParams(queryParams, "?");
        const candidateDashboardUrl = `${CSDomain}/app${queryStringFor3rdParty}#/myApplications`;

        window.location.assign(isCandidateDashboardEnabled ? candidateDashboardUrl : dashboardUrl);
    }
};

export const redirectToASHChecklist = (applicationId: string, jobId: string, requisitionId: string) => {
    const state = store.getState();

    const { appConfig } = state;
    const envConfig = appConfig?.results?.envConfig;

    if (envConfig) {
        const isLegacy = checkIfIsLegacy();
        const isCSRequest = checkIfIsCSRequest();

        const ASHUrl = isCSRequest? envConfig?.ASHChecklistURLCS : envConfig?.ASHChecklistURL;
        const ASHChecklistURL = ASHUrl.replace(
            "{applicationId}",
            applicationId
        ).replace("{requisitionId}", (isLegacy? requisitionId : jobId) as string);
        window.location.assign(ASHChecklistURL);
    }
  };

export const showCounterBanner = (): boolean => {
    const { hash } = window.location;
    return hash.includes(CONTINGENT_OFFER) || hash.includes(BACKGROUND_CHECK) || hash.includes(NHE) || hash.includes(SELF_IDENTIFICATION) ||
      hash.includes(REVIEW_SUBMIT);
}

export const processAssessmentUrl = (assessmentUrl: string, applicationId: string, jobId: string): string => {
    if (!assessmentUrl) {
        return assessmentUrl;
    }
    // add redirect and locale query params to the url before redirecting to HOOK
    const url = new URL(assessmentUrl);
    url.searchParams.append("locale", getLocale());
    url.searchParams.append("redirect", `applicationId=${applicationId}&jobId=${jobId}${getQueryParamStringFromURLFor3rdParty()}`);
    return url.toString();
};

export const onAssessmentStart =  (assessmentUrl: string, applicationData: Application, jobDetail: Job) => {
    const assessmentRedirectUrl = processAssessmentUrl(assessmentUrl, applicationData.applicationId, jobDetail.jobId);
    if (assessmentRedirectUrl) {
        postAdobeMetrics({ name: METRIC_NAME.ASSESSMENT_START });
        window.location.assign(assessmentRedirectUrl);
    }
}

export const setEpicApiCallErrorMessage = (errorMessage: ApiErrorMessage, isDismissible?: boolean) => {
    if (errorMessage) {
        const message = translate(errorMessage.translationKey, errorMessage.value);

        const alertMessage: AlertMessage = {
            type: MessageBannerType.Error,
            title: message,
            visible: true,
            isDismissible,
        }

        //Show Banner when error is due to unauthorized, we may extend logic to show error banner in future.
        boundSetBannerMessage(alertMessage);
    }
}

export const isI18nSelectOption = (option: any) => {
    return typeof option === 'object' && option.translationKey && option.value && option.showValue;
}

export const isNewBBuiPath = (pathName: string, newBBUIPathName: newBBUIPathName): boolean => {
    const { href } = window.location;
    const hashPath = window.location.hash.split('?')[0];
    const pageName = hashPath ? hashPath.replace("#/", "") : '';

    if(!pathName){
        pathName = pageName || '';
    }

    return Object.values(PAGE_ROUTES).includes(pathName as PAGE_ROUTES) && href.includes(newBBUIPathName) && href.includes(`#/${pathName}`);
}

export const isAddressValid = (address?: Address): boolean => {
    //Will use mandatory field of address in BB UI to check if address is empty or not

    if(!address) {
        return false;
    }

    const { addressLine1, city, country, state, zipcode, countryCode } = address;
    const isCompleteAddress = !!addressLine1 && !!city && !!country && !!state && !!zipcode && !!countryCode;

    return isCompleteAddress;
}

export const isAdditionalBgcInfoValid = (additionBgc?: AdditionalBackgroundInfoRequest): boolean => {
    if(!additionBgc) {
        return false;
    }

    const { dateOfBirth, governmentIdType, address, hasCriminalRecordWithinSevenYears, hasPreviouslyWorkedAtAmazon, idNumber, } = additionBgc;
    const addressValid = isAddressValid(address);
    return addressValid && !isNil(dateOfBirth) && !isNil(governmentIdType) && !isNil(hasCriminalRecordWithinSevenYears) && !isNil(hasPreviouslyWorkedAtAmazon) && !isNil(idNumber);
}

export const isSelfIdentificationInfoValid = (selfIdInfo?: SelfIdentificationInfo, countryCode?: CountryCode): boolean => {
    if(!selfIdInfo) {
        return false;
    }

    const country = countryCode ? countryCode : getCountryCode();
    const isVeteranCompleted = isSelfIdVeteranStepCompleted(selfIdInfo, country);
    const isDisabilityCompleted = isSelfIdDisabilityStepCompleted(selfIdInfo, country);
    const isEqualOpportunityCompleted = isSelfIdEqualOpportunityStepCompleted(selfIdInfo, country);

    switch (country) {
        case CountryCode.US:
            return isVeteranCompleted && isDisabilityCompleted && isEqualOpportunityCompleted;

        case CountryCode.MX:
            return isDisabilityCompleted && isEqualOpportunityCompleted;

        default:
            return isVeteranCompleted && isDisabilityCompleted && isEqualOpportunityCompleted;
    }
}

//This wil be used to check if first two steps are filled correctly before submitting in step 3
export const isSelfIdentificationInfoValidBeforeDisability = (selfIdInfo?: SelfIdentificationInfo): boolean => {
    if(!selfIdInfo) {
        return false;
    }

    const { ethnicity, gender, militarySpouse, protectedVeteran, veteran } = selfIdInfo;

    if(getCountryCode() === CountryCode.MX) {
        return !!ethnicity && !!gender;
    }

    return  !!ethnicity && !!gender && !!militarySpouse && !!protectedVeteran && !!veteran;
}

export const checkAndBoundGetApplication = (applicationId: string) => {
    if (applicationId){
        boundGetApplication({ applicationId: applicationId, locale: getLocale() });
    } else {
        routeToAppPageWithPath(PAGE_ROUTES.APPLICATIONID_NULL);
    }
};

export const getFeatureFlagValue = (featureFlag: FEATURE_FLAG): boolean => {
    const state = store.getState();
    const envConfig = state.appConfig.results?.envConfig;
    const featureFlagList: FeatureFlagList | undefined = envConfig?.featureList;

    if(featureFlagList){
        const featureResult = (featureFlagList[featureFlag] as FeatureFlag)?.isAvailable || false;

        // not print the feature flag value for MLS, since there are too many invocations.
        if (featureFlag !== FEATURE_FLAG.MLS) {
            log(`logging the featureFlagName: ${featureFlag}, featureFlagResult: ${featureResult}`, { featureFlagValue: featureFlagList[featureFlag] })
        }
        return featureResult;
    }
    return false;
}

export const getKeyMapFromDetailedRadioItemList = (radioButtonItemList: DetailedRadioButtonItem[]): {[key: string]: string} => {
    let keyMap = {};
    if(radioButtonItemList?.length > 0) {
        radioButtonItemList.forEach(item => {
            const temp = { [item.value]: item.titleTranslationKey }
            keyMap = {
                ...keyMap,
                ...temp
            }
        })
    }

    return keyMap;
}

export const getCountryMappedFeatureFlag = (featureFlag: FEATURE_FLAG): FeatureFlagsMapByCountry | undefined => {
    const state = store.getState();
    const envConfig = state.appConfig.results?.envConfig;
    const featureFlagList: FeatureFlagList | undefined = envConfig?.featureList;
    if(featureFlagList) {
        const featureFlagsCountryMap = featureFlagList[featureFlag] as FeatureFlagsMapByCountry || undefined;
        log(`loading brokenApplication feature flag for all countries: `, { featureFlagsCountryMap: featureFlagsCountryMap })
        return featureFlagsCountryMap;
    }
    return undefined;
}

export const isBrokenApplicationFeatureEnabled = (jobId: string, countryCode: CountryCode, featureFlagsCountryMap?: FeatureFlagsMapByCountry): boolean => {
    let isFeatureEnabled = false;
    const featureFlagForCountry = featureFlagsCountryMap?.[countryCode];
    try {
        if(featureFlagForCountry?.isAvailable && featureFlagForCountry?.jobIdAllowList){
            const regex = new RegExp(featureFlagForCountry?.jobIdAllowList);
            isFeatureEnabled = regex.test(jobId);
        }
        log(`calculating the broken applications feature flag for countryCode = ${countryCode}, jobId = ${jobId}, isFeatureEnabled = ${isFeatureEnabled},`
          +`jobAllowList = ${featureFlagForCountry?.jobIdAllowList}, `, { featureFlagForCountry: featureFlagForCountry });
    } catch (e) {
        logError(`exception happened when do the regex match for countryCode = ${countryCode}, jobId = ${jobId}, `
          +`jobAllowList = ${featureFlagForCountry?.jobIdAllowList}, therefore the isFeatureEnabled = ${isFeatureEnabled}.`,
          e, { featureFlagForCountry: featureFlagForCountry });
    }
    return isFeatureEnabled;
}

export const reverseMappingTranslate = (value: string | undefined, countryCode?: CountryCode) => {
    if (!value) {
        return "";
    }

    // Keep these values dynamic as it may change per country level
    const SelfIdPronounsItems = SelfIdPronounsItemsMap[countryCode || getCountryCode()];
    const SelfIdGenderRadioItems = SelfIdGenderRadioItemsMap[countryCode || getCountryCode()];
    const SelfIdEthnicBackgroundItems = SelfIdEthnicBackgroundItemsMap[countryCode || getCountryCode()];

    const keyMap = {
        ...getKeyMapFromDetailedRadioItemList(SelfIdPronounsItems),
        ...getKeyMapFromDetailedRadioItemList(SelfIdGenderRadioItems),
        ...getKeyMapFromDetailedRadioItemList(SelfIdEthnicBackgroundItems),
        ...getKeyMapFromDetailedRadioItemList(SelfIdDisabilityRadioItem),
        ...getKeyMapFromDetailedRadioItemList(SelfIdVeteranStatusRadioItem),
        ...getKeyMapFromDetailedRadioItemList(SelfIdVeteranStatusRadioItem),
        ...getKeyMapFromDetailedRadioItemList(SelfIdProtectedVeteranRadioItem),
        ...getKeyMapFromDetailedRadioItemList(SelfIdMilitarySpouseRadioItem),
        ...ValueToI18nKeyMap
    }

    const key = keyMap[value];

    if (!key) {
        console.warn('No key/translation found for value: ', value);
        return "";
    }

    return t(key, value);
};

export const getCountryCodeByCountryName = (countryName: string): string => {
    const country = CountrySelectOptions.filter(country => country.value === countryName);
    return country.length ? country[0].countryCode : "";
}

export const getMXCountryCodeByCountryName = (countryName: string): string => {
    const country = MXCountrySelectOptions.filter(country => country.value === countryName);
    return country.length ? country[0].countryCode : "";
}

export const AWAIT_TIMEOUT = "AWAIT_TIMEOUT";

// await a promise with timeout(ms), throws timeout error if not suppressTimeoutError
export const awaitWithTimeout = async (promise: Promise<any>, timeout: number, suppressTimeoutError?: boolean): Promise<any> => {
    let timer: ReturnType<typeof setTimeout>;

    return Promise.race([
        promise,
        new Promise(
            (_, reject) => timer = setTimeout(() => reject(AWAIT_TIMEOUT), timeout)
        )
    ]).catch(err => {
        if (err === AWAIT_TIMEOUT) {
            console.warn(`Promise await timeout: ${timeout} ms`);
            if (!suppressTimeoutError) {
                throw new Error(AWAIT_TIMEOUT);
            }
        } else {
            // other errors, rethrow to let client to handle
            throw err;
        }
    }).finally(
        () => clearTimeout(timer)
    );
};

export const showErrorMessage = (errorMessage: ErrorMessage, isDismissible?: boolean) => {
    const message = translate(errorMessage.translationKey, errorMessage.value);

    const alertMessage: AlertMessage = {
        type: MessageBannerType.Error,
        title: message,
        visible: true,
        isDismissible,
    }

    boundSetBannerMessage(alertMessage);
};

export const parseQueryParamsArrayToSingleItem = (queryParams: any) => {
    const parsedQueryParams = { ...queryParams };
    Object.keys(parsedQueryParams).forEach((key: string) => {
        const item = parsedQueryParams[key];
        if( isArray(item) && item.length > 0){
            parsedQueryParams[key] = item[0];
        }
        if (key === "jobId"){
            parsedQueryParams[key] = jobIdSanitizer(parsedQueryParams[key]);
        } else if(key === "requisitionId"){
            parsedQueryParams[key] = requisitionIdSanitizer(parsedQueryParams[key]);
        }
    });
    return parsedQueryParams;
};

export const formatLoggedApiError = (error: ApiError) => {
    if (error?.isAxiosError) {
      const { config, code, errorCode, errorMessage, message, request, response } = error;

      return {
        config,
        code,
        errorCode,
        errorMessage,
        message,
        request,
        response
      };
    }

    return error;
};

export const initKatalLogger = (envConfig: EnvConfig) => {
    // Only init once
    if (!window.log) {
      window.loggerUrl = envConfig.loggerUrl;
      window.appStage = envConfig.appStage;
      window.log = initLogger(envConfig.loggerUrl, envConfig.appStage);
      window.log.addErrorListener();
    }
};

export const hideHeaderFooter = () => {
    document.body.classList.add('no-header-footer');
};

export const showHeaderFooter = () => {
    document.body.classList.remove('no-header-footer');
};

export const getCountryCode = (): CountryCode => {

    return "{{Country}}" as CountryCode || CountryCode.US;
}

export const getSpanishLocaleDateFormatter = (date: string) => {
    return getLocale().substring(0, 2) === 'es' ? date.charAt(0).toUpperCase() + date.slice(1).replace('.', '') : date;
}

export const formatFlexibleTrainingDate = (flexibleDate: string): string => {

    if(!flexibleDate) {
        return "";
    }

    const dateRegex = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}");
    const dateValue = flexibleDate.match(dateRegex);
    const formattedDate = dateValue ? moment(dateValue[0]).locale(getLocale()).format("MMM DD, YYYY") : '';
    const rangeValue = flexibleDate.replace(dateRegex, "");

    const formattedTime = rangeValue ?
      rangeValue.trim()
        .split("-")
        .map(item => moment(item.trim(), 'hh:mm A').locale(getLocale()).format('hh:mm A'))
        .join(" - ") : '';

    return formattedDate && formattedTime ? `${getSpanishLocaleDateFormatter(formattedDate)} ${formattedTime}` : "";
};

export const getPayRateCountryConfig = (countryCode: CountryCode): countryConfigType => {
    return countryConfig[countryCode] || countryConfig[CountryCode.US];
};

export const showRequiredLanguageByCountry = (countryCode: CountryCode): boolean => {
    let show = true;
    switch(countryCode) {
        case CountryCode.MX:
            show = false;
            break;
        case CountryCode.US:
            show = true;
            break;
        default:
            show = true;
    }
    return show;
};

export const formatMonthlyBasePayHelper = (monthlyBasePay?: number | null, currencyCode?: string | null) => {
    const formattedMonthlyRate = currencyCode && monthlyBasePay ? new Intl.NumberFormat(getLocale(), {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: monthlyBasePay % 1 === 0 ? 0 : 2,
        currencyDisplay: 'narrowSymbol'
      }).format(monthlyBasePay): null;

    return formattedMonthlyRate;
}

//use this helper instead of initializing in reducer
export const initSelfIdStepConfig = (config: SelfIdentificationConfig, countryCode?: CountryCode): SelfIdentificationConfig => {
    const country = countryCode ? countryCode : getCountryCode();
    const initSelfIdConfig = SelfIdentificationConfigStepCountryMap[country];
    const { DISABILITY_FORM, EQUAL_OPPORTUNITY_FORM, VETERAN_FORM } = config;
    let initConfig = config;

    switch (country) {
        case CountryCode.US:
            if(!DISABILITY_FORM && !EQUAL_OPPORTUNITY_FORM && !VETERAN_FORM) {
                initConfig = initSelfIdConfig;
            }
            break;

        case CountryCode.MX:
            if(!DISABILITY_FORM && !EQUAL_OPPORTUNITY_FORM) {
                initConfig = initSelfIdConfig;
            }
            break;

        default:
            if(!DISABILITY_FORM && !EQUAL_OPPORTUNITY_FORM && !VETERAN_FORM) {
                initConfig = initSelfIdConfig;
            }
    }

    return initConfig;
}

export const getDetailedRadioErrorMap = (countryCode: CountryCode): DetailedRadioErrorType => {
    switch (countryCode) {
        case CountryCode.MX:
            return {
                errorMessage: "Make a selection to continue.",
                errorMessageTranslationKey: "BB-Detailed-button-error-text-message-mx"
            }

        default: return {};
    }
}

export const shouldPrefillAdditionalBgcInfo = (countryCode?: string, overrideCountryCode?: CountryCode): boolean => {
    const systemCountryCode = overrideCountryCode ? overrideCountryCode : getCountryCode();

    if(!countryCode) {
        return true;
    }

    return countryCode === systemCountryCode;
}
