declare module 'medooze-rtmp-server' {
	import { EventEmitter } from 'events';

	type Uuid = string;


	interface MedoozeEmitter {
		emitter: null|EventEmitter;
		on   (...args: Parameters<EventEmitter['on']>): this;
		once (...args: Parameters<EventEmitter['once']>): this;
		off  (...args: Parameters<EventEmitter['removeListener']>): this;
		stop (): void;
	}
	export interface Status<Code extends string, Level extends 'error'|'status'|'warning'>{
		code: Code;
		level: Level;
	}
	export interface Stream extends MedoozeEmitter {
		constructor (stream: Stream['stream']): void;
		//id: number; // private
		getId (): number;
		sendStatus (status: Status<any, any>, desc?: string): void;
		createIncomingStreamBridge (): IncomingStreamBridge;
		stop (): void;
		stream: any; // native code; property set in constructor()

		// `on` is inherited from EventEmmiter, here are possible variants of usage:

		on (eventName: 'stopped', callback: (...params: Array<any>) => void): this;

		// see ProcessCommandMessage(...) in src/rtmp-server.i
		// see SendCommand(...) in media-server/src/rtmp/rtmpclientconnection.cpp
		on (
			eventName: 'cmd',
			callback: (cmd: {name: 'publish', params: null}, lastFolder: string, firstFolder: string) => void,
		): this;
	}
	export interface Client extends MedoozeEmitter {
		constructor (connection: any, appName: string): void;

		//maxId: number; // private?
		streams: Map<number, Stream>;
		on (eventName: 'stream', callback: (stream: Stream) => void): this;

		// id: Uuid; // private
		// appName: string; // private
		getId (): Uuid;
		getAppName (): string;
		accept (): void;
		reject (): void;
		stop (): void;
	}
	type LayerEncodings = {
		encodingId     : any,
		simulcastIdx   : number,
		spatialLayerId : number,
		temporalLayerId: number,
		bitrate        : number,
	};
	export interface IncomingStreamTrackBridge {
		getId (): string; // 'audio', 'video', or custom string
		getSSRCs (): Record<string, {media: any, rtx: any}>; // fixme
		getStats (): Record<string, {
			waitTime : {
				min: number,
				max: number,
				avg: number,
			},
			media   : {
				numPackets:      number,
				numPacketsDelta: number,
				numFrames:       number,
				numFramesDelta:  number,
				totalBytes:      number,
				bitrate:         number,
				layers: Array<{
					spatialLayerId:  number,// Spatial layer id
					temporalLayerId: number,// Temporatl layer id
					totalBytes:      number,// total rtp received bytes for this layer
					numPackets:      number,// number of rtp packets received for this layer
					bitrate:         number,// average bitrate received during last second for this layer
				}>
			},
			rtx: {},
			numPackets:      number,
			numPacketsDelta: number,
			numFrames:       number,
			numFramesDelta:  number,
			bitrate:         number,
			total:           number,
			timestamp:       number,
			simulcastIdx:    number,
		}>;
		getActiveLayers (): {
			active: Array<LayerEncodings>,
			inactive: Array<LayerEncodings>,
			layers: Array<LayerEncodings>,
		};
		getMedia (): 'audio'|'video';
		on   (...args: Parameters<EventEmitter['on']>): this;
		once (...args: Parameters<EventEmitter['once']>): this;
		off  (...args: Parameters<EventEmitter['removeListener']>): this;
		stop (): void;
	}
	export interface IncomingStreamBridge extends MedoozeEmitter {
		getId (): Uuid;
		getTrack (trackId: string): IncomingStreamTrackBridge;
		getTracks (): Array<IncomingStreamTrackBridge>;
		getAudioTracks (): Array<IncomingStreamTrackBridge>;
		getVideoTracks (): Array<IncomingStreamTrackBridge>;
		getStats (): Record<Uuid, ReturnType<IncomingStreamTrackBridge['getStats']>>;
		detach (): void;
		attachTo (stream: Stream): void;
		stop (): void;
	}
	export interface Application extends MedoozeEmitter {
		on (name: 'connect', callback: (client: Client) => void): this;
		//application: any; // native code
		clients: Map<Uuid, Client>; // private?
		stop (): void;
	}
	export interface Server { // Server.js, not RTMPServer.js
		//server: any; // native code
		addApplication (name: string, application: Application): void;
		start (port: number): void;
		stop (): void;
	}

	// Everything below is exported by RTMPServer.js:

	export function terminate (): void;
	export function enableLog (flag: boolean): void;
	export function enableDebug (flag: boolean): void;
	export function enableUltraDebug (flag: boolean): void;
	export function createIncomingStreamBridge (): IncomingStreamBridge;
	export function createApplication (): Application;
	export function createServer (): Server;

