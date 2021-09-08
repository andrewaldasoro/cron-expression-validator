const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const DAYS_OF_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const SECONDS_BOUNDARIES: [number, number] = [0, 59];
const MINUTES_BOUNDARIES: [number, number] = SECONDS_BOUNDARIES;
const HOURS_BOUNDARIES: [number, number] = [0, 23];
const DAYS_OF_MONTH_BOUNDARIES: [number, number] = [1, 31];
const MONTHS_BOUNDARIES: [number, number] = [1, 12];
// const DAYS_OF_WEEK_BOUNDARIES: [number, number] = [1, 7]
const YEARS_BOUNDARIES: [number, number] = [1970, 2199];

export class CronQuartz {
  private _valid = false;
  private _verbose = false;
  private _errors: string[] = [];

  seconds?: string;
  minutes?: string;
  hours?: string;
  dayOfMonth?: string;
  month?: string;
  dayOfWeek?: string;
  year?: string;

  private get _result() {
    if (this._verbose) {
      return {
        valid: this._valid,
        errors: this._errors,
      };
    }

    return this._valid;
  }

  private static ERROR = {
    DAY_OF_WEEK: {
      OUT_OF_RANGE: "Day-of-Week values must be between 1 and 7",
      SYNTAX:
        "Day-of-Week values must be SUN, MON, TUE, WED, THU, FRI, SAT OR between 1 and 7, - * ? / L #",
      SYNTAX2:
        "(Day of week) - Unsupported value for field. Possible values are 1-7 or SUN-SAT , - * ? / L #",
      HASHTAG: "A numeric value between 1 and 5 must follow the # option",
    },
    DAY_OF_MONTH: {
      OUT_OF_RANGE: "Day of month values must be between 1 and 31",
      OFFSET: "Offset from last day must be <= 30",
    },
    MONTH: {
      RANGE: "Month values must be between 1 and 12",
      SYNTAX:
        "Month values must be JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC OR between 1 and 12",
    },

    YEAR: {
      INVALID_EXPRESSION: "Start year must be less than stop year",
      OUT_OF_RANGE:
        "(Year) - Unsupported value for field. Possible values are 1970-2199 , - * /",
    },

    TIME_MSG:
      "Minute and Second values must be between 0 and 59 and Hour Values must be between 0 and 23",

    DAY_OF_MONTH_DAY_OF_WEEK_MSG:
      "? can only be specfied for Day-of-Month -OR- Day-of-Week",

    MALFORMED: {
      NO_SPACES: "Unexpected Expression: no spaces",
      OUT_OF_BOUNDARIES: "Unexpected Expression: out of boundaries",
      STEP: "Step value malformed",
      WRONG_EXPRESSION: "wrong expression",
    },
  };

  constructor(expression?: string) {
    if (expression) this.test(expression);
  }

  test(
    expression: string,
    options?: {
      verbose: boolean;
    }
  ) {
    if (options?.verbose) {
      this._verbose = options.verbose;
    }

    if (!/\s/g.test(expression)) {
      this._errors.push(CronQuartz.ERROR.MALFORMED.NO_SPACES);
      return this._result;
    }

    const values = expression.trim().split(" ");

    if (values.length !== 6 && values.length !== 7) {
      this._errors.push(CronQuartz.ERROR.MALFORMED.OUT_OF_BOUNDARIES);
      return this._result;
    }

    this.seconds = values[0];
    this.minutes = values[1];
    this.hours = values[2];
    this.dayOfMonth = values[3];
    this.month = values[4];
    this.dayOfWeek = values[5];
    this.year = values[6] ?? undefined;

    this._valid =
      this.testSeconds(this.seconds) &&
      this.testMinutes(this.minutes) &&
      this.testHours(this.hours) &&
      this.testDayOfMonth(this.dayOfMonth) &&
      this.testMonth(this.month) &&
      this.testDayOfWeek(this.dayOfWeek) &&
      (this.year ? this.testYear(this.year) : true);

    return this._result;
  }

  testSeconds(expression: string) {
    return this.testTime(expression, SECONDS_BOUNDARIES);
  }

  testMinutes(expression: string) {
    return this.testTime(expression, MINUTES_BOUNDARIES);
  }

  testHours(expression: string) {
    return this.testTime(expression, HOURS_BOUNDARIES);
  }

