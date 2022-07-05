import {
    APP_CONFIG_ACTIONS,
    GET_ENV_CONFIG_TYPE,
    GET_INITIAL_APP_CONFIG_TYPE
} from "../actions/AppConfigActions/appConfigActionTypes";
import { BANNER_MESSAGE_TYPE, GET_STATE_CONFIG_TYPE, UI_ACTION } from "../actions/UiActions/uiActionTypes";
import { GET_JOB_DETAIL_TYPE } from "../actions/JobActions/jobDetailActionTypes";
import { SCHEDULE_ACTION_TYPE } from "../actions/ScheduleActions/scheduleActionTypes";
import { APPLICATION_ACTION_TYPES } from "../actions/ApplicationActions/applicationActionTypes";
import { CANDIDATE_ACTION_TYPES } from "../actions/CandidateActions/candidateActionTypes";
import { WORKFLOW_REQUEST } from "../actions/WorkflowActions/workflowActionTypes";
import { NHE_ACTION_TYPES } from "../actions/NheActions/nheActionTypes";
import { AlertMessage } from "../utils/types/common";

export interface uiState {
    isLoading: boolean;
    bannerMessage?: AlertMessage,
}

export const initUiState: uiState = {
    isLoading: false
}

export default function uiReducer( state: uiState = initUiState, action: UI_ACTION | APP_CONFIG_ACTIONS | any ): uiState {
    switch (action.type) {
        case GET_INITIAL_APP_CONFIG_TYPE.GET:
        case GET_ENV_CONFIG_TYPE.GET:
        case GET_JOB_DETAIL_TYPE.GET:
        case APPLICATION_ACTION_TYPES.GET_APPLICATION:
        case GET_STATE_CONFIG_TYPE.GET:
        case SCHEDULE_ACTION_TYPE.GET_LIST_BY_JOB:
        case SCHEDULE_ACTION_TYPE.GET_DETAIL:
        case APPLICATION_ACTION_TYPES.CREATE_APPLICATION:
        case APPLICATION_ACTION_TYPES.CREATE_APPLICATION_AND_SKIP_SCHEDULE:
        case APPLICATION_ACTION_TYPES.UPDATE_APPLICATION:
        case APPLICATION_ACTION_TYPES.UPDATE_WORKFLOW_NAME:
        case WORKFLOW_REQUEST.START:
        case WORKFLOW_REQUEST.INIT:
        case CANDIDATE_ACTION_TYPES.GET_CANDIDATE:
        case NHE_ACTION_TYPES.GET_SLOTS_DS:
            return {
                ...state,
                isLoading: true
            };
        case GET_INITIAL_APP_CONFIG_TYPE.SUCCESS:
        case GET_INITIAL_APP_CONFIG_TYPE.FAILED:
        case GET_ENV_CONFIG_TYPE.SUCCESS:
        case GET_ENV_CONFIG_TYPE.FAILED:
        case GET_JOB_DETAIL_TYPE.FAILED:
        case GET_JOB_DETAIL_TYPE.SUCCESS:
        case APPLICATION_ACTION_TYPES.GET_APPLICATION_SUCCESS:
        case APPLICATION_ACTION_TYPES.GET_APPLICATION_FAILED:
        case GET_STATE_CONFIG_TYPE.SUCCESS:
        case GET_STATE_CONFIG_TYPE.FAILED:
        case SCHEDULE_ACTION_TYPE.GET_LIST_BY_JOB_SUCCESS:
        case SCHEDULE_ACTION_TYPE.GET_LIST_BY_JOB_FAILED:
        case SCHEDULE_ACTION_TYPE.GET_DETAIL_SUCCESS:
        case SCHEDULE_ACTION_TYPE.GET_DETAIL_FAILED:
        case APPLICATION_ACTION_TYPES.CREATE_APPLICATION_SUCCESS:
        case APPLICATION_ACTION_TYPES.CREATE_APPLICATION_FAILED:
        case APPLICATION_ACTION_TYPES.CREATE_APPLICATION_AND_SKIP_SCHEDULE_SUCCESS:
        case APPLICATION_ACTION_TYPES.CREATE_APPLICATION_AND_SKIP_SCHEDULE_FAILED:
        case APPLICATION_ACTION_TYPES.UPDATE_APPLICATION_SUCCESS:
        case APPLICATION_ACTION_TYPES.UPDATE_APPLICATION_FAILED:
        case WORKFLOW_REQUEST.END:
        case APPLICATION_ACTION_TYPES.UPDATE_WORKFLOW_NAME_SUCCESS:
        case APPLICATION_ACTION_TYPES.UPDATE_WORKFLOW_NAME_FAILED:
        case CANDIDATE_ACTION_TYPES.GET_CANDIDATE_SUCCESS:
        case CANDIDATE_ACTION_TYPES.GET_CANDIDATE_FAILED:
        case NHE_ACTION_TYPES.GET_SLOTS_DS_FAILED:
        case NHE_ACTION_TYPES.GET_SLOTS_DS_SUCCESS:
            return {
                ...state,
                isLoading: action.loadingStatus? action.loadingStatus : false
            };

        case BANNER_MESSAGE_TYPE.SET_BANNER_MESSAGE:
            return {
                ...state,
                bannerMessage: action.payload
            }
        case BANNER_MESSAGE_TYPE.RESET_BANNER_MESSAGE:
            return {
                ...state,
                bannerMessage: undefined
            }

        default:
            return state;
    }
}
