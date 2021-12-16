import React, { useEffect } from "react";
import {
  VIEWPORT_SIZES,
  StencilResponsiveConsumer
} from "@amzn/stencil-react-components/responsive";
import { Col, Row } from "@amzn/stencil-react-components/layout";
import { Text } from "@amzn/stencil-react-components/text";
import { connect } from "react-redux";
import { onShowNavbar } from "../../actions/actions";
import { IconClock } from "@amzn/stencil-react-components/icons";
import { Button } from "@amzn/stencil-react-components/button";
import { useTranslation } from 'react-i18next';
import { get3rdPartyFromQueryParams } from "../../helpers/utils";

interface Error403PageProps {
  onShowNavbar: Function;
  appConfig: any;
}

const TimeoutPage: React.FC<Error403PageProps> = ({
  onShowNavbar,
  appConfig
}) => {
  useEffect(() => {
    onShowNavbar();
  }, [onShowNavbar]);

  const onClick = () => {
    const isCandidateDashboardEnabled = appConfig.featureList?.CANDIDATE_DASHBOARD?.isAvailable;
    const queryParamsInSession = window.sessionStorage.getItem("query-params");
    const queryParams = queryParamsInSession
      ? JSON.parse(queryParamsInSession)
      : {};
    const queryStringFor3rdParty = get3rdPartyFromQueryParams(queryParams,'?');
    const candidateDashboardUrl = `${appConfig.CSDomain}/app${queryStringFor3rdParty}#/myApplications`;
    window.location.assign(isCandidateDashboardEnabled? candidateDashboardUrl : appConfig.dashboardUrl);
  };

  const { t: translate } = useTranslation();

  return (
    <StencilResponsiveConsumer sizes={[VIEWPORT_SIZES.S]}>
      {({ matches }) => (
        <div data-testid="page">
          <Col gridGap="m" padding="l">
            <Text fontSize="m">
              <Row gridGap={4} alignItems="center">
                <IconClock color="warning" title={translate("servicePages:timeout.title")} />
                <Col>{translate("servicePages:timeout.title")}</Col>
              </Row>
            </Text>
            <Text fontSize="xs">
              {translate('servicePages:timeout.description')}
            </Text>
            <Button data-testid="dashboard-button" primary onClick={onClick}>
              {translate('servicePages:return-to-dashboard')}
            </Button>
          </Col>
        </div>
      )}
    </StencilResponsiveConsumer>
  );
};

const actions = {
  onShowNavbar
};

const mapStateToProps = (state: any, ownProps: any) => {
  return {
    appConfig: state.app.appConfig
  };
};

export default connect(mapStateToProps, actions)(TimeoutPage);
