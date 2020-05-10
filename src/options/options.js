const inquirer = require("inquirer");
const path = require("path");
const logs = require("../common/chalk");
const accounts = require("../accounts.json");
const fs = require("fs");
const account = require("../account.json");
const api = require("../client/client");
const { LocalStorage } = require("node-localstorage");
global.localStorage = new LocalStorage(path.resolve(__dirname, "../local"));

const find = (account) => {
  const findAccount = accounts.find((item) => item.account == account);
  return findAccount;
};

const formatedDate = (data) => {
  const date = new Date(data);

  return date.toLocaleDateString();
};

const add = () => {
  return inquirer
    .prompt([
      {
        type: "text",
        name: "account",
        message: "* Account: ",
        default: path.basename(process.cwd()),
        required: true,
        validate: function validateFirstName(name) {
          return name !== "";
        },
      },
      {
        type: "text",
        name: "appKey",
        message: "* API KEY: ",
        default: path.basename(process.cwd()),
        required: true,
        validate: function validateFirstName(name) {
          return name !== "";
        },
      },
      {
        type: "text",
        name: "appToken",
        message: "* API TOKEN: ",
        default: path.basename(process.cwd()),
        required: true,
        validate: function validateFirstName(name) {
          return name !== "";
        },
      },
    ])
    .then(({ account, appKey, appToken }) => {
      if (!account || !appKey || !appToken) {
        return console.log(logs.warning("Invalid fields"));
      }

      const id = localStorage.getItem("userId");

      if (!id) {
        return console.log(
          logs.info(
            "You need to login before doing this operation, try the command --login"
          )
        );
      }

      api
        .post("/v1/add", {
          id,
          account: {
            name: account,
            appKey,
            appToken,
          },
        })
        .then((res) => {
          if (res.data.error) {
            return console.log(logs.warning(res.data.message));
          }

          if (res.data) {
            return console.log(
              logs.success(
                `\n Account: ${logs.info(account)} successfully created`
              )
            );
          }
        })
        .catch((error) => {
          console.log(logs.error(error.message));
        });
    })
    .catch((error) => {
      console.log(logs.error("error: there was an error at the time"));
      console.log(logs.error(error.message));
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

const info = async () => {
  const id = localStorage.getItem("userId");

  if (id) {
    return api
      .get(`/v1/user?id=${id}`, {
        id,
      })
      .then(({ data }) => {
        if (data.error) {
          return console.log("\n", logs.error(data.message));
        }

        console.log(logs.warning("email: "), logs.info(data.email));
        console.log(
          logs.warning("User created on: "),
          logs.info(formatedDate(data.createdAt))
        );
        console.log(logs.warning("Accounts"));

        if (data.accounts.length === 0) {
          return console.log(logs.warning("No account registered"));
        }

        return console.table(
          data.accounts.map((item) => {
            return {
              account: item.name,
              appKey: item.appKey,
            };
          })
        );
      })
      .catch((error) => {
        console.log(error.message);
      });
  }

  return console.log(logs.info(`you need to login to get the information`));
};

const logout = async () => {
  const id = await localStorage.getItem("userId");

  if (id) {
    try {
      localStorage.setItem("userId", "");
      localStorage.setItem("token", "");

      return console.log(logs.success(`you successfully logged out!`));
    } catch (error) {
      return console.log(
        logs.error("An error occurred while trying to log out, try again"),
        logs.error(`\n ${error.message}`)
      );
    }
  }
  return console.log(
    logs.warning(
      `you need to select an account first, hold the command --add or --use`
    )
  );
};

const list = (param) => {
  const id = localStorage.getItem("userId");

  if (!id) {
    return console.log(
      logs.warning(`You must be logged in to perform this function`)
    );
  }

  api
    .get(`/v1/user/account?id=${id}`, {
      id,
    })
    .then(({ data }) => {
      if (data.error) {
        return console.log(data.message);
      }

      if (data.length === 0) {
        return console.log(logs.warning("No account found"));
      }

      return console.table(
        data.map((item) => {
          return {
            account: item.name,
            appKey: item.appKey,
          };
        })
      );
    })
    .catch((error) => {
      console.log(logs.error(error.message));
    });
};

const remove = async () => {
  const id = localStorage.getItem("userId");

  if (!id) {
    return console.log(
      logs.warning(`You must be logged in to perform this function`)
    );
  }

  const { data } = await api.get(`/v1/user/account?id=${id}`);

  if (data.length === 0) {
    console.log(logs.warning("No account registered"));
  }

  const accounts = data.map((item) => ({
    name: item.name,
  }));

  return inquirer
    .prompt([
      {
        type: "list",
        choices: accounts,
        message: "Select a account",
        default: path.basename(process.cwd()),
        name: "selected",
      },
    ])
    .then(({ selected }) => {
      return inquirer
        .prompt([
          {
            type: "confirm",
            message: `Are you sure you want to remove the account: ${selected}?`,
            name: `account`,
          },
        ])
        .then(({ account }) => {
          if (account) {
            api
              .delete("/v1/user/account", {
                id,
                name: account,
              })
              .then(({ data }) => {
                if (data.error) {
                  return console.log(data.message);
                }

                return console.log(
                  logs.info(
                    `Account: ${logs.success(
                      account
                    )} has been successfully removed!`
                  )
                );
              })
              .catch((error) => {
                console.log(error.message);
                console.log(
                  logs.error(
                    "Unable to create a new user at this time, please try again"
                  )
                );
              });
          } else {
            return;
          }
        });
    })
    .catch((error) => {
      console.log(error.message);
      console.log(
        logs.error("Unable to create a new user at this time, please try again")
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

const newUser = async () => {
  return inquirer
    .prompt([
      {
        type: "text",
        name: "email",
        message: "* Email: ",
        default: path.basename(process.cwd()),
      },
      {
        type: "text",
        name: "password",
        message: "* password: ",
        default: path.basename(process.cwd()),
      },
    ])
    .then(async ({ password, email }) => {
      if (!password || !email) {
        return console.log(logs.error(`Invalide fields`));
      }

      const { data } = await api.post("/v1/user", {
        email: email.trim(),
        password: password.trim(),
      });

      if (data.error) {
        return console.log(logs.error(data.message));
      }

      console.log(
        logs.success(
          `\n User create successfully, email: ${logs.info(email)} \n`
        )
      );

      return loginMethod(email, password);
    })
    .catch((error) => {
      console.log(error.message);
      console.log(
        logs.error("Unable to create a new user at this time, please try again")
      );
    });
};

const loginMethod = async (email, password) => {
  const { data } = await api.post("/v1/login", {
    email: email.trim(),
    password: password.trim(),
  });

  if (data.error) {
    return console.log(logs.error(data.error));
  }

  global.localStorage.setItem("token", data.token);
  global.localStorage.setItem("userId", data.user._id);

  return console.log(
    logs.success(`Login successfully, email: ${logs.info(email)}`)
  );
};

const login = async () => {
  return inquirer
    .prompt([
      {
        type: "text",
        name: "email",
        message: "* Email: ",
        default: path.basename(process.cwd()),
      },
      {
        type: "password",
        name: "password",
        message: "* password: ",
        default: path.basename(process.cwd()),
      },
    ])
    .then(async ({ password, email }) => {
      return loginMethod(email, password);
    })
    .catch(() => {
      console.log(logs.error("Unable to login at this time, please try again"));
    });
};

module.exports = {
  add,
  use,
  info,
  logout,
  list,
  remove,
  login,
  databases,
  findAll,
  filter,
  desc,
  newUser,
};
