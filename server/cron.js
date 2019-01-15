module.exports=function()
{
	var debug=true;

	var tasks={};

	this.register=function(alias,tm,func)
	{
		tasks[alias]={ func, tm, last_ts: 0 };
	};

	this.registered=function(alias)
	{
		return tasks[alias]===undefined;
	};

	this.unregister=function(alias)
	{
		if(this.registered(alias)) delete tasks[alias];
	};
};