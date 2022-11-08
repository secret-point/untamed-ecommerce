import Cookies from "js-cookie";
import * as boundUi from "../../../src/actions//UiActions/boundUi";
import * as adobeActions from "../../../src/actions/AdobeActions/adobeActions";
import * as boundApplicationActions from "../../../src/actions/ApplicationActions/boundApplicationActions";
import * as boundSelfIdentificationActions
  from "../../../src/actions/SelfIdentitifactionActions/boundSelfIdentificationActions";
import { METRIC_NAME } from "../../../src/constants/adobe-analytics";
import { initSelfIdentificationState } from "../../../src/reducers//selfIdentification.reducer";
import {
  MX_SelfIdentificationConfigSteps,
  MX_SelfIdPronounsItems,
  newBBUIPathName,
  SelfIdGenderRadioItems,
  US_SelfIdentificationConfigSteps
} from "../../../src/utils/constants/common";
import { CountryCode, INFO_CARD_STEP_STATUS, SELF_IDENTIFICATION_STEPS } from "../../../src/utils/enums/common";
import {
  NHE_TIMESLOT,
  TEST_APPLICATION_DATA,
  TEST_APPLICATION_ID,
  TEST_ASSESSMENT_URL,
  TEST_BACKGROUND_INFO,
  TEST_CANDIDATE_ADDRESS,
  TEST_JOB,
  TEST_JOB_ID,
  TEST_SCHEDULE,
  TEST_SELF_IDENTIFICATION
} from "../../test-utils/test-data";
import {
  AWAIT_TIMEOUT,
  awaitWithTimeout,
  checkAndBoundGetApplication,
  formatFlexibleTrainingDate,
  formatMonthlyBasePayHelper,
  getCountryCodeByCountryName,
  getKeyMapFromDetailedRadioItemList,
  getMXCountryCodeByCountryName,
  getQueryFromSearchAndHash,
  GetSelfIdentificationConfigStep,
  handleConfirmNHESelection,
  handleInitiateSelfIdentificationStep,
  handleSubmitSelfIdDisabilityStatus,
  handleSubmitSelfIdEqualOpportunity,
  handleSubmitSelfIdVeteranStatus,
  handleUpdateSelfIdStep,
  initSelfIdStepConfig,
  isAdditionalBgcInfoValid,
  isAddressValid,
  isDOBLessThan100,
  isDOBOverEighteen,
  isI18nSelectOption,
  isNewBBuiPath,
  isSelfIdDisabilityStepCompleted,
  isSelfIdentificationInfoValid,
  isSelfIdentificationInfoValidBeforeDisability,
  isSelfIdEqualOpportunityStepCompleted,
  isSelfIdVeteranStepCompleted,
  onAssessmentStart,
  parseQueryParamsArrayToSingleItem,
  processAssessmentUrl,
  renderNheTimeSlotFullAddress,
  reverseMappingTranslate,
  setEpicApiCallErrorMessage,
  showErrorMessage,
  validateInput,
  checkIfIsLegacy,
  renderScheduleFullAddress,
  populateTimeRangeHourData,
  parseObjectToQueryString
} from "../../../src/utils/helper";

