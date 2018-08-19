debug=false;

exports.client=Client=function(sock)
{
	var $this=this;

	this.socket=sock;

	this.props=
	{
		starttime: (+new Date()/1000).toFixed(0),
		alias:'testclient1',
		enabled: true,
		active: true,
		ip: '0.0.0.0',
		loadavg: [11.234,2.345,3.2],
		uptime: 1117493,
		tasks: [] // todo: aliases of tasks
	};

	this.ev=
	{
		connect: () => {},
		disconnect: () => {},
		error: () => {},

		start: () => {},
		stdout: (data) => {},
		stderr: (data) => {},
		exit: () => {}
	};

	this.socket.on('data',(data) =>
	{
		var adata=data.toString().split(String.fromCharCode(10));

		adata.forEach((e,i) =>
		{
			if(!e) return;

			var jdata;

			try
			{
				jdata=JSON.parse(e);
			}
			catch(e)
			{
				console.error('data parse error',data.toString(),debug ? e : '');
			}

			if(jdata!==undefined)
			{
				console.log(jdata);
			}
		});
	})
	.on('error',(e) => { this.ev.error(e); })
	.on('close',function(e)
	{
		console.log('close',e);
	});

	this.toData=() => this.props;
};

exports.clientlist=ClientList=function()
{
	var clients=[];

	this.add=function(sock)
	{
		var client=new Client(sock);

		this.addObject(client);

		return client;
	};

	this.addObject=function(client)
	{
		if(client instanceof Client)
		{
			clients.push(client);

			return true;
		}
		else return false;
	};

	this.items=function(index)
	{
		if(typeof index=='number' && index<clients.length && index>=0) return clients[index];

		return false;
	};

	this.delete=function(index)
	{
		if(typeof index=='number' && index<clients.length && index>=0)
		{
			clients.splice(index,1);

			return true;
		}
		else return false;
	};

	this.deleteObject=function(client)
	{
		if(client instanceof Client)
		{
			var i=clients.indexOf(client);

			if(i>=0) return this.delete(i);
		}

		return false;
	};

	this.count=() => clients.length;

	this.indexOfAlias=function(alias)
	{
		var r=-1;

		clients.some((e,i) =>
		{
			if(e instanceof Client && e.props.alias==alias)
			{
				r=i;
				return true;
			}

			return false;
		});

		return r;
	};

	this.toData=() => clients.map(e => e.toData());
};