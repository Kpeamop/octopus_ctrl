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

		private.tasks[alias]={ task, inner_start: false,
								interval: parseInt(tm.hi)*3600+parseInt(tm.mi)*60+parseInt(tm.si),
								startdate: { h: parseInt(tm.ht), m: parseInt(tm.mt), d: parseInt(tm.dt) }
							};

		task.ev.enable_change=active => {};
		task.ev.stop=err_code => { private.tasks[alias].inner_start=false; };
		// switch(tm.type)
		// {
		// 	case 'interval':
		// 	break;

		// 	case 'totime':
		// 	break;
		// }
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

	const ts=() => +new Date()/1000;

	setInterval(() =>
	{
		for(alias of Object.keys(private.tasks))
		{
			var { task, interval, startdate, inner_start }=private.tasks[alias];
			var { props: {
							starttime: { type, ttl },
							execution: { start, end }
						}
				}=task;

			start=parseInt(start);
			end=parseInt(end);
			ttl=parseInt(ttl);

			if(!end && start>0) // is running
			{
				if(ttl>0 && start+ttl<ts()) task.kill();
			}
			else
			if(private.enabled && task.props.enabled)
			{
				if(type=='interval' && (end+interval<ts() || !end && !start)) // is stopped
				{
					private.tasks[alias].inner_start=true;

					task.run();
				}
				else
				{
					var d=new Date();
					d.setDate(startdate.d);
					d.setHours(startdate.h);
					d.setMinutes(startdate.m);
					d.setSeconds(0);

					if(type=='totime' && +d/1000<ts() && (end<+d/1000 || !end))
					{
						private.tasks[alias].inner_start=true;

						task.run();
					}
				}

			}
		}

	},1000);
};