describe('processAssessmentUrl', () => {
  const locale = 'en-US';

  beforeEach(() => {
    Cookies.get = jest.fn().mockImplementationOnce(() => locale);
  });

  it('should return empty string if assessment url is empty', () => {
    const url = processAssessmentUrl("", TEST_APPLICATION_ID, TEST_JOB_ID);
    expect(url).toBe("");
  });

  it('should return the correct assessment url', () => {
    const url = processAssessmentUrl(TEST_ASSESSMENT_URL, TEST_APPLICATION_ID, TEST_JOB_ID);

    const redirectStr = `applicationId=${TEST_APPLICATION_ID}&jobId=${TEST_JOB_ID}`;
    expect(url).toEqual(`${TEST_ASSESSMENT_URL}?locale=${locale}&redirect=${encodeURIComponent(redirectStr)}`);
  });

  it('should return the correct assessment url with 3rd party query param', () => {
    const thridPartyQueryParam = 'cmpid=cpm-test-id&tid=t-test-id';
    window.location.hash = `#/test-page-name?${thridPartyQueryParam}&no_3rd_party=test`;
    const testUrl = `${TEST_ASSESSMENT_URL}`;
    const url = processAssessmentUrl(testUrl, TEST_APPLICATION_ID, TEST_JOB_ID);

    const redirectStr = `applicationId=${TEST_APPLICATION_ID}&jobId=${TEST_JOB_ID}&${thridPartyQueryParam}`;
    expect(url).toEqual(`${TEST_ASSESSMENT_URL}?locale=${locale}&redirect=${encodeURIComponent(redirectStr)}`);
  });
});

test("getCountryCodeByCountryName", () => {
  expect(getCountryCodeByCountryName("")).toEqual("");
  expect(getCountryCodeByCountryName("United States")).toEqual("US");
  expect(getCountryCodeByCountryName("custom")).toEqual("");
});

describe('awaitWithTimeout', () => {
  let promise: Promise<any>;

  beforeEach(() => {
    promise = new Promise((res) => setTimeout(() => res('result'), 100));
  });

  it('should return promise result if not timeout', async () => {
    const res = await awaitWithTimeout(promise, 1000);
    expect(res).toEqual('result');
  });

  it('should throw timeout error if timeout', async () => {
    await expect(awaitWithTimeout(promise, 10))
      .rejects
      .toThrow(AWAIT_TIMEOUT);
  });

  it('should not throw timeout error if suppressed', async () => {
    await expect(awaitWithTimeout(promise, 10, true))
      .resolves
      .toBeUndefined();
  });
});

describe("formatFlexibleTrainingDate", () => {
  expect(formatFlexibleTrainingDate("2022-10-10 3:30 AM - 8:30 AM")).toEqual("Oct 10, 2022 03:30 AM - 08:30 AM");
  expect(formatFlexibleTrainingDate("2022-10-11 8:30 PM - 9:30 PM")).toEqual("Oct 11, 2022 08:30 PM - 09:30 PM");
  expect(formatFlexibleTrainingDate("2022-10-11 10:30 PM - 11:30 PM")).toEqual("Oct 11, 2022 10:30 PM - 11:30 PM");
  expect(formatFlexibleTrainingDate("")).toEqual("");
  expect(formatFlexibleTrainingDate("2022-10-1 8:30 PM - 9:30 PM")).toEqual("");
  expect(formatFlexibleTrainingDate("2022-10-1 8:30 PM 9:30 PM")).toEqual("");
  expect(formatFlexibleTrainingDate("2022-10-1")).toEqual("");
  expect(formatFlexibleTrainingDate("8:30 PM 9:30 PM")).toEqual("");
  expect(formatFlexibleTrainingDate("8:30 PM - 9:30 PM")).toEqual("");
});

describe("formatMonthlyBasePayHelper", () => {

  it("should return correct format with no decimals", () => {
    expect(formatMonthlyBasePayHelper(55, 'USD')).toEqual('$55');
  });

  it("should return correct format with decimals", () => {
    expect(formatMonthlyBasePayHelper(40.10, 'USD')).toEqual('$40.10');
  });

  it("should return null", () => {
    expect(formatMonthlyBasePayHelper(null, 'USD')).toEqual(null);
    expect(formatMonthlyBasePayHelper(54)).toEqual(null);
    expect(formatMonthlyBasePayHelper()).toEqual(null);
  });
});

describe("parseQueryParamsArrayToSingleItem", () => {

  it("should parse query items to single param", () => {
    const queryParams = {
      "jobId": ["JOB-1234"],
      "requisitionId": "Req-000"
    };
    expect(parseQueryParamsArrayToSingleItem(queryParams)).toEqual({ jobId: 'JOB-1234', requisitionId: 'Req-000' });
  });
});

