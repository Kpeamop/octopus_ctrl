debug=true;

const dns=require('dns');

exports.client=Client=function(sock,props)
{
	this.socket=sock;

	this.props_filter=(a) =>
	{
		var mask=
				{
					starttime: parseInt((+new Date()/1000).toFixed(0)),
					alias: sock.remoteAddress,
					enabled: true,
					active: true,
					ip: sock.remoteAddress,
					hostname: '',
					loadavg: [0,0,0],
					cpus: 1,
					tasks: 0 // todo: aliases of tasks
				},
			r={};

		for(var i in mask)
			if(a[i]===undefined) r[i]=mask[i];
			else r[i]=a[i];

		return r;
	};

	this.props=this.props_filter(props || {});

	dns.reverse(this.props.ip,(err,hostname) =>
	{
		if(hostname && hostname.length>0) this.props.alias=this.props.hostname=hostname;
	});

	this.ev=
	{
		connect:	()		=> {},
		disconnect: ()		=> {},
		error:		(error)	=> {},
		status:		(tasks)	=> {},

		start:	(starttime,pid,task)	=> {},
		stdout:	(text,task)				=> {},
		stderr:	(text,task)				=> {},
		exit:	(endtime,err_code,task)	=> {}
	};

	this.socket.on('data',(data) =>
	{
		data.toString().split(String.fromCharCode(10)).forEach((e,i) =>
		{
			if(!e) return;

			var jdata;

			try
			{
				jdata=JSON.parse(e);
			}
			catch(e)
			{
				return console.error('data parse error',data.toString(),debug ? e : '');
			}

			var action=jdata.action,
				task=jdata.alias || '',
				text=jdata.text || '',
				err_code=jdata.err_code || '';

			switch(action)
			{
				case 'start':
					this.ev.start(jdata.starttime,jdata.pid,task);
				break;

				case 'stdout':
					this.ev.stdout(text,task);
				break;

				case 'stderr':
					this.ev.stderr(text,task);
				break;

				case 'exit':
					this.ev.exit(jdata.endtime,err_code,task);
				break;

				case 'loadavg':
					this.props.loadavg=jdata.value;
					this.props.tasks=jdata.tasks;
				break;

				case 'status':
					this.props.loadavg=jdata.loadavg;
					this.props.cpus=jdata.cpus;

					this.ev.status(jdata.tasks);
				break;

				default: console.log('Inknown action:',action,task,debug ? jdata : '');
			}
		});
	})
	.on('error',e => this.ev.error(e))
	.on('close',() =>
	{
		this.props.active=false;
		this.ev.disconnect();
	});

	this.socket.send=data =>
	{
		if(this.props.active) this.socket.write((typeof data=='object' ? JSON.stringify(data) : data)+String.fromCharCode(10));
		else if(debug) console.log('Can\'t send. Client "'+this.props.alias+'" is not active. "'+data+'"');
	};

	this.toData=() => this.props_filter(this.props);
};

exports.clientlist=ClientList=function()
{
	var clients=[];

	this.ev=
	{
		connect:	(client)		=> {},
		disconnect: (client)		=> {},
		error:		(error,client)	=> {},
		status:		(task,client)	=> {},

		start:	(starttime,pid,task,client)		=> {},
		stdout:	(text,task,client)				=> {},
		stderr:	(text,task,client)				=> {},
		exit:	(endtime,err_code,task,client)	=> {}
	};

	var addClientEvents=(client) =>
	{
		var temp_connect=client.ev.connect;
		client.ev.connect=() =>
		{
			temp_connect();
			this.ev.connect(client);
		};

		var temp_disconnect=client.ev.disconnect;
		client.ev.disconnect=() =>
		{
			temp_disconnect();
			this.ev.disconnect(client);
		};

		var temp_error=client.ev.error;
		client.ev.error=(error) =>
		{
			temp_error(error);
			this.ev.error(error,client);
		};

		var temp_status=client.ev.status;
		client.ev.status=(tasks) =>
		{
			temp_status(tasks);
			this.ev.status(tasks,client);
		};

		var temp_start=client.ev.start;
		client.ev.start=(starttime,pid,task) =>
		{
			temp_start(starttime,pid,task);
			this.ev.start(starttime,pid,task,client);
		};

		var temp_stdout=client.ev.stdout;
		client.ev.stdout=(text,task) =>
		{
			temp_stdout(text,task);
			this.ev.stdout(text,task,client);
		};

		var temp_stderr=client.ev.stderr;
		client.ev.stderr=(text,task) =>
		{
			temp_stderr(text,task);
			this.ev.stderr(text,task,client);
		};

		var temp_exit=client.ev.exit;
		client.ev.exit=(endtime,err_code,task) =>
		{
			temp_exit(endtime,err_code,task);
			this.ev.exit(endtime,err_code,task,client);
		};
	};

	this.add=function(sock,props)
	{
		var client=new Client(sock,props || {});

		this.addObject(client);

		return client;
	};

	this.addObject=function(client)
	{
		if(client instanceof Client)
		{
			addClientEvents(client);

			clients.push(client);

			return true;
		}
		else return false;
	};

	this.items=function(index)
	{
		if(typeof index=='number' && index<clients.length && index>=0) return clients[index];

		if(index===undefined) return clients;

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

	this.replaceObject=function(client,index)
	{
		if(client instanceof Client && typeof index=='number' && index<clients.length && index>=0)
		{
			addClientEvents(client);

			clients.splice(index,1,client);

			return true;
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

	this.itemOfAlias=function(alias)
	{
		var i=this.indexOfAlias(alias);

		if(i>=0) return this.items(i);
		else return null;
	};

	this.lazyClient=function(skip_overload=80,priority='')
	{
		var active=clients.filter(e => e.props.enabled && e.props.active).sort((a,b) => a.props.loadavg[1]<b.props.loadavg[1]),
			lazy=active.filter(e => e.props.loadavg[1]/e.props.cpus<=skip_overload/100);

		if(lazy.length==0) lazy=active;

		var client=lazy[0];

		lazy.some(e =>
		{
			if(e instanceof Client && e.props.alias==priority)
			{
				client=e;
				return true;
			}

			return false;
		});

		return client;
	};

	this.toData=() => clients.map(e => e.toData());
};