function Tasks(parent_item,editor)
{
	this.className='Tasks';
	this.mclass_prefix='x-';

	Tasks.parent.constructor.call(this,parent_item);

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
			var task=new Task(this,editor);

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

function Task(parent_item,editor)
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

	this.bind('alias',		 v => this.value('alias',v));
	this.bind('description', v => this.value('description',v));
	this.bind('pid',		 v => this.value('pid',v));
	// this.bind('ram',		 v => this.value('ram',(v/1024/1024).toFixed(1)));
	this.bind('enabled',	 v => this.value('enabled',v));
	this.bind('client',		 v => this.value('client',v));
	this.bind('log_counters',v =>
	{
			this.value('log-stdout',v.stdout);
			this.value('log-stderr',v.stderr);
	});
	this.bind('starttime',	 v =>
	{
		var leedzero=int => int<10 ? '0'+int : int;

		switch(v.type)
		{
			case 'totime':
				this.value('starttype','по времени');
				this.value('time-text',leedzero(v.ht)+':'+leedzero(v.mt)+' '+leedzero(v.dt)+(v.ttl>0 ? '<br>'+'ttl:'+v.ttl : ''));
			break;

			case 'interval':
				this.value('starttype','интервал');
				this.value('time-text',leedzero(v.hi)+':'+leedzero(v.mi)+':'+leedzero(v.si)+(v.ttl>0 ? '<br>'+'ttl:'+v.ttl : ''));
			break;

			default:
				this.value('starttype','ручной');
				this.value('time-text',(v.ttl>0 ? '<br>'+'ttl:'+v.ttl : ''));
		}

	});
	this.bind(['args'],	v => this.value('cmdargs',this.data('cmd')+'\n'+v.join('\n')));
	this.bind('execution',		v =>
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

	this.bindev('kill','click',		() => this.ev.kill());
	this.bindev('restart','click',	() => this.ev.restart());

	this.bindev(['logout','logerr'],'click',e => { e.preventDefault(); window.open('/log.html?task='+encodeURIComponent(this.data('alias'))); });

	this.bindev('menu_edit','click',e => // DEBUG delete ENV
	{
		if(editor)
		{
			this.lockup=true;

			editor.showmodal(this.datas(),need_update =>
			{
				if(need_update)
				{
					this.ev.update('description',editor.data('description'));
					this.ev.update('env',editor.data('env'));
					this.ev.update('cmd',editor.data('cmd'));
					this.ev.update('args',editor.data('args'));
					// this.ev.update('priority',editor.data('priority'));

					// небольшая топорность (отложенное отключение запрета обновления lockup)
					setTimeout(() => this.ev.update('starttime',editor.data('starttime'),() => this.lockup=false),200);
				}
				else this.lockup=false;
			});
		}
	});

	this.bindev('menu_delete','click',e =>
	{
		if(confirm('Удалить '+this.data('alias')+' ?')) alert(123);
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

function TaskEdit(parent_item)
{
	this.className='TaskEdit';
	this.mclass_prefix='te-';

	TaskEdit.parent.constructor.call(this,parent_item);

	this.hide();

	this.ev=
	{
		close: (need_update) => {}
	};

	this.bindev('ok','click',() =>
	{
		this.ev.close(true,this.datas());

		this.hide();
	});

	this.close=() =>
	{
		this.ev.close(false);

		this.hide();
	};

	this.bindev(['cancel','bg'],'click',() => this.close() );

	this.bindev('description',['keyup','change'],	() => this.data('description',this.value('description')) )
		// .bindev('priority',['keyup','change'],	() => this.data('priority',this.value('priority')) )
		.bindev('cmdargs',['change'], 		() =>
		{
			var cmdargs=this.value('cmdargs').split(/[\n\r]+/);

			this.data('cmd',cmdargs.shift());
			this.data('args',cmdargs.filter(v => !!v));
		})
		.bindev('env',['change'],			() =>
		{
			// this.data('priority',this.value('priority'))
			var env=this.value('env').split(/[\n\r]+/);

			var r={};

			env.forEach(e =>
			{
				var m=e.split('='),
					v=m.shift();

				if(v) r[v]=m.join('=');
			});

			this.data('env',r);
		});

	this.bindev('radio-i','change',() => this.data('starttime').type='interval')
		.bindev('radio-t','change',() => this.data('starttime').type='totime')

		.bindev('dt',['keyup','change'],	() => this.data('starttime').dt=this.value('dt'))
		.bindev('ht',['keyup','change'],	() => this.data('starttime').ht=this.value('ht'))
		.bindev('mt',['keyup','change'],	() => this.data('starttime').mt=this.value('mt'))
		.bindev('hi',['keyup','change'],	() => this.data('starttime').hi=this.value('hi'))
		.bindev('mi',['keyup','change'],	() => this.data('starttime').mi=this.value('mi'))
		.bindev('si',['keyup','change'],	() => this.data('starttime').si=this.value('si'))
		.bindev('ttl',['keyup','change'],	() => this.data('starttime').ttl=this.value('ttl'));

	this.showmodal=(data,cb_evclose) =>
	{
		this.data_clear();

		this.bind('alias',			v => this.value('alias',v));
		this.bind('description',	v => this.value('description',v));
		this.bind('env',			v => this.value('env',
			(function(o)
			{
				var r=[];

				for(var i of Object.keys(o)) r.push(i+'='+o[i]);

				return r.join('\n');
			})(v)
		));
		this.bind(['cmd','args'],	v => this.value('cmdargs',this.data('cmd')+'\n'+(this.data('args') ? this.data('args').join('\n') : '')));
		this.bind('starttime',		v =>
		{
			switch(v.type)
			{
				case 'interval':
					this.element('radio-i')['checked']=true;
				break;

				case 'totime':
					this.element('radio-t')['checked']=true;
				break;

				default:
					this.element('radio-i')['checked']=false;
					this.element('radio-t')['checked']=false;
			}

			this.value('dt',v.dt);
			this.value('ht',v.ht);
			this.value('mt',v.mt);
			this.value('hi',v.hi);
			this.value('mi',v.mi);
			this.value('si',v.si);
			this.value('ttl',v.ttl);
		});

		if(cb_evclose instanceof Function) this.ev.close=cb_evclose;

		this.loadData(data);

		this.show();
	};
}
