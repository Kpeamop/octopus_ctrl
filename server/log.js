module.exports=function(size)
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

	this.count=() => buffer.length;

	this.counters=() => counters;

	this.addStdout=function(msg,client)
	{
		counters.stdout++;

		if(buffer.length>=size) buffer.shift();

		buffer.push({ i:++index, tstamp_ms:+new Date(), type:'stdout', msg, client });
	};

	this.addStderr=function(msg,client)
	{
		counters.stderr++;

		if(buffer.length>=size) buffer.shift();

		buffer.push({ i:++index, tstamp_ms:+new Date(), type:'stderr', msg, client });
	};

	this.addSystem=function(msg,client)
	{
		counters.system++;

		if(buffer.length>=size) buffer.shift();

		buffer.push({ i:++index, tstamp_ms:+new Date(), type:'system', msg, client });
	};

	this.getAsk=(idx,count) =>
	{
		count=count || 20;
		idx=idx || index-count;
		idx=idx>0 ? idx : 1;

		return buffer.filter(e => e.i>=idx && e.i<=idx+count-1);
	};

	// this.getDesc=(idx,count) =>
	// {
	// 	return buffer.reverse().slice(idx,idx+count);
	// };

};