describe("showErrorMessage", () => {
  it("should call boundSetBannerMessage", () => {
    const spy = jest.spyOn(boundUi, 'boundSetBannerMessage');

    showErrorMessage({
      translationKey: "BB-websocket-error-message-internal-server-error",
      value: "Something went wrong with the websocket server. Please try again or refresh the browser.",
    });

    expect(spy).toHaveBeenCalled();
  });
});

describe("reverseMappingTranslate", () => {

  it("should return empty string with undefined or empty string passed", () => {
    expect(reverseMappingTranslate(undefined)).toEqual("");
    expect(reverseMappingTranslate("")).toEqual("");
  })

  it("should return empty string with invalid key", () => {
    expect(reverseMappingTranslate("test-key")).toEqual("");
  })

  it("should return correct value", () => {
    expect(reverseMappingTranslate("I choose not to self-identify", CountryCode.US)).toEqual("I choose not to self-identify");
    //TODO might need to update when translations come back
    expect(reverseMappingTranslate("She", CountryCode.MX)).toEqual("She");
  })
})

describe("checkAndBoundGetApplication", () => {
  it("should call boundGetApplication", () => {
    const spy = jest.spyOn(boundApplicationActions, "boundGetApplication");

    checkAndBoundGetApplication("TEST-ID-0001");

    expect(spy).toHaveBeenCalled();
  })
})

describe("isSelfIdentificationInfoValidBeforeDisability", () => {

  it("should return false", () => {
    expect(isSelfIdentificationInfoValidBeforeDisability()).toEqual(false)
  })

  it("should return true", () => {

    expect(isSelfIdentificationInfoValidBeforeDisability(TEST_SELF_IDENTIFICATION)).toEqual(true)
  })
})

describe("isSelfIdentificationInfoValid", () => {
  it("should return false", () => {
    expect(isSelfIdentificationInfoValid()).toEqual(false);
  })

  describe("US", () => {
    it("should return true: US", () => {
      expect(isSelfIdentificationInfoValid(TEST_SELF_IDENTIFICATION, CountryCode.US)).toEqual(true);
    })

    it("should return true: US - equal opportunity is not complete", () => {
      expect(isSelfIdentificationInfoValid({
        ...TEST_SELF_IDENTIFICATION,
        ethnicity: ""
      }, CountryCode.US)).toEqual(false);
    })

    it("should return true: US - disability is not complete", () => {
      expect(isSelfIdentificationInfoValid({
        ...TEST_SELF_IDENTIFICATION,
        disability: ""
      }, CountryCode.US)).toEqual(false);
    })

    it("should return true: US - veteran status  is not complete", () => {
      expect(isSelfIdentificationInfoValid({
        ...TEST_SELF_IDENTIFICATION,
        veteran: ""
      }, CountryCode.US)).toEqual(false);
    })
  })

  describe("MX", () => {
    it("should return true: MX", () => {
      expect(isSelfIdentificationInfoValid({
        ...TEST_SELF_IDENTIFICATION,
        pronoun: "Her"
      }, CountryCode.MX)).toEqual(true);
    })

    it("should return true: MX - equal opportunity is not complete", () => {
      expect(isSelfIdentificationInfoValid({
        ...TEST_SELF_IDENTIFICATION,
        ethnicity: ""
      }, CountryCode.MX)).toEqual(false);
    })

    it("should return true: MX - disability is not complete", () => {
      expect(isSelfIdentificationInfoValid({
        ...TEST_SELF_IDENTIFICATION,
        disability: ""
      }, CountryCode.MX)).toEqual(false);
    })
  })
})

describe("isAdditionalBgcInfoValid", () => {
  it("returns false", () => {
    expect(isAdditionalBgcInfoValid()).toEqual(false);
  })

  it("returns true", () => {
    expect(isAdditionalBgcInfoValid(TEST_BACKGROUND_INFO)).toEqual(true);
  })
});

