const fs=require('fs');
const path=require('path');

exports.task=Task=function(props)
{
	this.starttime=0;
	this.runtime=0;

	this.props=props;
	// {
	// 	alias:'testclient1',
	// 	description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti omnis, sit, earum rerum labore quo expedita mollitia hic culpa vitae.',
	// 	enabled: true,
	// 	active: true,
	// 	env: {},
	// 	pid: 123,
	// 	ram: 30000000,
	// 	server: 'test-server1',
	// 	starttime: 0,
	// 	runtime: 0,
	// 	endtime: 0,
	// 	cmd: '/bin/bash',
	// 	args: ['script.php','first arg',23,'string text variable'],
	// 	starttime:
	// 		{
	// 			type: 'interval',
	// 			h: 0,
	// 			m: 1,
	// 			s: 30
	// 		}
	// };

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

	this.toData=() => this.props;
};

exports.tasklist=TaskList=function()
{
	var dbf=path.dirname(__dirname)+'/db.json',
		tasks=JSON.parse(fs.readFileSync(dbf));

	var tasks;

	// tasks=[
	// 		{
	// 			alias:'testclient1',
	// 			description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti omnis, sit, earum rerum labore quo expedita mollitia hic culpa vitae.',
	// 			enabled: true,
	// 			active: true,
	// 			env: { NLS_LANG: 'RUS_NERUS', NLS_TIME: 'OLDTIME' },
	// 			pid: 123,
	// 			ram: 30000000,
	// 			server: 'test-server1',
	// 			starttime: 0,
	// 			runtime: 0,
	// 			endtime: 0,
	// 			cmd: '/bin/bash',
	// 			args: ['script.php','first arg',23,'string text variable'],
	// 			starttime:
	// 				{
	// 					type: 'interval',
	// 					h: 0,
	// 					m: 1,
	// 					s: 30
	// 				},
	// 			multiple: false,
	// 			priority: 'testclient3'
	// 		}
	// 	];

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