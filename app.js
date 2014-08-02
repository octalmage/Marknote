var marked = require('marked');
note="#I am using#\n**markdown**.";
markdown=marked(note);

var store=new Lawnchair(function()
{

    this.get('notes', function(notes) 
    {
       console.log(notes)
    })

    this.save({key:'notes',notes:note})
})



$(document).on("ready",function()
{
	var gui = require('nw.gui'); 
	var win = gui.Window.get();

	//Show Chrome debug console.
	//win.showDevTools();

	$("#display").html(markdown);

	$("#note").on("dblclick", function()
	{
		if ($("#edit").css("display")=="none")
		{
			//Unselect text from doubleclick. 
			window.getSelection().removeAllRanges()
			$("#noteedit").val(note);
			$("#display").css("display","none");
			$("#edit").css("display", "block");

			//Put cursor at end of textarea.  
			setTimeout(function()
			{
				$("#noteedit").focus();
				$("#noteedit")[0].selectionStart = $("#noteedit")[0].selectionEnd = $("#noteedit")[0].value.length
			},1)

		}
		else
		{	
			//unselect text from doubleclick. 
			window.getSelection().removeAllRanges()
			note=$("#noteedit").val();
			markdown=marked(note);
			$("#display").html(markdown);
			$("#edit").css("display", "none");
			$("#display").css("display","block");

		}
	})
});