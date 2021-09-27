[![typescript](https://camo.githubusercontent.com/56e4a1d9c38168bd7b1520246d6ee084ab9abbbb/68747470733a2f2f62616467656e2e6e65742f62616467652f69636f6e2f547970655363726970743f69636f6e3d74797065736372697074266c6162656c266c6162656c436f6c6f723d626c756526636f6c6f723d353535353535)](https://www.typescriptlang.org/)

# cron-quartz-validator

cron-quartz-validator is a **Node.JS** library (support typescript) to validate **quartz** cron expressions

## Installation

    npm install cron-quartz-validator

## Usage

**isValidCronExpression** method require _string_ (cron expression) as parameter and returns _boolean_ value

```js
import CronQuartz from "cron-quartz-validator";
const quartzValidator = new CronQuartz("* * * * * ? *");
```

```js
if (quartzValidator.test()) {
  // returns true
  // Your code
}
```

```js
if (quartzValidator.test("* * * * * * *")) {
  // returns false
}
```

### Optional second param if you want to get error message

Can get error message by passing `{ verbose: true }` as second parameter

```js
if(quartzValidator.test("* * * * 25/2 ? *", { verbose: true }) {
/** returns {
/* 		valid: false,
/* 		errors: [... 
/*    ]
/*	}
**/
}
```

```js
if(quartzValidator.test("* * * ? * * 123/555", { verbose: true }) {
/** returns {
/* 		valid: false,
/* 		erros: [...
/*		]
/*	}
**/
}
```

```js
if(quartzValidator.test("0 0 12 1/2 * ? *", { verbose: false }) { // returns true
	// Your code
}
```

## Cron accepted values

    Seconds: 0-59 * , -
    Minutes: 0-59 * , -
    Hours: 0-23 * , -
    Day of Month: 1-31 * , - ? L LW
    Months: (JAN-DEC or 1-12) * , -
    Day of Week: (SUN-SAT or 1-7) * , L - ? #
    Year: 1970-2099 * , -

## License

    MIT

Based on https://github.com/anushaihalapathirana/cron-expression-validator#readme
