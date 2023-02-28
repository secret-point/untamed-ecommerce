import { ofType } from "redux-observable";
import { from, Observable, of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/internal/operators";
import {
  actionGetScheduleDetailFailed,
  actionGetScheduleDetailSuccess,
  actionGetScheduleListByJobIdFailed,
  actionGetScheduleListByJobIdSuccess
} from "../actions/ScheduleActions/scheduleActions";
import {
  GetScheduleDetailAction,
  GetScheduleListByJobIdAction,
  SCHEDULE_ACTION_TYPE
} from "../actions/ScheduleActions/scheduleActionTypes";
import { PAGE_ROUTES } from "../components/pageRoutes";
import { getScheduleDuration } from "../helpers/job-helpers";
import { get12hrTimeStringLocalized, getLocalizedDate } from "../helpers/localization-helpers";
import { log, LoggerType } from "../helpers/log-helper";
import JobService from "../services/job-service";
import {
  GetScheduleDetailErrorMessage,
  GetScheduleListErrorMessages,
  UpdateApplicationErrorMessage
} from "../utils/api/errorMessages";
import { ApiError, GetScheduleDetailResponse, GetScheduleListResponse } from "../utils/api/types";
import { GET_SCHEDULE_LIST_BY_JOB_ID_ERROR_CODE, UPDATE_APPLICATION_ERROR_CODE } from "../utils/enums/common";
import { formatLoggedApiError, getLocale, routeToAppPageWithPath, setEpicApiCallErrorMessage } from "../utils/helper";
import { Locale, Schedule } from "../utils/types/common";
import { createProxyApiEpicError, epicSwitchMapHelper } from "./helper";

export const GetScheduleListByJobIdEpic = (action$: Observable<any>) => {
  return action$.pipe(
    ofType(SCHEDULE_ACTION_TYPE.GET_LIST_BY_JOB),
    switchMap((action: GetScheduleListByJobIdAction) =>
      from(new JobService().getAllSchedules(action.payload))
        .pipe(
          switchMap(epicSwitchMapHelper),
          switchMap(async (response: GetScheduleListResponse) => {
            const { data } = response;

            if (!data.availableSchedules || (data.availableSchedules && !data.availableSchedules.schedules)) {
              throw createProxyApiEpicError(GET_SCHEDULE_LIST_BY_JOB_ID_ERROR_CODE.FETCH_SHIFTS_ERROR);
            }

            if (data.availableSchedules.total <= 0 || data.availableSchedules.schedules.length === 0) {
              throw createProxyApiEpicError(GET_SCHEDULE_LIST_BY_JOB_ID_ERROR_CODE.NO_SCHEDULE_FOUND);
            }

            const { schedules } = data.availableSchedules;

            if (getLocale()=== Locale.enGB) {
              return schedules?.map((schedule) => {
                return {
                  ...schedule,
                  // if hireStartDate is present this is considered the firstDayOnSite in the UK
                  firstDayOnSite: schedule.hireStartDate || schedule.firstDayOnSite,
                  duration: getScheduleDuration({ ...schedule }),
                  hireEndDate: schedule?.hireEndDate && getLocalizedDate(schedule.hireEndDate),
                  scheduleText: schedule?.scheduleText && get12hrTimeStringLocalized(schedule.scheduleText)
                };
              });
            } 
           
            return schedules;
          }),
          map((data: Schedule[]) => {
            return actionGetScheduleListByJobIdSuccess(data);
          }),
          catchError((error: ApiError) => {
            log(`[Epic] GetScheduleListByJobIdEpic error: ${error?.errorCode}`, formatLoggedApiError(error), LoggerType.ERROR);

            const errorMessage = GetScheduleListErrorMessages[error.errorCode] || UpdateApplicationErrorMessage[UPDATE_APPLICATION_ERROR_CODE.INTERNAL_SERVER_ERROR];

            if (error.errorCode === GET_SCHEDULE_LIST_BY_JOB_ID_ERROR_CODE.NO_SCHEDULE_FOUND) {
              routeToAppPageWithPath(PAGE_ROUTES.NO_AVAILABLE_SHIFT);
            } else {
              setEpicApiCallErrorMessage(errorMessage);
            }

            return of(actionGetScheduleListByJobIdFailed(error));
          })
        )
    )
  );
};

export const GetScheduleDetailEpic = (action$: Observable<any>) => {
  return action$.pipe(
    ofType(SCHEDULE_ACTION_TYPE.GET_DETAIL),
    switchMap((action: GetScheduleDetailAction) =>
      from(new JobService().getScheduleDetailByScheduleId(action.payload.scheduleId))
        .pipe(
          switchMap(epicSwitchMapHelper),
          switchMap(async (response: GetScheduleDetailResponse) => {
            return response.data;
          }),
          map((data: Schedule) => {

            if (action.onSuccess) {
              action.onSuccess();
            }

            return actionGetScheduleDetailSuccess(data);
          }),
          catchError((error: ApiError) => {
            log(`[Epic] GetScheduleDetailEpic error: ${error?.errorCode}`, formatLoggedApiError(error), LoggerType.ERROR);

            const errorMessage = GetScheduleDetailErrorMessage[error.errorCode] || UpdateApplicationErrorMessage[UPDATE_APPLICATION_ERROR_CODE.INTERNAL_SERVER_ERROR];
            setEpicApiCallErrorMessage(errorMessage);

            if (action.onError) {
              action.onError(errorMessage);
            }

            return of(actionGetScheduleDetailFailed(error));
          })
        )
    )
  );
};
