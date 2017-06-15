module.exports = function(RED) {
	var request = require("request");

	function ProxmoxNodesNode(config) {

		RED.nodes.createNode(this,config);
		this.node = config.node;
		this.method = config.method;
		this.server = RED.nodes.getNode(config.server);
		this.baseURL = 'https://' + this.server.host + ':' + this.server.port;
		this.jar = request.jar();
		var node = this;
        var id2 = config.id2;

		node.on('input', function(msg) {
			if (node.auth) {
				var endpoint = "/api2/json/nodes";
				if (node.node || msg.proxmox-node) {
					endpoint += "/" + (node.node || msg.proxmox-node);
				}
				if (node.method || msg.proxmox-node-method) {
					endpoint += "/" + (node.method || msg.proxmox-node-method);

                    if (msg.proxmox-node-id2) {
						endpoint += "/" + (msg.proxmox-node-id2);
                    } else if(id2) {
						endpoint += "/" + (id2);
					} 
				}

				node.callApi(endpoint, msg);
			}
		});

		node.callApi = function(endpoint, msg) {
			var options = { method: 'GET',
				url: node.baseURL + endpoint,
				strictSSL: false,
				json: true,
				jar: node.jar
			};

			// node.log(JSON.stringify(options));
			
			request(options, function (error, response, body) {
				if (response.statusCode === 200) {
					msg.payload = response.body.data;
					node.send(msg);
				} else {
					node.error(error);
					node.error(JSON.stringify(response));
					node.error(JSON.stringify(body));
				}
			});
		}

		node.authenticate = function() {
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
				}
				else {
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
	RED.nodes.registerType("proxmox-nodes",ProxmoxNodesNode);
}