describe("isAddressValid", () => {

  it("should return false", () => {
    expect(isAddressValid()).toEqual(false);
  })

  it("should return true", () => {
    expect(isAddressValid(TEST_CANDIDATE_ADDRESS)).toEqual(true);
  })
})

describe("isNewBBuiPath", () => {

  it("returns false", () => {
    expect(isNewBBuiPath("", newBBUIPathName.US)).toEqual(false);
  })

})

describe("isI18nSelectOption", () => {
  it("return true", () => {
    expect(isI18nSelectOption({ translationKey: 'testkey', value: 'test', showValue: true })).toBeTruthy();
  })
})

describe("setEpicApiCallErrorMessage", () => {
  it("should call boundSetBannerMessage", () => {
    const spy = jest.spyOn(boundUi, 'boundSetBannerMessage');

    setEpicApiCallErrorMessage({
      translationKey: "BB-get-application-error-message-internal-server-error",
      value: "Something went wrong with the server. Please try again or refresh the browser."
    });

    expect(spy).toHaveBeenCalled()

  })
})

test("getKeyMapFromDetailedRadioItemList", () => {
  expect(getKeyMapFromDetailedRadioItemList(MX_SelfIdPronounsItems)).toEqual({
    "He": "BB-SelfId-equal-opportunity-form-pronoun-mx-he-title-text",
    "She": "BB-SelfId-equal-opportunity-form-pronoun-mx-she-title-text",
    "They": "BB-SelfId-equal-opportunity-form-pronoun-mx-they-title-text",
    "Other": "BB-SelfId-equal-opportunity-form-pronoun-mx-other-title-text",
    "Prefer not to say": "BB-SelfId-equal-opportunity-form-pronoun-mx-prefer-not-to-say-title-text"
  });

  expect(getKeyMapFromDetailedRadioItemList(SelfIdGenderRadioItems)).toEqual({
    "Male": "BB-SelfId-equal-opportunity-form-gender-male-text",
    "Female": "BB-SelfId-equal-opportunity-form-gender-female-text",
    "I choose not to self-identify": "BB-SelfId-equal-opportunity-form-gender-choose-not-to-identify-text"
  });
})

