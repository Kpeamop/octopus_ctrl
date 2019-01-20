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

		private.tasks[alias]={ tm, tm_job: 0, ts_start: 0, ts_end: 0 };

		const ts=() => +new Date()/1000;

		switch(tm.type)
		{
			case 'interval':
				var interval=tm.hi*3600+tm.mi*60+tm.si;

				// var launch=() =>
				// {
				// 	if(task.props.enabled)

				// };

				// task.run();

					// setInterval();

				task.ev.enable_change=active =>
				{
					;
				};

				task.ev.stop=err_code =>
				{
					console.log(111111);
				};



				;
			break;

			case 'totime':
				// tm.ht tm.mt tm.dt
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

			if(private.tasks[alias].tm_job>0) clearTimeout(private.tasks[alias].tm_job);

			delete private.tasks[alias];
		}
	};
};
