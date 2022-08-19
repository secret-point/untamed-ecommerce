import { getDataForEventMetrics, getDataForMetrics } from "../../helpers/adobe-helper";
import { AdobeMetrics, Metric, MetricData } from "../../@types/adobe-metrics";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import { EVENT_NAMES } from "../../constants/adobe-analytics";
import findIndex from "lodash/findIndex";
import { getCheckBoxListLabels, getMetricValues } from "../../helpers/utils";
import { CheckBoxItem } from "../../@types";
import { ApplicationData } from "../../@types/IPayload";
import store from "../../store/store";
import { log } from "../../helpers/log-helper";

export const JOB_OPPORTUNITIES = "job-opportunities";
export const CONSENT = "consent";
export const Unspecified = "Unspecified";

const getCmpId = () => {
  const cmpIdKeys = ["CMPID", "cmpid", "cmpID", "cmpId"];
  let cmpIdValue;
  for(let key of cmpIdKeys) {
    const cmpId = window.sessionStorage.getItem(key);
    if(!isNil(cmpId)) {
      cmpIdValue = cmpId;
      break;
    }
  }
  return cmpIdValue;
};

const getItemFromSessionStorageByKey = ( key: string ) => {
  return window.sessionStorage.getItem(key);
}

export const sendDataLayerAdobeAnalytics = ( metric: any ) => {
  const cmpId = getCmpId();
  const ikey = getItemFromSessionStorageByKey('ikey');
  const akey = getItemFromSessionStorageByKey('akey');
  const pandocampaignid = getItemFromSessionStorageByKey('pandocampaignid');
  const pandocandidateid = getItemFromSessionStorageByKey('pandocandidateid');
  const tid = getItemFromSessionStorageByKey('tid');

  metric = {
    ...metric,
    campaign: {
      ...(!!cmpId && { cmpid: cmpId }),
      ...(!!ikey && { ikey }),
      ...(!!akey && { akey }),
      ...(!!pandocampaignid && { pandocampaignid }),
      ...(!!pandocandidateid && { pandocandidateid }),
      ...(!!tid && { tid })
    }
  }
  window.dataLayerArray = window.dataLayerArray || [];
  window.dataLayerArray.push(metric);
};

export const addMetricForPageLoad = ( pageName: string ) => {
  let dataLayer: any = {};
  window.isPageMetricsUpdated = window.isPageMetricsUpdated || {};
  try {
    const { job, requisition } = store.getState();
    const isPageMetricsUpdated = window.isPageMetricsUpdated || {};
    if((!isEmpty(requisition) || !isEmpty(job)) && !isPageMetricsUpdated[pageName]) {
      dataLayer = getDataForMetrics(pageName);
      if(!isEmpty(dataLayer)) {
        sendDataLayerAdobeAnalytics(dataLayer);
        isPageMetricsUpdated[pageName] = true;
        window.isPageMetricsUpdated = isPageMetricsUpdated;
        log(`[Evnet 'Page Load' - '${pageName}'] adding new metrics`, dataLayer);
        log(`[Evnet 'Page Load' - '${pageName}'] new metrics`, window.dataLayerArray);
      }
    }
  }
  catch(ex) {
    console.log(ex);
    console.log("unable to update metrics");
  }
};

export const postAdobeMetrics = ( adobeMetrics: AdobeMetrics, data: { [key: string]: object } | MetricData = {}, appData?: ApplicationData ) => {
  const { name, values = {}, metricsValues = {} } = adobeMetrics;
  let metric: Metric = getDataForEventMetrics(name);

  switch(name) {
    case EVENT_NAMES.SUBMIT_NHE_PREFERENCES: {
      const metricData: { [key: string]: string[] } = { possibleNHEDates: [], possibleNHETimeSlots: [] };
      metricData.possibleNHEDates = getCheckBoxListLabels(data.possibleNHEDates as CheckBoxItem[]);
      metricData.possibleNHETimeSlots = getCheckBoxListLabels(data.possibleNHETimeSlots as CheckBoxItem[]);
      const submitNhePrefMetrics = getMetricValues(metricsValues, metric, metricData);
      metric = { ...metric, ...submitNhePrefMetrics };
      break;
    }

    case EVENT_NAMES.SELECT_NHE: {
      // add old method getMetricValues as a fallback for now, this can be revisited and removed later.
      const selectNheMetricValue = {...getMetricValues(metricsValues, metric, data as MetricData), ...values};
      const { nhe } = store.getState();
      if(nhe) {
        const { nheData } = nhe.results;
        selectNheMetricValue["NHE"]["count"] = nheData.length;
        const appId = selectNheMetricValue["NHE"]["apptID"] as string;
        const selectedIndex = findIndex(nheData, { timeSlotId: appId });
        selectNheMetricValue["NHE"]["position"] = selectedIndex + 1;
      }
      metric = { ...metric, ...selectNheMetricValue };
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

  log(`[Evnet '${name}'] adding new metrics`, metric);
  log(`[Evnet '${name}'] new metrics`, window.dataLayerArray);
};
