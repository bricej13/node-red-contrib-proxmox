module.exports = function(RED) {
	var request = require("request");

	function ProxmoxApiNode(config) {

		RED.nodes.createNode(this,config);
		this.path = config.path;
		this.method = config.method;
		this.payload = config.payload;
		this.server = RED.nodes.getNode(config.server);
		this.baseURL = 'https://' + this.server.host + ':' + this.server.port;
		this.jar = request.jar();
		var node = this;

		node.on('input', function(msg) {
			if (node.auth) {
				var endpoint = "/api2/json";

				if (node.path || msg.path) {
					endpoint += "/" + (msg.path || node.path);
				}

				var requestOptions = node.setupOptions(endpoint, (msg.method || node.method), msg);
				node.callApi(requestOptions, msg, 5);
			}
		});

		node.setupOptions = function(endpoint, method, msg) {
			var options = { method: method,
				url: node.baseURL + endpoint,
				strictSSL: false,
				json: true,
				jar: node.jar,
			};

            // Add payload & headers for write operations
            if (["PUT", "POST", "DELETE"].includes(method)) {

                if (msg.payload || node.payload) {
                    if (typeof msg.payload === 'object') {
                        options.form = msg.payload;
                    }
                    else if (node.payload !== ""){
                        try {
                            var payloadObject = JSON.parse(node.payload);
                            options.form = payloadObject;
                        } catch (e) {
                            node.error("Error parsing JSON payload:")
                            node.error(node.payload);
                        }
                    }
                }

                options.headers = {
                    'CSRFPreventionToken': node.auth.CSRFPreventionToken,
                    'cache-control': 'no-cache', 
                    'content-type': 'application/x-www-form-urlencoded'
                }
            }

            // node.log(JSON.stringify(options));

            return options;
        }

        node.callApi = function(options, msg, ttl) {
            // node.log("Calling API with options:");
            // node.log(JSON.stringify(options));
			request(options, function (error, response, body) {
				if (response.statusCode === 200) {
					msg.payload = response.body.data;
					node.send(msg);
				} else if (response.statusCode === 401) {
                    node.authenticate(options, msg, ttl);
				} else {
					node.error(error);
					node.error(JSON.stringify(response));
					node.error(JSON.stringify(body));
				}
			});
		}

		node.authenticate = function(requestOptions, msg, ttl) {
			var options = { method: 'POST',
				url: node.baseURL + '/api2/json/access/ticket',
				strictSSL: false,
				json: true,
				headers: { 'cache-control': 'no-cache', 'content-type': 'application/x-www-form-urlencoded' },
				form: { 
					username: node.server.username,
					password: node.server.password
				} 
			};

			request(options, function (error, response, body) {
				if (response.statusCode === 200) {
					node.status({fill:"green",shape:"dot",text:"authenticated"});
					node.log("Successfully connected to Proxmox");
					var cookie = request.cookie("PVEAuthCookie=" + response.body.data.ticket);
					node.jar.setCookie(cookie, node.baseURL);
					node.auth = response.body.data;

                    // node.log(JSON.stringify(node.auth));

                    // Retry previous request if needed
                    if (typeof requestOptions !== 'undefined' && typeof msg !== 'undefined' && typeof ttl !== 'undefined') {
                        if (ttl > 0) {
                            // node.log("Re-authenticating to proxmox.");
                            node.callApi(requestOptions, msg, ttl-1);
                        }
                    }
				} else if (response.statusCode === 401) {
                } else {
					delete node.auth;
					node.status({fill:"red",shape:"ring",text:"authentication failed"});
					node.error("Failed to connect to Proxmox", error, JSON.stringify(response));
					node.error(error);
					node.error(JSON.stringify(response));
				}
			});

		}
		node.status({fill:"orange",shape:"ring",text:"unauthenticated"});
		node.authenticate();

	}
	RED.nodes.registerType("proxmox-api",ProxmoxApiNode);
}

