const net=require('net');
const { task,tasklist }=require('./task');
const inc=require('../include');

module.exports=Client=function()
{
	this.count_reconnect=0;
	this.config={ connection: { port: 6778, host: '127.0.0.1' } };
	this.client=null;

	this.proto={};

	this.tasks=new tasklist();

	this.tasks.ev=
	{
		start: (cmd,args,startts,task) =>
		{
			this.client.send({action:'task.start',cmd,args,startts,task:task.pid});
		},
		stdout: (text,task) =>
		{
			this.client.send({action:'task.stdout',text,task:task.pid});
		},
		stderr: (text,task) =>
		{
			this.client.send({action:'task.stderr',text,task:task.pid});
		},
		exit: (err_code,duration,endts,task) =>
		{
			this.client.send({action:'task.exit',err_code,duration,endts,task:task.pid});
		}
	};

	this.set=function(k,v)
	{
		this[k]=v;

		return this;
	};

	this.loadavg=function()
	{

	};

	this.exec=function(cmd,args=[],env_extra=[])
	{
		this.tasks.add(cmd,args).run();
	};

	this.run=function()
	{
		var self=this;

		this.client=net.Socket({
								readable: true,
								writable: true
							})
		.on('data',(data) =>
		{
			try
			{
				jdata=JSON.parse(data.toString());

				if(jdata.action)
					switch(jdata.action)
					{
						case 'gettasks':

						break;

						case 'getloadavg':

						break;

						case 'doexec':

						break;

						case 'killall':

						break;

						default: ;
					}
			}
			catch(e)
			{
				console.log('data error',e,data.toString());
			}
		})
		.on('drain',() =>
		{
			console.log('drain');
		})
		.on('end',() =>
		{
			console.log('end');
		})
		.on('error',(err) =>
		{
			// console.log('error',err);
		})
		.on('close',function()
		{
			console.log('closed. reconnecting...',self.count_reconnect);

			setTimeout(() => this.rconnect(),500);
		})
		.on('timeout',function()
		{
			console.log('timeout. reconnecting...',self.count_reconnect);

			setTimeout(() => this.rconnect(),500);
		})
		.on('connect',function()
		{
			console.log('connected');

			this.send(self.proto.identity());
		});

		this.client.rconnect=function()
		{
			self.count_reconnect++;
			this.connect(self.config.connection.port,self.config.connection.host);
		};

		this.client.send=function(data)
		{
			this.write((typeof data=='object' ? JSON.stringify(data) : data)+String.fromCharCode(10));
		};

		this.client.rconnect();
	};
};