	export const NetConnection:
	{
		Call:
		{
			BadVersion		: Status<"NetConnection.Call.BadVersion"		,"error">,	//Packet encoded in an unidentified format.
			Failed			: Status<"NetConnection.Call.Failed"		,"error">,	//The NetConnection.call() method was not able to invoke the server-side method or command.
			Prohibited		: Status<"NetConnection.Call.Prohibited"		,"error">,	//An Action Message Format (AMF) operation is prevented for security reasons. Either the AMF URL is not in the same domain as the file containing the code calling the NetConnection.call() method, or the AMF server does not have a policy file that trusts the domain of the the file containing the code calling the NetConnection.call() method.
		},
		Connect:
		{
			AppShutdown		: Status<"NetConnection.Connect.AppShutdown"	,"error">,	//The server-side application is shutting down.
			Closed			: Status<"NetConnection.Connect.Closed"		,"status">,	//The connection was closed successfully.
			Failed			: Status<"NetConnection.Connect.Failed"		,"error">,	//The connection attempt failed.
			IdleTimeout		: Status<"NetConnection.Connect.IdleTimeout"	,"status">,	//Flash Media Server disconnected the client because the client was idle longer than the configured value for <MaxIdleTime>. on Flash Media Server, <AutoCloseIdleClients> is disabled by default. When enabled, the default timeout value is 3600 seconds (1 hour). For more information, see Close idle connections.
			InvalidApp		: Status<"NetConnection.Connect.InvalidApp"		,"error">,	//The application name specified in the call to NetConnection.connect() is invalid.
			NetworkChange		: Status<"NetConnection.Connect.NetworkChange"	,"status">,	//Flash Player has detected a network change, for example, a dropped wireless connection, a successful wireless connection,or a network cable loss.Use this event to check for a network interface change. Don't use this event to implement your NetConnection reconnect logic. Use "NetConnection.Connect.Closed" to implement your NetConnection reconnect logic.
			Rejected		: Status<"NetConnection.Connect.Rejected"		,"error">,	//The connection attempt did not have permission to access the application.
		},
	};