describe("handleInitiateSelfIdentificationStep", () => {
  const spy = jest.spyOn(boundSelfIdentificationActions, "boundUpdateSelfIdStepConfig");

  beforeEach(() => {
    spy.mockReset();
  })

  const { EQUAL_OPPORTUNITY, DISABILITY_FORM, VETERAN_FORM } = SELF_IDENTIFICATION_STEPS

  describe("US", () => {
    it("should call boundUpdateSelfIdStepConfig: US and no step completed", () => {

      handleInitiateSelfIdentificationStep({
        ...TEST_SELF_IDENTIFICATION,
        militarySpouse: "",
        veteran: "",
        disability: "",
        protectedVeteran: "",
        gender: "",
        ethnicity: "",
      }, CountryCode.US);

      expect(spy).toHaveBeenCalledWith({
        completedSteps: [],
        [EQUAL_OPPORTUNITY]: {
          status: INFO_CARD_STEP_STATUS.ACTIVE,
          editMode: false
        },
        [VETERAN_FORM]: {
          status: INFO_CARD_STEP_STATUS.LOCKED,
          editMode: false
        },
        [DISABILITY_FORM]: {
          status: INFO_CARD_STEP_STATUS.LOCKED,
          editMode: false
        },
      });
    })

    it("should call boundUpdateSelfIdStepConfig: US and only equal opportunity complete", () => {

      handleInitiateSelfIdentificationStep({
        ...TEST_SELF_IDENTIFICATION,
        militarySpouse: "",
        veteran: "",
        disability: "",
        protectedVeteran: ""
      }, CountryCode.US);

      expect(spy).toHaveBeenCalledWith({
        completedSteps: [EQUAL_OPPORTUNITY],
        [EQUAL_OPPORTUNITY]: {
          status: INFO_CARD_STEP_STATUS.COMPLETED,
          editMode: false
        },
        [VETERAN_FORM]: {
          status: INFO_CARD_STEP_STATUS.ACTIVE,
          editMode: false
        },
        [DISABILITY_FORM]: {
          status: INFO_CARD_STEP_STATUS.LOCKED,
          editMode: false
        },
      });
    })

    it("should call boundUpdateSelfIdStepConfig: US and only equal opportunity and veteran complete", () => {

      handleInitiateSelfIdentificationStep({
        ...TEST_SELF_IDENTIFICATION,
        disability: ""
      }, CountryCode.US);

      expect(spy).toHaveBeenCalledWith({
        completedSteps: [EQUAL_OPPORTUNITY, VETERAN_FORM],
        [EQUAL_OPPORTUNITY]: {
          status: INFO_CARD_STEP_STATUS.COMPLETED,
          editMode: false
        },
        [VETERAN_FORM]: {
          status: INFO_CARD_STEP_STATUS.COMPLETED,
          editMode: false
        },
        [DISABILITY_FORM]: {
          status: INFO_CARD_STEP_STATUS.ACTIVE,
          editMode: false
        },
      });
    })

    it("should call boundUpdateSelfIdStepConfig: US and all step complete", () => {

      handleInitiateSelfIdentificationStep(TEST_SELF_IDENTIFICATION, CountryCode.US);

      expect(spy).toHaveBeenCalledWith({
        completedSteps: [EQUAL_OPPORTUNITY, VETERAN_FORM, DISABILITY_FORM],
        [EQUAL_OPPORTUNITY]: {
          status: INFO_CARD_STEP_STATUS.COMPLETED,
          editMode: false
        },
        [VETERAN_FORM]: {
          status: INFO_CARD_STEP_STATUS.COMPLETED,
          editMode: false
        },
        [DISABILITY_FORM]: {
          status: INFO_CARD_STEP_STATUS.COMPLETED,
          editMode: false
        },
      });
    })
  })

  describe("MX", () => {
    it("should call boundUpdateSelfIdStepConfig: MX and no step completed", () => {

      handleInitiateSelfIdentificationStep({
        ...TEST_SELF_IDENTIFICATION,
        disability: "",
        gender: "",
        ethnicity: "",
        pronoun: ""
      }, CountryCode.MX);

      expect(spy).toHaveBeenCalledWith({
        completedSteps: [],
        [EQUAL_OPPORTUNITY]: {
          status: INFO_CARD_STEP_STATUS.ACTIVE,
          editMode: false
        },
        [DISABILITY_FORM]: {
          status: INFO_CARD_STEP_STATUS.LOCKED,
          editMode: false
        },
      });
    })

    it("should call boundUpdateSelfIdStepConfig: MX and only equal opportunity complete", () => {

      handleInitiateSelfIdentificationStep({
        ...TEST_SELF_IDENTIFICATION,
        disability: "",
        pronoun: 'Her'
      }, CountryCode.MX);

      expect(spy).toHaveBeenCalledWith({
        completedSteps: [EQUAL_OPPORTUNITY],
        [EQUAL_OPPORTUNITY]: {
          status: INFO_CARD_STEP_STATUS.COMPLETED,
          editMode: false
        },
        [DISABILITY_FORM]: {
          status: INFO_CARD_STEP_STATUS.ACTIVE,
          editMode: true
        },
      });
    })

    it("should call boundUpdateSelfIdStepConfig: MX and all step complete", () => {

      handleInitiateSelfIdentificationStep({
        ...TEST_SELF_IDENTIFICATION,
        pronoun: 'Her'
      }, CountryCode.MX);

      expect(spy).toHaveBeenCalledWith({
        completedSteps: [EQUAL_OPPORTUNITY, DISABILITY_FORM],
        [EQUAL_OPPORTUNITY]: {
          status: INFO_CARD_STEP_STATUS.COMPLETED,
          editMode: false
        },
        [DISABILITY_FORM]: {
          status: INFO_CARD_STEP_STATUS.COMPLETED,
          editMode: false
        },
      });
    })
  })
})

