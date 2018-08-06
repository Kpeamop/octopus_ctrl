debug=true;

const { spawn }=require('child_process');

exports.task=Task=function(cmd,args=[])
{
	var env=Object.assign({},process.env),
		app;

	this.starttime=0;
	this.runtime=0;

	this.ev=
	{
		start: (cmd,args,startts) => { if(debug) console.log('start:',cmd,args,startts); },
		stdout: (text) => { if(debug) console.log('stdout:',text); },
		stderr: (text) => { if(debug) console.log('stderr:',text); },
		// close: (err_code) => {},
		exit: (err_code,duration,endts) => { if(debug) console.log('exit:',err_code); }
	};

	this.kill=function()
	{
		this.app.kill();
	};

	this.setenv=function(a)
	{
		if(typeof a=='object') env=Object.assign(env,a);
		else if(arguments.length>1) env[arguments[0]]=arguments[1];
	};

	this.run=function()
	{
		this.starttime=+new Date();

		this.app=spawn(cmd,args,{ env: this.env });

		this.app.stdout.on('data',(text) => { this.ev.stdout(text.toString()); });
		this.app.stderr.on('data',(text) => { this.ev.stderr(text.toString()); });
		// this.app.on('close',(err_code) => { this.ev.close(err_code); });
		this.app.on('exit',(err_code) =>
		{
			this.runtime=+new Date()-this.starttime;
			this.ev.exit(err_code,this.runtime,+new Date());
		});

		this.ev.start(cmd,args,this.starttime);
	};
};

exports.tasklist=TaskList=function()
{
	var tasks=[];

	this.autoremove=false; // remove on exit

	this.ev=
	{
		start: (cmd,args,startts,task) => {},
		stdout: (data,task) => {},
		stderr: (data,task) => {},
		exit: (err_code,duration,endts,task) => {}
	};

	this.add=function(cmd,args=[],env_extra={})
	{
		var task=new Task(cmd,args);

		task.setenv(env_extra);

		this.addObject(task);

		return task;
	};

	this.addObject=function(task)
	{
		if(task instanceof Task)
		{
			var temp_start=task.ev.start;
			task.ev.start=(cmd,args,startts) =>
			{
				temp_start(cmd,args,startts);
				this.ev.start(cmd,args,startts,task);
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
			task.ev.exit=(err_code,duration,endts) =>
			{
				temp_exit(err_code,duration,endts);
				this.ev.exit(err_code,duration,endts,task);
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

	this.count=function()
	{
		return tasks.length;
	};

	this.killall=function()
	{
		if(this.autoremove)	while(tasks.length>0) tasks.pop().kill();
		else tasks.forEach((task) => task.kill());
	};
};