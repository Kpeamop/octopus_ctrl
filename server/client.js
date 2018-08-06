debug=false;

exports.client=Client=function(sock)
{
	this.starttime=0;

	this.socket=sock;

	this.ev=
	{
		start: () => {},
		stdout: (data) => {},
		stderr: (data) => {},
		// close: (err_code) => {},
		exit: (err_code) => {}
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
				console.log('data parse error',data.toString(),debug ? e : '');
			}

			if(jdata!==undefined)
			{
				console.log(jdata);
			}
		});
	})
	.on('error',() => { })
	.on('close',function(e)
	{
		// console.log('close',e);

		// self.server.getConnections((e,cnt) => console.log(cnt) );
		// console.log('cliof',self.clients.indexOf(this));
	});

	this.setenv=function(a)
	{
		if(typeof a=='object') env=Object.assign(env,a);
		else if(arguments.length>1) env[arguments[0]]=arguments[1];
	};
};

exports.clientlist=function()
{
	var clients=[];

	this.autoremove=false; // remove on disconnect

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

	this.count=function()
	{
		return clients.length;
	};

	this.indexOfSocket=function(sock)
	{
		// if(sock instanceof Socket)
		{
			// return clients.indexOf(sock);
		}

		return -1;
	};
};