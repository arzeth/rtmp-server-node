# rtmp-server-node
RTMP server for node

## Install
 
Just add the Medooze media server as a dependency to your node proyect:
```
    npm i --save rtmp-media-server
```

## Example

```
import RTMPServer from 'medooze-rtmp-server'
// or const RTMPServer = require('medooze-rtmp-server')

const bridge	= RTMPServer.createIncomingStreamBridge();
const demo	= RTMPServer.createApplication();
const rtmp	= RTMPServer.createServer();

// https://rtmp.example.com/demo
// https://rtmp.example.com/demo/user123
// https://rtmp.example.com/demo/user123/passpharse
rtmp.addApplication("demo", demo);
// Absolutely nothing will happen (and connection won't be closed or rejected by the server)
// if the url doesn't have "demo", i.e. https://rtmp.example.com
rtmp.start(1935);

demo.on("connect", (client)=>{
	// getAppName returns "demo" in case of https://rtmp.example.com/demo/user123
	// getAppName returns "demo/user123" in case of https://rtmp.example.com/demo/user123/passphrase
	console.log("connected on %O", client.getAppName());
	
	client.on("stream", (stream)=>{
		console.log("got stream: %O", stream.getId());
		
		stream.on("cmd", (cmd, ...params)=>{
			// params is ["", "demo"] in case of https://rtmp.example.com/demo
			// params is ["user123", "demo"] in case of https://rtmp.example.com/demo/user123
			// params is ["passphrase", "demo"] in case of https://rtmp.example.com/demo/user123/passphrase
			console.log("got cmd `%s` with params=%O", cmd.name, params);
			
			if (cmd.name === "publish")
			{
				try {
					//Start publishing
					bridge.attachTo(stream);
					//Started
					stream.sendStatus(RTMPServer.NetStream.Publish.Start);
				} catch (e) {
					//Log it
					console.error(e);
					//Error
					stream.sendStatus(RTMPServer.NetStream.Failed, e.toString());
				}
			}
		});
		
		stream.on("stopped", ()=>{
			console.log("stream stopped");
		});
	});
	
	client.accept();
});

```

## Author

Sergio Garcia Murillo @ Medooze

## Contributing
To get started, [Sign the Contributor License Agreement](https://www.clahub.com/agreements/medooze/media-server-node).

## License
MIT
