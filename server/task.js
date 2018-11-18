debug=true;

const fs=require('fs');

const path=require('path');
const { log }=require('./log');

exports.task=Task=function(props)
{
	var private=
	{
		tm_autoreset: null
	};

	this.log=new log(4000);

	var mask_def=	{
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
		mask_save=	{
						alias: '',
						description: '',
						enabled: false,
						env: {},
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
						cmd: '',
						args: [],
						multiple: false,
						priority: ''
					};

	this.props_filter=(mask,a,replace) =>
	{
		var r={};

		for(var i in mask)
			if(a[i]===undefined) r[i]=mask[i];
			else r[i]=a[i];

		if(typeof replace=='object')
			for(var i in replace)
				r[i]=replace[i];

		return r;
	};

	this.props=this.props_filter(mask_def,props);

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

	this.autoreset=timeout =>
	{
		if(timeout>0)
		{
			if(!private.tm_autoreset)
				private.tm_autoreset=setTimeout(() =>
				{
					this.props.pid=0;
					this.props.execution.end=parseInt((+new Date()/1000).toFixed(0));
					this.props.execution.err_code=0;

					this.log.addSystem('autoreset');
					if(debug) console.log('autoreset',this.props.alias);

					private.tm_autoreset=null;
				},timeout);
		}
		else
		{
			clearTimeout(private.tm_autoreset);
			private.tm_autoreset=null;
		}

	};

	this.kill=() =>
	{
		if(debug) console.log('kill',this.props.alias);

		if(this.props.pid>0)
		{
			this.log.addSystem('kill');

			this.ev.kill();
		}
	};

	this.run=() =>
	{
		if(debug) console.log('run',this.props.alias);

		if(!this.props.pid)
		{
			// this.props.execution.start=parseInt((+new Date()/1000).toFixed(0));
			// this.props.execution.end=0;

			this.ev.run();
		}
	};

	this.toData=() => this.props_filter(mask_def,this.props,{ log_counters: this.log.counters() });
	this.saveData=() => this.props_filter(mask_save,this.props);
};

exports.tasklist=TaskList=function()
{
	var dbf=path.dirname(__dirname)+'/db.json',
		tasks=[];

	try
	{
		fs.accessSync(dbf);

		tasks=JSON.parse(fs.readFileSync(dbf));
	}
	catch(e) {}

	this.ev=
	{
		// start: (task) => {},
		// stdout: (data,task) => {},
		// stderr: (data,task) => {},
		// exit: (err_code,task) => {},

		kill: (task) => {},
		run: (task) => {},

		update_prop: (prop,value,task) => {},
		log_add_msg: (type,client,ts,msg,task) => {}
	};

	this.save=function()
	{
		try
		{
			fs.writeFileSync(dbf,JSON.stringify(this.saveData()));
		}
		catch(e) {}
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

			var temp_log_add_msg=task.log.ev.add_msg;
			task.log.ev.add_msg=(type,client,ts,msg) =>
			{
				temp_log_add_msg(type,client,ts,msg);
				this.ev.log_add_msg(type,client,ts,msg,task);
			};

			tasks.push(task);

			return true;
		}
		else return false;
	};

	this.items=function(index)
	{
		if(typeof index=='number' && index<tasks.length && index>=0) return tasks[index];

		if(index===undefined) return tasks;

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

		tasks.forEach(task => task.kill());
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
	this.saveData=() => tasks.map(e => e.saveData());

	tasks=tasks.map(e => this.indexOfAlias(e.alias)<0 ? this.add(e) : null).filter(e => e!==null);
};