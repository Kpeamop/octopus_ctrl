const fs=require('fs');
const inc=require('../include');

module.exports=function(dir)
{
	var files={};

	this.autoflush=true;

	var tm_autoflush=null;

	this.add_msg=(file,message,type) =>
	{
		file=file.replace(/[^-_a-z0-9]+/gi,'_');

		message='['+type+'] '+message.replace(/^\s+|\s+$/,''); // trim

		if(!files[file]) files[file]=[message];
		else files[file].push(message);

		if(this.autoflush)
		{
			if(!tm_autoflush) tm_autoflush=setTimeout(this.flush,2000);
		}
		else this.flush();
	};

	this.stopflush=() =>
	{
		if(tm_autoflush)
		{
			clearTimeout(tm_autoflush);
			tm_autoflush=null;
		}
	};

	this.flush=() =>
	{
		this.stopflush();

		if(this.autoflush) tm_autoflush=setTimeout(this.flush,2000);

		for(var file in files)
		{
			while(files[file].length>0)
			{
				try
				{
					fs.appendFileSync(dir+'/'+file+'.log',inc.timeFormat((+new Date()/1000).toFixed(0))+' '+files[file].shift()+String.fromCharCode(10));
				}
				catch(e) { }
			}
		}
	};
};