var fk="fbcd6faa67652a8a2fae7e46548f5a98";
var fs="81c019a7ce65ad9c";
var frob;
var token;
var photopool=[];
var picswX=[];
var page = 1
var picsperpage=10
var num=0;
var asked=[];
var num;
var scores=[[0,0],[0,0],[0,0],[0,0]];
var gonext=false;
var canscore=false;


function flogin() {
	console.log("running flogin");
	//login button is still available in case user closes flickr window prematurely
	if (frob){
		alert("You did this part already.")
		return false;
	};
	console.log("flogging!");
	$('#token').show();
	var sig=MD5(fs+"api_key"+fk+"formatjsonmethodflickr.auth.getFrobnojsoncallback1");
	$.getJSON("https://api.flickr.com/services/rest/?method=flickr.auth.getFrob&api_key="+fk+"&format=json&nojsoncallback=1&api_sig="+sig, function(data) {
		frob=data.frob._content;
		console.log("got frob:"+frob);
		var sig2=MD5(fs+"api_key"+fk+"frob"+frob+"permsread");
		var r;
		window.open("http://flickr.com/services/auth/?api_key="+fk+"&perms=read&frob="+frob+"&api_sig="+sig2, "Authenticate");
	});
	return false;
}

function ftoken(){
	console.log("running ftoken");
	sig3=MD5(fs+"api_key"+fk+"formatjsonfrob"+frob+"methodflickr.auth.getTokennojsoncallback1");
	$.getJSON("https://api.flickr.com/services/rest/?method=flickr.auth.getToken&api_key="+fk+"&frob="+frob+"&format=json&nojsoncallback=1&api_sig="+sig3, function(data){
		token=data.auth.token._content
		$("#token").hide();
		$("#flog").hide();
		getphotos();
	});
	return false;
}


function getphotos(criteria){	
	num=0
	console.log("running getphotos");
	photopool=[]
	$("#start").hide();
	//constructing PHOTO SEARCH sig and API url
	
	sig=MD5(fs+"api_key"+fk+"auth_token"+token+"formatjson"+"methodflickr.interestingness.getList"+"nojsoncallback1page"+page+"per_page20");
	var APIstr="https://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key="+fk+"&page="+page+"&per_page=20&format=json&nojsoncallback=1&auth_token="+token+"&api_sig="+sig;	
	$.getJSON(APIstr, function(data) {
		filterphotos(data);	
	});	
	return false;
}	

function filterphotos(data){
	var promises = [];
	
		$.each(data.photos.photo,function(i,mypic){
			var def = new $.Deferred();
			//constructing EXIF sig and API url
			var sig4=MD5(fs+"api_key"+fk+"auth_token"+token+"formatjson"+"methodflickr.photos.getExif"+"nojsoncallback1"+"photo_id"+mypic.id+"secret"+mypic.secret);
			var APIstr="https://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key="+fk+"&photo_id="+mypic.id+"&secret="+mypic.secret+"&format=json&nojsoncallback=1&auth_token="+token+"&api_sig="+sig4;
			def = $.getJSON(APIstr,function(exifdata){
				photopool.push(exifdata);
				console.log("got exif")
			});
			promises.push(def);
		})
		
	$.when.apply($,promises).then(function(){
		reviewPhotopool();	
	});
	return false;
}

function reviewPhotopool(){
	asked=[];
	picswX=[];
	console.log("Running reviewPhotopool");
	var params = ["ISO","ExposureTime","FNumber","Flash"]
	$.each(photopool,function(key,mypic){
		var count = 0;
		try{
			for (i=0;i<mypic.photo.exif.length;i++){
				if (params.indexOf(mypic.photo.exif[i].tag)>=0){
					console.log(mypic.photo.exif[i].tag);
					count+=1;
					mypic[mypic.photo.exif[i].tag]=mypic.photo.exif[i].raw._content;
				}
			};
		}
		catch (err){
			console.log(page,key+" no EXIF");
			console.log(mypic);
		}	
		if (count==params.length){
			picswX.push(mypic);
		}
	});
	$("#status").text("finding photos...")
	if(picswX.length<0){
		page+=1;
		getphotos();
	}else{
		showPwX ();
	}	
	return false;
}

