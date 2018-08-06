const proto=require('./proto');
const config=require('./config');
const server=require('./server/');
const webface=require('./webface/');

var app=new server();

app.set('config',config)
	.set('proto',proto)
	.run();

var web=new webface();

web.set('config',config)
	.set('proto',proto)
	.run();