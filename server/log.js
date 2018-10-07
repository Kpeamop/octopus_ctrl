exports.log=function(size)
{
	var buffer=[];
	var index=0;
	var counters=
	{
		stdout: 0,
		stderr: 0,
		system: 0
	};

	Object.defineProperty(this,'lastIndex', { get: () => index });
	// Object.defineProperty(this,'counters', { get: () => counters });

	this.ev=
	{
		add_msg: (type,client,ts,msg) => {}
	};

	this.count=() => buffer.length;

	this.counters=() => counters;

	this.addStdout=function(msg,client)
	{
		var ts=+new Date();

		counters.stdout++;
		client=client || '';

		if(buffer.length>=size) buffer.shift();

		buffer.push({ i:++index, tstamp_ms:ts, type:'stdout', msg, client });

		this.ev.add_msg('stdout',client,ts,msg);
	};

	this.addStderr=function(msg,client)
	{
		var ts=+new Date();

		counters.stderr++;
		client=client || '';

		if(buffer.length>=size) buffer.shift();

		buffer.push({ i:++index, tstamp_ms:ts, type:'stderr', msg, client });

		this.ev.add_msg('stderr',client,ts,msg);
	};

	this.addSystem=function(msg,client)
	{
		var ts=+new Date();

		counters.system++;
		client=client || '';

		if(buffer.length>=size) buffer.shift();

		buffer.push({ i:++index, tstamp_ms:ts, type:'system', msg, client });

		this.ev.add_msg('system',client,ts,msg);
	};

	this.getAsk=(idx,count) =>
	{
		count=(count || 20)-1;
		idx=idx || index-count;
		idx=idx>0 ? idx : 1;

		return buffer.filter(e => e.i>=idx && e.i<=idx+count);
	};

	// this.getDesc=(idx,count) =>
	// {
	// 	return buffer.reverse().slice(idx,idx+count);
	// };

};