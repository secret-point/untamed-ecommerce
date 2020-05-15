import { goTo, setLoading } from "./actions";
import { onUpdateError } from "./error-actions";
import CandidateApplicationService from "../services/candidate-application-service";
import IPayload from "../@types/IPayload";
import { push } from "react-router-redux";
import isEmpty from "lodash/isEmpty";
import { onGetRequisitionHeaderInfo } from "./requisition-actions";
import {
  UpdateNonFcraRequest,
  UpdateAdditionalBackgroundInfoRequest,
  UpdateContingentOffer
} from "../@types/candidate-application-service-requests";

export const START_APPLICATION = "START_APPLICATION";
export const GET_APPLICATION = "GET_APPLICATION";
export const SET_APPLICATION_DATA = "SET_APPLICATION_DATA";
export const UPDATE_APPLICATION = "UPDATE_APPLICATION";
export const UPDATE_NON_FCRA_QUESTIONS = "UPDATE_NON_FCRA_QUESTIONS";
export const ON_GET_CANDIDATE = "ON_GET_CANDIDATE";
export const UPDATE_ADDITIONAL_BG_INFO = "UPDATE_ADDITIONAL_BG_INFO";
export const UPDATE_CONTINGENT_OFFER = "UPDATE_CONTINGENT_OFFER";

const candidateApplicationService = new CandidateApplicationService();

export const onStartApplication = (data: IPayload) => (dispatch: Function) => {
  const { appConfig, nextPage, urlParams } = data;
  const origin = window.location.origin;
  const redirectUrl = `${origin}#/${nextPage.id}/${urlParams.requisitionId}`;
  let url = `${appConfig.authenticationURL}/?redirectUrl=${encodeURIComponent(
    redirectUrl
  )}`;
  window.location.assign(url);
};

export const onGetApplication = (payload: IPayload) => async (
  dispatch: Function
) => {
  try {
    setLoading(true)(dispatch);
    const applicationId = payload.urlParams?.applicationId;
    onGetRequisitionHeaderInfo(payload)(dispatch);
    onGetCandidate(payload)(dispatch);
    if (applicationId && isEmpty(payload.data.application)) {
      const applicationResponse = await candidateApplicationService.getApplication(
        applicationId
      );

      dispatch({
        type: GET_APPLICATION,
        payload: {
          application: applicationResponse,
          currentState: applicationResponse.currentState
        }
      });
    }
    setLoading(false)(dispatch);
  } catch (ex) {
    setLoading(false)(dispatch);
    onUpdateError(
      ex?.response?.data?.errorMessage || "unable to get application"
    )(dispatch);
  }
};

export const onGetCandidate = (payload: IPayload) => async (
  dispatch: Function
) => {
  if (isEmpty(payload.data.candidate)) {
    const response = await candidateApplicationService.getCandidate();
    dispatch({
      type: ON_GET_CANDIDATE,
      payload: response
    });
  }
};

export const onLaunchFCRA = (payload: IPayload) => (dispatch: Function) => {
  const { urlParams } = payload;
  const url = `/app/fcra/${urlParams.requisitionId}/${urlParams.applicationId}`;
  dispatch(push(url));
};

export const continueWithFCRADecline = (payload: IPayload) => (
  dispatch: Function
) => {
  dispatch({
    type: "UPDATE_VALUE_CHANGE",
    payload: {
      keyName: "fcraQuestions.showWithDrawnModal",
      value: true,
      pageId: payload.currentPage.id
    }
  });
};

export const updatePreHireStepsStatus = (payload: IPayload) => (
  dispatch: Function
) => {
  console.log(payload);
};

export const createApplication = (payload: IPayload) => async (
  dispatch: Function
) => {
  if (isEmpty(payload.data.application)) {
    try {
      setLoading(true)(dispatch);
      const candidateResponse = await candidateApplicationService.getCandidate();
      const response = await candidateApplicationService.createApplication({
        candidateId: candidateResponse.candidateId,
        parentRequisitionId: payload.urlParams.requisitionId,
        language: "English"
      });

      dispatch({
        type: UPDATE_APPLICATION,
        payload: {
          application: response
        }
      });

      setLoading(false)(dispatch);
      const { nextPage, urlParams } = payload;
      goTo(
        `/${nextPage.id}/${urlParams?.requisitionId}/${response?.applicationId}`
      )(dispatch);
    } catch (ex) {
      setLoading(false)(dispatch);
      onUpdateError(
        ex?.response?.data?.errorMessage || "Unable to get application"
      )(dispatch);
    }
  }
};

export const updateApplication = (payload: IPayload) => async (
  dispatch: Function
) => {
  setLoading(true)(dispatch);
  const {
    data,
    currentPage,
    options,
    urlParams,
    isContentContainsSteps,
    activeStepIndex,
    stepId
  } = payload;
  let updateData = data.output[currentPage.id];
  let type = currentPage.id;
  if (isContentContainsSteps && activeStepIndex) {
    updateData = data.output[currentPage.id][activeStepIndex];
    type = stepId;
  }
  const applicationId = data.application.applicationId;
  if (!isEmpty(updateData) || options?.ignoreAPIPayload) {
    try {
      const response = await candidateApplicationService.updateApplication({
        type: type,
        applicationId,
        payload: updateData
      });
      dispatch({
        type: UPDATE_APPLICATION,
        payload: {
          application: response
        }
      });
      setLoading(false)(dispatch);
    } catch (ex) {
      setLoading(false)(dispatch);
      onUpdateError(
        ex?.response?.data?.errorMessage || "Unable to update application"
      )(dispatch);
    }
  }

  if (options?.goTo) {
    goTo(options?.goTo, urlParams)(dispatch);
  }
};

export const updateNonFcraQuestions = (payload: IPayload) => async (
  dispatch: Function
) => {
  const applicationId = payload.urlParams?.applicationId;
  const candidateApplicationService = new CandidateApplicationService();
  const { data, currentPage } = payload;
  const updateData = data.output[currentPage.id] as UpdateNonFcraRequest;
  const response = await candidateApplicationService.updateNonFcraQuestions(
    applicationId,
    updateData
  );
  dispatch({
    type: UPDATE_NON_FCRA_QUESTIONS,
    payload: {
      application: response
    }
  });
};
export const updateAdditionalBackgroundInfo = (payload: IPayload) => async (
  dispatch: Function
) => {
  const candidateApplicationService = new CandidateApplicationService();
  const { data, currentPage } = payload;
  const updateData = data.output[
    currentPage.id
  ] as UpdateAdditionalBackgroundInfoRequest;
  await candidateApplicationService.updateAdditionalBackgroundInfo(updateData);
  dispatch({
    type: UPDATE_ADDITIONAL_BG_INFO,
    payload: {
      //application: response
    }
  });
};

export const updateContingentOffer = (payload: IPayload) => async (
  dispatch: Function
) => {
  const applicationId = payload.urlParams?.applicationId;
  const candidateApplicationService = new CandidateApplicationService();
  const { data, currentPage } = payload;
  const updateData = data.output[currentPage.id] as UpdateContingentOffer;
  updateData.offerAccepted = true;
  updateData.offerAcceptedTime = new Date().toISOString();
  try {
    const response = await candidateApplicationService.updateContingentOffer(
      applicationId
    );
    dispatch({
      type: UPDATE_CONTINGENT_OFFER,
      payload: {
        application: response
      }
    });

    const { urlParams } = payload;
    dispatch(
      push(`/app/bgc/${urlParams?.requisitionId}/${response?.applicationId}`)
    );
  } catch (error) {
    onUpdateError(error.response.data)(dispatch);
  }
};
