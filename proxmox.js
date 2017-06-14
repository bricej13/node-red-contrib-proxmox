module.exports = function(RED) {
	var request = require("request");

	function ProxmoxNode(config) {

		RED.nodes.createNode(this,config);
		this.server = RED.nodes.getNode(config.server);
		var node = this;

		node.on('input', function(msg) {
			if (node.auth) {
				msg.payload = node.server;
				msg.payload.auth = node.auth;
				node.send(msg);
			}
		});

		node.authenticate = function() {
			var options = { method: 'POST',
				url: 'https://' + node.server.host + ':' + node.server.port + '/api2/json/access/ticket',
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

					var msg = {};
					msg.payload = response.body.data;
					node.send(msg);
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
	RED.nodes.registerType("proxmox",ProxmoxNode);
}

