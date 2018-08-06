const net=require('net');
const os=require('os');
const process=require('process');

function packet()
{

}

exports.identity=function()
{
	return 	{
				platform: 	os.platform(),
				uptime: 	os.uptime(),
				os_release: os.release(),
				hostname: 	os.hostname(),
				loadavg: 	os.loadavg(),
				pid: 		process.pid,
				ip: Object.values(os.networkInterfaces())
						.reduce((r,i) => r.concat(i),[])
						.filter(i => i.internal==false && i.family=='IPv4')
						.map(i => i['address'])
			};
};

exports.loadavg=function()

{
	return os.loadavg();
};

exports.gettasks=function()
{
	return 	{
				action: 'gettasks'
			};
};
