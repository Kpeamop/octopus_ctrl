debug=true;

const fs=require('fs');
const path=require('path');
const log=require('./log');

exports.task=Task=function(props)
{
	this.log=new log(1000);

	this.props_filter=(a) =>
	{
		var mask=
				{
					alias: '',
					description: '',
					enabled: false,
					env: {},
					pid: 0,
					ram: 0,
					client: '',
					starttime: {
						type: 'manual',
						ht: '',
						mt: '',
						dt: '',
						hi: '',
						mi: '',
						si: '',
						ttl: 7200
					},
					execution: {
						start: 0,
						end: 0,
						err_code: 0
					},
					cmd: '',
					args: [],
					multiple: false,
					priority: ''
				},
			r={};

		for(var i in mask)
			if(a[i]===undefined) r[i]=mask[i];
			else r[i]=a[i];

		return r;
	};

	this.props=this.props_filter(props);

	this.ev=
	{
		start: (starttime,pid,client) =>
		{
			this.props.execution.err_code=0;
			this.props.execution.start=starttime;
			this.props.execution.end=0;
			this.props.client=client;
			this.props.pid=pid;

			this.log.addSystem('started',client);
		},
		stdout: (msg,client) =>
		{
			this.log.addStdout(msg,client);
		},
		stderr: (msg,client) =>
		{
			this.log.addStderr(msg,client);
		},
		// close: (err_code) => {},
		exit: (endtime,err_code,client) =>
		{
			this.props.pid=0;
			this.props.execution.end=endtime;
			this.props.execution.err_code=err_code;

			this.log.addSystem('stopped at err:'+err_code,client);
		},

		kill: () => {},
		run: () => {},

		update_prop: (prop,value) => {}
	};

	this.kill=() =>
	{
		if(debug) console.log('kill',this.props.alias);

		this.ev.kill();
	};

	this.run=() =>
	{
		if(debug) console.log('run',this.props.alias);

		this.props.execution.start=parseInt((+new Date()/1000).toFixed(0));

		this.ev.run();
	};

	this.toData=() => this.props_filter(this.props);
};

exports.tasklist=TaskList=function()
{
	var dbf=path.dirname(__dirname)+'/db.json',
		tasks=JSON.parse(fs.readFileSync(dbf));

	var tasks;

	// fs.writeFileSync(dbf,JSON.stringify(tasks));

	this.ev=
	{
		// start: (task) => {},
		// stdout: (data,task) => {},
		// stderr: (data,task) => {},
		// exit: (err_code,task) => {},

		kill: (task) => {},
		run: (task) => {},

		update_prop: (prop,value,task) => {}
	};

	this.add=function(a)
	{
		var task=new Task(a);

		this.addObject(task);

		return task;
	};

	this.addObject=function(task)
	{
		if(task instanceof Task)
		{
			var temp_kill=task.ev.kill;
			task.ev.kill=() =>
			{
				temp_kill();
				this.ev.kill(task);
			};

			var temp_run=task.ev.run;
			task.ev.run=() =>
			{
				temp_run();
				this.ev.run(task);
			};

			var temp_update_prop=task.ev.update_prop;
			task.ev.update_prop=(prop,value) =>
			{
				temp_update_prop(prop,value);
				this.ev.update_prop(prop,value,task);
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

	this.count=() => tasks.length;

	this.indexOfAlias=function(alias)
	{
		var r=-1;

		tasks.some((e,i) =>
		{
			if(e instanceof Task && e.props.alias==alias)
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
		if(debug) console.log('killall');

		if(this.autoremove)	while(tasks.length>0) tasks.pop().kill();
		else tasks.forEach((task) => task.kill());
	};

	this.dispatchMessages=function(arr_msgs)
	{
		arr_msgs.forEach(m =>
		{
			if(!m.task) return console.log('Not found alias task in "'+m.action+'".');

			var task=this.itemOfAlias(m.task);

			if(!task) return console.log('Not found task as "'+m.task+'" in "'+m.action+'".');

			switch(m.action)
			{
				case 'start':
					task.ev.start(m.starttime,m.pid,m.client.props.alias);
				break;

				case 'stdout':
					task.ev.stdout(m.text,m.client.props.alias);
				break;

				case 'stderr':
					task.ev.stderr(m.text,m.client.props.alias);
				break;

				case 'exit':
					task.ev.exit(m.endtime,m.err_code,m.client.props.alias);
				break;

				default: console.log('Inknown message action');
			}
		});
	};

	this.toData=() => tasks.map(e => e.toData());

	tasks=tasks.map(e => this.indexOfAlias(e.alias)<0 ? this.add(e) : null).filter(e => e!==null);
};