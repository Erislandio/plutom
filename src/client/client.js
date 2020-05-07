const { account, appKey, appToken } = require("../account.json");
const axios = require("axios");

class VtexClient {
  constructor() {
    this.baseUrl = `https://${account}.vtexcommercestable.com.br`;
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-vtex-api-appKey": appKey,
      "x-vtex-api-appToken": appToken,
    };
  }

  async databases() {
    try {
      const { data } = await axios.get(`${this.baseUrl}/api/dataentities`, {
        headers: {
          ...this.headers,
        },
      });

      return data;
    } catch (error) {
      return error;
    }
  }

  async findAll(acronym, fields, where) {
    try {
      const { data, status } = await axios.get(
        `${this.baseUrl}/api/dataentities/${acronym}/search?_fields=${fields}&_where=${where}`,
        {
          headers: {
            ...this.headers,
          },
        }
      );

      return {
        data,
        status,
      };
    } catch (error) {
      return error;
    }
  }

  async desc(acronym) {
    try {
      const { data, status } = await axios.get(
        `${this.baseUrl}/api/dataentities/${acronym}/`,
        {
          headers: {
            ...this.headers,
          },
        }
      );

      return {
        data,
        status,
      };
    } catch (error) {
      return error;
    }
  }
}

module.exports = VtexClient;
