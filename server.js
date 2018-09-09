const config=require('./config');
const server=require('./server/');
const webface=require('./webface/');

var app=new server();

app.set('config',config)
	.run();

var web=new webface();

try
{
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