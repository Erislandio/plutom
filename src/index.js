#!/usr/bin/env node
const { Command } = require("commander");
const spinner = require("./common/spinner");
const program = new Command();
const { Parser } = require("node-sql-parser");
const parser = new Parser();

const {
  use,
  info,
  logout,
  add,
  list,
  remove,
  databases,
  filter,
  desc,
} = require("./options/options");

function buildProgram() {
  program
    .option("-lg, --login <account>", "Login an account")
    .option("-i, --info", "Show account info")
    .option("-a, --add", "Add an account")
    .option("-l, --logout", "Logout from account")
    .option("-ls, --list [account]", "Lists created accounts")
    .option("-rm, --remove <account>", "Remove an account")
    .option("-dbs, --databases", "List databases (acronym)")
    .option("--all <acronym>", "Get all data from acronym")
    .option(
      "-q, --query <query>",
      "Get all data from acronym - ex: firstName from CL"
    )
    .option("-d, --desc <acronym>", "List info fron table ex: desc  CL");

  program.parse(process.argv);
  program.version("0.0.1");
}

function runCommand() {
  if (program.login) {
    return use(program.login);
  }
  if (program.info) {
    return info();
  }
  if (program.logout) {
    return logout();
  }
  if (program.add) {
    return add();
  }

  if (program.list) {
    return list(program.list);
  }

  if (program.remove) {
    return remove(program.remove);
  }

  if (program.databases) {
    spinner.start();

    return databases().then((res) => {
      console.table(res);
      spinner.stop();
    });
  }

  if (program.query) {
    spinner.start();

    filter(parser.astify(program.query)).finally(() => {
      spinner.stop();
    });
  }

  if (program.desc) {
    spinner.start();

    desc(program.desc).finally(() => {
      spinner.stop();
    });
  }
}

async function run() {
  buildProgram();
  runCommand();
}

run();
