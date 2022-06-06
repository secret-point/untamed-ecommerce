import React from "react";
import {
    Application,
    BgcStepConfig,
    Candidate,
    CandidateInfoErrorState,
    CandidatePatchRequest,
    DayHoursFilter,
    FormInputItem,
    Job,
    Locale,
    NonFcraFormErrorStatus,
    QueryParamItem,
    Range,
    Schedule,
    SchedulePreference,
    ScheduleStateFilters,
    TimeRangeHoursData
} from "./types/common";
import { history } from "../store/store";
import Cookies from "js-cookie";
import { AdditionalBGCFormConfig, HVH_LOCALE, initScheduleStateFilters, NameRegexValidator } from "./constants/common";
import range from "lodash/range";
import moment from "moment";
import {
    GetScheduleListByJobIdRequest,
    SelectedScheduleForUpdateApplication,
    UpdateApplicationRequestDS
} from "./apiTypes";
import {
    boundGetScheduleListByJobId,
    boundUpdateScheduleFilters
} from "../actions/ScheduleActions/boundScheduleActions";
import {
    BGC_STEP_STATUS,
    BGC_STEPS,
    DAYS_OF_WEEK,
    FCRA_DISCLOSURE_TYPE,
    QUERY_PARAMETER_NAME,
    UPDATE_APPLICATION_API_TYPE
} from "./enums/common";
import capitalize from 'lodash/capitalize';
import { boundUpdateApplicationDS } from "../actions/ApplicationActions/boundApplicationActions";
import { BACKGROUND_CHECK, JOB_CONFIRMATION, NHE } from "../components/pageRoutes";
import queryString from "query-string";
import { isBoolean } from "lodash";
import { CS_DOMAIN_LIST } from "../constants";
import { parseQueryParamsArrayToSingleItem } from "../helpers/utils";
import { onCompleteTaskHelper } from "../actions/WorkflowActions/workflowActions";
import isEmpty from "lodash/isEmpty";
import { boundUpdateStepConfigAction } from "../actions/BGC_Actions/boundBGCActions";
import get from 'lodash/get';
import set from 'lodash/set';
import pick from 'lodash/pick';
import { initScheduleState } from "../reducers/bgc.reducer";
import { boundUpdateCandidateInfoError } from "../actions/CandidateActions/boundCandidateActions";

export const routeToAppPageWithPath =
    ( pathname: string, queryParams?: QueryParamItem[] ) => {
        //get current query params and append new query parameters
        //If new parameter has same value as existing one, it will update its value
        let newQueryParam: string = '';
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

export const parseSearchParamFromHash = ( hashURL: string ): { [key: string]: string } => {
    let url = hashURL.split("#")[1];

    if(!url) return {};

    url = url.split("?")[1];

    if(!url) return {};

    return url.split('&')
        .reduce(( result: { [key: string]: string }, param ) => {
            let [key, value] = param.split("=");
            result[key] = decodeURIComponent(value);
            return result;
        }, {});
};

export const parseObjectToQueryString = ( obj: { [key: string]: any } ): string => {
    let str = [];

    for(let p in obj)
        if(obj.hasOwnProperty(p)) {
            let value;
            value = typeof obj[p] === 'object' ? JSON.stringify(obj[p]) : obj[p];
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(value));
        }

    return str.join("&");
}

export const getLocale = (): Locale => {
    const locale: string = Cookies.get(HVH_LOCALE) || '';

    return locale ? locale as Locale : Locale.enUS;
}

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
    const queryParams = parseQueryParamsArrayToSingleItem(queryString.parse(window.location.search));
    const isLegacy = !queryParams.jobId;
    return isLegacy;
}

export const checkIfIsCSRequest = (override? : boolean) => {
    if(isBoolean(override)){
        return override
    }
    const origin = window.location.origin;
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
        // Go to the new page, don't wait work flow to do the routing
        routeToAppPageWithPath(BACKGROUND_CHECK);
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
    return new RegExp(NameRegexValidator).test(name)
}

