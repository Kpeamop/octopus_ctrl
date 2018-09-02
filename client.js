const config=require('./config');
const client=require('./client/');

var app=new client();

app.set('config',config)
	.run();
