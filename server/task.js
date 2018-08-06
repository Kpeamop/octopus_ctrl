const fs=require('fs');
const path=require('path');

exports.task=Task=function(a)
{
	this.starttime=0;
	this.runtime=0;

	this.props={};

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
};

exports.tasklist=TaskList=function()
{
	var dbf=path.dirname(__dirname)+'/db.json',
		tasks=JSON.parse(fs.readFileSync(dbf));

	// tasks=[
	// 		{
	// 			alias: 'test-task1',
	// 			description: 'test cron task .... debug',
	// 			cmd: 'test-task.sh',
	// 			args: ['3','3','3'],
	// 			enabled: false,
	// 			repeater: 0,
	// 			multiple: false,
	// 			priority: 'test',
	// 			env: { NLS_LANG: 'RUS_NERUS', NLS_TIME: 'OLDTIME' }
	// 		},
	// 		{
	// 			alias: 'test-task2',
	// 			description: 'test cron task .... debug',
	// 			cmd: 'test-task.sh',
	// 			args: ['1','2','5'],
	// 			enabled: true,
	// 			repeater: 5,
	// 			multiple: false,
	// 			priority: 'test',
	// 			env: { NLS_LANG: 'RUS_NERUS', NLS_TIME: 'OLDTIME' }
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

	this.count=function()
	{
		return tasks.length;
	};

	this.killall=function()
	{
		if(this.autoremove)	while(tasks.length>0) tasks.pop().kill();
		else tasks.forEach((task) => task.kill());
	};

	tasks=tasks.map((i,e) => { return this.add(e); });
};