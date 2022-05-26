import { QUERY_PARAMETER_NAME } from "../enums/common";

export interface QueryParamItem {
    paramName?: QUERY_PARAMETER_NAME,
    paramValue?: string
}

export interface AppConfig {
    envConfig?: EnvConfig;
    pageOrder?: PageOrder[];
    countryStateConfig?: CountryStateConfig;
}

export interface EnvConfig {
    stage: string;
    authenticationURL: string;
    dashboardUrl: string;
    stepFunctionEndpoint: string;
    ASHChecklistURL: string;
    ASHChecklistURLCS: string;
    defaultDaysHoursFilter: DaysHoursFilter[];
    defaultAvailableFilter: AvailableFilter;
    defaultAvailableFilterDS: AvailableFilter;
    featureList?: any;
    CSDomain: string;
}

export interface DaysHoursFilter {
    day: string;
    isActive: boolean;
    startTime: string;
    endTime: string;
}

export interface AvailableFilter {
    sortBy: string;
    filter: Filter;
    seasonalOnly: boolean;
    locale: string;
    pageFactor: number;
    isCRSJobsDisplayed: boolean;
}

export interface Filter {
    range: Range;
    schedulePreferences: SchedulePreference;
    in: In;
    eq: Eq;
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

export interface day {
    startTime: string;
    endTime: string;
}

export interface Range {
    HOURS_PER_WEEK: HOURS_PER_WEEK;
}

export interface HOURS_PER_WEEK {
    maximumValue: number;
    minimumValue: number;
}

export interface In {}

export interface Eq {}

export type CountryStateConfig = State[]

export interface State {
    value: string,
    text: string
}

interface PageOrder {
    orderNumber: number;
    configPath: string;
}

export interface Job {
    jobId: string;
    availableSchedules: { schedules: AvailableSchedule[] };
    language: string,
    dataSource: string,
    requisitionType: string,
    jobIdNumber: string,
    jobTitle: string,
    jobType: string,
    employmentType: string,
    fullAddress: string,
    country: string,
    city: string,
    postalCode: string,
    totalPayRateMin: number,
    totalPayRateMax: number,
    currencyCode: string,
    tagLine: string,
    letterOfIntent: string,
    image: string,
    jobPreviewVideo: string,
    limitedTimeOffer: string,
    featuredJob: boolean,
    bonusJob: boolean,
    jobDescription: string,
    jobQualification: string,
    careerPortalURL: string,
    blackbirdPortalURL: string,
    postingStatus: string,
    dspEnabled?: boolean | null,
    qualificationCriteria: string[];
}

export interface AvailableSchedule {
    scheduleId: string;
}

export enum Locale {
    enGB = 'en-GB',
    enUS = 'en-US',
    esUS = 'es-US',
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

export interface SelectedLocations {
    label: string;
    checked: boolean;
    value: string;
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

export interface ChildRequisition {
    requisitionId: string;
    requisitionTitle: string;
    requisitionStatus: string;
    parentRequisitionId: string;
    requisitionFunction: string;
    requisitionCategory: string;
    requisitionType: string;
    phoneToolTitle: string;
    panProcessing: string;
    recruiterName: string;
    postingStatus: string;
    applicationWorkflow: string;
    backgroundCheckType: string;
    isPoolingReq: boolean;
    isTemporaryReq: boolean;
    isNodeReq: boolean;
    isPAPIenabled: boolean;
    bypassDrugTest: boolean;
    isTemplate: boolean;
    isTestReq: boolean;
    showAllShifts: boolean;
    considerSimilarPositions: boolean;
    country: string;
    locationCode: string;
    locationState: string;
    locationCity: string;
    locationDescription: string;
    locationPostalCode: string;
    companyCode: string;
    jobCode: string;
    jobTitle: string;
    standardHours: number;
    payBasis: string;
    basePayRate: number;
    isVariableCompPayEligible: boolean;
    isStockEligible: boolean;
    questionSets: QuestionSet;
    isCentralizationEnabled: boolean;
    externalReferenceId: string;
    createdBy: string;
    lastModifiedBy: string;
    lastModificationDate: string;
    isCandidatePreferencesEnabled: boolean;
    isCandidateNHEPreferencesEnabled: boolean;
    shortDescription: string;
    selected: boolean;
    imageUrl: string;
    videoUrl: string;
    posterUrl: string;
}

export interface QuestionSet {
    SHIFT_PREFERENCES: string;
    DISQUALIFICATION: string;
    DIVERSITY?: string;
    PRESCREENING: string;
    SELF_IDENTIFICATION: string;
}

export interface AvailableShifts {
    schedules: Schedules[];
    total: any;
}

export interface Schedules {
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

export interface Schedule {
    scheduleId: string;
    jobId: string;
    dataSource: string;
    language: string;
    externalJobTitle: string;
    basePay: number;
    totalPayRate: number;
    currencyCode: string;
    scheduleText: string;
    hoursPerWeek: number;
    firstDayOnSite: string;
    scheduleBannerText: string;
    scheduleType: string;
    employmentType: string;
    tagLine: string;
    image: string;
    jobPreviewVideo: string;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    distance: number;
    iconUrl: string;
    bgcVendorName: string;
    bonusSchedule: boolean;
    signOnBonus: number;
    briefJobDescription: string;
}

export interface HoursPerWeek {
    maximumValue: number;
    minimumValue: number;
}

export interface Application {
    active: boolean;
    submitted: boolean;
    applicationId: string;
    sfApplicationId: string;
    language: string;
    candidateId: string;
    sfCandidateId: string;
    candidateName: string;
    parentRequisitionId: string;
    currentState: string;
    assessment: any;
    jobSelected: JobSelected;
    contingentOffer: ContingentOffer;
    fcraQuestions: any;
    nonFcraQuestions: any;
    nheAppointment: any;
    nhePreference: NHEPreferences;
    applicationSignature: any;
    firstAvailableStartDate: number;
    appointmentCompleted: boolean;
    wotcScreening: any;
    rehireEligibilityAudit: string;
    step: string;
    subStep: string;
    bgcDisclosureFCRA: string;
    metadata: any;
    createdBy: string;
    lastModifiedBy?: any;
    creationDate: string;
    lastModificationDate?: any;
    shift: any;
    schedule: any;
    onlySeasonalShifts: boolean;
    workflowStepName: string;
    hasBGCCaliforniaDisclosureAcknowledged: boolean;
    jobReferral: JobReferral;
    jobScheduleSelected: {
        jobId: string;
        scheduleId: string;
        scheduleDetails: any;
        jobScheduleSelectedTime: string;
    }
    dspEnabled?: boolean
}

export interface ContingentOffer {
    offerAcceptedTime: string;
    offerAccepted: boolean;
}

export interface NHEPreferences {
    preferredNHEDates: string[];
    preferredNHETimeIntervals: string[];
    preferenceSelectedOn: string;
}

export interface JobSelected {
    childRequisitionId: string;
    headCountRequestId: string;
    jobSelectedOn: string;
    bgcVendorName: BGCVendorType;
    shift: Shifts;
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
    shiftType: string;
    altShiftCode: string;
    locationPostalCode: string;
    locationState: string;
    country: string;
}

export enum BGCVendorType {
    FADV = "FADV",
    ACCURATE = "ACCURATE"
}

export interface JobReferral {
    hasReferral: boolean | string;
    referralInfo: string;
}