describe("handleUpdateSelfIdStep", () => {
  it("shoudl call boundUpdateSelfIdStepConfig", () => {
    const spy = jest.spyOn(boundSelfIdentificationActions, "boundUpdateSelfIdStepConfig");
    handleUpdateSelfIdStep({ ...initSelfIdentificationState.stepConfig }, SELF_IDENTIFICATION_STEPS.DISABILITY_FORM, SELF_IDENTIFICATION_STEPS.EQUAL_OPPORTUNITY);
    expect(spy).toHaveBeenCalled();
  })
})

describe("handleSubmitSelfIdVeteranStatus", () => {
  it("should call boundUpdateApplicationDS", () => {
    const spy = jest.spyOn(boundApplicationActions, "boundUpdateApplicationDS");
    handleSubmitSelfIdVeteranStatus(TEST_APPLICATION_DATA, TEST_SELF_IDENTIFICATION, { ...initSelfIdentificationState.stepConfig });
    expect(spy).toHaveBeenCalled();
  })
})

describe("handleSubmitSelfIdDisabilityStatus", () => {
  it("should call boundUpdateApplicationDS", () => {
    const spy = jest.spyOn(boundApplicationActions, "boundUpdateApplicationDS");
    handleSubmitSelfIdDisabilityStatus(TEST_APPLICATION_DATA, TEST_SELF_IDENTIFICATION, { ...initSelfIdentificationState.stepConfig });
    expect(spy).toHaveBeenCalled();
  })
})

describe("handleSubmitSelfIdEqualOpportunity", () => {
  it("should call boundUpdateApplicationDS", () => {
    const spy = jest.spyOn(boundApplicationActions, "boundUpdateApplicationDS");
    handleSubmitSelfIdEqualOpportunity(TEST_APPLICATION_DATA, TEST_SELF_IDENTIFICATION, { ...initSelfIdentificationState.stepConfig });
    expect(spy).toHaveBeenCalled();
  })
})

describe("handleConfirmNHESelection", () => {

  it("should call postAdobeMetrics", () => {
    const spy = jest.spyOn(adobeActions, "postAdobeMetrics");

    handleConfirmNHESelection(TEST_APPLICATION_DATA, NHE_TIMESLOT);

    expect(spy).toHaveBeenCalled();
  })
})

describe("renderNheTimeSlotFullAddress", () => {
  it("should match", () => {
    expect(renderNheTimeSlotFullAddress(NHE_TIMESLOT)).toEqual("01:30 PM - 02:00 PM Onsite - Recruiting Office at Amazon Distribution Center, 3230 International Place, Dupont, WA 98327");
  })
})

describe("getMXCountryCodeByCountryName", () => {
  it("should return MX", () => {
    expect(getMXCountryCodeByCountryName("Mexico")).toEqual("MX")
  })

  it("should return empty string", () => {
    expect(getMXCountryCodeByCountryName("USA")).toEqual("")
  })
})

describe("onAssessmentStart", () => {
  it("should call", () => {
    const spy = jest.spyOn(adobeActions, "postAdobeMetrics");
    onAssessmentStart("https://hiring.amazon.com/#/", TEST_APPLICATION_DATA, TEST_JOB)
    expect(spy).toHaveBeenCalledWith({ name: METRIC_NAME.ASSESSMENT_START });
  })
})

describe("validateInput", () => {
  it("should return false", () => {
    expect(validateInput("", true, "")).toEqual(false);
  })

  it("should return true", () => {
    expect(validateInput("", false, "")).toEqual(true);
  })

  it("should return true", () => {
    expect(validateInput("45689", false, "^[0-9]*$")).toEqual(true);
  })

  it("should return false", () => {
    expect(validateInput("45A689", true, "^[0-9]*$")).toEqual(false);
  })
})

