import React from "react";
import { Col } from "@stencil-react/components/layout";
import {
  MessageBanner,
  MessageBannerType
} from "@stencil-react/components/message-banner";
import RendererContainer from "../../containers/renderer";
import StepsContentRendererContainer from "../../containers/steps-content-renderer";
import PanelContainer from "../../containers/panel/panel-container";
import ModalContainer from "../../containers/modal/modal-container";

export type IContentProps = {
  hasResponseError: boolean;
  errorMessage?: string;
  isContentContainsSteps: boolean;
  isContentContainsPanels: boolean;
  isContentContainsModals: boolean;
};

const Content: React.FC<IContentProps> = ({
  hasResponseError,
  errorMessage,
  isContentContainsSteps,
  isContentContainsPanels,
  isContentContainsModals
}) => {
  return (
    <div>
      <Col gridGap={5}>
        {hasResponseError && (
          <Col gridGap={10}>
            <MessageBanner type={MessageBannerType.Error}>
              {errorMessage}
            </MessageBanner>
          </Col>
        )}
        {isContentContainsSteps ? (
          <StepsContentRendererContainer />
        ) : (
          <RendererContainer type="content" />
        )}
        {isContentContainsPanels && <PanelContainer />}
        {isContentContainsModals && <ModalContainer />}
      </Col>
    </div>
  );
};

export default Content;
