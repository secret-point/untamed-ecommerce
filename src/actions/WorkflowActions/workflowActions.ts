import { Application, EnvConfig, Schedule, WorkflowData } from "../../utils/types/common";
import StepFunctionService from "../../services/step-function-service";
import moment from "moment";
import { MAX_MINUTES_FOR_HEARTBEAT } from "../../constants";
import { getDataForEventMetrics } from "../../helpers/adobe-helper";
import { sendDataLayerAdobeAnalytics } from "../AdobeActions/adobeActions";
import { log, logError } from "../../helpers/log-helper";
import _get from "lodash/get";
import { checkIfIsCSRequest, pathByDomain } from "../../helpers/utils";
import { boundWorkflowRequestEnd, boundWorkflowRequestStart } from "../UiActions/boundUi";
import store from "../../store/store";
import { boundUpdateWorkflowName } from "../ApplicationActions/boundApplicationActions";
import { routeToAppPageWithPath } from "../../utils/helper";

export const loadWorkflow = (
  requisitionId: string,
  applicationId: string,
  candidateId: string,
  envConfig: EnvConfig,
  isCompleteTaskOnLoad?: boolean,
  applicationData?: Application
) => {
  if (!window?.stepFunctionService?.websocket) {
    if (isCompleteTaskOnLoad) {
      window.isCompleteTaskOnLoad = isCompleteTaskOnLoad;
      window.applicationData = applicationData;
    }
    log("Initiated to connect websocket");
    window.stepFunctionService = StepFunctionService.load(
      requisitionId,
      applicationId,
      candidateId,
      envConfig
    );
  }
};

export const loadWorkflowDS = (
  jobId: string,
  scheduleId: string,
  applicationId: string,
  candidateId: string,
  envConfig: EnvConfig,
  isCompleteTaskOnLoad?: boolean,
  applicationData?: Application
) => {
  if (!window?.stepFunctionService?.websocket) {
    if (isCompleteTaskOnLoad) {
      window.isCompleteTaskOnLoad = isCompleteTaskOnLoad;
      window.applicationData = applicationData;
    }
    log("Initiated to connect websocket", [
      jobId,
      scheduleId,
      applicationId,
      candidateId,
      envConfig
    ]);
    window.stepFunctionService = StepFunctionService.loadDS(
      jobId,
      scheduleId,
      applicationId,
      candidateId,
      envConfig
    );
  }
};

export const startOrResumeWorkflow = () => {
  log("Started workflow");
  window.stepFunctionService.websocket?.send(
    JSON.stringify({
      action: "startWorkflow",
      applicationId: window.stepFunctionService.applicationId,
      candidateId: window.stepFunctionService.candidateId,
      requisitionId: window.stepFunctionService.requisitionId,
      isCsDomain: checkIfIsCSRequest()
    })
  );
};

export const startOrResumeWorkflowDS = () => {
  log("Started DS workflow");
  boundWorkflowRequestStart();
  window.stepFunctionService.websocket?.send(
    JSON.stringify({
      action: "startWorkflow",
      applicationId: window.stepFunctionService.applicationId,
      candidateId: window.stepFunctionService.candidateId,
      jobId: window.stepFunctionService.jobId,
      scheduleId: window.stepFunctionService.scheduleId,
      isCsDomain: checkIfIsCSRequest()
    })
  );
  if(window.hasCompleteTask){
    window.hasCompleteTask();
    window.hasCompleteTask = undefined;
  }
};

export const sendHeartBeatWorkflow = () => {
  const websocket = window.stepFunctionService.websocket;
  if (window.hearBeatTime) {
    log("Sending the heart beat event");
    const endTime = moment();
    const startTime = moment(window.hearBeatTime);
    const duration = moment.duration(endTime.diff(startTime));
    if (
      duration.asMinutes() < MAX_MINUTES_FOR_HEARTBEAT &&
      websocket?.OPEN === websocket?.readyState
    ) {
      window.stepFunctionService.websocket?.send(
        JSON.stringify({
          action: "heartbeat"
        })
      );
    } else {
      log("Websocket timed out, moved to timed out page");
      window.location.assign(`${pathByDomain()}/#/timeout`);
    }
  } else {
    window.hearBeatTime = moment().toISOString();
    if (websocket?.OPEN === websocket?.readyState) {
      log("Sending the heart beat event");
      window.stepFunctionService.websocket?.send(
        JSON.stringify({
          action: "heartbeat"
        })
      );
    } else {
      log("Websocket timed out, moved to timed out page");
      window.location.assign(`${pathByDomain()}/#/timeout`);
    }
  }
};

