const net=require('net');
const { task,tasklist }=require('./task');
const inc=require('../include');
const os=require('os');

module.exports=Client=function()
{
	var private=
	{
		count_reconnect: 0,
		config: { connection: { port: 6778, host: '127.0.0.1' }, autokill: 5000 },
		client: null,
		tasks: new tasklist(),
		tm_loadavg: null,
		tm_autokill: null
	};

	private.tasks.ev=
	{
		start:	(cmd,args,starttime,task)	=> private.client.send({ action:'start',	alias:task.alias, cmd,args,starttime }),
		stdout:	(text,task)					=> private.client.send({ action:'stdout',	alias:task.alias, text }),
		stderr:	(text,task)					=> private.client.send({ action:'stderr',	alias:task.alias, text }),
		exit:	(err_code,endtime,task)		=> private.client.send({ action:'exit',		alias:task.alias, err_code,endtime }),

		kill:	(task)						=> {} //private.client.send({ action:'kill',		alias:task.alias })
	};

	this.set=function(k,v)
	{
		private[k]=v;

		return this;
	};

	this.run=function()
	{
		var $this=this;

		private.client=net.Socket({ readable: true,writable: true })
		.on('data',(data) =>
		{
			try
			{
				jdata=JSON.parse(data.toString());
			}
			catch(e)
			{
				console.log('data error',e,data.toString());
			}

			switch(jdata.action)
			{
				case 'run':
					private.tasks.add(jdata.cmd,jdata.args,jdata.env).run();
				break;

				case 'kill':
					var i;

					if(i=private.tasks.itemOfAlias(jdata.alias)) i.kill();
				break;

				case 'killall':
					private.tasks.killall();
				break;

				default: console.log(jdata);
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
			console.log('error',err);
		})
		.on('close',function()
		{
			console.log('closed. reconnecting...',private.count_reconnect);

			clearInterval(private.tm_loadavg);

			if(private.config.autokill>0)
				private.config.autokill=setTimeout(() => private.tasks.killall(),private.config.autokill);

			setTimeout(() => this.rconnect(),500);
		})
		.on('timeout',function()
		{
			console.log('timeout. reconnecting...',private.count_reconnect);

			clearInterval(private.tm_loadavg);

			if(private.config.autokill>0)
				private.config.autokill=setTimeout(() => private.tasks.killall(),private.config.autokill);

			setTimeout(() => this.rconnect(),500);
		})
		.on('connect',function()
		{
			console.log('connected');

			clearTimeout(private.tm_autokill);

			private.tm_loadavg=setInterval(() => private.client.send({ action: 'loadavg', value:os.loadavg() }),5000);

			private.client.send({ action:'status', tasks:private.tasks.toData() });
		});

		private.client.rconnect=function()
		{
			private.count_reconnect++;
			this.connect(private.config.connection.port,private.config.connection.host);
		};

		private.client.send=function(data)
		{
			this.write((typeof data=='object' ? JSON.stringify(data) : data)+String.fromCharCode(10));
		};

		private.client.rconnect();
	};
};
