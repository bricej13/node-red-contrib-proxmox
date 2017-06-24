module.exports = function(RED) {
	var request = require("request");

	function ProxmoxServerNode(n) {
		RED.nodes.createNode(this,n);
        var self = this;
		this.host = n.host;
		this.port = n.port;
		this.username = n.username;
		this.password = n.password;

		this.baseURL = 'https://' + this.host + ':' + this.port;
        this.isConnected = false;
        this.isConnecting = false;
        this.auth = {};
        this.childNodes = {};

        this.register = function(childNode) {
            this.childNodes[childNode.id] = childNode;
            if (!this.isConnected && !this.isConnecting) {
                this.isConnecting = true;
                this.authenticate();
            } else if (this.isConnected) {
                childNode.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
            }
        }

        this.deregister = function(childNode) {
            delete this.childNodes[childNode.id];
        }

		this.authenticate = function() {
			var options = { method: 'POST',
				url: this.baseURL + '/api2/json/access/ticket',
				strictSSL: false,
				json: true,
				headers: { 'cache-control': 'no-cache', 'content-type': 'application/x-www-form-urlencoded' },
				form: { 
					username: this.username,
					password: this.password
				} 
			};

			request(options, function (error, response, body) {
				if (response.statusCode === 200) {
                    for (var id in self.childNodes) {
                        if (self.childNodes.hasOwnProperty(id)) {
                            self.childNodes[id].status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                        }
                    }

                    self.auth = response.body.data
					self.log("Successfully connected to Proxmox");

                    self.isConnected = true;

				} else if (response.statusCode === 401) {
                } else {
					delete self.auth;
                    for (var id in self.childNodes) {
                        if (self.childNodes.hasOwnProperty(id)) {
                            self.childNodes[id].status( {fill:"red",shape:"ring",text:"authentication failed"});
                        }
                    }
					self.error("Failed to connect to Proxmox", error, JSON.stringify(response));
					self.error(error);
					self.error(JSON.stringify(response));
				}
                this.isConnecting = false;
			});

		}
	}
	RED.nodes.registerType("proxmox-server",ProxmoxServerNode);
}
