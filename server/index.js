const net=require('net');
const { client,clientlist }=require('./client');
const { task,tasklist }=require('./task');

module.exports=Server=function()
{
	var $this=this;

	this.config={ connection: { port: 6778 } };
	this.proto={};

	this.tasks=new tasklist();
	this.clients=new clientlist();
	// this.runlist=new runlist(this.clients); // summary tasks of clients

	this.ev=
	{
		data: () => {},
		connect: (sock) => { console.log('c'/*,sock*/); },
		disconnect: (sock) => { console.log('d'/*,sock*/); },
		error: () => {},
	};

	this.set=function(k,v)
	{
		this[k]=v;

		return this;
	};

	this.run=() =>
	{
		this.server=net.createServer()
		.on('connection',(sock) =>
		{
			console.log('connect from',sock.server._connectionKey);

			// sock.on('data',(data) => this.ev.data(data) );
			// sock.on('close',() =>  this.ev.disconnect(this) );

			this.clients.add(sock).ev.connect();

			this.ev.connect(sock);
		})
		.listen({
					port: this.config.connection.port,
					host: '0.0.0.0',
					exclusive: true
				},
				() => { console.log('octopus server runing on','\t:'+this.config.connection.port); }
		);
	};
};
