const axios = require("axios");
const path = require("path");
const { LocalStorage } = require("node-localstorage");
global.localStorage = new LocalStorage(path.resolve(__dirname, "../local"));

const token = localStorage.getItem("token");

const instance = axios.create({
  baseURL: "https://plutom.herokuapp.com",
  timeout: 15000,
  headers: { Authorization: `Bearer ${token}` },
});

module.exports = instance;