  testDayOfMonth(expression: string) {
    const testLimit = (_expr: string) => {
      if (this.testBoundaries(_expr, DAYS_OF_MONTH_BOUNDARIES)) return true;

      return this.malformedReturn(CronQuartz.ERROR.DAY_OF_MONTH.OUT_OF_RANGE);
    };

    if (expression === "*") {
      if (this.dayOfWeek === "*") return false;

      return true;
    }

    if (expression === "?") {
      if (this.dayOfWeek === "?") return false;

      return true;
    }

    const isLastDays =
      expression.toLowerCase() === "l" || expression.toLowerCase() === "lw";

    if (isLastDays) return true;

    if (/^[1-7]l$/.test(expression.toLowerCase())) {
      return true;
    }

    if (expression.includes("/")) {
      const values = expression.split("/");

      if (values.length !== 2)
        return this.malformedReturn(CronQuartz.ERROR.DAY_OF_MONTH.OUT_OF_RANGE);

      if (this.filterInt(values[0]) >= this.filterInt(values[1]))
        return this.malformedReturn(
          CronQuartz.ERROR.MALFORMED.WRONG_EXPRESSION
        );

      if (this.testDayOfMonth(values[0])) return testLimit(values[1]);

      return this.malformedReturn(CronQuartz.ERROR.DAY_OF_MONTH.OUT_OF_RANGE);
    }

    if (expression.includes("-")) {
      const values = expression.split("-");

      if (values.length !== 2)
        return this.malformedReturn(
          CronQuartz.ERROR.MALFORMED.WRONG_EXPRESSION
        );

      if (values[1].toLowerCase() === "l")
        return this.malformedReturn(CronQuartz.ERROR.DAY_OF_MONTH.OUT_OF_RANGE);

      if (this.testDayOfMonth(values[0])) return testLimit(values[1]);

      return this.malformedReturn(CronQuartz.ERROR.DAY_OF_MONTH.OUT_OF_RANGE);
    }

    if (expression.includes(",")) {
      const values = expression.split(",");

      if (!values.every((v) => this.testTime(v, DAYS_OF_MONTH_BOUNDARIES)))
        return this.malformedReturn(
          CronQuartz.ERROR.MALFORMED.WRONG_EXPRESSION
        );

      return true;
    }

    return testLimit(expression);
  }

  testMonth(expression: string) {
    const testLimit = (_expr: string) => {
      if (this.testBoundaries(_expr, MONTHS_BOUNDARIES)) return true;
      if (MONTHS.includes(_expr.toLowerCase())) return true;

      return this.malformedReturn(CronQuartz.ERROR.DAY_OF_MONTH.OUT_OF_RANGE);
    };

    if (expression === "*") return true;

    if (expression.includes("/")) {
      const values = expression.split("/");

      if (values.length !== 2)
        return this.malformedReturn(
          CronQuartz.ERROR.MALFORMED.WRONG_EXPRESSION
        );

      if (this.filterInt(values[0]) >= this.filterInt(values[1]))
        return this.malformedReturn(
          CronQuartz.ERROR.MALFORMED.WRONG_EXPRESSION
        );

      if (this.testMonth(values[0])) return testLimit(values[1]);
    }

    if (expression.includes("-")) {
      const monthRangeArr = expression.split("-");
      if (
        !isNaN(this.filterInt(monthRangeArr[0])) &&
        !isNaN(this.filterInt(monthRangeArr[1])) &&
        !this.isValidMonthNo(monthRangeArr, 1, 12)
      ) {
        this._errors.push(CronQuartz.ERROR.MONTH.RANGE);
      }
      if (
        isNaN(this.filterInt(monthRangeArr[0])) &&
        isNaN(this.filterInt(monthRangeArr[1])) &&
        !this.isValidMonthStr(monthRangeArr, MONTHS)
      ) {
        this._errors.push(CronQuartz.ERROR.MONTH.SYNTAX);
      }
      return !isNaN(this.filterInt(monthRangeArr[0])) &&
        !isNaN(this.filterInt(monthRangeArr[1]))
        ? this.isValidMonthNo(monthRangeArr, 1, 12)
        : this.isValidMonthStr(monthRangeArr, MONTHS);
    } else if (expression.includes(",")) {
      const multiMonthArr = expression.split(",");
      if (
        !isNaN(this.filterInt(multiMonthArr[0])) &&
        !this.isValidMonthNo(multiMonthArr, 1, 12)
      ) {
        this._errors.push(CronQuartz.ERROR.MONTH.RANGE);
      }
      if (
        isNaN(this.filterInt(multiMonthArr[0])) &&
        !this.isValidMonthStr(multiMonthArr, MONTHS)
      ) {
        this._errors.push(CronQuartz.ERROR.MONTH.SYNTAX);
      }
      return !isNaN(this.filterInt(multiMonthArr[0]))
        ? this.isValidMonthNo(multiMonthArr, 1, 12)
        : this.isValidMonthStr(multiMonthArr, MONTHS);
    } else if (typeof expression === "string") {
      if (
        !isNaN(this.filterInt(expression)) &&
        !this.isValidMonthNo([expression], 1, 12)
      ) {
        this._errors.push(CronQuartz.ERROR.MONTH.RANGE);
      }
      if (
        isNaN(this.filterInt(expression)) &&
        !this.isValidMonthStr([expression], MONTHS)
      ) {
        this._errors.push(CronQuartz.ERROR.MONTH.SYNTAX);
      }
      return !isNaN(this.filterInt(expression))
        ? this.isValidMonthNo([expression], 1, 12)
        : this.isValidMonthStr([expression], MONTHS);
    } else {
      this._errors.push(CronQuartz.ERROR.MONTH.SYNTAX);
      return false;
    }
  }

