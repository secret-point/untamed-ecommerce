import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Col, Row } from "@amzn/stencil-react-components/layout";
import StepHeader from "../../common/StepHeader";
import { Image } from "@amzn/hvh-candidate-application-ui-components";
import { IconArrowLeft, IconHourGlass, IconSize, IconSort } from '@amzn/stencil-react-components/icons';
import { Text } from "@amzn/stencil-react-components/text";
import { getPageNameFromPath, parseQueryParamsArrayToSingleItem } from "../../../helpers/utils";
import { useLocation } from "react-router";
import queryString from "query-string";
import { Locale } from "../../../utils/types/common";
import { boundGetApplication } from "../../../actions/ApplicationActions/boundApplicationActions";
import { addMetricForPageLoad } from "../../../actions/AdobeActions/adobe-actions";
import { JobState } from "../../../reducers/job.reducer";
import { ApplicationState } from "../../../reducers/application.reducer";
import { boundGetJobDetail } from "../../../actions/JobActions/boundJobDetailActions";
import ScheduleCard from "../../common/jobOpportunity/ScheduleCard";
import { translate as t } from "../../../utils/translator";
import { GetScheduleListByJobIdRequest } from "../../../utils/apiTypes";
import { boundGetScheduleListByJobId } from "../../../actions/ScheduleActions/boundScheduleActions";
import { getLocale, handleApplyScheduleFilters, handleResetScheduleFilters } from "../../../utils/helper";
import { ScheduleState } from "../../../reducers/schedule.reducer";
import { ApplicationStepList } from "../../../utils/constants/common";
import {
    FlyoutContent,
    FlyoutPosition,
    RenderFlyoutFunctionParams,
    WithFlyout
} from "@amzn/stencil-react-components/flyout";
import { Button, ButtonVariant } from "@amzn/stencil-react-components/button";
import SortSchedule from "../../common/jobOpportunity/SortSchedule";
import FilterSchedule from "../../common/jobOpportunity/FilterSchedule";

interface MapStateToProps {
    job: JobState,
    application: ApplicationState,
    schedule: ScheduleState
}

interface JobOpportunityProps {

}

type JobOpportunityMergedProps = MapStateToProps & JobOpportunityProps;

const JobOpportunity = ( props: JobOpportunityMergedProps ) => {
    const { job, application, schedule } = props;
    const { search, pathname } = useLocation();
    const pageName = getPageNameFromPath(pathname);
    const queryParams = parseQueryParamsArrayToSingleItem(queryString.parse(search));
    const { applicationId, jobId } = queryParams;
    const jobDetail = job.results;
    const applicationData = application.results;
    const scheduleData = schedule.scheduleList;
    const scheduleFilters = schedule.filters;

    useEffect(() => {
        jobId && boundGetJobDetail({ jobId: jobId, locale: Locale.enUS })
        applicationId && boundGetApplication({ applicationId: applicationId, locale: Locale.enUS });
        const request: GetScheduleListByJobIdRequest = {
            jobId,
            applicationId,
            locale: getLocale()
        }
        boundGetScheduleListByJobId(request);
    }, []);

    useEffect(() => {
        jobDetail && applicationData && addMetricForPageLoad(pageName);
    }, [jobDetail, applicationData]);

    const renderSortScheduleFlyout = ( { close }: RenderFlyoutFunctionParams ) => (
        <FlyoutContent
            titleText={t('BB-JobOpportunity-sort-schedule-flyout-title', 'Sort By')}
            onCloseButtonClick={close}
            buttons={[
                <Button
                    onClick={() => {
                        handleApplyScheduleFilters(scheduleFilters);
                        close()
                    }}
                    variant={ButtonVariant.Primary}
                >
                    {t('BB-JobOpportunity-sort-schedule-flyout-apply-Btn', 'Apply')}
                </Button>
            ]}
            maxWidth='40vw'
        >
            <SortSchedule filters={scheduleFilters}/>
        </FlyoutContent>
    )

    const renderFilterScheduleFlyout = ( { close }: RenderFlyoutFunctionParams ) => (
        <FlyoutContent
            titleText={t('BB-JobOpportunity-filter-schedule-flyout-title', 'Filter')}
            onCloseButtonClick={close}
            buttons={[
                <Button
                    onClick={() => {
                        handleResetScheduleFilters();
                        close();
                    }}
                >
                    {t('BB-JobOpportunity-filter-schedule-flyout-reset-Btn', 'Reset')}
                </Button>,
                <Button
                    onClick={() => {
                        handleApplyScheduleFilters(scheduleFilters);
                        close()
                    }}
                    variant={ButtonVariant.Primary}
                >
                    {t('BB-JobOpportunity-filter-schedule-flyout-apply-Btn', 'Apply')}
                </Button>
            ]}
            maxWidth='40vw'
        >
            <FilterSchedule filters={scheduleFilters}/>
        </FlyoutContent>
    )

    return (
        <Col id='jobOpportunityContainer'>
            {
                //TODO need to align how each application workflow is related to app steps
            }
            <StepHeader jobTitle={jobDetail?.jobTitle || ''} step={ApplicationStepList[0]}/>
            <Col id="jobOpportunityHeaderImageContainer">
                <Image
                    id="jobOpportunityHeaderImage"
                    src="https://m.media-amazon.com/images/G/01/HVH-CandidateApplication/jobs/20170525PrimeNowUWA2_15-min.jpg"
                    aria-hidden="true"
                />
                <Col id="jobOpportunityHeaderImageOverlay">
                    {/*May need to add overlay content in future*/}
                </Col>
            </Col>

            <Col>
                <Row padding={{ top: 'S400' }}>
                    <Row className="backToJobDashboardLink" gridGap={5}>
                        <IconArrowLeft size={IconSize.ExtraSmall} fontSize='T100'/>
                        <Text fontWeight="medium" fontSize='T200'>
                            {t('BB-JobOpportunity-Go-To-Dashboard-Link', 'Go Back to Jobs Dashboard')}
                        </Text>
                    </Row>
                </Row>

                <Col className="scheduleListContainer" padding={{ top: 'S500' }}>
                    <Row className="scheduleListActionContainer">
                        <Row className="scheduleListActionItem" gridGap={5}>
                            <WithFlyout
                                renderFlyout={renderFilterScheduleFlyout}
                                flyoutPosition={FlyoutPosition.Leading}
                            >
                                {( { open } ) => (
                                    <Row onClick={() => open()} gridGap={8} alignItems="center">
                                        <IconHourGlass size={IconSize.ExtraSmall}/>
                                        <Text fontWeight="medium" fontSize='T200'>
                                            {t('BB-JobOpportunity-filter-button', 'Filter')}
                                        </Text>
                                    </Row>
                                )}
                            </WithFlyout>
                        </Row>
                        <Row
                            className="scheduleListActionItem"
                        >
                            <WithFlyout renderFlyout={renderSortScheduleFlyout}>
                                {( { open } ) => (
                                    <Row onClick={() => open()} gridGap={8} alignItems="center">
                                        <IconSort size={IconSize.ExtraSmall}/>
                                        <Text fontWeight="medium" fontSize='T200'>
                                            {t('BB-JobOpportunity-sort-button', 'Sort')}
                                        </Text>
                                    </Row>
                                )}
                            </WithFlyout>
                        </Row>
                    </Row>

                    {
                        scheduleData.map(scheduleItem => <ScheduleCard scheduleDetail={scheduleItem}/>)
                    }
                </Col>
            </Col>
        </Col>
    )
}

const mapStateToProps = ( state: MapStateToProps ) => {
    return state;
};

export default connect(mapStateToProps)(JobOpportunity);
