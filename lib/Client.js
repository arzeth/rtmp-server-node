const uuidV4		= require("uuid/v4");
const Emitter		= require("./Emitter");
const Stream		= require("./Stream");

class Client extends Emitter
{
	constructor(connection,appName)
	{
		//Init emitter
		super();
		//Create new id
		this.id = uuidV4();
		//Get app name from request url
		this.appName = appName;
		//Store native connection
		this.connection = connection;
		//Map of streams
		this.streams = new Map();
		//Ids
		this.maxId = 0;
		
		//Events
		this.onstream = (netstream)=>{
			//Create stream wrapper
			const stream = new Stream(netstream);
			//New id
			const id = this.maxId++;
			//Add to stream
			this.streams.set(id,stream);
			//Listen for stopped event
			stream.once("stopped",()=>{
				//Delete from set
				this.streams.delete(id);
			});
			//Emit event
			this.emitter.emit("stream",stream);
		};
		this.ondisconnect = ()=>{
			//NO connection anymore
			this.connection = false;
			//Stop us
			this.stop();
		};
		
		
	}
	
	getId()
	{
		return this.id;
	}
	
	getAppName()
	{
		return this.appName;
	}
	
	accept()
	{
		//Accept and pass us as listener
		this.connection.get().Accept(this);
	}
	
	reject()
	{
		//Reject
		this.connection.get().Reject();
		//Stop
		this.stop();
	}
	
	stop()
	{
		//If already stopped
		if (!this.streams)
			//Do nothing
			return;
		
		//If got connection
		if (this.connection)
			//Disconnect connection
			this.connection.get().Disconnect();
		
		//Stop all stream
		for (const [id,stream] of this.streams)
			//Stop it
			stream.stop();
		
		//Launche stopped event
		this.emitter.emit("stopped",this);
		
		//Stop emitter
		super.stop();
		//Release mem
		this.connection = null;
		this.streams = null;
	}
}

module.exports = Client;
