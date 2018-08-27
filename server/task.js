const fs=require('fs');
const path=require('path');

exports.task=Task=function(props)
{
	this.props_filter=(a) =>
	{
		var mask=
				{
					alias: '',
					description: '',
					enabled: false,
					active: true,
					env: {},
					pid: 0,
					ram: 0,
					server: '',
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
						end: 0
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
		start: () => {},
		stdout: (data) => {},
		stderr: (data) => {},
		// close: (err_code) => {},
		exit: (err_code) => {},

		update_prop: (prop,value) => {}
	};

	this.kill=function()
	{

	};

	this.run=function()
	{

	};

	this.toData=() => this.props_filter(this.props); // ? props_filter
};

exports.tasklist=TaskList=function()
{
	var dbf=path.dirname(__dirname)+'/db.json',
		tasks=JSON.parse(fs.readFileSync(dbf));

	var tasks;

	// fs.writeFileSync(dbf,JSON.stringify(tasks));

	this.ev=
	{
		start: (task) => {},
		stdout: (data,task) => {},
		stderr: (data,task) => {},
		exit: (err_code,task) => {},
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

	this.killall=function()
	{
		if(this.autoremove)	while(tasks.length>0) tasks.pop().kill();
		else tasks.forEach((task) => task.kill());
	};

	this.toData=() => tasks.map(e => e.toData());

	tasks=tasks.map(e => this.indexOfAlias(e.alias)<0 ? this.add(e) : null).filter(e => e!==null);
};