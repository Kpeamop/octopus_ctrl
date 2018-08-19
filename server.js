const proto=require('./proto');
const config=require('./config');
const server=require('./server/');
const webface=require('./webface/');

var app=new server();

app.set('config',config)
	.set('proto',proto)
	.run();

var web=new webface();

try
{
	web.set('config',config)
		.set('proto',proto)
		.set('clients',app.clients)
		.set('tasks',app.tasks)
		.run();
}
catch(e)
{
	console.error('webface',e.message);
}