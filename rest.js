const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

class REST {
  constructor(components, config) {
    this.hub = components.hub;
    this.api = express();
    this.api.use(bodyParser.json());
    this.api.use(cors());
    this.api.post("/create", (req, res) => this.createGame(req, res));
    this.api.listen(config.port);
    console.log(`Listening on ${config.port}`);
  }

  async createGame(req, res) {
    try {
      if(!req.body.p1 || !req.body.p2) throw new Error("Players not set!");
      let p1 = await this.hub.addSession(req.body.p1);
      let p2 = await this.hub.addSession(req.body.p2);
      this.hub.createGame(p1, p2);
      //Apply in to pool 
      res.send({ p1, p2 });
    } catch (err) {
      console.log(err);
      res.status(400).send(err.message);
    }
  }
}

module.exports = REST;