import moment from "moment";
import isEmpty from "lodash/isEmpty";
import isBoolean from "lodash/isBoolean";
import includes from "lodash/includes";

export const covertValueTo = (type: string, value: any) => {
  switch (type) {
    case "BOOL_TO_STRING": {
      if (isBoolean(value)) {
        return value ? "yes" : "no";
      } else {
        return value;
      }
    }
    case "DATE_TO_STRING": {
      return isEmpty(value)
        ? value
        : moment(value)
            .utc()
            .format("YYYY-MM-DD");
    }
    default:
      return value;
  }
};

export const validation = (
  value: any,
  type: string,
  isOptional?: boolean,
  validationProps?: any
) => {
  switch (type) {
    case "SSN": {
      //9 digit number, in format xxx-xx-xxxx
      const regex = new RegExp(
        /^(?!000|666)[0-8][0-9]{2}(?!00)[0-9]{2}(?!0000)[0-9]{4}$/
      );
      return regex.test(value);
    }
    case "ZIPCODE": {
      //5 digit number, eg 20171 or 20171-4567
      const regex = new RegExp(/^[0-9]{5}(?:-[0-9]{4})?$/);
      return regex.test(value);
    }
    case "DATE_OF_BIRTH": {
      //According to SF rule: DoB should not be within 10 yrs: today - 10 years.
      let tenYearsFromNow = moment()
        .utc()
        .subtract(18, "years");

      const regex = new RegExp(
        /^[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
      );
      if (!regex.test(value)) {
        //format: should be yyyy-mm-dd, and valid date: [18: 100] ; month : [1-12]: days: [1,31]
        return false;
      } else if (!moment(value).isValid()) {
        //legal date
        return false;
      } else if (moment(value).utc() > tenYearsFromNow) {
        return false;
      } else {
        return true;
      }
    }
    case "LEGAL_NAME": {
      if (!value) {
        return true;
      } else {
        const stringArray = value.split(" ");
        const hasEmptyString = includes(stringArray, "");
        if (stringArray.length === 2 && !hasEmptyString) {
          return true;
        } else {
          return false;
        }
      }
    }
    case "REGEX": {
      if (isOptional && !value) {
        return true;
      } else {
        const { regex } = validationProps;
        if (regex) {
          const decodeRegex = decodeURI(regex);
          const regExp = new RegExp(decodeRegex);
          return regExp.test(value);
        } else {
          return true;
        }
      }
    }
    default: {
      console.log("Missing validation type");
      return true;
    }
  }
};
