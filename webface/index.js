const http=require('http');
const express=require('express');
const less=require('less');
const fs=require('fs');

module.exports=function()
{
	this.config={ connection: {port_http: 1188} };
	this.proto={};

	var server=express();

	server.set('views',__dirname);

    // server.use('/css',require('less-middleware'));

	server.use('/js',express.static(__dirname+'/js'));
	server.use('/images',express.static(__dirname+'/images'));

	server.get('/css/*.css',function(req,res)
	{
		res.status(200);
		res.type('text/css');

		var m=req.url.match(/\/css\/([-_a-zA-Z0-9]*)\.css/),
			file=m[1]!==undefined ? m[1] : 'style';

		less.render(fs.readFileSync(__dirname+'/css/'+file+'.less').toString())
			.then(out => res.send(out),
					e => console.error(e));
	});

	server.get(/\/(.+\.html)?/,function(req,res)
	{
		res.status(200);
		res.type('text/html');
		res.render(__dirname+'/html/index.jade',{title:123});
	});

	// server.use((err,req,res,next) =>
	// {
	// 	console.error(err.stack);
	// 	res.type('text/plain');
	// 	res.status(500);
	// 	res.send('500 - server error');
	// });

	this.set=function(k,v)
	{
		this[k]=v;

		return this;
	};

	this.run=function()
	{
		server.listen(this.config.connection.port_http,() =>
		{
			console.log('express running');
		});
	};
};