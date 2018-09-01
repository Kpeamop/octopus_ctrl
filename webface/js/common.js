$(document).ready(() =>
{
	extend(Tasks,Control);
	extend(Task,Control);
	extend(TaskTime,Control);
	extend(Clients,Control);
	extend(Client,Control);

	var tasks,clients;

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

			history.pushState({},'','#'+this.attributes.sheet.value);
		})
		.filter('[sheet='+(location.hash.replace('#','') || 'tasks')+']').trigger('click');

	tasks.ev=
	{
		update:		(task,property,value,unlock_cb)	=> jsonRequest('/set/task',{alias:task.data('alias'),property,value},unlock_cb),
		kill: 		(task)	=> jsonRequest('/do/kill',{alias:task.data('alias')},() => {}),
		restart:	(task)	=> jsonRequest(parseInt(task.data('execution').end)>0 ? '/do/start' : '/do/restart',{alias:task.data('alias')},() => {}),
	};

	clients.ev.update=(client,property,value,unlock_cb)	=> jsonRequest('/set/client',{alias:client.data('alias'),property,value},unlock_cb);

	$('#enabled').on('click',e => jsonRequest('/set/enabled',{'value':e.target.checked},() => {}) );
	$('#killall').on('click',e => jsonRequest('/do/kill/all',{},() => {}) );

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