  testDayOfWeek(dayOfWeek: string, dayOfMonth?: string) {
    if (
      (dayOfWeek === "*" && dayOfMonth !== "*") ||
      (dayOfWeek === "?" && dayOfMonth !== "?")
    ) {
      return true;
    }
    if (dayOfWeek.toLowerCase() === "l") {
      return true;
    }
    if (dayOfWeek === "*") {
      return dayOfMonth !== "*";
    } else if (dayOfWeek.includes("/") && dayOfMonth === "?") {
      const startingDayOfWeekOptionArr = dayOfWeek.split("/");
      if (!this.isValidMonthNo([startingDayOfWeekOptionArr[0]], 1, 7)) {
        this._errors.push(CronQuartz.ERROR.DAY_OF_WEEK.OUT_OF_RANGE);
      }
      if (!this.isValidMonthNo([startingDayOfWeekOptionArr[1]], 0, 7)) {
        this._errors.push(
          "Expression " +
            startingDayOfWeekOptionArr[1] +
            " is not a valid increment value. Accepted values are 0-7"
        );
      }
      return (
        this.isValidMonthNo([startingDayOfWeekOptionArr[0]], 1, 7) &&
        this.isValidMonthNo([startingDayOfWeekOptionArr[1]], 0, 7)
      );
    } else if (dayOfWeek.includes("-") && dayOfMonth === "?") {
      const dayOfWeekRangeArr = dayOfWeek.split("-");
      if (
        !isNaN(this.filterInt(dayOfWeekRangeArr[0])) &&
        !isNaN(this.filterInt(dayOfWeekRangeArr[1])) &&
        !this.isValidMonthNo(dayOfWeekRangeArr, 1, 7)
      ) {
        this._errors.push(CronQuartz.ERROR.DAY_OF_WEEK.OUT_OF_RANGE);
      }
      if (
        isNaN(this.filterInt(dayOfWeekRangeArr[0])) &&
        isNaN(this.filterInt(dayOfWeekRangeArr[1])) &&
        !this.isValidMonthStr(dayOfWeekRangeArr, DAYS_OF_WEEK)
      ) {
        this._errors.push(CronQuartz.ERROR.DAY_OF_WEEK.SYNTAX);
      }
      return !isNaN(this.filterInt(dayOfWeekRangeArr[0])) &&
        !isNaN(this.filterInt(dayOfWeekRangeArr[1]))
        ? this.isValidMonthNo(dayOfWeekRangeArr, 1, 7)
        : this.isValidMonthStr(dayOfWeekRangeArr, DAYS_OF_WEEK);
    } else if (dayOfWeek.includes(",") && dayOfMonth === "?") {
      const multiDayOfWeekArr = dayOfWeek.split(",");
      if (
        !isNaN(this.filterInt(multiDayOfWeekArr[0])) &&
        !this.isValidMonthNo(multiDayOfWeekArr, 1, 7)
      ) {
        this._errors.push(CronQuartz.ERROR.DAY_OF_WEEK.OUT_OF_RANGE);
      }
      if (
        isNaN(this.filterInt(multiDayOfWeekArr[0])) &&
        !this.isValidMonthStr(multiDayOfWeekArr, DAYS_OF_WEEK)
      ) {
        this._errors.push(CronQuartz.ERROR.DAY_OF_WEEK.SYNTAX);
      }
      return !isNaN(this.filterInt(multiDayOfWeekArr[0]))
        ? this.isValidMonthNo(multiDayOfWeekArr, 1, 7)
        : this.isValidMonthStr(multiDayOfWeekArr, DAYS_OF_WEEK);
    } else if (dayOfWeek.includes("#") && dayOfMonth === "?") {
      const weekdayOfMonthArr = dayOfWeek.split("#");
      if (!this.isValidMonthNo([weekdayOfMonthArr[0]], 1, 7)) {
        this._errors.push(CronQuartz.ERROR.DAY_OF_WEEK.SYNTAX2);
      }
      if (!this.isValidMonthNo([weekdayOfMonthArr[1]], 1, 5)) {
        this._errors.push(CronQuartz.ERROR.DAY_OF_WEEK.HASHTAG);
      }
      return (
        this.isValidMonthNo([weekdayOfMonthArr[0]], 1, 7) &&
        this.isValidMonthNo([weekdayOfMonthArr[1]], 1, 5)
      );
    } else if (typeof dayOfWeek === "string" && dayOfMonth === "?") {
      if (
        !isNaN(this.filterInt(dayOfWeek)) &&
        !this.isValidMonthNo([dayOfWeek], 1, 7)
      ) {
        this._errors.push(CronQuartz.ERROR.DAY_OF_WEEK.OUT_OF_RANGE);
      }
      if (
        isNaN(this.filterInt(dayOfWeek)) &&
        !this.isValidMonthStr([dayOfWeek], DAYS_OF_WEEK)
      ) {
        this._errors.push(CronQuartz.ERROR.DAY_OF_WEEK.SYNTAX);
      }
      return !isNaN(this.filterInt(dayOfWeek))
        ? this.isValidMonthNo([dayOfWeek], 1, 7)
        : this.isValidMonthStr([dayOfWeek], DAYS_OF_WEEK);
    } else {
      if (
        this.isInvalidValues(dayOfWeek, dayOfMonth) &&
        !this.isHasErrorMsg(this._errors)
      ) {
        this._errors.push(CronQuartz.ERROR.DAY_OF_MONTH_DAY_OF_WEEK_MSG);
      } else {
        this._errors.push(CronQuartz.ERROR.DAY_OF_WEEK.SYNTAX + " or * or /");
      }
      return false;
    }
  }