	export const NetStream:
	{
		Failed				: Status<"NetStream.Failed"				,"error">,	//(Flash Media Server) An error has occurred for a reason other than those listed in other event codes.
		Buffer:
		{
			Empty			: Status<"NetStream.Buffer.Empty"			,"status">,	//Flash Player is not receiving data quickly enough to fill the buffer. Data flow is interrupted until the buffer refills, at which time a NetStream.Buffer.Full message is sent and the stream begins playing again.
			Flush			: Status<"NetStream.Buffer.Flush"			,"status">,	//Data has finished streaming, and the remaining buffer is emptied. Note: Not supported in AIR 3.0 for iOS.
			Full			: Status<"NetStream.Buffer.Full"			,"status">,	//The buffer is full and the stream begins playing.
		},
		Connect:
		{
			Closed			: Status<"NetStream.Connect.Closed"			,"status">,	//The P2P connection was closed successfully. The info.stream property indicates which stream has closed. Note: Not supported in AIR 3.0 for iOS.
			Failed			: Status<"NetStream.Connect.Failed"			,"error">,	//The P2P connection attempt failed. The info.stream property indicates which stream has failed. Note: Not supported in AIR 3.0 for iOS.
			Rejected		: Status<"NetStream.Connect.Rejected"		,"error">,	//The P2P connection attempt did not have permission to access the other peer. The info.stream property indicates which stream was rejected. Note: Not supported in AIR 3.0 for iOS.
			Sucess			: Status<"NetStream.Connect.Success"		,"status">,	//The P2P connection attempt succeeded. The info.stream property indicates which stream has succeeded. Note: Not supported in AIR 3.0 for iOS.
		},
		DRM:
		{
			UpdateNeeded		: Status<"NetStream.DRM.UpdateNeeded"		,"status">,	//A NetStream object is attempting to play protected content, but the required Flash Access module is either not present, not permitted by the effective content policy, or not compatible with the current player. To update the module or player, use the update() method of flash.system.SystemUpdater. Note: Not supported in AIR 3.0 for iOS.
		},
		MulticasStream:
		{
			Reset			: Status<"NetStream.MulticastStream.Reset"		,"status">,	//A multicast subscription has changed focus to a different stream published with the same name in the same group. Local overrides of multicast stream parameters are lost. Reapply the local overrides or the stream<s default parameters will be used.

		},
		Pause:
		{
			Notify			: Status<"NetStream.Pause.Notify"			,"status">,	//The stream is paused.

		},
		Play:
		{
			Failed			: Status<"NetStream.Play.Failed"			,"error">,	//An error has occurred in playback for a reason other than those listed elsewhere in this table, such as the subscriber not having read access. Note: Not supported in AIR 3.0 for iOS.
			FileStructureInvalid	: Status<"NetStream.Play.FileStructureInvalid"	,"error">,	//(AIR and Flash Player 9.0.115.0) The application detects an invalid file structure and will not try to play this type of file. Note: Not supported in AIR 3.0 for iOS.
			InsufficientBW		: Status<"NetStream.Play.InsufficientBW"		,"warning">,	//(Flash Media Server) The client does not have sufficient bandwidth to play the data at normal speed. Note: Not supported in AIR 3.0 for iOS.
			NoSupportedTrackFound	: Status<"NetStream.Play.NoSupportedTrackFound"	,"status">,	//(AIR and Flash Player 9.0.115.0) The application does not detect any supported tracks (video, audio or data) and will not try to play the file. Note: Not supported in AIR 3.0 for iOS.
			PublishNotify		: Status<"NetStream.Play.PublishNotify"		,"status">,	//The initial publish to a stream is sent to all subscribers.
			Reset			: Status<"NetStream.Play.Reset"			,"status">,	//Caused by a play list reset. Note: Not supported in AIR 3.0 for iOS.
			Start			: Status<"NetStream.Play.Start"			,"status">,	//Playback has started.
			Stop			: Status<"NetStream.Play.Stop"			,"status">,	//Playback has stopped.
			StreamNotFound		: Status<"NetStream.Play.StreamNotFound"		,"error">,	//The file passed to the NetStream.play() method can't be found.
			Transition		: Status<"NetStream.Play.Transition"		,"status">,	//(Flash Media Server 3.5) The server received the command to transition to another stream as a result of bitrate stream switching. This code indicates a success status event for the NetStream.play2() call to initiate a stream switch. If the switch does not succeed, the server sends a NetStream.Play.Failed event instead. When the stream switch occurs, an onPlayStatus event with a code of "NetStream.Play.TransitionComplete" is dispatched. For Flash Player 10 and later. Note: Not supported in AIR 3.0 for iOS.
			UnpublishNotify		: Status<"NetStream.Play.UnpublishNotify"		,"status">,	//An unpublish from a stream is sent to all subscribers.

		},
		Publish:
		{
			BadName		: Status<"NetStream.Publish.BadName"			,"error">,	//Attempt to publish a stream which is already being published by someone else.
			Idle		: Status<"NetStream.Publish.Idle"				,"status">,	//The publisher of the stream is idle and not transmitting data.
			Start		: Status<"NetStream.Publish.Start"				,"status">,	//Publish was successful.
			Rejected	: Status<"NetStream.Publish.Rejected"			,"status">,
			Denied		: Status<"NetStream.Publish.Denied"				,"status">,
		},
		Record:
		{
			AlreadyExists	: Status<"NetStream.Record.AlreadyExists"			,"status">,	//The stream being recorded maps to a file that is already being recorded to by another stream. This can happen due to misconfigured virtual directories.
			Failed		: Status<"NetStream.Record.Failed"				,"error">,	//An attempt to record a stream failed.
			NoAccess	: Status<"NetStream.Record.NoAccess"			,"error">,	//Attempt to record a stream that is still playing or the client has no access right.
			Start		: Status<"NetStream.Record.Start"				,"status">,	//Recording has started.
			Stop		: Status<"NetStream.Record.Stop"				,"status">,	//Recording stopped.
		},
		Seek:
		{
			Failed		: Status<"NetStream.Seek.Failed"				,"error">,	//The seek fails, which happens if the stream is not seekable.
			InvalidTime	: Status<"NetStream.Seek.InvalidTime"			,"error">,	//For video downloaded progressively, the user has tried to seek or play past the end of the video data that has downloaded thus far, or past the end of the video once the entire file has downloaded. The info.details property of the event object contains a time code that indicates the last valid position to which the user can seek.
			Notify		: Status<"NetStream.Seek.Notify"				,"status">,	//The seek operation is complete. Sent when NetStream.seek() is called on a stream in AS3 NetStream Data Generation Mode. The info object is extended to include info.seekPoint which is the same value passed to NetStream.seek().

		},
		Unpublish:
		{
			Success		: Status<"NetStream.Unpublish.Success"			,"status">,	//The unpublish operation was successful.

		},
		Unpause:
		{
			Notify		: Status<"NetStream.Unpause.Notify"				,"status">,	//The stream is resumed.
		},
		Step:
		{
			Notify		: Status<"NetStream.Step.Notify"				,"status">,	//The step operation is complete. Note: Not supported in AIR 3.0 for iOS.
		}
	};
}
