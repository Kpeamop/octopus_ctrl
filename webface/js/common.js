$(document).ready(() =>
{
	extend(Tasks,Control);
	extend(Task,Control);
	extend(TaskTime,Control);
	extend(Clients,Control);
	extend(Client,Control);

	// var tasks,clients;

	try
	{
		tasks=new Tasks('content');
		clients=new Clients('content');
	}
	catch(e)
	{
		console.error(e.messsage);
		return;
	}

	$('.tabs .tab')
		.on('click',function(e)
		{
			$('.tab').removeClass('sel').filter(this).addClass('sel');
			$('.tabsheet').removeClass('sel').filter('.'+this.attributes.sheet.value).addClass('sel');
		})
		.filter('.sel').each((i,e) => $('.tabsheet').removeClass('sel').filter('.'+e.attributes.sheet.value).addClass('sel') );

	tasks.ev.up=(task,property,value,unlock_cb) =>
	{
		var a=new XMLHttpRequest();

		a.open('POST','/set/task');
		a.setRequestHeader('Content-Type','application/json');

		try
		{
			a.send(JSON.stringify({alias:task.data('alias'),property,value}));
		}
		catch(e) {};

		unlock_cb();
	};

	clients.ev.up=(client,property,value,unlock_cb) =>
	{
		var a=new XMLHttpRequest();

		a.open('POST','/set/client');
		a.setRequestHeader('Content-Type','application/json');

		try
		{
			a.send(JSON.stringify({alias:client.data('alias'),property,value}));
		}
		catch(e) {};

		unlock_cb();
	};

	var refresh_data=() =>
	{
		if($('.clients.tabsheet:visible').length>0 || !$('.clients.tabsheet > *').length)
			$.getJSON('/json/clients',jdata =>
			{
				$(clients.dom()).removeClass('disabled');
				$('.content .menu').removeClass('disabled');

				clients.arrange(jdata);
			})
			.fail(e =>
			{
				$(clients.dom()).addClass('disabled');
				$('.content .menu').addClass('disabled');

				console.log(e.status,e.statusText);
			});

		if($('.tasks.tabsheet:visible').length>0 || !$('.tasks.tabsheet > *').length)
			$.getJSON('/json/tasks',jdata =>
			{
				$(tasks.dom()).removeClass('disabled');
				$('.content .menu').removeClass('disabled');

				tasks.arrange(jdata);
			})
			.fail(e =>
			{
				$(tasks.dom()).addClass('disabled');
				$('.content .menu').addClass('disabled');

				console.log(e.status,e.statusText);
			});
	};

	refresh_data();

	setInterval(refresh_data,1000);
});