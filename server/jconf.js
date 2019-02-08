const fs=require('fs');

module.exports=function(_dbf)
{
	var dbf=_dbf;

	this.data={};

	this.load=_dbf =>
	{
		dbf=_dbf || dbf;

		try
		{
			fs.accessSync(dbf,fs.constants.R_OK);

			this.data=JSON.parse(fs.readFileSync(dbf));
		}
		catch(e)
		{
			console.error('Can\'t read file "'+dbf+'"');
		}
	};

	this.save=_dbf =>
	{
		dbf=_dbf || dbf;

		try
		{
			// fs.accessSync(dbf,fs.constants.W_OK);

			fs.writeFileSync(dbf,JSON.stringify(this.data));
		}
		catch(e)
		{
			console.error('Can\'t write file "'+dbf+'"');
		}
	};
}