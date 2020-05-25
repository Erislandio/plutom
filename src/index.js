#!/usr/bin/env node
const { Command } = require("commander");
const spinner = require("./common/spinner");
const program = new Command();
const { Parser } = require("node-sql-parser");
const parser = new Parser();
const figlet = require("figlet");
const logs = require("./common/chalk");

program.version("1.1.0");

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
  login,
  newUser,
} = require("./options/options");

function buildProgram() {
  program
    .option("-lg, --login ", "Login on application")
    .option("-u, --use", "Use an account")
    .option("-i, --info", "Show account info")
    .option("-a, --add", "Add an account")
    .option("--logout", "Logout")
    .option("-ls, --list", "Lists created accounts")
    .option("-rm, --remove ", "Remove an account")
    .option("-dbs, --databases", "List databases (acronym)")
    .option("--all <acronym>", "Get all data from acronym")
    .option(
      "-q, --query <query>",
      "Get all data from acronym - ex: select firstName from CL"
    )
    .option("-d, --desc <acronym>", "List info from table ex: --desc  'CL'")
    .option("-n, --new ", "Create new user")
    .option("--banner", "Show banner");

  program.parse(process.argv);
}

function runCommand() {
  if (program.login) {
    return login(program.login);
  }
  if (program.use) {
    return use(program.use);
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
    try {
      spinner.start();

      filter(parser.astify(program.query)).finally(() => {
        spinner.stop();
      });
    } catch (error) {
      spinner.stop();
      console.log(logs.error('\n Invalid query'))
    }
  }

  if (program.desc) {
    spinner.start();

    desc(program.desc).finally(() => {
      spinner.stop();
    });
  }

  if (program.new) {
    console.log(logs.success(`\n *  Welcome - Create new Account * \n`));
    newUser();
  }
  if (program.banner) {
    return banner();
  }
}

function banner() {
  return figlet("\n Plutom \n ", function (err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(logs.success('Developed by: Erislandio Soares ;-)'))
    return console.log(data);
  });
}

async function run() {
  buildProgram();
  runCommand();
}

run();
