// Maintained in localsite/js/navigation.js
const page_scripts = document.getElementsByTagName("script");
const current_code_path = page_scripts[page_scripts.length-1].src;
const slash_count = (current_code_path.match(/\//g) || []).length; // To set path to header.html

if (window.location.protocol != 'https:' && location.host.indexOf('localhost') < 0) {
	location.href = location.href.replace("http://", "https://");
}
var imageUrl;

$(document).ready(function(){
	// Get the levels below root
 	var foldercount = (location.pathname.split('/').length - 1); // - (location.pathname[location.pathname.length - 1] == '/' ? 1 : 0) // Removed because ending with slash or filename does not effect levels. Increased -1 to -2.
 	foldercount = foldercount - 2;
 	var climbcount = foldercount;
 	if(location.host.indexOf('localhost') >= 0) {
 		//climbcount = foldercount - 0;
 	}
 	var climbpath = "";
 	for (var i = 0; i < climbcount; i++) {
 		climbpath += "../";
 	}
 	if (climbpath == "") {
 		climbpath += "./"; // Eliminates ? portion of URL
 	}
 	//console.log("climbpath " + climbpath);

 	var modelpath = climbpath;
 	if(location.host.indexOf('localhost') < 0 && location.host.indexOf('model.') < 0 && location.host.indexOf('hood') < 0) { // When not localhost or other sites that have a fork of io and community.
 		// To do: allow "Input-Output Map" link in footer to remain relative.
 		modelpath = "https://model.earth/" + modelpath; // Avoid - gets applied to #headerSiteTitle and hamburger menu
 		
 		//modelpath = "/" + modelpath;
 	}
 	if (param.showhero != "false") {
 		if(location.host.indexOf("georgia") >= 0) { 
	 		//$("body").prepend( "<div class='headerImage'><img src='" + modelpath + "../io/img/hero/sustainable-communities.jpg' style='width:100%'></div>");
	 	}
	}
 	$("body").wrapInner( "<div id='fullcolumn'></div>"); // Creates space for sidecolumn
 	if(document.getElementById("sidecolumn") == null) {
 		$("body").prepend( "<div id='sidecolumn' class='hideprint'></div>\r" );
 	}
 	$("body").addClass("flexbody"); // For footer to stick at bottom on short pages
 	$("body").wrapInner( "<main class='flexmain' style='position:relative'></main>"); // To stick footer to bottom
 	$("body").prepend( "<div id='header' class='flexheader hideprint'></div>\r" );
		

 	if (param["showheader"] == "false") {

		$(".filterPanel").addClass("filterPanel_fixed");
		$("#map1").addClass("filterPanel_fixed_maptop");
	

	// TO DO: Add support for custom headerpath

 	} else {
 		// LOAD HEADER.HTML
 		let headerFile = modelpath + "../localsite/header.html";
 		if (slash_count <= 4) { // Folder is the root of site
 			// Currently avoid since "https://model.earth/" is prepended to climbpath above.
 			//headerFile = climbpath + "../header.html";
 		}
 		if (param.headerFile) {
 			modelpath = ""; // Use the current repo when custom headerFile provided.
 			headerFile = param.headerFile;
 		}

		if (param.header) headerFile = param.header;
	 	$("#header").load(headerFile, function( response, status, xhr ) {

	 		// Move headerOffset2 and filterEmbedHolder immediately after body tag start.
	 		// Allows map embed to reside below intro text and additional navigation on page.
	 		$("#filterEmbedHolder").insertAfter("#headeroffset");
	 		//$(".headerOffset2").insertAfter("#headeroffset");
	 		$(".headerOffset2").insertAfter("#headerFixed");
	 		
	 		//$(".headerOffset2").hide();

	 		// Make paths relative to current page
	 		$("#header a[href]").each(function() {
	 			if($(this).attr("href").toLowerCase().indexOf("http") < 0) {
		      		$(this).attr("href", modelpath + $(this).attr('href'));
		  		}
		    })
		    $("#header img[src]").each(function() {
	 		  if($(this).attr("src").toLowerCase().indexOf("http") < 0) {
	 		  	if($(this).attr("src").indexOf("/") != 0) { // Don't append if starts with /
		      		$(this).attr("src", modelpath + $(this).attr('src')); // Was climbpath
		      	}
		  	  }
		    })

	 		// Set here so path works at all levels.

	 		// To do: fetch the existing background-image.
	 		if (param.startTitle == "Code for America" ||  location.host.indexOf('codeforamerica') >= 0) {
	  			param.titleArray = []
	  			param.headerLogo = "<img src='/localsite/img/logo/partners/codeforamerica.png' style='width:140px;'>";
		 		document.title = "Code for America - " + document.title
		 		// BUGBUG - error in console
		 		//changeFavicon("https://lh3.googleusercontent.com/HPVBBuNWulVbWxHAT3Nk_kIhJPFpFObwNt4gU2ZtT4m89tqjLheeRst_cMnO8mSrVt7FOSlWXCdg6MGcGV6kwSyjBVxk5-efdw")
		 	} else if (param.startTitle == "Code for Atlanta" ||  location.host.indexOf('atlanta') >= 0) {
	  			param.titleArray = []
	  			param.headerLogo = "<img src='https://scienceatl.org/wp-content/uploads/2020/04/code.png' style='width:150px;'>";
		 		document.title = "Code for Atlanta - " + document.title
		 		// BUGBUG - error in console
		 		//changeFavicon("https://lh3.googleusercontent.com/HPVBBuNWulVbWxHAT3Nk_kIhJPFpFObwNt4gU2ZtT4m89tqjLheeRst_cMnO8mSrVt7FOSlWXCdg6MGcGV6kwSyjBVxk5-efdw")
		 	// localhost will be removed from the following. Currently allows Georgia branding during testing.
		 	// location.host.indexOf('localhost') >= 0 || 
		 	} else if (location.host.indexOf('localhost') >= 0 || param.startTitle == "Georgia.org" || location.host.indexOf("georgia") >= 0) {
		 		$(".siteTitleShort").text("Model Georgia");
		 		param.titleArray = [];
		 		//param.headerLogo = "<a href='https://georgia.org'><img src='" + modelpath + "../community/img/logo/georgia_usa_gray.png' style='width:130px;padding-top:4px'></a>";
		 		param.headerLogo = "<a href='https://georgia.org'><img src='/localsite/img/logo/states/GA.png' style='width:130px;padding-top:4px'></a>";
		 		param.headerLogoNoText = "<a href='https://georgia.org'><img src='/localsite/img/logo/states/GA-notext.png' style='width:40px;padding-top:0px;margin-top:-4px'></a>";
		 		document.title = "Georgia.org - " + document.title
		 		changeFavicon("https://www.georgia.org/sites/default/files/logo-georgia-peach-notext_0.png")
		 		$('.georgia').css('display', 'inline');
		 		$('.georgia-hide').css('display', 'none');
		 		if (location.host.indexOf('localhost') < 0) {
		 			$(".locationTab").hide(); // So we can test locally
		 		}
		 		if (location.host.indexOf('georgia.org') >= 0) {
		 			$('.georgiaorg-hide').css('display', 'none');
		 		}
		 	} else if (!Array.isArray(param.titleArray) && (param.startTitle == "Neighborhood.org" || location.host.indexOf('neighborhood.org') >= 0)) {
		 		$(".siteTitleShort").text("Neighborhood Modeling");
		 		param.titleArray = ["neighbor","hood"]
	  			param.headerLogo = "<img src='/localsite/img/logo/partners/neighborhood-icon.png' style='width:40px;opacity:0.7'>"
	  			document.title = "Neighborhood.org - " + document.title
	  			changeFavicon("/localsite/img/logo/partners/neighborhood-icon.png")
	  			$('.neighborhood').css('display', 'inline');
		 	} else if (!Array.isArray(param.titleArray)) {
		 		$(".siteTitleShort").text("Model Earth");
		 		param.titleArray = ["model","earth"]
	  			//param.headerLogo = "<img src='/community/img/logo/favicon.png' style='width:26px;opacity:0.9;margin-right:0.8px'>"
	  			param.headerLogo = "<img src='/community/img/logo/model-earth.png' style='width:34px; margin-right:2px'>";
	  			document.title = "Model Earth - " + document.title
	  			//changeFavicon(modelpath + "../community/img/logo/favicon.png")
	  			changeFavicon(modelpath + "../community/img/logo/model-earth.png")
	  			$('.earth').css('display', 'inline'); 
		 		console.log(".earth display")
		 	}

		 	if (param["show"] == "mockup") {
		 		if(location.host.indexOf("georgia") >= 0) {
		 			$('#headerLocTitle').html("West Central Georgia");
			 		//$('#headerLocTitle').html("<span class='arrownext' style='margin:10px 10px 0 10px'></span><span style='float:left'> West Central Georgia</span>");
			 	}
			 	// Hack, since called too early for header
			 	$('.mock-up').css('display', 'block');
		 	}

		 	if(location.host.indexOf('neighborhood') >= 0) {
		 		// Since deactivated above due to conflict with header logo in app.
		 		$('.neighborhood').css('display', 'block');
		 	}
		 	if (param.titleArray) {
		 		if (param.titleArray[1] == undefined) {
		 			$('#headerSiteTitle').html("");
		 		} else {
			 		//let titleValue = "<span style='float:left'><a href='" + climbpath + "' style='text-decoration:none'>";
			 		let titleValue = "<span style='float:left'><a href='/' style='text-decoration:none'>";
			 		
			 		titleValue += "<span style='color: #777;'>" + param.titleArray[0] + "</span>";
			 		for (var i = 1; i < param.titleArray.length; i++) {
			 			titleValue += "<span id='titleTwo' style='color:#bbb;margin-left:1px'>" + param.titleArray[i] + "</span>";
			 		}
			 		titleValue += "</a></span>";
			 		$('#headerSiteTitle').html(titleValue);
			 		let theState = $("#state_select").find(":selected").text();
			 		if (theState) {
			 			//$(".locationTabText").text(theState);
			 		}
			 	}
		 	}
		 	


			// WAS LIMITED TO HEADER

			/*
			if (param.favicon) {
		 		imageUrl = climbpath + ".." + param.favicon;
		 		//$('#headerlogoside').css('width', '40px');
		 		//$('#headerlogoside').css('height', '40px');
		 		$('.logoholder-modelearth').css('width', '40px');
		 		$('.logoholder-modelearth').css('height', '40px');
		 		$('.logoholder-modelearth').css('margin-top', '7px');
		 		$('.logoholder-modelearth').css('margin-right', '20px');
		 	}
		 	*/
		 	if (param.headerLogo) {
		 		$('#headerLogo').html("<a href='" + climbpath + "' style='text-decoration:none'>" + param.headerLogo + "</a>");
		 	} else {
			 	$('#headerLogo').css('background-image', 'url(' + imageUrl + ')');
				$('#headerLogo').css('background-repeat', 'no-repeat');
			}
			if (param.headerLogoNoText) {
				$('#logoholderbar').html("<a href='" + climbpath + "' style='text-decoration:none'>" + param.headerLogoNoText + "</a>");
			} else if (param.headerLogo) {
				$('#logoholderbar').html("<a href='" + climbpath + "' style='text-decoration:none'>" + param.headerLogo + "</a>");
			}
			/*
	 		//$('#headerLogo').css('background-size', '70% 70%');

	 		$('#headerLogo').css('margin-left', '20px');

	 		//$('#headerLogo').css('background-size', '70% 70%');
	 		$('#headerLogo').css('background-position', 'center');
			*/

	 		$('.showMenu').click(function () {
				//$(".showMenu").hide();
				$("#menuHolder").show();
				$("#menuHolder").css('margin-right','0px')
				//$("#itemMenu").appendTo($(this).parent().parent());
				event.stopPropagation();
			});
			$('.hideMenu').click(function () {
				$("#menuHolder").show();
				$("#menuHolder").css('margin-right','-250px');
				//$("#itemMenu").appendTo($(this).parent().parent());
				event.stopPropagation();
			});

			$(".hideAdvanced").click(function(event) {
			//$(document).on("click", ".hideAdvanced", function(event) {
				$(".fieldSelector").hide();
				$("#filterLocations").hide();
				$("#filterClickLocation").removeClass("filterClickActive");
			});


			$('.filterBubble').click(function(e){
				console.log('filterBubble click')
			    e.stopPropagation(); // To keep location filter open when clicking
			});
			$(document).click(function(event) { // Hide open menus
				if($("#menuHolder").css('display') !== 'none') {
	            	$("#menuHolder").hide(); // Since menu motion may freeze when going to another page.

	            	if (!$(event.target).parents("#menuHolder").length) {
	            		//event.preventDefault(); // Using requires double click
	            	}
	        	}
	        	//$("#filterLocations").hide();
			});
		// END WAS LIMITED TO HEADER
		$(".headerOffset").show();
		}); // End $("#header").load
	}


	if(document.getElementById("footer") == null) {
		$("body").append( "<div id='footer' class='flexfooter noprint'></div>\r" );
	} else {
		//$("#footer").addClass("flexfooter");
	}
	var footerClimbpath = "";
	let footerFile = modelpath + "../localsite/footer.html"; // modelpath remains relative for site desgnated above as having a local copy of io and community.
	if (param.footer) {
		footerFile = param.footer; // Custom

		var footerFilePath = location.pathname + footerFile;
		if (footerFile.indexOf("/") > 0) {
			footerFilePath = footerFilePath.substr(0, footerFilePath.lastIndexOf("/") + 1); // Remove file name
		}

		console.log("footerFilePath " + footerFilePath);

		var upLevelInstance = (footerFilePath.match(/\.\.\//g) || []).length; // count of ../ in path.

		var climbLevels = ""
		for (var i = 0; i < upLevelInstance; i++) { // Remove ../ for each found
			climbLevels = climbLevels + "../";
		}	 	
	 	footerClimbpath = climbLevels; // Example: ../
	 	console.log("footerClimbpath (Levels up to current page): " + footerClimbpath);
	 	//alert(footerClimbpath)
	} else {
		footerClimbpath = climbpath;
	}

	if (location.host.indexOf('familytrees') >= 0) {
		//footerClimbpath = "../"; // TEMP FIX
	}
	$("#footer").load(footerFile, function( response, status, xhr ) {
		console.log("footerFile: " + footerFile);
		let pageFolder = getPageFolder(footerFile);
		//alert("footerClimbpath: " + footerClimbpath);
		//alert("pageFolder: " + pageFolder);

		//var pathToFooter = 

		// Append footerClimbpath to relative paths
		makeLinksRelative("footer", footerClimbpath, pageFolder);
		//makeLinksRelative("footer",footerClimbpath,footerFilePath); // Not working on second level pages.

	});

	$(document).ready(function () {
		
	});
 	// SIDE NAV WITH HIGHLIGHT ON SCROLL
	if (param["sidecolumn"]) {
		$("#sidecolumn").load( modelpath + "../community/nav.html", function( response, status, xhr ) {

			// Make paths relative to current page
	 		$("#sidecolumn a[href]").each(function() {
	 			if($(this).attr("href").toLowerCase().indexOf("http") < 0){
		      		$(this).attr("href", climbpath + $(this).attr('href'));
		  		}
		    })
	 		$("#sidecolumn img[src]").each(function() {
		      $(this).attr("src", climbpath + $(this).attr('src'));
		    })
			
			// Clone after path change
	 		$("#headerLogo").clone().appendTo("#logoholderside");

	 		// ALL SIDE COLUMN ITEMS
	 		var topMenu = $("#sidecolumnContent");
	 		//console.log("topMenu:");
	 		//console.log(topMenu);
			var menuItems = topMenu.find("a");
			var scrollItems = menuItems.map(function(){ // Only include "a" tag elements that have an href.

				// Get the section using the names of hash tags (since id's start with #). Example: #intro, #objectives
				if ($(this).attr("href").includes('#')) {
					var sectionID = '#' + $(this).attr("href").split('#')[1].split('&')[0]; // Assumes first hash param does not use an equals sign.
				
					//console.log('Get hash: ' + sectionID);

				    var item = $(sectionID); //   .replace(/\//g, "").replace(/../g, "")    Use of replaces fixes error due to slash in path.
				    if (item.length) {
				    	return item;
				    }
				}
			});
			var bottomSection = "partners";

	 		// BIND CLICK HANDLER TO MENU ITEMS
			menuItems.click(function(e){
			  var href = $(this).attr("href");
			  /*
			  console.log('Clicked ' + href);
			  var offsetTop = href === "#" ? 0 : $(href).offset().top-topMenuHeight+1;
			  */
			  if (href.includes("#intro")) { 

			  	// If current page contains a section called intro
			  	if($('#intro').length > 0) {
				  	//alert("intro click")
				    $('html,body').scrollTop(0);

				    // BUGBUG - still need to set URL since this is needed to override default position:
				    e.preventDefault();
				}
			  }
			});

			/*
			// Alternative to flaky $(this).scrollTop()+topMenuHeight; // this is the window
			function getScrollTop(){
			    if(typeof pageYOffset != 'undefined'){
			        //most browsers except IE before #9
			        return pageYOffset;
			    }
			    else{
			        var B= document.body; //IE 'quirks'
			        var D= document.documentElement; //IE with doctype
			        D= (D.clientHeight)? D: B;
			        return D.scrollTop;
			    }
			}
			*/

			// HIGHLIGHT SIDE NAVIGATION ON SCROLL
			function currentSideID() {
				var scrollTop = window.pageYOffset || (document.documentElement.clientHeight ? document.documentElement.scrollTop : document.body.scrollTop) || 0;
				var topMenuHeight = 150;
				// Get container scroll position
				var fromTop = scrollTop+topMenuHeight; // this is the window
				//console.log('fromTop ' + fromTop);
				// Get id of current scroll item
				var cur = scrollItems.map(function(){
					// scrollItems is the sections fron nav.html, but just return the current one.
			   		//console.log('offset().top ' + $(this).offset().top)
			     	if ($(this).offset().top < fromTop) {
			     		//console.log('offset().top < fromTop ' + $(this).offset().top + ' < ' + fromTop);
			     		return this;
			       	}
				});
				if (cur.length == 0 && $("#allsections").length) {
					// At top, above top of intro section
					// To Do: Get the top most section
					// allsections
					return $("#allsections section:first").attr("id"); // "intro" when on tools page,
				}
				// Get the id of the last item fetched from scrollItems
				cur = cur[cur.length-1];
				var id = cur && cur.length ? cur[0].id : "";
				//console.log('currentSideID id: ' + id);
				return id;
			}
			var lastID;
			
			$(window).scroll(function() {
				var id = currentSideID();
				//console.log("id: " + id + " lastID: " + lastID);
			   if($('#' + bottomSection).length > 0 && $(window).scrollTop() + $(window).height() == $(document).height()) { // If bottomSection exists and at bottom
			      //console.log('at bottom');
			      menuItems.removeClass("active");
			      menuItems.filter("[href*='#"+bottomSection+"']").addClass("active");
			      lastID = bottomSection;
			   } else if (id && lastID !== id) { // Highlight side navigation
			      //console.log("CURRENT ID: " + id);
			      lastID = id;
			      menuItems.removeClass("active");
			      if (currentSection && currentSection.length) {
			      	if (id.length == 0) {
			      		// Page without sections
			      	} else if (id == "intro") {
			      		// To do: Change to highlight the uppermost section.
			      		menuItems.filter("[href='..\/tools\/#']").addClass("active");
			      	} else {
			      		menuItems.filter("[href*='#"+id+"']").addClass("active"); // *= means contains
			      	}
			  	  }
			      /*
			      menuItems
			         .parent().removeClass("active")
			         .end().filter("[href*='#"+id+"']").parent().addClass("active");
			       */
			   } else {
			   		//console.log("Scrolling, no action");
			   }
			   
			  if (id == "intro") {
			  	//console.log("headerbar show");
			    $('.headerbar').show();
			    // For when entering from a #intro link from another page.
			    // Would be better to disable browser jump to #intro elsewhere.
			    //$('html,body').scrollTop(0); 
			  }
			});

			// Initial page load
			var currentSection = currentSideID();
			if (currentSection && currentSection.length) {
				if (currentSection == "intro") {
			      	// To do: Change to highlight the uppermost section.
			      	menuItems.filter("[href='..\/tools\/#']").addClass("active");
			      	lastID = "intro";
			    } else {
			    	menuItems.filter("[href*='#"+currentSection+"']").addClass("active");
			    	// To do: If not found, try using folder name from link when no #
			    	//menuItems.filter("[href*='interns/']").addClass("active");
				}
			}
		});
	}
	// END SIDE NAV WITH HIGHLIGHT ON SCROLL
});

function makeLinksRelative(divID,climbpath,pageFolder) {
	  $("#" + divID + " a[href]").each(function() {

      //if (pagePath.indexOf('../') >= 0) { // If .md file is not in the current directory
      //$("#" + divID + " a[href]").each(function() {
      if($(this).attr("href").toLowerCase().indexOf("http") < 0){ // Relative links only        
          $(this).attr("href", climbpath + $(this).attr('href'));
      } else if (!/^http/.test($(this).attr("href"))) { // Also not Relative link
          alert("Adjust: " + $(this).attr('href'))
          $(this).attr("href", pageFolder + $(this).attr('href'));
      }
    })
}
function getPageFolder(pagePath) {
  let pageFolder = pagePath;
  if (pageFolder.lastIndexOf('?') > 0) { // Incase slash reside in parameters
    pageFolder = pageFolder.substring(0, pageFolder.lastIndexOf('?'));
  }
  // If there is a period after the last slash, remove the filename.
  if (pageFolder.lastIndexOf('.') > pageFolder.lastIndexOf('/')) {
    pageFolder = pageFolder.substring(0, pageFolder.lastIndexOf('/')) + "/";
  }
  if (pageFolder == "/") {
    pageFolder = "";
  }
  return pageFolder;
}
const changeFavicon = link => {
  let $favicon = document.querySelector('link[rel="icon"]')
  // If a <link rel="icon"> element already exists,
  // change its href to the given link.
  if ($favicon !== null) {
    $favicon.href = link
  // Otherwise, create a new element and append it to <head>.
  } else {
    $favicon = document.createElement("link")
    $favicon.rel = "icon"
    $favicon.href = link
    document.head.appendChild($favicon)
  }
}
