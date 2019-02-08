$(document).ready(() =>
{
	extend(Tasks,Control);
	extend(Task,Control);
	extend(Clients,Control);
	extend(Client,Control);
	extend(TaskEdit,Control);

	var tasks,clients,editor;

	try
	{
		editor=new TaskEdit('body');
		tasks=new Tasks('content',editor);
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
		restart:	(task)	=> jsonRequest(parseInt(task.data('pid'))>0 ? '/do/restart' : '/do/start',{alias:task.data('alias')},() => {}),

		menu_edit:		task => {},
		menu_delete:	task => jsonRequest('/do/deltask',{ alias: task.data('alias') },() => {})
	};

	clients.ev.update=(client,property,value,unlock_cb)	=> jsonRequest('/set/client',{alias:client.data('alias'),property,value},unlock_cb);

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

	$('#enabled').on('click',e => jsonRequest('/set/enabled',{'value':e.target.checked},() => {}) );
	$('#killall').on('click',e => jsonRequest('/do/kill/all',{},() => {}) );
	$('#newtask').on('click',e =>
	{
		var alias=prompt('Введите метку задачи (только латиница, цифры и знак подчеривания):','task_'+(+new Date()/1000).toFixed(0));

		if(alias!==null)
		{
			alias=alias.replace(/[^_a-z0-9]/,'');

			jsonRequest('/do/newtask',{ alias },(err,jdata) =>
			{
				var json={};

				try
				{
					json=JSON.parse(jdata);
				}
				catch(e) {};

				if(json.result)
				{
					// костыль на добавление
					// todo: единая процедура для редактирования/добавления
					editor.showmodal({ alias,cmd: '',args: '',env: '',description: '',starttime: { type: '', dt: '',ht: '',mt: '',hi: '',mi: '',si: '',ttl: '' } },need_update =>
					{
						if(need_update)
						{
							['description','env','cmd','args','starttime'/*,'priority'*/].forEach(e =>
							{
								jsonRequest('/set/task',{ alias,property: e,value: editor.data(e) },() => {});
							});
						}
					},true);
				}
				else alert('Ошибка добавления, возможно задача "'+alias+'" уже существует.');
			});
		}
	});
});