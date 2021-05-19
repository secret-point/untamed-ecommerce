import ICandidateApplication, { Candidate } from "./ICandidateApplication";
import { History } from "history";
import { ChildRequisition } from "./shift-preferences";
export interface Consent {}

export interface WorkflowData {
  stepName: string;
  errorMessageCode: string;
}

export interface Bgc {}

export interface OutputData {
  consent: Consent;
  bgc: Bgc;
}

export interface ConsentInfo {
  jobTitle: string;
  questions: string[];
  locationDescription: string;
  requisitionStatus: string;
  requisitionType: string;
  isCandidatePreferencesEnabled: boolean;
  isCandidateNHEPreferencesEnabled: boolean;
}

export interface SelectedLocations {
  label: string;
  checked: boolean;
  value: string;
}
export interface Location {
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface NHETimeSlots {
  timeSlotId: string;
  startTime: string;
  endTime: string;
  location: Location;
  timezone: string;
  availableResources: number;
  appointmentsBooked: number;
  recruitingEventId: string;
  timeRange: string;
  date: string;
  dateWithoutFormat: string;
  childRequisitionId: string;
  nheSource: string;
}

export interface Requisition {
  consentInfo: ConsentInfo;
  childRequisitions: ChildRequisition[];
  selectedChildRequisition: ChildRequisition;
  jobDescription: any;
  availableShifts: AvailableShifts;
  selectedLocations: SelectedLocations[];
  nheTimeSlots: NHETimeSlots[];
}

export interface ContingentOffer {
  offerAcceptedTime: string;
  offerAccepted: boolean;
}

export interface ApplicationData {
  requisition: Requisition;
  application: ICandidateApplication;
  output: any;
  candidate: Candidate;
  showPreviousNames: string;
  selectedShift: any;
  loadingShifts: boolean;
  shiftsEmptyOnFilter: boolean;
  shiftPageFactor: number;
}

export interface Page {
  id: string;
  orderNumber: number;
  configPath: string;
}

export interface UrlParam {
  page: string;
  requisitionId: string;
  applicationId: string;
  misc: string;
}

export interface DaysHoursFilter {
  day: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
}

export interface HOURS_PER_WEEK {
  maximumValue: number;
  minimumValue: number;
}

export interface Range {
  HOURS_PER_WEEK: HOURS_PER_WEEK;
}
export interface day {
  startTime: string;
  endTime: string;
}

export interface SchedulePreference {
  MONDAY: day;
  TUESDAY: day;
  WEDNESDAY: day;
  THURSDAY: day;
  FRIDAY: day;
  SATURDAY: day;
  SUNDAY: day;
}

export interface In {}

export interface Eq {}

export interface Filter {
  range: Range;
  schedulePreferences: SchedulePreference;
  in: In;
  eq: Eq;
}

export interface AvailableFilter {
  sortBy: string;
  filter: Filter;
  seasonalOnly: boolean;
  locale: string;
  pageFactor: number;
  isCRSJobsDisplayed: boolean;
}

export interface AppConfig {
  stage: string;
  authenticationURL: string;
  dashboardUrl: string;
  stepFunctionEndpoint: string;
  ASHChecklistURL: string;
  defaultDaysHoursFilter: DaysHoursFilter[];
  defaultAvailableFilter: AvailableFilter;
}

export interface PageOrder {
  id: string;
  orderNumber: number;
  configPath: string;
}

export default interface Payload {
  output: any;
  data: ApplicationData;
  currentPage: Page;
  nextPage: Page;
  previousPage: Page;
  urlParams: UrlParam;
  appConfig: AppConfig;
  pageOrder: PageOrder[];
  keyName: string;
  candidateId: string;
  isContentContainsSteps?: boolean;
  activeStepIndex?: number;
  updatedPageId: string;
  options: any;
  value: any;
  pageId: string;
  stepId: string;
  stepsLength: number;
  selectedShift: any;
  selectedRequisitionId: string;
  selectedRequisitionIndex: number;
  history: History;
}
export interface AvailableShifts {
  shifts: Shifts[];
  total: any;
}
export interface Shifts {
  headCountRequestId: string;
  jobTitle: string;
  isTemporaryReq: boolean;
  requisitionId: string;
  jobType: string;
  locationDescription: string;
  fillRate: number;
  openCount: number;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  hoursPerWeek: HoursPerWeek;
  haveMedicalBenefits: boolean;
  day1Date: string;
  hireStartDate: string;
  basePayRate: number;
  shiftDifferential: number;
  shortDescription: string;
  days: string;
  time: string;
  iconUrl: string;
  currency: string;
  jobClass: string;
  shiftCode: string;
  altShiftCode: string;
  locationPostalCode: string;
  locationState: string;
  country: string;
}

export interface HoursPerWeek {
  maximumValue: number;
  minimumValue: number;
}
