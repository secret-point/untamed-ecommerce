import { Button, ButtonVariant } from "@amzn/stencil-react-components/button";
import { IconPencil } from "@amzn/stencil-react-components/icons";
import { Col, Row } from "@amzn/stencil-react-components/layout";
import { Text } from "@amzn/stencil-react-components/text";
import queryString from "query-string";
import React, { useEffect } from "react";
import { connect } from "react-redux";
import { useLocation } from "react-router";
import { addMetricForPageLoad } from "../../../actions/AdobeActions/adobeActions";
import { boundUpdateApplicationDS } from "../../../actions/ApplicationActions/boundApplicationActions";
import { boundGetCandidateInfo } from "../../../actions/CandidateActions/boundCandidateActions";
import { boundGetJobDetail } from "../../../actions/JobActions/boundJobDetailActions";
import { boundGetScheduleDetail } from "../../../actions/ScheduleActions/boundScheduleActions";
import { onCompleteTaskHelper } from "../../../actions/WorkflowActions/workflowActions";
import { getPageNameFromPath, parseQueryParamsArrayToSingleItem } from "../../../helpers/utils";
import { ApplicationState } from "../../../reducers/application.reducer";
import { CandidateState } from "../../../reducers/candidate.reducer";
import { JobState } from "../../../reducers/job.reducer";
import { ScheduleState } from "../../../reducers/schedule.reducer";
import { UpdateApplicationRequestDS } from "../../../utils/apiTypes";
import { CommonColors } from "../../../utils/colors";
import { UPDATE_APPLICATION_API_TYPE, WORKFLOW_STEP_NAME } from "../../../utils/enums/common";
import { checkAndBoundGetApplication, createUpdateApplicationRequest, formatDate, getLocale, routeToAppPageWithPath } from "../../../utils/helper";
import { translate as t } from "../../../utils/translator";
import { Application } from "../../../utils/types/common";
import ScheduleDetails from "../../common/jobOpportunity/ScheduleDetails";

interface MapStateToProps {
  job: JobState;
  application: ApplicationState;
  schedule: ScheduleState;
  candidate: CandidateState;
}

