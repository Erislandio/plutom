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
            name: account.replace(/ /g, ""),
            appKey: appKey.replace(/ /g, ""),
            appToken: appToken.replace(/ /g, ""),
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

const use = async (param) => {
  const id = localStorage.getItem("userId");

  if (!id) {
    return console.log(
      logs.warning(`You must be logged in to perform this function`)
    );
  }

  const { data } = await api.get(`/v1/user/account?id=${id}`);

  if (data.length === 0) {
    return console.log(logs.warning("No account registered"));
  }

  const accounts = data.map((item) => ({
    name: item.name,
  }));

  return inquirer
    .prompt([
      {
        type: "list",
        choices: accounts,
        message: "Select a account to use",
        default: path.basename(process.cwd()),
        name: "selected",
      },
    ])
    .then(({ selected }) => {
      api
        .post("/v1/set/account", {
          name: selected,
          id,
        })
        .then(({ data }) => {
          if (data.error) {
            return console.log(logs.error(data.message));
          }

          return console.log(
            logs.success(`You are using the account: ${selected}`)
          );
        })
        .catch(() => {
          console.log(
            logs.error("Unable to use a account at this time, please try again")
          );
        });
    })
    .catch((error) => {
      console.log(error.message);
      console.log(
        logs.error("Unable to use a account at this time, please try again")
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

        if (data.account && data.account.name) {
          console.log(
            logs.warning(
              `You are using the account: ${logs.info(data.account.name)}`
            )
          );
        }

        if (data.accounts.length === 0) {
          return console.log(logs.warning("No account registered"));
        } else {
          console.log(logs.warning("Accounts"));

          return console.table(
            data.accounts.map((item) => {
              return {
                account: item.name,
                appKey: item.appKey,
              };
            })
          );
        }
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
        return console.log(logs.warning("\n No accounts registered, try the --add command"));
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
    return console.log(logs.warning("No account registered"));
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
        .then(async ({ account }) => {
          if (account) {
            const accountId = data.find((item) => item.name === selected);

            api
              .delete("/v1/user/account", {
                data: {
                  id,
                  accountId,
                },
              })
              .then(({ data }) => {
                if (data.error) {
                  return console.log(data.message);
                }

                return console.log(
                  logs.info(
                    `Account: ${logs.success(
                      selected
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

            api.get(`/v1/user?id=${id}`).then(({ data }) => {
              if (data.account) {
                if (data.account.name === selected) {
                  api
                    .post(`/v1/exit/account`, {
                      id,
                    })
                    .then(() => {
                      console.log(
                        logs.info(
                          `You have been successfully logged out of the account: ${selected}`
                        )
                      );
                    })
                    .catch(() => {
                      console.log(
                        logs.error(
                          `An error occurred while trying to log out of the account: ${selected}`
                        )
                      );
                    });
                }
              }
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

const isValid = (id) => {
  if (!id) {
    console.log(
      logs.warning(
        `\n You need to be logged into an account, use the: ${logs.info(
          "--login command"
        )}`
      )
    );

    return false;
  }

  return true;
};

const databases = async () => {
  const id = localStorage.getItem("userId");

  if (!isValid(id)) return;
  try {
    return api
      .post("/v1/search/databases", {
        id,
      })
      .then(({ data }) => {
        if (data.error) {
          console.log("\n");
          return console.log(logs.warning(data.message));
        }
        console.log("\n");
        console.table(data);
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
  const id = localStorage.getItem("userId");

  if (!isValid(id)) return;

  const {
    type,
    columns,
    where,
    from: [{ table }],
  } = query;

  const find = formateWhere(where);

  if (columns === "*" && where !== null) {
    return api
      .post(`/v1/search`, {
        id,
        acronym: table,
        fields: "_all",
        where: find,
      })
      .then((res) => {
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

  return api
    .post("/v1/search", {
      id,
      acronym: table,
      fields: formateColumns,
      where: find,
    })
    .then((res) => {
      if (res.status === 200) {
        console.log("\n");
        return console.table(res.data);
      }
      return null;
    });
};

const desc = async (query) => {
  const id = localStorage.getItem("userId");

  if (!id) {
    return console.log(
      logs.warning(
        `\n You need to be logged into an account, use the: ${logs.info(
          "--login command"
        )}`
      )
    );
  }

  if (query.length !== 2) {
    return console.log(logs.warning("\n Invalid acronym \n "));
  }

  return api
    .post(`/v1/desc`, {
      acronym: query,
      id,
    })
    .then(({ data }) => {
      if (data.error) {
        return console.log(logs.error(data.message));
      }

      if (data.length) {
        console.log("\n");
        console.table(
          data.map((item) => ({
            name: item.name,
            type: item.type,
            isSearchable: item.isSearchable,
            isFilter: item.isFilter,
          }))
        );
      }
    })
    .catch(() => {
      console.log(logs.error("Unable to desc table, please try again"));
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
    email: email.trim().replace(/ /g, ""),
    password: password.trim().replace(/ /g, ""),
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
