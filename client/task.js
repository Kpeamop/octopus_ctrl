debug=true;

const { spawn }=require('child_process');

exports.task=Task=function(alias,cmd,args=[])
{
	var private=
	{
		alias,
		cmd,
		args,
		env: Object.assign({},process.env),
		app: null,
		starttime: 0,
		endtime: 0,
		memory: 0
	};

	Object.defineProperty(this,'alias',		{ get: () => private.alias });
	Object.defineProperty(this,'starttime',	{ get: () => private.starttime });
	Object.defineProperty(this,'endtime',	{ get: () => private.endtime });
	Object.defineProperty(this,'pid',		{ get: () => private.app.pid });

	this.ev=
	{
		start: (cmd,args) =>
		{
			private.starttime=parseInt((+new Date()/1000).toFixed(0));
			private.endtime=0;

			if(debug) console.log('start:',cmd,args);
		},
		stdout: (text) => { if(debug) console.log('stdout:',text); },
		stderr: (text) => { if(debug) console.log('stderr:',text); },
		// close: (err_code) => {},
		exit: (err_code) =>
		{
			private.endtime=parseInt((+new Date()/1000).toFixed(0));

			if(debug) console.log('exit:',err_code);
		},

		kill: () =>
		{
			if(debug) console.log('kill');
		}
	};

	this.kill=function()
	{
		private.app.kill();

		this.ev.kill(this);
	};

	this.setenv=function(a)
	{
		if(typeof a=='object') private.env=Object.assign(private.env,a);
		else if(arguments.length>1) private.env[arguments[0]]=arguments[1];
	};

	this.run=function()
	{
		try
		{
			private.app=spawn(cmd,args,{ env: private.env });

			private.app.stdout.on('data',text => this.ev.stdout(text.toString()) );
			private.app.stderr.on('data',text => this.ev.stderr(text.toString()) );
			// private.app.on('close',(err_code) => { this.ev.close(err_code); });
			private.app.on('exit',err_code => this.ev.exit(err_code));
			private.app.on('error',err =>
			{
				if(err.errno=='ENOENT') this.ev.exit('File '+cmd+' not found.');
				else console.log(err);
			});

			this.ev.start(cmd,args);
		}
		catch(e)
		{
			// if(debug) console.log(e);

			// this.ev.stderr(e.toString());
		}
	};

	this.toData=() => { return { alias:private.alias, starttime:private.starttime, endtime:private.endtime, pid:private.app.pid||0, memory:private.memory }; };
};

exports.tasklist=TaskList=function()
{
	var tasks=[];

	this.autoremove=true; // remove on exit

	this.ev=
	{
		start:	(cmd,args,startts,task) 		=> {},
		stdout:	(data,task) 					=> {},
		stderr:	(data,task) 					=> {},
		exit:	(err_code,endts,task) 			=> {},

		kill:	(task)							=> {}
	};

	this.add=function(alias,cmd,args=[],env_extra={})
	{
		var task=new Task(alias,cmd,args);

		task.setenv(env_extra);

		this.addObject(task);

		return task;
	};

	this.addObject=function(task)
	{
		if(task instanceof Task)
		{
			var temp_start=task.ev.start;
			task.ev.start=(cmd,args) =>
			{
				temp_start(cmd,args);
				this.ev.start(cmd,args,task.starttime,task);
			};

			var temp_stdout=task.ev.stdout;
			task.ev.stdout=(data) =>
			{
				temp_stdout(data);
				this.ev.stdout(data,task);
			};

			var temp_stderr=task.ev.stderr;
			task.ev.stderr=(data) =>
			{
				temp_stderr(data);
				this.ev.stderr(data,task);
			};

			var temp_exit=task.ev.exit;
			task.ev.exit=(err_code) =>
			{
				if(this.autoremove) this.deleteObject(task);

				temp_exit(err_code);
				this.ev.exit(err_code,task.endtime,task);
			};

			var temp_kill=task.ev.kill;
			task.ev.kill=() =>
			{
				temp_kill();
				this.ev.kill(task);
			};

			tasks.push(task);

			return true;
		}
		else return false;
	};

	this.items=function(index)
	{
		if(typeof index=='number' && index<tasks.length && index>=0) return tasks[index];

		return false;
	};

	this.delete=function(index)
	{
		if(typeof index=='number' && index<tasks.length && index>=0)
		{
			tasks.splice(index,1);

			return true;
		}
		else return false;
	};

	this.deleteObject=function(task)
	{
		if(task instanceof Task)
		{
			var i=tasks.indexOf(task);

			if(i>=0) return this.delete(i);
		}

		return false;
	};

	this.indexOfAlias=function(alias)
	{
		var r=-1;

		tasks.some((e,i) =>
		{
			if(e instanceof Task && e.alias==alias)
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

	this.killall=function()
	{
		if(this.autoremove)	while(tasks.length>0) tasks.pop().kill();
		else tasks.forEach((task) => task.kill());
	};

	this.count=() => tasks.length;

	this.toData=() => tasks.map(e => e.toData());
};