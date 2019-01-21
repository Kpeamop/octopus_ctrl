const inc=require('../include');

module.exports=function()
{
	var debug=true;

	var private=
	{
		tasks: {},
		enabled: false
	};

	this.ev=
	{
		enable_change: active => {}
	};

	const ts=() => +new Date()/1000;

	Object.defineProperty(this,'enabled',
	{
		get: () => private.enabled,
		set: v =>  this.ev.enable_change(private.enabled=v)
	});

	this.register=function(alias,tm,task)
	{
		if(this.registered(alias))
		{
			console.log('Already registred task "'+alias+'" in cron.');

			return;
		}

		if(debug) console.log('cron: register task "'+alias+'" on',tm.type,(tm.type=='interval' ? tm.hi+':'+tm.mi+':'+tm.si : tm.dt+' '+tm.ht+':'+tm.mt));

		private.tasks[alias]={ task };

		switch(tm.type)
		{
			case 'interval':
				private.tasks[alias].interval=parseInt(tm.hi)*3600+parseInt(tm.mi)*60+parseInt(tm.si);

				task.ev.enable_change=active => {};
				task.ev.stop=err_code => {};
			break;

			case 'totime':
				// var startdate=tm.ht tm.mt tm.dt;
				;
			break;
		}
	};

	this.registered=function(alias)
	{
		return private.tasks[alias]!==undefined;
	};

	this.unregister=function(alias)
	{
		if(this.registered(alias))
		{
			if(debug) console.log('cron: unregister task "'+alias+'"');

			delete private.tasks[alias];
		}
	};

	setInterval(() =>
	{
		if(private.enabled)
		{
			for(alias of Object.keys(private.tasks))
			{
				var { task, interval }=private.tasks[alias],
					{ props: {
								starttime: { ttl },
								execution: { start, end }
							}
					}=task;

				start=parseInt(start);
				end=parseInt(end);
				ttl=parseInt(ttl);

				if(task.props.enabled)
				{
					if(!end && start>0) // is running
					{
						if(ttl>0 && start+ttl<ts()) task.kill();
					}
					else if(!end || end+interval<ts()) // is stopped
							{
								task.run();
							}
				}
			}
		}

	},1000);
};
