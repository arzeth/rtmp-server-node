const uuidV4		= require("uuid/v4");
const Native		= require("./Native");
const Emitter		= require("./Emitter");
const IncomingStreamTrackBridge = require("./IncomingStreamTrackBridge");


/**
 * The incoming streams represent the received media stream from a remote peer.
 */
class IncomingStreamBridge extends Emitter
{
	/**
	 * @ignore
	 * @hideconstructor
	 * private constructor
	 */
	constructor()
	{
		//Init emitter
		super();
		//Create new id
		this.id = uuidV4();
		
		//Create native bridge
		this.bridge = new Native.IncomingStreamBridge(this);
		
		//Store sources
		this.tracks = new Map();
		
		//Create audio and video tracks
		this.tracks.set("audio",new IncomingStreamTrackBridge("audio","audio",this.bridge.GetReceiver(),this.bridge.GetAudio()));
		this.tracks.set("video",new IncomingStreamTrackBridge("video","video",this.bridge.GetReceiver(),this.bridge.GetVideo()));
		
		//Listen for aac config
		this.onaacconfig = (config)=>{
			/**
			* IncomingStreamBridge aac specific config received
			*
			* @name aacconfig
			* @memberof IncomingStreamBridge
			* @kind event
			* @argument {String} config
			*/
			this.emitter.emit("aacconfig", config);
		};
		
		//Event listeners
		this.onstreamstopped = (stream)=>{
			//If it is the same as ours
			if (this.stream===stream)
				//Detach
				this.detach();
		};
	}
	
	/**
	 * The media stream id
	 * @returns {String}
	 */
	getId()
	{
		return this.id;
	}
	
	/**
	 * Get statistics for all tracks in the stream
	 * 
	 * See OutgoingStreamTrack.getStats for information about the stats returned by each track.
	 * 
	 * @returns {Map<String>,Object} Map with stats by trackId
	 */
	getStats()
	{
		const stats = {};
		
		//for each track
		for (let track of this.tracks.values())
			//Append stats
			stats[track.getId()] = track.getStats();
		
		return stats;
	}
	
	/**
	 * Get track by id
	 * @param {String} trackId	- The track id
	 * @returns {IncomingStreamTrack}	- requested track or null
	 */
	getTrack(trackId)
	{
		//get it
		return this.tracks.get(trackId);
	}
	
	/**
	 * Get all the tracks
	* @returns {Array<IncomingStreamTrack>}	- Array of tracks
	 */
	getTracks()
	{
		//Return a track array
		return Array.from(this.tracks.values());
	}
	/**
	 * Get an array of the media stream audio tracks
	 * @returns {Array<IncomingStreamTrack>}	- Array of tracks
	 */
	getAudioTracks()
	{
		var audio = [];
		
		//For each track
		for (let track of this.tracks.values())
			//If it is an video track
			if(track.getMedia().toLowerCase()==="audio")
				//Append to tracks
				audio.push(track);
		//Return all tracks
		return audio;
	}
	
	/**
	 * Get an array of the media stream video tracks
	 * @returns {Array<IncomingStreamTrack>}	- Array of tracks
	 */
	getVideoTracks()
	{
		var video = [];
		
		//For each track
		for (let track of this.tracks.values())
			//If it is an video track
			if(track.getMedia().toLowerCase()==="video")
				//Append to tracks
				video.push(track);
		//Return all tracks
		return video;
	}
	
	detach()
	{
		//If we had an stream
		if (this.stream)
		{
			//Remove listener
			this.stream.stream.get().RemoveMediaListener(this.bridge);
			//Remove listener
			this.stream.off("stopped", this.onstreamstopped);
		}
		//No stream
		this.stream = null;
	}
	
	attachTo(stream)
	{
		//Detach just in case
		this.detach();
		
		//If attaching to a stream
		if (stream)
		{
			//Attach
			stream.stream.get().AddMediaListener(this.bridge);
			//Listen for stopped event
			stream.once("stopped", this.onstreamstopped);
		}
		
		//Store new stream
		this.stream = stream;
	}
	
		
	/**
	 * Removes the media stream from the transport and also detaches from any attached incoming stream
	 */
	stop()
	{
		//Don't call it twice
		if (!this.bridge) return;
		
		//Detach
		this.detach();
		
		//Stop all streams
		for (let track of this.tracks.values())
			//Stop track
			track.stop();
		
		//Clear tracks jic
		this.tracks.clear();
		
		//Stop bridge
		this.bridge.Stop();
		
		/**
		* IncomingStreamBridge stopped event
		*
		* @name stopped
		* @memberof IncomingStreamBridge
		* @kind event
		* @argument {IncomingStreamBridge} incomingStreamBridge
		*/
		this.emitter.emit("stopped", this);
		
		//Stop emitter
		super.stop();
		
		//Remove bridge reference, so destructor is called on GC
		this.bridge = null;
	}
}

module.exports = IncomingStreamBridge;
