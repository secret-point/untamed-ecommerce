import { propertyOf, filter, set, isEmpty } from "lodash";
import { ApplicationData } from "../@types/IPayload";

const getValue = (
  output: any,
  dataKey: string,
  pageId: string,
  data: ApplicationData,
  isContentContainsSteps?: boolean,
  activeStepIndex?: number
) => {
  let value = propertyOf(data)(dataKey);
  value = isEmpty(value) ? propertyOf(output)(dataKey) : value;
  value = isEmpty(value) ? propertyOf(output[pageId])(dataKey) : value;
  if (
    isContentContainsSteps &&
    activeStepIndex !== undefined &&
    output[pageId]
  ) {
    value = isEmpty(value)
      ? propertyOf(output[pageId][activeStepIndex])(dataKey)
      : value;
  }
  value = isEmpty(value) ? propertyOf(data.output[pageId])(dataKey) : value;
  return value;
};

const isComponentRendered = (
  output: any,
  pageId: string,
  data: ApplicationData,
  showComponentProperties?: any,
  isContentContainsSteps?: boolean,
  activeStepIndex?: number
) => {
  if (showComponentProperties) {
    const { dataKey, filter } = showComponentProperties;
    const value = getValue(
      output,
      dataKey,
      pageId,
      data,
      isContentContainsSteps,
      activeStepIndex
    );
    if (filter.type === "object") {
      return !isEmpty(value);
    } else {
      return value === filter.value;
    }
  } else {
    // show component if show component properties are empty.
    return true;
  }
};

export const validateRequiredData = (
  components: any,
  pageId: string,
  output: any,
  data: ApplicationData,
  isContentContainsSteps?: boolean,
  activeStepIndex?: number
) => {
  if (pageId) {
    const requiredDataForComponents = filter(components || [], obj => {
      const data = propertyOf(obj)("properties.required");
      if (data) {
        return obj;
      }
    });
    let validComponents: any = {};
    let result = true;
    requiredDataForComponents.forEach((component: any) => {
      const dataKey = propertyOf(component)("properties.dataKey");
      const requiredErrorMessage = propertyOf(component)(
        "properties.requiredErrorMessage"
      );
      let componentRendered = true;
      let dataKeyOutputValue = getValue(
        output,
        dataKey,
        pageId,
        data,
        isContentContainsSteps,
        activeStepIndex
      );
      if (component.showComponentProperties) {
        componentRendered = isComponentRendered(
          output,
          pageId,
          data,
          component.showComponentProperties,
          isContentContainsSteps,
          activeStepIndex
        );
      }
      if (!dataKeyOutputValue && componentRendered) {
        set(validComponents, dataKey, {
          hasError: true,
          errorMessage: requiredErrorMessage
        });
        result = false;
      } else {
        set(validComponents, dataKey, {
          hasError: false,
          errorMessage: requiredErrorMessage
        });
      }
    });
    return {
      valid: result,
      validComponents
    };
  } else {
    return {
      valid: true
    };
  }
};