  testYear(expression: string) {
    YEARS_BOUNDARIES[0] = new Date().getFullYear();
    return this.testTime(expression, YEARS_BOUNDARIES);
  }

  private isValidMonthNo(monthArr: string[], val: number, endVal: number) {
    return monthArr.every((month) => {
      return this.filterInt(month) >= val && this.filterInt(month) <= endVal;
    });
  }

  private isValidMonthStr(monthArr: string[], dataArr: string[]) {
    return monthArr.every((month) => {
      return dataArr.includes(month.toLowerCase());
    });
  }

  private isInvalidValues(dayOfWeek?: string, dayOfMonth?: string) {
    const isAll = dayOfWeek === "*" && dayOfMonth === "*";
    const isAny = dayOfWeek === "?" && dayOfMonth === "?";
    return isAll || isAny;
  }

  private isHasErrorMsg(array: string[]) {
    return array.includes(CronQuartz.ERROR.DAY_OF_MONTH_DAY_OF_WEEK_MSG);
  }

  private testTime(expression: string, boundaries: [number, number]) {
    const testLimit = (_expr: string) => {
      if (this.testBoundaries(_expr, boundaries)) return true;

      return this.malformedReturn(CronQuartz.ERROR.DAY_OF_MONTH.OUT_OF_RANGE);
    };

    if (expression === "*") return true;

    if (expression.includes("/")) {
      const values = expression.split("/");

      if (values.length !== 2)
        return this.malformedReturn(
          CronQuartz.ERROR.MALFORMED.WRONG_EXPRESSION
        );

      if (this.filterInt(values[0]) >= this.filterInt(values[1]))
        return this.malformedReturn(
          CronQuartz.ERROR.MALFORMED.WRONG_EXPRESSION
        );

      if (this.testTime(values[0], boundaries)) return testLimit(values[1]);

      return this.malformedReturn(CronQuartz.ERROR.DAY_OF_MONTH.OUT_OF_RANGE);
    }

    if (expression.includes("-")) {
      const values = expression.split("-");

      if (values.length !== 2)
        return this.malformedReturn(
          CronQuartz.ERROR.MALFORMED.WRONG_EXPRESSION
        );

      if (this.testTime(values[0], boundaries)) return testLimit(values[1]);

      return this.malformedReturn(CronQuartz.ERROR.DAY_OF_MONTH.OUT_OF_RANGE);
    }

    if (expression.includes(",")) {
      const values = expression.split(",");

      if (!values.every((v) => this.testTime(v, boundaries)))
        return this.malformedReturn(
          CronQuartz.ERROR.MALFORMED.WRONG_EXPRESSION
        );

      return true;
    }

    return testLimit(expression);
  }

  private testBoundaries(v: string, [min, max]: [number, number]): boolean {
    return this.filterInt(v) >= min && this.filterInt(v) <= max;
  }

  private malformedReturn(error: string) {
    this._errors.push(error);
    return false;
  }

  private filterInt(value: string): number {
    if (/^[-+]?(\d+|Infinity)$/.test(value)) {
      return Number(value);
    } else {
      return NaN;
    }
  }
}

// TO TEST
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});
promptExpression();

function promptExpression() {
  return readline.question("test quartz expression: ", (answer: string) => {
    const cronValidator = new CronQuartz();
    console.log(cronValidator.test(answer));

    promptExpression();
  });
}
