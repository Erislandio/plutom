const inquirer = require("inquirer");
const path = require("path");
const logs = require("../common/chalk");
const accounts = require("../accounts.json");
const fs = require("fs");
const account = require("../account.json");
const Client = require("../client/client");
const api = new Client();

const find = (account) => {
  const findAccount = accounts.find((item) => item.account == account);
  return findAccount;
};

const logOnTerminal = (message, type) => {
  switch (type) {
    case "error":
      return console.log(logs.error(`\n ${message} \n`));
    case "success":
      return console.log(logs.success(`\n ${message} \n`));
    case "info":
      return console.log(logs.info(`\n ${message} \n`));
    default:
      return console.table(message);
  }
};

const add = () => {
  return inquirer
    .prompt([
      {
        type: "text",
        name: "account",
        message: "* Account: ",
        default: path.basename(process.cwd()),
      },
      {
        type: "text",
        name: "appKey",
        message: "* API KEY: ",
        default: path.basename(process.cwd()),
      },
      {
        type: "text",
        name: "appToken",
        message: "* API TOKEN: ",
        default: path.basename(process.cwd()),
      },
    ])
    .then(({ account, appKey, appToken }) => {
      const findAccount = find(account);

      if (findAccount) {
        const list = accounts.map((item) => ({
          name: item.account,
          token: item.appKey,
        }));

        console.table(list);
        return console.log(logs.warning(`Account: ${account} already exists`));
      }

      const newAccount = accounts.concat({ account, appKey, appToken });

      fs.writeFileSync(
        path.resolve(__dirname + "/../accounts.json"),
        JSON.stringify(newAccount)
      );

      console.log(
        logs.success(`Account: ${logs.warning(account)}, created successfully`)
      );
    })
    .catch(() => {
      console.log(logs.error("error: there was an error at the time"));
    });
};

const use = (param) => {
  if (!accounts.length) {
    return console.log(
      logs.error(
        `You need to register an account first, use the --add parameter`
      )
    );
  }

  if (typeof param !== "boolean") {
    const accountSelector = find(param);

    if (accountSelector) {
      fs.writeFileSync(
        path.resolve(__dirname + "/../account.json"),
        JSON.stringify(accountSelector)
      );

      return console.log(logs.success(`You logged into the account: ${param}`));
    }

    return console.log(logs.error(`Account: ${param} does not exist`));
  }

  return inquirer
    .prompt([
      {
        type: "list",
        choices: accounts.map(({ account }) => account),
        message: "Select account:",
        name: "account",
      },
    ])
    .then(({ account }) => {
      const accountSelector = find(account);
      fs.writeFileSync(
        path.resolve(__dirname + "/../account.json"),
        JSON.stringify(accountSelector)
      );
      return console.log(
        logs.success(`You logged into the account: ${account}`)
      );
    });
};

const info = () => {
  if (account && account.account) {
    return console.log(
      logs.success(
        `You are logged in to the account: ${logs.info(account.account)}`
      )
    );
  }

  return console.log(
    logs.warning(`
    you are not logged into any account`)
  );
};

const logout = () => {
  if (account && account.account) {
    try {
      fs.writeFileSync(
        path.resolve(__dirname + "/../account.json"),
        JSON.stringify({ account: null })
      );

      return console.log(
        logs.success(
          `you successfully logged out!: ${logs.info(account.account)}`
        )
      );
    } catch (error) {
      return console.log(
        logs.error("An error occurred while trying to log out, try again")
      );
    }
  } else {
    return console.log(
      logs.warning(
        `you need to select an account first, hold the command --add or --use`
      )
    );
  }
};

const list = (param) => {
  if (typeof param === "string") {
    const accountList = accounts.filter((item) => {
      return item.account === param;
    });

    if (accountList.length) {
      return console.table(
        accountList.map(({ account, appKey }) => ({ account, appKey }))
      );
    }

    return console.log(logs.warning(`Account: ${logs.info(param)} not found`));
  }

  if (accounts.length === 0) {
    console.log(
      logs.info(`
    There are no accounts registered at the moment, use the ${logs.success(
      "--add command"
    )} to add a new account in the app.`)
    );

    return inquirer
      .prompt([
        {
          type: "confirm",
          message: "Do you want to add a new account?",
          name: "add",
        },
      ])
      .then(() => {
        return add();
      })
      .catch(() => console.log(logs.error("Exit")));
  }

  return console.table(
    accounts.map(({ account, appKey, appToken }) => ({
      account,
      appKey,
      appToken,
    }))
  );
};

const remove = (param) => {
  const findAccount = accounts.find((item) => {
    return item.account === param;
  });

  const newAccounts = accounts.filter((item) => {
    return item.account !== param;
  });

  if (!findAccount) {
    return console.log(
      logs.error(
        `Account: ${logs.warning(
          param
        )}, has already been removed or cannot be found`
      )
    );
  }

  inquirer
    .prompt([
      {
        type: "confirm",
        message: `Are you sure you want to remove: ${param}?`,
        name: "remove",
      },
    ])
    .then(() => {
      fs.writeFileSync(
        path.resolve(__dirname + "/../accounts.json"),
        JSON.stringify(newAccounts)
      );

      return console.log(
        logs.success(`Account: ${logs.warning(param)} was remove successfully`)
      );
    })
    .catch(() => {
      return console.log(
        logs.error(`Account: ${logs.warning(param)} was remove successfully`)
      );
    });
};

const isValid = () => {
  if (!account.account) {
    console.log(
      logs.warning(
        `\n You need to be logged into an account, use the: ${logs.info(
          "--login command"
        )}`
      )
    );

    return false;
  }

  if (!account.appKey || !account.appToken) {
    console.log(logs.warning(`\n You need to configure appKey and appToken`));

    return false;
  }

  return true;
};

const databases = async () => {
  if (!isValid()) return;
  try {
    return api.databases().then((res) => {
      console.log(logs.info(`\n \n ** Available databases ** \n`));
      return res;
    });
  } catch (error) {
    console.log(error);
  }
};

const findAll = async (acronym) => {};

const formateWhere = (where) => {
  const {
    operator,
    left: { column },
    right: { value },
  } = where;

  const url = `${column}${operator}${value}`;

  return url;
};

const filter = async (query) => {
  const {
    type,
    columns,
    where,
    from: [{ table }],
  } = query;

  const find = formateWhere(where);

  if (columns === "*" && where !== null) {
    return api.findAll(table.toUpperCase(), "_all", find).then((res) => {
      if (res.status === 200) {
        return console.log(res.data);
      }
      return null;
    });
  }

  const formateColumns = columns
    .map(({ expr: { column } }) => {
      return column;
    })
    .join(",");

  return api.findAll(table, formateColumns, find).then((res) => {
    if (res.status === 200) {
      console.log("\n");
      return console.table(res.data);
    }
    return null;
  });
};

const desc = async (query) => {
  if (query.length !== 2) {
    return console.log(logs.warning("Invalid acronym"));
  }

  return api.desc(query.toUpperCase()).then((res) => {
    if (res.status === 200) {
      console.log("\n");
      return console.table(
        res.data.fields.map(
          ({ name, type, isNullable, isSearchable, isFilter }) => ({
            name,
            type,
            isNullable,
            isSearchable,
            isFilter,
          })
        )
      );
    }
    return null;
  });
};

module.exports = {
  add,
  use,
  info,
  logout,
  list,
  remove,
  databases,
  findAll,
  filter,
  desc,
};
