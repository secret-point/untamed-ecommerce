import React from "react";
import {
  IconCalendarFill, IconClockFill,
  IconDocument,
  IconGlobe,
  IconPaymentFill,
  IconSize
} from '@amzn/stencil-react-components/icons';
import { Col, Row } from "@amzn/stencil-react-components/layout";
import { Text } from "@amzn/stencil-react-components/text";
import { renderScheduleFullAddress, getFeatureFlagValue } from "../../../utils/helper";
import { Schedule } from "../../../utils/types/common";
import { localeToLanguageList } from "../../../utils/constants/common";
import { FEATURE_FLAG } from "../../../utils/enums/common";
import { translate as t } from "../../../utils/translator";

interface ScheduleDetailsProps {
  scheduleDetail: Schedule,
}

const ScheduleDetails = (props: ScheduleDetailsProps) => {

  const { scheduleDetail } = props;
  const requiredLanguages = scheduleDetail.requiredLanguage || [];
  const showRequiredLanguages = getFeatureFlagValue(FEATURE_FLAG.MLS) && requiredLanguages?.length > 0;

  const {
    hoursPerWeek,
    firstDayOnSite,
    firstDayOnSiteL10N,
    currencyCode,
    scheduleText,
    totalPayRate,
    totalPayRateL10N
  } = scheduleDetail;

  const renderRequiredLanguages = (schedule: Schedule): string => {
    const languageList: string[] = [];

    localeToLanguageList.forEach((item) => requiredLanguages?.includes(item.locale) ? languageList.push(t(item.translationKey, item.language)) : null);

    return t(`BB-Schedule-card-languages-supported`, `Languages Supported`) + `: ` + languageList.join(', ');
}

  return (
    <Col gridGap={8} width="95%">
      <Row gridGap={5} alignItems="center">
        <IconClockFill size={IconSize.ExtraSmall} />
        <Text fontSize="T100">{scheduleText}</Text>
      </Row>
      <Row gridGap={5} alignItems="center">
        <IconCalendarFill size={IconSize.ExtraSmall} />
        <Text fontSize="T100">
          {t("BB-Schedule-card-possible-start-date-text", "Possible Start Date:")} {firstDayOnSiteL10N || firstDayOnSite} <b>
            {t("BB-Schedule-card-possible-start-date-or-earlier-text", "(or earlier!)")}
          </b>
        </Text>
      </Row>
      <Row gridGap={5} alignItems="center">
        <IconPaymentFill size={IconSize.ExtraSmall} />
        <Text fontSize="T100">{totalPayRateL10N || `${currencyCode}${totalPayRate}`} {t("BB-Schedule-card-total-pay-per-hour-text", "/hr")}</Text>
      </Row>
      <Row gridGap={5} alignItems="center">
        <IconDocument size={IconSize.ExtraSmall} />
        <Text fontSize="T100">{hoursPerWeek} {t("BB-Schedule-card-hours-per-week-text", "hrs/wk")}</Text>
      </Row>
      { showRequiredLanguages && <Row gridGap={5} alignItems="center">
        <IconGlobe size={IconSize.ExtraSmall} />
        <Text fontSize="T100">{renderRequiredLanguages(scheduleDetail)}</Text>
      </Row> }
      <Row gridGap={5} alignItems="center">
        { !showRequiredLanguages && <IconGlobe size={IconSize.ExtraSmall} /> }
        <Text fontSize="T100">{renderScheduleFullAddress(scheduleDetail)}</Text>
      </Row>
    </Col>
  )
}

export default ScheduleDetails;
