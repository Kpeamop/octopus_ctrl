const net=require('net');
const { client,clientlist }=require('./client');
const { task,tasklist }=require('./task');
// const cron=require('./cron');

module.exports=Server=function()
{
	var $this=this;

	this.config={ connection: { port: 6778 } };

	// this.cron=new cron();
	this.tasks=new tasklist();
	this.clients=new clientlist();

	this.ev=
	{
		data: () => {},
		connect: (client) => { console.log('c'/*,client*/); },
		disconnect: (client) => { console.log('d'/*,client*/); },
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
		.on('connection',sock =>
		{
			console.log('connect from',sock.server._connectionKey);

			var c=new client(sock);

			var i;

			if((i=this.clients.indexOfAlias(c.props.alias))>=0)
			{
				if(this.clients.items(i).props.active) return sock.end('{"error":"Already connect from '+sock.remoteAddress+'"}');

				c.props.enabled=this.clients.items(i).props.enabled;
				this.clients.replaceObject(c,i);
			}
			else this.clients.addObject(c);

			c.ev.connect();

			this.ev.connect(c);
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
