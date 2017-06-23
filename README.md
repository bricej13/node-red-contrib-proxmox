## Node-RED Proxmox
This is a Node-RED module to allow easy access to the Proxmox API. 
This node requires that you have access to a running instance of Proxmox and have an account with permissions to access the API.

### Nodes
This module exposes two nodes: a Proxmox Server configuration node, and a generic Proxmox API node. The Proxmox Server configuration allows for configuration of Proxmox servers. The Proxmox API node performs the action of calling the Proxmox API and returning the result.

### Proxmox API Node
Upon a trigger, this node will call the API path indicated. The results of the call will be set as the value of `msg.payload`
The folowing values can be set on the `msg` object and they will overwrite any manually entered settings:
- `msg.path`: The API path to query. List of available paths is available at the API documentation link below.
- `msg.method`: A method from the following list: GET, POST, PUT, DELETE. PUT and POST require additional information to be passed in the payload.
- `msg.payload`: Body of the message to be sent on POST & PUT requests. See API docs for proper values. 

See the [Proxmox API Documentation](https://pve.proxmox.com/pve-docs/api-viewer/index.html) for further details.

Tested with Proxmox version 4.4



## TODO:
- [x] Add a README.md
- [ ] Update configuration to use `credentials` for username/password
- [ ] Package for NPM