describe("isDOBOverEighteen", () => {
  it("should return false", () => {
    expect(isDOBOverEighteen("")).toEqual(false)
  })

  it("should return false", () => {
    expect(isDOBOverEighteen("2020-01-01")).toEqual(false)
  })

  it("should return true", () => {
    expect(isDOBOverEighteen("2004-01-01")).toEqual(true)
  })
})

test("isDOBLessThan100", () => {
  expect(isDOBLessThan100("05-10-1999")).toBeTruthy();
  expect(isDOBLessThan100("1999-05-10")).toBeTruthy();
  expect(isDOBLessThan100("15-10-1199")).toBeFalsy();
  expect(isDOBLessThan100("18-89-4586")).toBeFalsy();
  expect(isDOBLessThan100("")).toBeFalsy();
  expect(isDOBLessThan100("15-10-1922")).toBeFalsy();
})
describe("getQueryFromSearchAndHash", () => {
  beforeEach(() => {
    window.location.search = "";
    window.location.hash = "";
  });

  it("should return correct query string", () => {
    expect(getQueryFromSearchAndHash("?query1=q1", "#/page-name?hash1=h1"))
      .toEqual("hash1=h1&query1=q1");

    expect(getQueryFromSearchAndHash("?query1=q1&query2=q2", "#/page-name?hash1=h1&hash2=h2"))
      .toEqual("hash1=h1&hash2=h2&query1=q1&query2=q2");
  });

  it("should return correct query string for empty location.search", () => {
    expect(getQueryFromSearchAndHash("", "#/page-name?hash1=h1&hash2=h2"))
      .toEqual("hash1=h1&hash2=h2");
  });

  it("should return correct query string for empty location.hash", () => {
    expect(getQueryFromSearchAndHash("?query1=q1&query2=q2", ""))
      .toEqual("query1=q1&query2=q2");
  });

  it("should return correct query string for empty search and hash", () => {
    expect(getQueryFromSearchAndHash("", ""))
      .toEqual("");
  });
});


test("isSelfIdVeteranStepCompleted", () => {
  expect(isSelfIdVeteranStepCompleted({
    ...TEST_SELF_IDENTIFICATION
  }, CountryCode.US)).toBeTruthy();

  expect(isSelfIdVeteranStepCompleted({
    ...TEST_SELF_IDENTIFICATION,
    veteran: ""
  }, CountryCode.US)).toBeFalsy();
})

test("isSelfIdEqualOpportunityStepCompleted", () => {
  expect(isSelfIdEqualOpportunityStepCompleted({
    ...TEST_SELF_IDENTIFICATION
  }, CountryCode.US)).toBeTruthy();

  expect(isSelfIdEqualOpportunityStepCompleted({
    ...TEST_SELF_IDENTIFICATION,
    pronoun: "Her"
  }, CountryCode.MX)).toBeTruthy();

  expect(isSelfIdEqualOpportunityStepCompleted({
    ...TEST_SELF_IDENTIFICATION,
    gender: ""
  }, CountryCode.US)).toBeFalsy();

  expect(isSelfIdEqualOpportunityStepCompleted({
    ...TEST_SELF_IDENTIFICATION,
    gender: ""
  }, CountryCode.MX)).toBeFalsy();
});

test("GetSelfIdentificationConfigStep", () => {
  expect(GetSelfIdentificationConfigStep(CountryCode.US)).toEqual(US_SelfIdentificationConfigSteps);
  expect(GetSelfIdentificationConfigStep(CountryCode.MX)).toEqual(MX_SelfIdentificationConfigSteps);
})


