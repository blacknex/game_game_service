const REST = require("./rest.js");
const config = require("./config.json");
const Hub = require("./hub");

class MMService {
	constructor() {
		this.init();
	}

	async init() {
		this.hub = new Hub(config.hub);
		this.rest = new REST({ hub: this.hub }, config.rest);
	}
}

new MMService();