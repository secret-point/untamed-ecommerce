import { getDataForEventMetrics } from "./../helpers/adobe-helper";
import { AdobeMetrics, Metric, MetricData } from "./../@types/adobe-metrics";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import { getDataForMetrics } from "../helpers/adobe-helper";
import { EVENT_NAMES } from "../constants/adobe-analytics";
import findIndex from "lodash/findIndex";
import { getCheckBoxListLabels, getMetricValues } from "../helpers/utils";
import { CheckBoxItem } from "../@types";
import { ApplicationData } from "../@types/IPayload";

export const JOB_OPPORTUNITIES = "job-opportunities";
export const CONSENT = "consent";

const getCmpId = () => {
  const cmpIdKeys = ["CMPID", "cmpid", "cmpID", "cmpId"];
  let cmpIdValue;
  for (let key of cmpIdKeys) {
    const cmpId = window.sessionStorage.getItem(key);
    if (!isNil(cmpId)) {
      cmpIdValue = cmpId;
      break;
    }
  }
  return cmpIdValue;
};

export const sendDataLayerAdobeAnalytics = (metric: any) => {
  const cmpId = getCmpId();
  if (!isNil(cmpId)) {
    metric = {
      ...metric,
      campaign: {
        cmpid: cmpId
      }
    };
  }
  window.dataLayerArray = window.dataLayerArray || [];
  window.dataLayerArray.push(metric);
};

export const addMetricForPageLoad = () => {
  let dataLayer: any = {};
  try {
    const { app } = window.reduxStore.getState();
    if ((!isEmpty(app.data.requisition) || !isEmpty(app.data.job)) && !window.isPageMetricsUpdated) {
      dataLayer = getDataForMetrics();
      window.isPageMetricsUpdated = true;
      if (!isEmpty(dataLayer)) {
        sendDataLayerAdobeAnalytics(dataLayer);
      }
    }
  } catch (ex) {
    console.log(ex);
    console.log("unable to update metrics");
  }
};

export const postAdobeMetrics = (
  adobeMetrics: AdobeMetrics,
  data: { [key: string]: object } | MetricData,
  appData?: ApplicationData
) => {
  const { name, metricsValues } = adobeMetrics;
  let metric: Metric = getDataForEventMetrics(name);
  switch (name) {
    case EVENT_NAMES.SUBMIT_NHE_PREFERENCES: {
      const metricData: { [key: string]: string[] } = {
        possibleNHEDates: [],
        possibleNHETimeSlots: []
      };
      metricData.possibleNHEDates = getCheckBoxListLabels(
        data.possibleNHEDates as CheckBoxItem[]
      );
      metricData.possibleNHETimeSlots = getCheckBoxListLabels(
        data.possibleNHETimeSlots as CheckBoxItem[]
      );
      const submitNhePrefMetrics = getMetricValues(
        metricsValues,
        metric,
        metricData
      );
      metric = {
        ...metric,
        ...submitNhePrefMetrics
      };
      break;
    }
    case EVENT_NAMES.SELECT_NHE: {
      const selectNheMetricValue = getMetricValues(
        metricsValues,
        metric,
        data as MetricData
      );
      if (appData) {
        const { nheTimeSlots } = appData.requisition;
        selectNheMetricValue["NHE"]["count"] = nheTimeSlots.length;
        const appId = selectNheMetricValue["NHE"]["apptID"] as string;
        const selectedIndex = findIndex(nheTimeSlots, {
          timeSlotId: appId
        });
        selectNheMetricValue["NHE"]["position"] = selectedIndex + 1;
      }
      metric = {
        ...metric,
        ...selectNheMetricValue
      };
      break;
    }
    case EVENT_NAMES.SUBMIT_SHIFT_PREFERENCES: {
      getMetricValues(metricsValues, metric, data as MetricData);
    }
    default: {
      metric = getDataForEventMetrics(name);
      break;
    }
  }

  sendDataLayerAdobeAnalytics(metric);
};
