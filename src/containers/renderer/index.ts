import { connect } from "react-redux";
import Renderer from "../../components/renderer";
import { onAction } from "../../actions";
import { validateRequiredData } from "../../helpers/validate";
import { withRouter } from "react-router-dom";
import find from "lodash/find";

const actions = {
  onAction
};

const getConfig = (config: any, ownProps: any) => {
  if (ownProps.isContentContainsPanel) {
    return ownProps.panelConfig;
  } else if (ownProps.isContentContainsImageContainer) {
    let imageContainer =
      find(config[ownProps.type]?.imageContainers || [], {
        id: ownProps.imageContainerId
      }) || {};
    return imageContainer;
  } else if (ownProps.isConfigContainsFlyouts) {
    return ownProps.flyOutConfig;
  } else if (ownProps.isContentContainsSteps) {
    return config[ownProps.type]?.steps[ownProps.activeStepIndex];
  } else if (ownProps.isContentContainsModals) {
    return config[ownProps.type]?.modals[ownProps.modalIndex];
  } else {
    return config[ownProps.type]; //type is Header, Content or Footer
  }
};

const mapStateToProps = (state: any, ownProps: any) => {
  const { page } = ownProps.match?.params as any;
  let config = getConfig(state.app.pageConfig, ownProps);

  const isDataValid = validateRequiredData(config, state.app.outputData, page);
  return {
    ...config,
    outputData: state.app.outputData,
    data: state.app.data,
    pageId: page,
    isDataValid,
    currentPage: state.app.currentPage,
    nextPage: state.app.nextPage,
    urlParams: ownProps.match?.params,
    appConfig: state.app.appConfig,
    pageOrder: state.app.pageOrder,
    candidateId: state.app.candidateId,
    hasResponseError: state.app.hasResponseError,
    errorMessage: state.app.errorMessage,
    isContentContainsSteps: ownProps.isContentContainsSteps,
    activeStepIndex: ownProps.activeStepIndex
  };
};

export default withRouter(connect(mapStateToProps, actions)(Renderer));
