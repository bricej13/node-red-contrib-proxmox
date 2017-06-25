module.exports = function(RED) {
	var rp = require("request-promise");

	function ProxmoxServerNode(n) {
		RED.nodes.createNode(this,n);
        var self = this;
		this.host = n.host;
		this.port = n.port;

        if (this.credentials) {
            this.username = this.credentials.username;
            this.password = this.credentials.password;
        }

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

            return rp(options)
                .then(function (body) {
                    for (var id in self.childNodes) {
                        if (self.childNodes.hasOwnProperty(id)) {
                            self.childNodes[id].status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                        }
                    }

                    self.auth = body.data
                    self.log("Successfully connected to Proxmox: " + self.username + "@" + self.host + ":" + self.port);

                    self.isConnected = true;

                }).catch(function(error) {
                    self.isConnected = false;
                    delete self.auth;

                    for (var id in self.childNodes) {
                        if (self.childNodes.hasOwnProperty(id)) {
                            self.childNodes[id].status( {fill:"red",shape:"ring",text:"authentication failed"});
                        }
                    }

                    self.error("Failed to connect to Proxmox");
                    self.error(error);
                    self.error(JSON.stringify(response));

                }).finally(function() {
                    this.isConnecting = false;
                });
		}
	}
	RED.nodes.registerType("proxmox-server",ProxmoxServerNode, {
        credentials: {
            username: {type:"text"},
            password: {type:"password"}
        }
    });
}
