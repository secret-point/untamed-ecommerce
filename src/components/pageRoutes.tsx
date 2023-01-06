export enum PAGE_ROUTES {
  DEFAULT = "/",
  CONSENT = "consent",
  PRE_CONSENT = "pre-consent",
  JOB_OPPORTUNITIES = "job-opportunities",
  JOB_CONFIRMATION = "job-opportunities/job-confirmation",
  JOB_DESCRIPTION = "job-opportunities/job-description",
  CONTINGENT_OFFER = "contingent-offer",
  BACKGROUND_CHECK = "bgc",
  BACKGROUND_CHECK_FCRA = "bgc/fcra",
  RESUME_APPLICATION = "resume-application",
  NHE = "nhe",
  ALREADY_APPLIED = "already-applied",
  SELF_IDENTIFICATION = "self-identification",
  REVIEW_SUBMIT = "review-submit",
  THANK_YOU = "thank-you",
  SESSION_TIMEOUT = "session-timeout",
  WOTC = "wotc",
  WOTC_COMPLETE = "wotc-complete",
  ASSESSMENT_CONSENT = "assessment-consent",
  ASSESSMENT_NOT_ELIGIBLE = "assessment-not-eligible",
  ASSESSMENT_FINISHED = "assessment-finished",
  CANDIDATE_WITHDRAWS = "candidate-withdraws",
  CALI_DISCLOSURE = "cali-disclosure",
  AMAZON_REJECTS = "amazon-rejects",
  WORKFLOW_FAILED = "workflow-failed",
  AMAZON_WITHDRAWS = "amazon-withdraws",
  NO_AVAILABLE_TIME_SLOTS = "no-available-time-slots",
  CAN_NOT_OFFER_JOB = "can-not-offer-job",
  SUPPLEMENTARY_SUCCESS = "supplementary-success",
  REHIRE_ELIGIBILITY_STATUS = "rehire-eligibility-status",
  NO_AVAILABLE_SHIFT = "no-available-shift",
  APPLICATIONID_NULL = "applicationId-null"
}

// Reference: https://code.amazon.com/packages/HVHStepFunctionDefinitions/blobs/ad75b9869a017bc84a9e03920e835a6b2cec7063/--/configuration/nacf_tier_1_node_workflow/defintion.json#L186
export const PagesControlledByWorkFlowService = [
  PAGE_ROUTES.JOB_OPPORTUNITIES,
  PAGE_ROUTES.ASSESSMENT_CONSENT,
  PAGE_ROUTES.CONTINGENT_OFFER,
  PAGE_ROUTES.BACKGROUND_CHECK,
  PAGE_ROUTES.CAN_NOT_OFFER_JOB,
  PAGE_ROUTES.CALI_DISCLOSURE,
  PAGE_ROUTES.NHE,
  PAGE_ROUTES.SELF_IDENTIFICATION,
  PAGE_ROUTES.REVIEW_SUBMIT,
  PAGE_ROUTES.THANK_YOU,
  PAGE_ROUTES.WOTC,
  PAGE_ROUTES.SUPPLEMENTARY_SUCCESS,
  PAGE_ROUTES.ASSESSMENT_NOT_ELIGIBLE,
  PAGE_ROUTES.REHIRE_ELIGIBILITY_STATUS,
  PAGE_ROUTES.AMAZON_WITHDRAWS,
  PAGE_ROUTES.CANDIDATE_WITHDRAWS,
  PAGE_ROUTES.AMAZON_REJECTS,
  PAGE_ROUTES.WORKFLOW_FAILED,
  PAGE_ROUTES.RESUME_APPLICATION
];
