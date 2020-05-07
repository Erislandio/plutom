const chalk = require("chalk");

module.exports = {
  error: chalk.bold.red,
  warning: chalk.keyword("orange").bold,
  success: chalk.green.bold,
  info: chalk.blue.bold,
};