function showPwX() {
	console.log("Running showPwX");
	$("#status").text("loading photos...")
	$("#status").css("color", "DarkGray ")
	$.each(picswX, function(i, mypic) {

		//use the photo info to create the url
		var myurl = "https://farm" + mypic.photo.farm + ".staticflickr.com/" + mypic.photo.server + "/" + mypic.photo.id + "_" + mypic.photo.secret + "_b.jpg"

		//use the exif data to determine what question/responses/feedback to present
		if(i % 3 == 0) {
			//ISO Q
			var question = "Does this photo use an ISO above 400?";
			var response1 = "yes";
			var response2 = "no";
			var feedback = "ISO reflects the sensitivity of the sensors. In bright daylight, ISO is usually set to 200 or below. Indoors and nighttime require either more light through a larger aperture, longer exposure, or a flash, or a higher ISO which would be more sensitive to the low level of light. Higher ISO results in lower detail and higher grain."
		}
		if(i % 3 == 1) {
			//f/Number Q
			var question = "Do you think the f/Number of this photo is lower than 7?";
			var response1 = "yes";
			var response2 = "no";
			var feedback = "The f/Number of a photo relates to the aperture size. With a larger aperture more light can get to the sensor, but the depth of field is more shallow. This is desirable when the photographer wants the background blurred compared to the subject and the foreground, but doesn't work so well on large things like landscapes."
		}
		if(i % 3 == 2) {
			//Exposure Q
			var question = "Do you think the exposure time of this photo is lower than 1 second?";
			var response1 = "yes";
			var response2 = "no";
			var feedback = "A Longer exposure time allows more light to the sensor, but emphasizes motion. That's great if the subject is motionless or you want to show the path of the subject, but requires the camera to be perfectly still or its motion will result in blur of the entire image. Capturing 'just the right moment' like when a bat hits a ball requires a short exposure time. However more light in the form of daylight, floodlights, or a flash is required to get the proper exposure if the shutter is open too briefly."
		}

		//create a 'block' for each picture with all of the relevant inputs and text, etc.
		$.when(
			$("#pics").append("<div id='pic" + i + "' style=';' class='image row '><img id='img" + i + "' src=" + myurl + " alt='flicker pic #" + i + "' class='img-responsive center-block'><div id='question" + i + "' class='question " + i + "'>" + question + "</div><div id='hider" + i + "' class='hider'><p>Move the cursor here to examine the photo better.</p></div><div id='response" + i + "' class='response container " + i + "' style='z-index:9'><form role='form'><label class='radio-inline'><input type='radio' name='optradio'>" + response1 + "</label><label class='radio-inline'><input type='radio' name='optradio'>" + response2 + "</label><label class='radio-inline'><input type='radio' name='optradio'>Pass. It\'s too hard to tell.</label></form></div><div id='exif" + i + "' class='exif " + i + "'>" + "<ul><li>ISO:" + mypic.ISO + "</li><li>Exposure:" + mypic.ExposureTime + "</li><li>f/number:" + mypic.FNumber + "</li><li>Flash:" + mypic.Flash + "</li>" + "</ul></div><div id='feedback" + i + "' class='feedback " + i + "'>" + feedback + "</div><div id='selfscore" + i + "' class='selfscore container " + i + "'style='z-index:9><p>how would you rate your answer?</p><form role='form'><label class='radio-inline'><input type='radio' name='optradio' id='plusone" + i + "'>I was right.</label><label class='radio-inline'><input type='radio' name='optradio' id='miss" + i + "'>Not quite right.</label><label class='radio-inline'><input type='radio' name='optradio' id='pass" + i + "'>Pass. It was too hard to tell.</label></form></div></div></div>"),
			//above block used tips from https://css-tricks.com/text-blocks-over-image/

			$("." + i).hide(),
			$("#hider" + i).hide(),
			$("#img" + i).fadeTo(500, .3),
			$('html, body').animate({
				scrollTop: $("#pic" + i).offset().top
			}, 500, 'swing')
		).then(function() {
			$("#status").text("here comes your first question");
			$("#status").css("color", "White");
			if(i + 1 == picswX.length) {
				console.log("show triggering quiz");
				gonext=true;
				meter("show");
			};
		});
	});
	return false;
}

function meter(source){
	console.log("meter called from"+source);
	if (gonext){
		gonext=false;
		quiz();
	}
	return false;
}

function quiz() {
	console.log("Running quiz");
	num = Math.floor(Math.random() * picswX.length);
	while (asked.indexOf(num) > -1){
		num = Math.floor(Math.random() * picswX.length);
	}
	asked.push(num);
	console.log("We have asked " + asked.length + " out of " + picswX.length);
	console.log("num is " + num);
	$.when(
		$('html, body').animate({
			scrollTop: $("#pic" + num).offset().top
		}, 2000, 'swing'),
		$("#img" + num).fadeTo(1000, .5),
		$("#status").hide(),
		$("." + num).fadeTo(1000, .01),
		$("#question" + num).fadeTo(1000, 1),
		$("#response" + num).fadeTo(1000, 1),
		$("#hider" + num).show(1000)
	).then(function() {
		console.log("scrolled to next pic");
	});

	$("#hider" + num).mouseenter(function() {
			$("." + num).hide();
			$("#img" + num).fadeTo(200, 1);
		})
		.mouseleave(function() {
			$("." + num).show();
			$('html, body').animate({
				scrollTop: $("#pic" + num).offset().top
			}, 100, 'swing', function() {
				$("#img" + num).fadeTo(500, .5);
			});
		});

	$(".response").change(function() {
		$("#exif" + num).fadeTo(500, 1);
		$("#feedback" + num).fadeTo(500, 1);
		$("#selfscore" + num).fadeTo(500, 1);
	});

	$(".selfscore").change(function() {
		if($('#plusone'+num).prop('checked')){
			$('#plusone'+num).prop('checked',false);
			scores[num%3][0]+=1;
			gonext=true;
			canscore=true;
		}
		if($('#miss'+num).prop('checked')){
			$('#miss'+num).prop('checked',false);
			gonext=true;
			canscore=true;
		}
		if($('#pass'+num).prop('checked')){
			$('#pass'+num).prop('checked',false);
			gonext=true;
		}
		if (canscore){
			scores[num%3][1]+=1;
			scores[3][1]=scores[0][1]+scores[1][1]+scores[2][1];
			scores[3][0]=scores[0][0]+scores[1][0]+scores[2][0];
			$("#ISOscore").text("ISO: "+scores[0][0]+"/"+scores[0][1]);
			$("#FNscore").text("f/Number: "+scores[1][0]+"/"+scores[1][1]);
			$("#Shutterscore").text("Exposure: "+scores[2][0]+"/"+scores[2][1]);
			$("#total").text("Total Score: "+scores[3][0]+"/"+scores[3][1]);
			$("#status").text("selecting next question");
			canscore=false;
		}	
		$.when(
			$("#status").show(),
			$("." + num).hide(),
			$("#img" + num).fadeTo(500, .3)
		).then(function(){
			if(asked.length<picswX.length-1){
				console.log("quiz triggering meter");
				meter("quiz");
			}	
		});
	});
	// https://css-tricks.com/text-blocks-over-image/

return false;
}
