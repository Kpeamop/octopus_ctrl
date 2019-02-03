const http=require('http');
const express=require('express');
const compress=require('compression');
const basic=require('express-basic-auth');
const less=require('less');
const fs=require('fs');
const auth=require('basic-auth');

module.exports=function()
{
	var $this=this;

	var private=
	{
		config: { connection: { port_http: 1188 } },
		cron: undefined,
		tasks: undefined,
		clients: undefined
	};

	var server=express();

	server.set('views',__dirname);

	server.use(compress());

	server.use(express.json());
	server.use(express.urlencoded({ extended: true }));

	server.use(function(req,res,next)
	{
		if(Object.keys(private.config.users).length>0)
			basic({ users: private.config.users, challenge: true })(req,res,next);
		else next();
	});

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
		var m=req.url.match(/^\/([-_a-zA-Z0-9]*)\.html/),
			file=m instanceof Array && m[1]!==undefined ? m[1] : 'index',
			vars={};

		switch(file)
		{
			case 'index':
				vars.enabled=private.cron.enabled;
			break;

			case 'test':

			break;

			case 'log':
				var task,alias=req.query.task;

				if(alias && (task=private.tasks.itemOfAlias(alias)))
				{
					vars.task=alias;
					vars.log_counters=task.log.counters();

					break;
				}

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
		var m=req.url.match(/^\/json\/([-_a-zA-Z0-9]*)(?:\/([-_a-zA-Z0-9]+))?/),
			action=m instanceof Array && m[1]!==undefined ? m[1] : 'index';

		var data;

		switch(action)
		{
			case 'test':
				data={ test_object: ['test array'] };
			break;

			case 'clients':
				data=private.clients.toData();
			break;

			case 'tasks':
				data=private.tasks.toData();
			break;

			case 'config':
				data=Object.assign({
										enabled: private.cron.enabled
									},
									private.config);
			break;

			case 'log':
				var task,alias=req.query.task;

				if(alias && (task=private.tasks.itemOfAlias(alias)))
				{
					if(m[2]===undefined) data=task.log.getAsk(req.query.index,req.query.count || 20);
					// else data=task.log.getDesc(req.query.index,req.query.count || 20);

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
		var m=req.url.match(/^\/set\/([-_a-zA-Z0-9]*)(?:\/([-_a-zA-Z0-9]+))?$/),
			action=m instanceof Array && m[1]!==undefined ? m[1] : 'index';

		var data={ result: false },
			log_msg='';

		switch(action)
		{
			case 'client':
				log_msg=req.body.alias+'.'+req.body.property+':'+req.body.value;

				if((i=private.clients.indexOfAlias(req.body.alias))>=0)
				{
					private.clients.items(i).props[req.body.property]=req.body.value;

					data.result=true;
				}
			break;

			case 'task':
				log_msg=req.body.alias+'.'+req.body.property+':'+req.body.value;

				if((i=private.tasks.indexOfAlias(req.body.alias))>=0)
				{
					private.tasks.items(i).props[req.body.property]=req.body.value;
					private.tasks.save();

					data.result=true;
				}
			break;

			case 'enabled':
				log_msg='cron.enabled:'+req.body.value;

				private.cron.enabled=req.body.value;
			break;

			case 'config':

			break;
		}

		res.status(200);
		res.type('application/json');

		res.send(JSON.stringify(data));

		$this.ev.log_command(getUser(req),'set',action,log_msg,data.result);
	});

	server.post(/^\/do\/(.+)$/,function(req,res)
	{
		var m=req.url.match(/^\/do\/([-_a-zA-Z0-9]+)(?:\/([-_a-zA-Z0-9]+))?$/),
			action=m instanceof Array && m[1]!==undefined ? m[1] : 'index';

		var data={ result: false },
			log_msg='';

		switch(action)
		{
			case 'start':
				log_msg=req.body.alias;

				var i;
				if(i=private.tasks.itemOfAlias(req.body.alias))
				{
					i.run();

					data.result=true;
				}
			break;

			case 'kill':
				log_msg=m[2] || req.body.alias;

				if(m[2]!==undefined && m[2]=='all')
				{
					private.tasks.killall();//killall

					data.result=true;
				}
				else
				{
					var i;
					if(i=private.tasks.itemOfAlias(req.body.alias))
					{
						i.kill();

						data.result=true;
					}
				}
			break;

			case 'restart':
				log_msg=req.body.alias;

				var i;
				if(i=private.tasks.itemOfAlias(req.body.alias))
				{
					i.kill();
					setTimeout(i.run,500);

					data.result=true;
				}
			break;
		}

		res.status(200);
		res.type('application/json');

		res.send(JSON.stringify(data));

		$this.ev.log_command(getUser(req),'do',action,log_msg,data.result);
	});

	this.ev=
	{
		log_command: (user,command,action,message,result) => {}
	};

	this.set=function(k,v)
	{
		private[k]=v;

		return this;
	};

	this.run=function()
	{
		if(private.tasks===undefined || private.clients===undefined || private.cron===undefined) throw new Error('Can\'t found private "cron" or "tasks" or "clients".');

		server.listen(private.config.connection.port_http,() =>
		{
			console.log('webface server running on','\t:'+private.config.connection.port_http);
		});
	};
};

function getUser(req)
{
	var u=auth(req);

	return u ? u.name : 'anonymous';
}