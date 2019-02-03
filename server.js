const config=require('./config');
const server=require('./server/');
const webface=require('./webface/');
const syslog=require('./server/syslog');

var app=new server();

app.set('config',config)
	.run();

var web=new webface();

var slog=new syslog(__dirname+'/logs');

try
{
	// todo: отрефакторить, сменить вид связи с syslog

	web.ev.log_command=(u,c,a,m,r) =>
	{
		// if(debug) console.log(u,c,a,m,r);
		slog.add_msg(c+' '+a+' '+m+' result:'+r,u);
	};

	web.set('config',	config)
		.set('cron',	app.cron)
		.set('clients',	app.clients)
		.set('tasks',	app.tasks)
		.run();
}
catch(e)
{
	console.error('webface',e.message);
}