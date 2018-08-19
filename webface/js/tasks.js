function Tasks(parent_item)
{
	this.className='Tasks';
	this.mclass_prefix='x-';

	Tasks.parent.constructor.call(this,parent_item);

	// var $this=this;

	this.ev=
	{
		up: (task,prop,newvalue,cb) => { console.log(task,prop,newvalue,cb);  }
	};

	this.arrange=(jdata) =>
	{
		var active=jdata.map(e => e.alias);

		// delete
		this.items().forEach((task) =>
		{
			if(active.indexOf(task.data('alias'))<0 && !task.destroying()) task.selfdestruct();
		});

		// update
		this.items().forEach((task) =>
		{
			jdata.some((e,i) =>
			{
				if(task.data('alias')==e.alias)
				{
					if(task.destroying()) task.abortdestruct();

					if(!task.lockup) task.loadData(e);

					jdata.splice(i,1);

					return true;
				}
				else return false;
			});
		});

		// insert
		jdata.forEach(e => (new Task(this)).loadData(e));
	};
}

function Task(parent_item)
{
	this.className='Task';
	this.mclass_prefix='t-';

	Task.parent.constructor.call(this,parent_item);

	this.lockup=false;

	var $this=this;

	var time=new TaskTime(this,this.element('time'));
	// time.show();

	this.bind('alias',		v => this.value('alias',v));
	this.bind('description',v => this.value('description',v));
	this.bind('pid',		v => this.value('pid',v));
	this.bind('ram',		v => this.value('ram',(v/1024/1024).toFixed(1)));
	this.bind('enabled',	v => this.value('enabled',v));
	this.bind('args',		v => this.value('cmdargs',this.data('cmd')+'\n'+v.join('\n')));
	this.bind('execution',	v =>
	{
		this.value('starttime',v.start);
		this.value('runtime',totime((+new Date()/1000).toFixed(0)-v.start));
		this.value('endtime','-');
	});
	this.bind('env',v =>
	{
		var a=[];

		for(var i in v) a.push(i+'='+v[i]);

		this.value('env',a.join('\n'));
	});

	this.bindev('enabled','change',e =>
	{
		this.lockup=true;

		parent_item.ev.up(this,'enabled',e.target.checked,() => this.lockup=false);
	});

	// animated self destruct

	var destruct_timeout;

	this.destroying=() => destruct_timeout>0;

	this.selfdestruct=() =>
	{
		this.dom().classList.add('disabled','red');

		destruct_timeout=setTimeout(() =>
		{
			if(parent_item instanceof Tasks)  parent_item.delete(this);
			// animate SlideUp
			console.log('sd SlideUp');
		},2000);
	};

	this.abortdestruct=() =>
	{
		clearTimeout(destruct_timeout);

		this.dom().classList.remove('disabled','red');

		destruct_timeout=-1;
	};
}

function TaskTime(parent_item,parent_dom)
{
	this.className='TaskTime';
	this.mclass_prefix='tt-';

	TaskTime.parent.constructor.call(this,parent_item,parent_dom);

	var $this=this;


}