export const handleUInitiateBGCStep = ( applicationData: Application, candidateData: Candidate ) => {
    const isNonFcraCompleted = !isEmpty(applicationData?.nonFcraQuestions);
    const isFcraCompleted = !isEmpty(applicationData?.fcraQuestions);
    const isAdditionalBgcCompleted = !isEmpty(candidateData?.additionalBackgroundInfo);
    const { FCRA, NON_FCRA, ADDITIONAL_BGC } = BGC_STEPS;
    const { ACTIVE, COMPLETED, LOCKED } = BGC_STEP_STATUS;

    let stepConfig: BgcStepConfig = { ...initScheduleState.stepConfig }

    if(isFcraCompleted && !isNonFcraCompleted && !isAdditionalBgcCompleted) {
        stepConfig = {
            ...stepConfig,
            completedSteps: [FCRA],
            [FCRA]: {
                status: COMPLETED,
                editMode: false
            },
            [NON_FCRA]: {
                status: ACTIVE,
                editMode: false
            },
            [ADDITIONAL_BGC]: {
                status: LOCKED,
                editMode: false
            }
        }
    }
    else if(isFcraCompleted && isNonFcraCompleted && !isAdditionalBgcCompleted) {
        stepConfig = {
            ...stepConfig,
            completedSteps: [FCRA, NON_FCRA],
            [FCRA]: {
                status: COMPLETED,
                editMode: false
            },
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
    else if(isFcraCompleted && isNonFcraCompleted && isAdditionalBgcCompleted) {
        stepConfig = {
            ...stepConfig,
            completedSteps: [FCRA, NON_FCRA, ADDITIONAL_BGC],
            [FCRA]: {
                status: COMPLETED,
                editMode: false
            },
            [NON_FCRA]: {
                status: COMPLETED,
                editMode: false
            },
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
    (candidate: CandidatePatchRequest, formError: CandidateInfoErrorState, formConfig: FormInputItem[]): {hasError: boolean, formError: CandidateInfoErrorState} => {
        let hasError: boolean = false;
        formConfig
            .filter(itemConfig => itemConfig.edited === true)
            .forEach(itemConfig => {
                const { dataKey, required, regex } = itemConfig;
                const value = get(candidate,itemConfig.dataKey);
                const isValid = validateInput(value, required || false, regex || '');
                set(formError, dataKey, !isValid);
                if(!isValid && !hasError) hasError = true;
            });
        return {
            hasError,
            formError
        }
    }

export const validateInput = (value: string, required: boolean, regex: string) => {
    if(!required && (!value || value?.length === 0)) return true;

    if(required && (!value || value?.length === 0)) return false;

    return new RegExp(regex).test(value);
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
    ( applicationData: Application, ackEsign: string, noticeEsign: string, requestedCopyOfBGC: boolean, stepConfig: BgcStepConfig ) => {
        if(applicationData) {
            const updateApplicationPayload = {
                nonFcraQuestions: {
                    nonFcraAcknowledgementEsign: {
                        signature: ackEsign.trim(),
                    },
                    nonFcraStateNoticeEsign: {
                        signature: noticeEsign.trim(),
                    },
                    requestedCopyOfBackgroundCheck: requestedCopyOfBGC
                }
            }

            const updateApplicationRequest = createUpdateApplicationRequest(applicationData, UPDATE_APPLICATION_API_TYPE.NON_FCRA_BGC, updateApplicationPayload);
            boundUpdateApplicationDS(updateApplicationRequest, () => {
                handleUpdateNonFCRABGCStep(stepConfig);
            })
        }
    }

export const handleUpdateNonFCRABGCStep = (stepConfig: BgcStepConfig) => {
    const { completedSteps } = stepConfig;
    const request: BgcStepConfig = {
        ...stepConfig,
        completedSteps: [...completedSteps, BGC_STEPS.NON_FCRA],
        [BGC_STEPS.NON_FCRA]: {
            status: BGC_STEP_STATUS.COMPLETED,
            editMode: false
        },
        [BGC_STEPS.ADDITIONAL_BGC]: {
            status: BGC_STEP_STATUS.ACTIVE,
            editMode: false
        }
    }
    boundUpdateStepConfigAction(request);
}

export const validateNonFcraSignatures = ( applicationData: Application, nonFcraAckEsign: string, nonFcraNoticeEsign: string ): NonFcraFormErrorStatus => {
    let errorStatus: NonFcraFormErrorStatus = {
        hasError: false,
        ackESignHasError: false,
        noticeESignHasError: false
    }

    const fcraQuestions = applicationData?.fcraQuestions;
    const bgcDisclosureEsign = fcraQuestions?.bgcDisclosureEsign.signature;

    if(!validateName(nonFcraAckEsign)) {
        errorStatus = {
            ...errorStatus,
            hasError: true,
            ackESignHasError: true
        }
    }

    if(!validateName(nonFcraNoticeEsign)) {
        errorStatus = {
            ...errorStatus,
            hasError: true,
            noticeESignHasError: true
        }
    }

    //first check if there two signature are equal
    if(nonFcraNoticeEsign !== nonFcraAckEsign) {
        errorStatus = {
            ...errorStatus,
            hasError: true,
            noticeESignHasError: true
        }
    }

    if((!!bgcDisclosureEsign && bgcDisclosureEsign !== nonFcraAckEsign) || (!!bgcDisclosureEsign && bgcDisclosureEsign !== nonFcraNoticeEsign)) {
        errorStatus = {
            ...errorStatus,
            hasError: true,
            noticeESignHasError: true,
            ackESignHasError: true
        }
    }

    return errorStatus
}

export const bgcShouldDisplayContinue = (stepConfig: BgcStepConfig): boolean => {
    const { FCRA, NON_FCRA, ADDITIONAL_BGC } = BGC_STEPS;
    const { COMPLETED } = BGC_STEP_STATUS;
    const fcraStatus = stepConfig[FCRA];
    const nonFcraStatus = stepConfig[NON_FCRA];
    const addBgcStatus = stepConfig[ADDITIONAL_BGC];

    return fcraStatus.status === COMPLETED && !fcraStatus.editMode &&
        nonFcraStatus.status === COMPLETED && !nonFcraStatus.editMode &&
        addBgcStatus.status == COMPLETED && !addBgcStatus.editMode
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

export const handleUpdateFcraBGCStep = (stepConfig: BgcStepConfig) => {
    const { completedSteps } = stepConfig;
    const request: BgcStepConfig = {
        ...stepConfig,
        completedSteps: [...completedSteps, BGC_STEPS.FCRA],
        [BGC_STEPS.FCRA]: {
            status: BGC_STEP_STATUS.COMPLETED,
            editMode: false
        },
        [BGC_STEPS.NON_FCRA]: {
            status: BGC_STEP_STATUS.ACTIVE,
            editMode: false
        }
    }

    boundUpdateStepConfigAction(request);
}

export const handleSubmitAdditionalBgc =
    ( candidateData: Candidate, applicationData: Application, candidatePatchRequest: CandidatePatchRequest, formError: CandidateInfoErrorState, stepConfig: BgcStepConfig ) => {
        const { ADDITIONAL_BGC } = UPDATE_APPLICATION_API_TYPE;
        const patch: CandidatePatchRequest = resetUnchangedFieldFromPatch(candidateData, AdditionalBGCFormConfig, candidatePatchRequest) || {};
        const verifyInfo = verifyBasicInfo(patch, formError, AdditionalBGCFormConfig);
        boundUpdateCandidateInfoError(verifyInfo.formError);
        if(!verifyInfo.hasError) {
            //Bound update additional info all
            const payload = {
                candidate: candidatePatchRequest.additionalBackgroundInfo
            }
            const request: UpdateApplicationRequestDS =
                createUpdateApplicationRequest(applicationData, ADDITIONAL_BGC, payload);
            boundUpdateApplicationDS(request, (applicationData: Application) => {
                onCompleteTaskHelper(applicationData);
                handleUpdateAdditionalBGCStep(stepConfig);
                routeToAppPageWithPath(NHE);
            })
        }
    }

export const handleUpdateAdditionalBGCStep = (stepConfig: BgcStepConfig) => {
    const { completedSteps } = stepConfig;
    const request: BgcStepConfig = {
        ...stepConfig,
        completedSteps: [...completedSteps, BGC_STEPS.FCRA, BGC_STEPS.ADDITIONAL_BGC],
        [BGC_STEPS.NON_FCRA]: {
            status: BGC_STEP_STATUS.COMPLETED,
            editMode: false
        }
    }

    boundUpdateStepConfigAction(request);
}
