$(document).ready(() =>
{
	$('.tab')
		.on('click',function(e)
		{
			$('.tab').removeClass('sel').filter(this).addClass('sel');
			$('.tabsheet').removeClass('sel').filter('.'+this.attributes.sheet.value).addClass('sel');
		})
		.filter('.sel').each((i,e) => $('.tabsheet').removeClass('sel').filter('.'+e.attributes.sheet.value).addClass('sel') );

	t=new Tasks('content');
	x=new Task(t);
	x=new Task(t);
	x=new Task(t);

	t=new Clients('content');
	x=new Client(t);
	x=new Client(t);
	x=new Client(t);

	// setInterval(() =>
	// {
	// 	$.getJSON('/json/clients',(jdata) =>
	// 	{
	// 		console.log(jdata);
	// 	});
	// },1000);

});