export const goToStep = async (workflowData: WorkflowData) => {
  const state = store.getState();
  const applicationData = state.application.results;
  const currentPath = window.location.hash.split('?')[0].replace('#/', '').split('/')[0];
  const { stepName } = workflowData;
  log("Received data from step function", {
    workflowData,
    currentStepName: currentPath,
    goToStepName: stepName
  });
  if (stepName && stepName !== currentPath && applicationData) {
    boundWorkflowRequestStart();
    log(
      `current step name (${currentPath}) and go to step name (${stepName}) is not matched`
    );
    log("updating workflow step name in application", {
      applicationId: applicationData.applicationId,
      stepName
    });
    boundUpdateWorkflowName(
      {applicationId: applicationData.applicationId, workflowStepName:stepName},
      ()=>{
        boundWorkflowRequestEnd();
        routeToAppPageWithPath(stepName);
        log(`update workflow step in local storage as ${stepName}`);
      },
      (ex: any)=>{
        logError("Unable to update workflow step in application", ex);
        boundWorkflowRequestEnd();
      }
    )

    if (
      workflowData.stepName === "supplementary-success" ||
      workflowData.stepName === "thank-you"
    ) {
      const metric = window.MetricsPublisher.newChildActionPublisherForMethod(
        "ApplicationCompleteTime"
      );

      const metricName =
        workflowData.stepName === "supplementary-success"
          ? "Completed"
          : "PreHireStepsCompleted";
      metric.publishTimerMonitor(
        metricName,
        Date.now() - window.applicationStartTime
      );
    }
  } else {
    log(`Received same as current step name ${currentPath}`);
    boundWorkflowRequestEnd();
  }
};

export const completeTask = (
  application?: Application,
  step?: string,
  isBackButton?: boolean,
  goToStep?: string,
  jobId?: string,
  schedule?: Schedule
) => {
  if (window.stepFunctionService?.websocket) {
    boundWorkflowRequestStart();
    const jobSelectedOn = application?.jobSelected?.jobSelectedOn || application?.jobScheduleSelected?.jobScheduleSelectedTime;
    const state = schedule?.state || "";
    const employmentType = schedule?.employmentType || "Regular";
    const data: any = {
      action: "completeTask",
      applicationId: window.stepFunctionService.applicationId,
      candidateId: window.stepFunctionService.candidateId,
      requisitionId: window.stepFunctionService.requisitionId || "", // requisitionId can't be null
      jobId: jobId || "",
      state:'TB',
      employmentType,
      eventSource: "HVH-CA-UI",
      jobSelectedOn,
      currentWorkflowStep: step,
      isCsDomain: checkIfIsCSRequest(true)
    };

    if (isBackButton) {
      data.workflowStepName = goToStep;
    } else {
      data.workflowStepName = "";
    }
    window.stepFunctionService.websocket?.send(JSON.stringify(data));
    log(`${step} completed`, {
      ...data
    });
  }
};

export const onTimeOut = () => {
  if (window.hearBeatTime) {
    const endTime = moment();
    const startTime = moment(window.hearBeatTime);
    const duration = moment.duration(endTime.diff(startTime));
    if (duration.asMinutes() > MAX_MINUTES_FOR_HEARTBEAT) {
      boundWorkflowRequestEnd();
      const adobeDataLayer = getDataForEventMetrics("session-timeout");
      sendDataLayerAdobeAnalytics(adobeDataLayer);
      window.location.assign(`${pathByDomain()}/#/timeout`);
    }
  } else {
    boundWorkflowRequestEnd();
    const adobeDataLayer = getDataForEventMetrics("session-timeout");
    sendDataLayerAdobeAnalytics(adobeDataLayer);
    window.location.assign(`${pathByDomain()}/#/timeout`);
  }
};