const ReviewSubmit = (props: MapStateToProps) => {
  const { job, application, schedule, candidate } = props;
  const { search, pathname } = useLocation();
  const pageName = getPageNameFromPath(pathname);
  const queryParams = parseQueryParamsArrayToSingleItem(queryString.parse(search));
  const { applicationId, jobId, scheduleId } = queryParams;

  const jobDetail = job.results;
  const { candidateData } = candidate.results;
  const { scheduleDetail } = schedule.results;

  const applicationData = application.results;
  const nheAppointment = applicationData?.nheAppointment;
  const location = applicationData?.nheAppointment?.location;

  useEffect(() => {
    boundGetCandidateInfo();
  }, []);

  useEffect(() => {
    scheduleId && boundGetScheduleDetail({
      locale: getLocale(),
      scheduleId: scheduleId
    })
  }, [scheduleId]);

  useEffect(() => {
    jobId && jobId !== jobDetail?.jobId && boundGetJobDetail({ jobId: jobId, locale: getLocale() })
  }, [jobDetail, jobId]);

  useEffect(() => {
    checkAndBoundGetApplication(applicationId);
  }, [applicationId]);

  useEffect(() => {
    jobDetail && applicationData && addMetricForPageLoad(pageName);
  }, [jobDetail, applicationData, pageName]);

  const handleBackToEdit = (stepName: WORKFLOW_STEP_NAME) => {
    const isBackButton = true;
    if (applicationData) {
      onCompleteTaskHelper(applicationData, isBackButton, stepName);
      routeToAppPageWithPath(stepName);
    }
  };

  const handleSubmitApplication = () => {
    if (applicationData) {
      const { REVIEW_SUBMIT } = UPDATE_APPLICATION_API_TYPE;
      const payload = {
        jobId,
        scheduleId,
        scheduleDetails: JSON.stringify(scheduleDetail)
      }
      const request: UpdateApplicationRequestDS = createUpdateApplicationRequest(applicationData, REVIEW_SUBMIT, payload);
      boundUpdateApplicationDS(request, (applicationData: Application) => {
        onCompleteTaskHelper(applicationData);
      });
    }
  }

  return (
    <Col gridGap="S300" padding={{ top: "S300" }}>
      <Row gridGap="S300" padding="S500" style={{ background: `${CommonColors.Blue05}` }}>
        <Text fontSize="T300">
          {jobDetail?.jobTitle || ""}
        </Text>
      </Row>

      <Text fontSize="T400">
        {t("BB-ReviewSubmit-header-title-text", "Review and Submit")}
      </Text>

      <div>
        <Col gridGap="S300">
          <Text fontSize="T300">
            {t("BB-ReviewSubmit-job-details-section-title-text", "Job Details")}
          </Text>
          {scheduleDetail && <ScheduleDetails scheduleDetail={scheduleDetail} />}
        </Col>
      </div>

      <div>
        <Row alignItems="center" justifyContent="space-between">
          <Text fontSize="T300">
            {t("BB-ReviewSubmit-job-details-section-background-check-text", "Background check")}
          </Text>

          <Button icon={<IconPencil />} variant={ButtonVariant.Tertiary} onClick={() => handleBackToEdit(WORKFLOW_STEP_NAME.BGC)}>Edit</Button>
        </Row>

        <Col gridGap="S300">
          <Text fontSize="T100" fontWeight="bold">
            {t("BB-ReviewSubmit-job-details-section-authorized-text", "Authorized")}
          </Text>

          {applicationData?.nonFcraQuestions?.requestedCopyOfBackgroundCheck && <Text fontSize="T100">
            {t("BB-ReviewSubmit-job-details-section-send-free-copy-of-background-check-text", "Send free copy of background check")}
          </Text>}

          <Text fontSize="T100">
            {t("BB-ReviewSubmit-job-details-section-national-id-type-text", "National ID Type:")} {candidateData?.additionalBackgroundInfo.governmentIdType}
          </Text>

          <Text fontSize="T100">
            {t("BB-ReviewSubmit-job-details-section-national-id-number-text", "National ID Number:")} {candidateData?.additionalBackgroundInfo.idNumber}
          </Text>

          <Text fontSize="T100">
            {t("BB-ReviewSubmit-job-details-section-date-of-birth-text", "Date of birth:")} {formatDate(candidateData?.additionalBackgroundInfo.dateOfBirth, { displayFormat: "Do MMM YYYY" })}
          </Text>
        </Col>
      </div>

      <div>
        <Row alignItems="center" justifyContent="space-between">
          <Text fontSize="T300">
            {t("BB-ReviewSubmit-pre-hire-appointment-section-title-text", "Pre-Hire Appointment")}
          </Text>

          <Button icon={<IconPencil />} variant={ButtonVariant.Tertiary} onClick={() => handleBackToEdit(WORKFLOW_STEP_NAME.NHE)}>Edit</Button>
        </Row>
        <Col gridGap="S300">
          <Text>
            {formatDate(nheAppointment?.dateWithoutFormat, {
              defaultDateFormat: "DD/MM/yyyy",
              displayFormat: "dddd, MMM Do YYYY"
            })}
          </Text>

          <Text fontSize="T100">
            {location && `${location.streetAddress} ${location.city} ${location.state} ${location.postalCode}`}
          </Text>

          <Text fontSize="T100">
            {t("BB-ReviewSubmit-pre-hire-appointment-section-hours-text", "Hours:")} {nheAppointment?.startTime} - {nheAppointment?.endTime}
          </Text>

          <Text fontSize="T100">
            {t("BB-ReviewSubmit-pre-hire-appointment-section-look-forward-text", "We look forward to seeing you at the time above.")}
          </Text>
        </Col>
      </div>

      <div>
        <Row alignItems="center" justifyContent="space-between">
          <Text fontSize="T300">
            {t("BB-ReviewSubmit-selfId-section-title-text", "Voluntary Self-identification")}
          </Text>

          <Button icon={<IconPencil />} variant={ButtonVariant.Tertiary} onClick={() => handleBackToEdit(WORKFLOW_STEP_NAME.SELF_IDENTIFICATION)}>Edit</Button>
        </Row>
        <Col gridGap="S300">
          <Text fontSize="T100">
            {t("BB-ReviewSubmit-selfId-section-equal-opportunity-text", "Equal Opportunity:")} {candidateData?.selfIdentificationInfo.gender}
            {candidateData?.selfIdentificationInfo.ethnicity ? `, ${candidateData?.selfIdentificationInfo.ethnicity}` : ""}
          </Text>

          <Text fontSize="T100">
            {t("BB-ReviewSubmit-selfId-section-veteral-status-text", "Veteral Status:")} {candidateData?.selfIdentificationInfo.veteran}
          </Text>

          <Text fontSize="T100">
            {t("BB-ReviewSubmit-selfId-section-disability-status-text", "Disability Status:")} {candidateData?.selfIdentificationInfo.disability}
          </Text>
        </Col>
      </div>

      <Col gridGap="S300" padding="S500" style={{ background: `${CommonColors.Blue05}` }}>
        <Button variant={ButtonVariant.Primary} onClick={handleSubmitApplication}>
          {t("BB-ReviewSubmit-submit-application-button-text", "Submit application")}
        </Button>
      </Col>
    </Col >
  )
}

const mapStateToProps = (state: MapStateToProps) => {
  return state;
};

export default connect(mapStateToProps)(ReviewSubmit);
