import {
  onUpdateChange,
  onRedirect,
  onSubmit,
  onGoToAction,
  onGoToSelfServicePage,
  onGoToSelfServicePageDS,
  onResetIsUpdateActionExecuted,
  onGoBack,
  onGoToDashboard,
  onGoToASH,
  onGoToDashboardOrASH,
  onCompleteTask,
  onFilterChange,
  onResetPageOutput,
  onBackButtonCompleteTask,
  onRedirectToASHChecklist,
  onLogVideoMetrics,
  onLogSpecificJobVideoMetrics,
  onClearWarningMessage,
  onNheAppointmentsUnavailable,
  goToCSHomePage
} from "./actions";
import {
  onStartApplication,
  onGetApplication,
  onGetApplicationSelfServiceDS,
  onLaunchFCRA,
  continueWithFCRADecline,
  createApplication,
  updateApplication,
  onSelectedShifts,
  onSelectedSchedules,
  onUpdateShiftSelection,
  onUpdateShiftSelectionDS,
  onUpdateShiftSelectionSelfService,
  onUpdateShiftSelectionSelfServiceDS,
  onCancelShiftSelectionSelfService,
  onCancelShiftSelectionSelfServiceDS,
  onGetCandidate,
  onTerminateApplication,
  onUpdateWotcStatus,
  onShowPreviousName,
  onSaveShiftPreferences,
  sendPageLoadAdobeEvent,
  onGetApplicationDS,
  onSubmitApplicationDS
} from "./application-actions";
import {
  onGetRequisitionHeaderInfo,
  onGetNHETimeSlots,
  onGetNHETimeSlotsDS,
  onGetPossibleNHEDates,
  onGetAllAvailableShifts,
  onGetAllAvailableShiftsSelfService,
  onGetChildRequisitions,
  onGetJobDescription,
  onGoToDescription,
  onApplyFilter,
  onApplyFilterSelfService,
  onResetFilters,
  onResetFiltersSelfService,
  onShiftsIncrementalLoad,
  onShiftsIncrementalLoadSelfService,
  selectJobRole,
  loadShiftPreferences
} from "./requisition-actions";
import {
  onGetJobInfo,
  onGetAllSchedules,
  onGetAllSchedulesSelfService,
  onApplyFilterDS,
  onApplyFilterSelfServiceDS,
  onResetFiltersDS,
  onSchedulesIncrementalLoad,
  onSchedulesIncrementalLoadSelfService,
  onResetFiltersSelfServiceDS,
  onGoToDescriptionDS,
  onGetJobDescriptionDS,
  onGetScheduleDetails,
  onCheckIfSkipScheduleSelection,
  onSkipScheduleSelection,
  onClearSelectedSchedule,
} from "./job-actions";
const actionMap: any = {
  CANCEL_SHIFT_SELECTION_SELF_SERVICE: onCancelShiftSelectionSelfService,
  CANCEL_SHIFT_SELECTION_SELF_SERVICE_DS: onCancelShiftSelectionSelfServiceDS,
  CLEAR_SELECTED_SCHEDULE: onClearSelectedSchedule,
  COMPLETE_TASK: onCompleteTask,
  CONTINUE_WITH_FCRA_DECLINE: continueWithFCRADecline,
  CREATE_APPLICATION: createApplication,
  GET_ALL_AVAILABLE_SHIFTS: onGetAllAvailableShifts,
  GET_ALL_AVAILABLE_SHIFTS_SELF_SERVICE: onGetAllAvailableShiftsSelfService,
  GET_ALL_SCHEDULES: onGetAllSchedules,
  GET_ALL_SCHEDULES_SELF_SERVICE: onGetAllSchedulesSelfService,
  GET_APPLICATION: onGetApplication,
  GET_APPLICATION_SELF_SERVICE_DS: onGetApplicationSelfServiceDS,
  GET_APPLICATION_DS: onGetApplicationDS,
  GET_CHILD_REQUISITIONS: onGetChildRequisitions,
  GET_JOB_DESCRIPTION: onGetJobDescription,
  GET_JOB_DESCRIPTION_DS: onGetJobDescriptionDS,
  GET_JOB_INFO: onGetJobInfo,
  GET_NHE_PREFERENCES_DATES: onGetPossibleNHEDates,
  GET_NHE_TIME_SLOTS: onGetNHETimeSlots,
  GET_NHE_TIME_SLOTS_DS: onGetNHETimeSlotsDS,
  GET_REQUISITION_HEADER_INFO: onGetRequisitionHeaderInfo,
  GET_SCHEDULE_DETAILS: onGetScheduleDetails,
  GO_TO_DASHBOARD: onGoToDashboard,
  GO_TO_ASH: onGoToASH,
  GO_TO_DASHBOARD_OR_ASH: onGoToDashboardOrASH,
  GO_TO_JOB_DESCRIPTION: onGoToDescription,
  GO_TO_JOB_DESCRIPTION_DS: onGoToDescriptionDS,
  LAUNCH_FCRA: onLaunchFCRA,
  LOAD_INCREMENTAL_SCHEDULE: onSchedulesIncrementalLoad,
  LOAD_INCREMENTAL_SCHEDULE_SELF_SERVICE: onSchedulesIncrementalLoadSelfService,
  LOAD_INCREMENTAL_SHIFTS: onShiftsIncrementalLoad,
  LOAD_INCREMENTAL_SHIFTS_SELF_SERVICE: onShiftsIncrementalLoadSelfService,
  LOAD_SHIFT_PREFERENCES_DETAILS: loadShiftPreferences,
  LOG_VIDEO_METRICS: onLogVideoMetrics,
  LOG_SPECIFIC_JOB_VIDEO_METRICS: onLogSpecificJobVideoMetrics,
  ON_APPLY_FILTER: onApplyFilter,
  ON_APPLY_FILTER_DS: onApplyFilterDS,
  ON_APPLY_FILTER_SELF_SERVICE_DS: onApplyFilterSelfServiceDS,
  ON_APPLY_FILTER_SELF_SERVICE: onApplyFilterSelfService,
  ON_BACK_BUTTON_COMPLETE_TASK: onBackButtonCompleteTask,
  ON_FILTER_CHANGE: onFilterChange,
  ON_GET_CANDIDATE: onGetCandidate,
  ON_GO_BACK: onGoBack,
  ON_GO_TO: onGoToAction,
  ON_GO_TO_SELF_SERVICE_PAGE: onGoToSelfServicePage,
  ON_GO_TO_SELF_SERVICE_PAGE_DS: onGoToSelfServicePageDS,
  ON_OUTPUT_VALUE_CHANGE: onUpdateChange,
  ON_REDIRECT: onRedirect,
  ON_RESET_OUTPUT_STATE: onResetPageOutput,
  ON_SAVE_SHIFT_PREFERENCES: onSaveShiftPreferences,
  ON_SCHEDULE_SELECTION: onSelectedSchedules,
  ON_SHIFT_SELECTION: onSelectedShifts,
  ON_VALUE_CHANGE: onUpdateChange,
  ON_VALUE_UPDATE: onUpdateChange,
  REDIRECT_TO_ASH_CHECKLIST: onRedirectToASHChecklist,
  RESET_FILTERS: onResetFilters,
  RESET_FILTERS_DS: onResetFiltersDS,
  RESET_FILTERS_SELF_SERVICE: onResetFiltersSelfService,
  RESET_FILTERS_SELF_SERVICE_DS: onResetFiltersSelfServiceDS,
  RESET_IS_UPDATE_ACTION_EXECUTED: onResetIsUpdateActionExecuted,
  SELECT_JOB_ROLE: selectJobRole,
  SEND_PAGE_LOAD_ADOBE_EVENT: sendPageLoadAdobeEvent,
  SHOW_PREVIOUS_NAMES: onShowPreviousName,
  START_APPLICATION: onStartApplication,
  SUBMIT_APPLICATION: onSubmitApplicationDS,
  SUBMIT_DATA: onSubmit,
  TERMINATE_APPLICATION: onTerminateApplication,
  UPDATE_APPLICATION: updateApplication,
  UPDATE_SHIFT_SELECTION: onUpdateShiftSelection,
  UPDATE_SHIFT_SELECTION_DS: onUpdateShiftSelectionDS,
  UPDATE_SHIFT_SELECTION_SELF_SERVICE: onUpdateShiftSelectionSelfService,
  UPDATE_SHIFT_SELECTION_SELF_SERVICE_DS: onUpdateShiftSelectionSelfServiceDS,
  UPDATE_WOTC_STATUS: onUpdateWotcStatus,
  CHECK_IF_SKIP_SCHEDULE_SELECTION: onCheckIfSkipScheduleSelection,
  SKIP_SCHEDULE_SELECTION: onSkipScheduleSelection,
  CLEAR_WARNING_MESSAGE: onClearWarningMessage,
  NHE_APPOINTMENTS_UNAVAILABLE: onNheAppointmentsUnavailable,
  GO_TO_CAREESITE: goToCSHomePage
};

export default actionMap;
