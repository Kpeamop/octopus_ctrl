module.exports=function(size)
{
	var buffer=[];
	var index=0;

	Object.defineProperty(this,'lastIndex', { get: () => index });

	this.count=() => buffer.length;

	this.addStdout=function(mgs,client)
	{
		if(buffer.length>=size) buffer.shift();

		buffer.push({ i:++index, tstamp_ms:+new Date(), type:'stdout', msg, client });
	};

	this.addStderr=function(msg,client)
	{
		if(buffer.length>=size) buffer.shift();

		buffer.push({ i:++index, tstamp_ms:+new Date(), type:'stderr', msg, client });
	};

	this.addSystem=function(msg,client)
	{
		if(buffer.length>=size) buffer.shift();

		buffer.push({ i:++index, tstamp_ms:+new Date(), type:'system', msg, client });
	};

	this.getAsk=(index,count) =>
	{
		return buffer.slice(index,index+count);
	};

	this.getDesc=(index,count) =>
	{
		return buffer.reverse().slice(index,index+count)
	};

};