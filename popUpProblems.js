// Global variable popUpProblemTimer is defined in the HTML.

$(document).ready(function(){

	// Declaring semi-global variables for later use.
	var video = $('.video');
	var state;
	var time;
	var problemCounter;
	var skipEmAll;
	var protectedTime = false;
	var problemsBeingShown = 0;
	
	// Log play/pause events from the player.
	// Also set the play/pause external control properly.
	video.on('pause', function () {
		Logger.log("harvardx.video_embedded_problems", {"video_event": "pause"});
		console.log('pause');
		$('#playpauseicon').html('&#8227;');
		$('#playpauseword').html('Play');
	});

	video.on('play', function () {
		Logger.log("harvardx.video_embedded_problems", {"video_event": "play"});
		console.log('play');
		// Also set the play/pause external control properly.
		$('#playpauseicon').html('||'); // Need a better-looking pause icon.
		$('#playpauseword').html('Pause');
	});
	
	// Check to see whether the video is ready before continuing.
	var waitForVid = setInterval(function(){

		state = video.data('video-player-state');	// Sometimes this fails and that's ok.

		if (state.videoPlayer.isCued()){
			console.log('video data loaded');
			clearInterval(waitForVid);
			var pause = setTimeout(function(){
				console.log('done waiting');
				setUpData();
				setUpControls();
				mainLoop();
			}, 0);
		}
	}, 100);
	
	// Checks local storage and gets data from the video.
	function setUpData(){
	
		console.log('setting up data');
	
		// Get the video data.
		video =  $('.video');
		state = video.data('video-player-state');
		time = state.videoPlayer.currentTime;
		
		// Storing a separate problem counter for each video.
		// Create the counter if it doesn't exist.
		if(!localStorage[state.id + '-counter']){
			localStorage[state.id + '-counter'] = '0';
			localStorage[state.id + '-skip'] = 'false';
			
			// If the counter didn't exist, we're on a new browser.
			// Clear the questions from before the current time.
			clearOlderPopUps(time);
		}
		
		// Which problem are we on?   Using + to cast as integer.
		problemCounter = +localStorage[state.id + '-counter'];
		
		// Are we currently skipping problems?
		skipEmAll = (localStorage[state.id + '-skip'] === 'true');
		// If so, let's update the button.
		if(skipEmAll){
			$('#sunmoon').html('&#9790;');
			$('#onoff').html('Problems are Off');
			Logger.log('harvardx.video_embedded_problems', {'reload_event': 'turn_problems_off', 'time': time});
			console.log('problems are off after reload');
		}

		// Let's avoid situations where we're faced with a question
		// mere seconds after the page loads, shall we?
		// Unless we're past the last problem...
		if(time < popUpProblemTimer[popUpProblemTimer.length-1].time) {
			if(problemCounter > 0){
				// Go to just after the previous question...
				ISaidGoTo(popUpProblemTimer[problemCounter-1].time + 1);
			}else{
				// Or all the way back to the beginning.
				ISaidGoTo(0);
			}
		}
	}
	
	// Makes the buttons work and sets up event handlers.
	function setUpControls(){		
		
		console.log('setting up controls');
	
		// If they seek to a specific position, set the problem counter appropriately 
		// so that earlier problems don't gang up on them.
		video.on('seek', function(event, ui) {
			clearOlderPopUps(ui);
		});
			
		// Let someone go through the problems again if they want.
		// Also useful for debugging.
		$('#popUpReset').on('click tap', function(){
			updateProblemCounter(0);
			ISaidGoTo(0);
			Logger.log('harvardx.video_embedded_problems', {'control_event': 'reset'});
			console.log('reset counter and time to zero');
			
			// If problems are currently on, turn them off for two seconds after we go back.
			// This addresses a bug that appears in Mobile Safari.
			// Note that you can't put questions in the first two seconds of the video
			// because of this.
			if(!skipEmAll){
				skipEmAll = true;
				var dontSpamProblemsEarly = setTimeout(function(){
					skipEmAll = false;
				}, 2000);
			}
			
		});
		
		// Go back to one second after the previous problem.
		$('#backOneProblem').on('click tap', function(){
			if(problemCounter > 1){
				var newTime = popUpProblemTimer[problemCounter-2].time + 1;
				ISaidGoTo(newTime);
				Logger.log('harvardx.video_embedded_problems', {'control_event': 'back_one'});
				console.log('going back one problem');
			}else{
				updateProblemCounter(0);
				ISaidGoTo(0);
				Logger.log('harvardx.video_embedded_problems', {'control_event': 'back_one_to_start'});
				console.log('going back to beginning');
			}
		});
		
  		
		// Play or pause the video
		$('#popUpPlayPause').on('click tap', function(){
			if(state.videoPlayer.isPlaying()){
				state.videoPlayer.pause();
				$('#playpauseicon').html('&#8227;');
				$('#playpauseword').html('Play');
				Logger.log('harvardx.video_embedded_problems', {'control_event': 'play'});
				console.log('play from exterior controls');
			}else{
				state.videoPlayer.play();
				$('#playpauseicon').html('||');
				$('#playpauseword').html('Pause');
				Logger.log('harvardx.video_embedded_problems', {'control_event': 'pause'});
				console.log('pause from exterior controls');
			}
		});
				
		// Let someone turn the pop-up questions on and off.
		// Give visual indication by changing the button.
		$('#problemToggle').on('click tap', function(){
			if(skipEmAll){
				skipEmAll = false;
				localStorage[state.id + '-skip'] = 'false';
				$('#sunmoon').html('&#9788;');
				$('#onoff').html('Problems are On');
				Logger.log('harvardx.video_embedded_problems', {'control_event': 'turn_problems_on', 'time': time});
				console.log('no longer skipping all problems from time ' + time);
			}else{
				skipEmAll = true;
				localStorage[state.id + '-skip'] = 'true';
				$('#sunmoon').html('&#9790;');
				$('#onoff').html('Problems are Off');
				Logger.log('harvardx.video_embedded_problems', {'control_event': 'turn_problems_off', 'time': time});
				console.log('skipping all problems from time ' + time);
			}
		});
				
	}
	
	// Every 500 ms, check to see whether we're going to add a new problem.
	function mainLoop(){
	
		var timeChecker = setInterval(function(){
			
			state.videoPlayer.update();		// Forced update of time. Required for Safari.
			time = state.videoPlayer.currentTime;

			if(problemCounter < popUpProblemTimer.length){
				if(time > popUpProblemTimer[problemCounter].time){
				
					if(!skipEmAll && !protectedTime){
						state.videoPlayer.pause();
						popUpProblem(popUpProblemTimer[problemCounter].title, state);
						updateProblemCounter(problemCounter+1);
					}else{
						// We're still incrementing and tracking even if we skip problems.
						updateProblemCounter(problemCounter+1);
					}
				}
			}
		}, 500);
	
	}
	
	// Set all the time-related stuff to a particular time and then seek there.
	// Does the work of creating the dialogue.
	// It pulls a question from lower down in the page, and puts it back when we're done.
	function popUpProblem(title, state){
		
		// Find the div for the problem based on its title.
		problemDiv = $('h2:contains(' + title + ')').parent().parent();

		var problemID = $('h2:contains(' + title + ')').parent().attr('id');
		
		Logger.log('harvardx.video_embedded_problems', {'display_problem': title, 'problem_id': problemID,'time': time});
		console.log('displaying problem: ' + title + ' ' + problemID);
		
		// Make a modal dialog out of the chosen problem.
		problemDiv.dialog({
			modal: true,
			dialogClass: "no-close",
			resizable: true,
			width: 800,
			show: { 
				effect: 'fade', 
				duration: 200 
			},
			buttons: {
				'Skip': function() {
					dialogDestroyed('skip_problem');
					$( this ).dialog( 'destroy' );  // Put the problem back when we're done.
				},
				'Done': function() {
					dialogDestroyed('mark_done');
					$( this ).dialog( 'destroy' );  // Put the problem back when we're done.
				},
			},
			open: function() {
				// Highlight various controls.
				$('span.ui-button-text:contains("Done")').addClass('answeredButton');
				$('input.check.Check').attr('style', '	background: linear-gradient(to top, #9df 0%,#7bd 20%,#adf 100%); background-color:#ACF;	text-shadow: none;');
				problemsBeingShown++;
			},
			close: function(){ 
				state.videoPlayer.play(); 
				Logger.log('harvardx.video_embedded_problems', {'unusual_event': 'dialog_closed_unmarked'});
				console.log('dialog closed');  // Should be pretty rare. I took out the 'close' button.
			}
		});
	}
	
	// Log the destruction of the dialog and play the video if there are no more dialogs up.
	function dialogDestroyed(message){
		Logger.log('harvardx.video_embedded_problems', {'control_event': message});
		console.log(message);
		$('input.check.Check').removeAttr('style');  // un-blue the check button.
		problemsBeingShown--;
		if(problemsBeingShown < 1){
			state.videoPlayer.play();
		}
	}
	
	// This resets the problem counter to match the time.
	function clearOlderPopUps(soughtTime){
		Logger.log('harvardx.video_embedded_problems', {'control_event': 'seek_to_' + soughtTime});
		console.log('sought to time ' + soughtTime);
		updateProblemCounter(0);  // Resetting fresh.
		for(var i = 0; i < popUpProblemTimer.length; i++){
			if(soughtTime > popUpProblemTimer[i].time){
				updateProblemCounter(i+1);
				console.log('new problem counter: ' + problemCounter);
			}else{
				break;
			}
		}
	}
	
	// I blame multiple Javascript timing issues.
	function ISaidGoTo(thisTime){
		time = thisTime;
		state.videoPlayer.seekTo(thisTime);
		console.log('I said go to ' + thisTime);
	}
	
	// Keep the counter and the local storage in sync.
	function updateProblemCounter(number){
		problemCounter = number;
		localStorage[state.id + '-counter'] = number.toString();
		console.log('counter set to ' + problemCounter);
	}

});