function Clients(parent_item)
{
	this.className='Clients';
	this.mclass_prefix='x-';

	Clients.parent.constructor.call(this,parent_item);

	// var $this=this;

	this.ev=
	{
		update: (client,property,newvalue,cb) => {}
	};

	this.arrange=(jdata) =>
	{
		var active=jdata.map(e => e.alias);

		// delete
		this.items().forEach((client) =>
		{
			if(active.indexOf(client.data('alias'))<0 && !client.destroying()) client.selfdestruct();
		});

		// update
		this.items().forEach((client) =>
		{
			jdata.some((e,i) =>
			{
				if(client.data('alias')==e.alias)
				{
					if(client.destroying()) client.abortdestruct();

					if(!client.lockup) client.loadData(e);

					jdata.splice(i,1);

					return true;
				}
				else return false;
			});
		});

		// insert
		jdata.forEach(e =>
		{
			var client=new Client(this);

			client.ev=
			{
				update:		(property,value,cb) => this.ev.update(client,property,value,cb)
			};

			client.loadData(e);
		});
	};
}

function Client(parent_item)
{
	this.className='Client';
	this.mclass_prefix='c-';

	Client.parent.constructor.call(this,parent_item);

	this.lockup=false;

	this.ev=
	{
		update:	(property,value,cb) => {}
	};

	// var $this=this;

	this.bind('active',v =>
	{
		this.element('active').classList.remove('green','red');
		this.element('active').classList.add(v ? 'green' : 'red');
	});
	this.bind('enabled',	v => this.value('enabled',v) );
	this.bind('alias',		v => this.value('alias',this.data('hostname') ? this.data('hostname') : v) );
	this.bind('ip',			v => this.value('ip',v) );
	this.bind('loadavg',	v => this.value('loadavg',v.map(i=>i.toFixed(2)).join(', ')) );
	this.bind('starttime',	v => this.value('uptime',totime((+new Date()/1000).toFixed(0)-v).replace(' ',' day(s) ')) );
	this.bind('tasks',		v => this.value('tasks',v) );

	this.bindev('enabled','change',e =>
	{
		this.lockup=true;

		this.ev.update('enabled',e.target.checked,() => this.lockup=false);
	});

	// animated self destruct

	var destruct_timeout;

	this.destroying=() => destruct_timeout>0;

	this.selfdestruct=() =>
	{
		this.dom().classList.add('disabled','red');

		destruct_timeout=setTimeout(() =>
		{
			if(parent_item instanceof Clients)  parent_item.delete(this);
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
