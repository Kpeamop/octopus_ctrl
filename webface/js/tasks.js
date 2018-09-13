function Tasks(parent_item)
{
	this.className='Tasks';
	this.mclass_prefix='x-';

	Tasks.parent.constructor.call(this,parent_item);

	// var $this=this;

	this.ev=
	{
		update:		(task,property,value,cb)	=> {},
		kill:		(task)						=> {},
		restart:	(task)						=> {}
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
		jdata.forEach(e =>
		{
			var task=new Task(this);

			task.ev=
			{
				update:		(property,value,cb) => this.ev.update(task,property,value,cb),
				kill:		() => this.ev.kill(task),
				restart:	() => this.ev.restart(task)
			};

			task.loadData(e);
		});
	};
}

function Task(parent_item)
{
	this.className='Task';
	this.mclass_prefix='t-';

	Task.parent.constructor.call(this,parent_item);

	this.lockup=false;

	this.ev=
	{
		update:		(property,value,cb) => {},
		kill:		() => {},
		restart:	() => {}
	};

	// var $this=this;

	var time=new TaskTime(this,this.element('time'));

	time.ev.save=() =>
	{
		this.lockup=true;

		this.ev.update('starttime',this.data('starttime',time.datas()),() => this.lockup=false);
	};

	this.bind('alias',		v => this.value('alias',v));
	this.bind('description',v => this.value('description',v));
	this.bind('pid',		v => this.value('pid',v));
	this.bind('ram',		v => this.value('ram',(v/1024/1024).toFixed(1)));
	this.bind('enabled',	v => this.value('enabled',v));
	this.bind('client',		v => this.value('client',v));
	this.bind('starttime',	v =>
	{
		if(!time.lockup) time.loadData(v);

		var leedzero=int => int<10 ? '0'+int : int;

		switch(v.type)
		{
			case 'totime':
				this.value('starttype','по времени');
				this.value('time-text',leedzero(v.ht)+':'+leedzero(v.mt)+' '+leedzero(v.dt));
			break;

			case 'interval':
				this.value('starttype','интервал');
				this.value('time-text',leedzero(v.hi)+':'+leedzero(v.mi)+':'+leedzero(v.si)+'<br>'+'ttl:'+v.ttl);
			break;

			default:
				this.value('starttype','ручной');
				this.value('time-text','ручной');
		}

	});
	this.bind('args',		v => this.value('cmdargs',this.data('cmd')+'\n'+v.join('\n')));
	this.bind('execution',	v =>
	{
		var end=parseInt(v.end);
		var start=parseInt(v.start);
		var pid=this.data('pid');

		this.value('starttime',	start>0 ? timeFormat(start,'d.m.y h:i:s') : '---');
		this.value('runtime',	start>0 ? totime((end>0 ? end : (+new Date()/1000).toFixed(0))-start) : '---');
		this.value('endtime',	end>0 ? timeFormat(end,'d.m.y h:i:s') : '---');

		this.value('restart',	pid>0 ? 'restart' : 'start');
		this.element('kill').disabled=!pid;
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

		this.ev.update('enabled',e.target.checked,() => this.lockup=false);
	});

	this.bindev('time-text','click',time.showmodal);

	this.bindev('kill','click',		() => this.ev.kill());
	this.bindev('restart','click',	() => this.ev.restart());

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

	this.lockup=false;

	// var $this=this;

	this.ev=
	{
		save: () => {}
	};

	this.element('radio-i')['name']=
	this.element('radio-t')['name']=
	this.element('radio-m')['name']='radio_'+Math.random().toString().substr(2);

	this.bind('type',	v =>
	{
		if(!this.lockup)
			switch(v)
			{
				case 'interval':
					this.element('radio-i')['checked']=true;
				break;

				case 'totime':
					this.element('radio-t')['checked']=true;
				break;

				default:
					this.element('radio-m')['checked']=true;
			}
	})
	.bindev('radio-i','change',() => this.data('type','interval'))
	.bindev('radio-t','change',() => this.data('type','totime'))
	.bindev('radio-m','change',() => this.data('type','manual'))
	;
	this.bind('ht',		v => this.value('ht',v))	.bindev('ht',['keyup','change'],	() => this.data('ht',this.value('ht')));
	this.bind('mt',		v => this.value('mt',v))	.bindev('mt',['keyup','change'],	() => this.data('mt',this.value('mt')));
	this.bind('dt',		v => this.value('dt',v))	.bindev('dt',['keyup','change'],	() => this.data('dt',this.value('dt')));
	this.bind('hi',		v => this.value('hi',v))	.bindev('hi',['keyup','change'],	() => this.data('hi',this.value('hi')));
	this.bind('mi',		v => this.value('mi',v))	.bindev('mi',['keyup','change'],	() => this.data('mi',this.value('mi')));
	this.bind('si',		v => this.value('si',v))	.bindev('si',['keyup','change'],	() => this.data('si',this.value('si')));
	this.bind('ttl',	v => this.value('ttl',v))	.bindev('ttl',['keyup','change'],	() => this.data('ttl',this.value('ttl')));

	this.bindev('ok','click',() =>
	{
		this.ev.save.call(this);

		this.lockup=false;
		this.hide();
	});
	this.bindev('cancel','click',() =>
	{
		this.lockup=false;
		this.hide();
	});

	this.showmodal=() =>
	{
		this.lockup=true;
		this.show();
	};
}
