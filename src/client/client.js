const axios = require("axios");

const instance = axios.create({
  baseURL: "https://plutom.herokuapp.com",
  timeout: 5000,
  headers: {},
});

module.exports = instance;