test("isSelfIdEqualOpportunityStepCompleted", () => {
  expect(isSelfIdDisabilityStepCompleted({
    ...TEST_SELF_IDENTIFICATION
  }, CountryCode.US)).toBeTruthy();

  expect(isSelfIdDisabilityStepCompleted({
    ...TEST_SELF_IDENTIFICATION,
  }, CountryCode.MX)).toBeTruthy();

  expect(isSelfIdDisabilityStepCompleted({
    ...TEST_SELF_IDENTIFICATION,
    disability: ""
  }, CountryCode.US)).toBeFalsy();

  expect(isSelfIdDisabilityStepCompleted({
    ...TEST_SELF_IDENTIFICATION,
    disability: ""
  }, CountryCode.MX)).toBeFalsy();
})

describe("initSelfIdStepConfig", () => {
  describe("US", () => {
    test("init config without self step map", () => {
      expect(initSelfIdStepConfig({ completedSteps: [] }, CountryCode.US)).toEqual(US_SelfIdentificationConfigSteps);
    });

    test("init config with self Id step map", () => {
      expect(initSelfIdStepConfig(US_SelfIdentificationConfigSteps, CountryCode.US)).toEqual(US_SelfIdentificationConfigSteps);
    })
  });

  describe("MX", () => {
    test("init config without self step map", () => {
      expect(initSelfIdStepConfig({ completedSteps: [] }, CountryCode.MX)).toEqual(MX_SelfIdentificationConfigSteps);
    });

    test("init config with self Id step map", () => {
      expect(initSelfIdStepConfig(MX_SelfIdentificationConfigSteps, CountryCode.MX)).toEqual(MX_SelfIdentificationConfigSteps);
    })
  })
})

describe("checkIfLegacy", () => {
  it("should return true", () => {

    const url = "https://hiring.amazon.com/application/";

    Object.defineProperty(window, "location", {
      value: new URL(url)
    });

    expect(checkIfIsLegacy()).toBeTruthy();
  })

  it("should return false", () => {

    const url = "https://hiring.amazon.com/application/?candidateId=abcde&jobId=546987";

    Object.defineProperty(window, "location", {
      value: new URL(url)
    });

    expect(checkIfIsLegacy()).toBeFalsy();
  })
})

describe("renderScheduleFullAddress", () => {
  let schedule = { ...TEST_SCHEDULE };
  
  beforeEach(()=>{
    schedule = { ...TEST_SCHEDULE }
  })

  it("with State", () => {
    expect(renderScheduleFullAddress(schedule)).toEqual("38811 Cherry Street, Newark, CA 94560");
  })

  it("without State", () => {
    schedule.state = "";
    expect(renderScheduleFullAddress(schedule)).toEqual("38811 Cherry Street, Newark, 94560");
  })

  it("without City", () => {
    schedule.city = "";
    expect(renderScheduleFullAddress(schedule)).toEqual("38811 Cherry Street, CA 94560");
  })

  it("without Zipcode", () => {
    schedule.postalCode = "";
    expect(renderScheduleFullAddress(schedule)).toEqual("38811 Cherry Street, Newark, CA");
  })

  it("without Address", () => {
    schedule.address = "";
    expect(renderScheduleFullAddress(schedule)).toEqual("Newark, CA 94560");
  })
})

describe("populateTimeRangeHourData", () => {

  it("when isThisEndTime set to true", () => {
    expect(populateTimeRangeHourData("8", true)[0]).toEqual({ time: '09:00 AM', hours: 9 });
  })

  it("when isThisEndTime set to false", () => {
    expect(populateTimeRangeHourData("8", false)[0]).toEqual({ time: '12:00 AM', hours: 0 });
  })
})

describe("parseObjectToQueryString", () => {
  it("should return expected string", () => {

    const testObj = {
      firstName: "test first name",
      lastName: "test last name",
      address: {
        state: "WA",
        city: "Seattle"
      }
    }

    expect(parseObjectToQueryString(testObj)).toEqual("firstName=test%20first%20name&lastName=test%20last%20name&address=%7B%22state%22%3A%22WA%22%2C%22city%22%3A%22Seattle%22%7D")
  })

  it("should return empty string", () => {

    const emptyObj = {};
    
    expect(parseObjectToQueryString(emptyObj)).toEqual("")
  })
})