const fs=require('fs');
const inc=require('../include');

module.exports=function(dir)
{
	this.add_msg=(message,user) =>
	{
		try
		{
			fs.appendFileSync(dir+'/_syslog_.log',inc.timeFormat((+new Date()/1000).toFixed(0))+' ['+user+'] '+message+String.fromCharCode(10));
		}
		catch(e) { }
	};
};