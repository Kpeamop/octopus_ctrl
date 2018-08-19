const http=require('http');
const express=require('express');
const bodyParser = require('body-parser');
const less=require('less');
const fs=require('fs');

module.exports=function()
{
	var $this=this;

	this.config={ connection: {port_http: 1188} };
	this.proto={};

	this.tasks;
	this.clients;

	var server=express();

	server.set('views',__dirname);

	server.use(bodyParser.json());
	server.use(bodyParser.urlencoded({ extended: true }));

	server.use('/js',express.static(__dirname+'/js'));
	server.use('/images',express.static(__dirname+'/images'));

	server.get('/css/*.css',function(req,res)
	{
		res.status(200);
		res.type('text/css');

		var m=req.url.match(/\/css\/([-_a-zA-Z0-9]*)\.css/),
			file=m instanceof Array && m[1]!==undefined ? m[1] : 'style';

		less.render(fs.readFileSync(__dirname+'/css/'+file+'.less').toString(),{ compress: true })
			.then(out => res.send(out['css']),
					e => console.error(e));
	});

	server.get(/^\/(.+\.html)?$/,function(req,res)
	{
		var m=req.url.match(/\/([-_a-zA-Z0-9]*)\.html/),
			file=m instanceof Array && m[1]!==undefined ? m[1] : 'index',
			vars={};

		switch(file)
		{
			case 'index':

			break;

			case 'test':

			break;

			default:
				res.status(404);
			 	res.send('404 - not found');
			 	return;
		}

		res.status(200);
		res.type('text/html');

		res.render(__dirname+'/html/'+file+'.jade',vars);
	});

	server.get(/^\/json\/(.+)$/,function(req,res)
	{
		var m=req.url.match(/\/json\/([-_a-zA-Z0-9]*)(?:\/([-_a-zA-Z0-9]+))?/),
			action=m instanceof Array && m[1]!==undefined ? m[1] : 'index';

		var data;

		switch(action)
		{
			case 'test':
				data={ test_object: ['test array'] };
			break;

			case 'clients':
				data=$this.clients.toData();
			break;

			case 'tasks':
				data=$this.tasks.toData();
			break;

			case 'config':

			break;

			case 'log':
				if(m[2]!==undefined)
				{

					break;
				}

			default:
				res.status(404);
			 	res.send('404 - not found');
			 	return;
		}

		res.status(200);
		res.type('application/json');

		res.send(JSON.stringify(data));
	});

	server.post(/^\/set\/(.+)$/,function(req,res)
	{
		var m=req.url.match(/\/set\/([-_a-zA-Z0-9]*)(?:\/([-_a-zA-Z0-9]+))?/),
			action=m instanceof Array && m[1]!==undefined ? m[1] : 'index';

		var data={ result: false };

		switch(action)
		{
			case 'client':
				if((i=$this.clients.indexOfAlias(req.body.alias))>=0)
				{
					$this.clients.items(i).props[req.body.property]=req.body.value;

					data.result=true;
				}
			break;

			case 'task':
				if((i=$this.tasks.indexOfAlias(req.body.alias))>=0)
				{
					$this.tasks.items(i).props[req.body.property]=req.body.value;

					data.result=true;
				}
			break;

			case 'config':

			break;

			default:
				res.status(404);
			 	res.send('404 - not found');
			 	return;
		}

		res.status(200);
		res.type('application/json');

		res.send(JSON.stringify(data));
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
		if(this.tasks===undefined || this.clients===undefined) throw new Error('Can\'t found "this.tasks" or "this.clients".');

		server.listen(this.config.connection.port_http,() =>
		{
			console.log('webface server running on','\t:'+this.config.connection.port_http);
		});
	};
};