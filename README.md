Embedded Video Problems for edX
====================

Do you, brave course designer, want to have questions appear during your video? This script does it. The problem pops up, the video pauses, the student answers or skips the question, and the video keeps playing.

If you're an edX student, this script isn't useful for you. It's something that course designers use, not something that students can use.


How Do I Implement This?
--------

You will need: 

* A video already made and embedded in a unit. 
* A set of questions (in the same unit; i.e. the same edX page) that you want to place in your video.
 * Each question should have a unique name.

Upload the .css and .js files to the "Files and Uploads" section of your course. You shouldn't need to touch them afterwards.

Copy the contents of the .html file and paste them into a Raw HTML component. You can delete the Display Name for that element, or you can name it "video problem controls" or something. 

Around the middle of the HTML you will see this:

```
var popUpProblemTimer = 
[
    {time: 4, title: "What Game?"},
    {time: 8.5, title: "What Happened?"},
    {time: 12, title: "What Was That?"},
    {time: 16, title: "Collision"}
]
```
  
This array tells the script what problems will be displayed at what time (in seconds). The problems are selected by their name, so you will need to name each of your problems differently (set their Display Name in the Settings tab of the problem editor).

This problem name is case-sensitive, and what you put in the HTML must match the problem's title *exactly*. You can add or remove lines; just make sure that every line has a comma at the end except for the last one.

You can put this Raw HTML component anywhere on the page, but I recommend putting it directly above or below the video and being consistent throughout your course.

**Minutae**

You can have multiple videos on the same page and this should only trigger on the first one.

The "Done" and "skip" buttons do the exact same thing, but they log differently.

This script logs via the Logger.log() code.

How Does It Work?
--------

A bit of jQuery finds the specified problem via its title (it looks for an H2 element). The script then detaches it from the page and displays it as a modal dialogue. When the dialogue is destroyed (not closed, which is why I took out the 'close' button), it is placed back in the page in the same place.

I initially tried to write this using the YouTube javascript API. Sadly, this was a total waste of time. The docs say that you can have two 'player' objects for one video, but I never found this to be true. Instead, one of the folks on the edx-code list told me about a data structure you can get at via `$('.video').data('video-player-state')` , and that worked like a charm.

There are a lot more details. I've tried to comment the code well. If you have questions after reading it, let me know.

Files
--------

* **popUpProblems.css** provides a few things to help this blend in with edX. Put it in your "Files and Uploads" section.
* **popUpProblems.html** is what you cut-and-paste into a Raw HTML component to make this work.
* **popUpProblems.js** does the actual work of moving the problems around and displaying them. Put it in your "Files and Uploads" section.
* **popUpProblems.zip** is fairly unnecessary here on GitHub where you can download the whole thing as a zip file anyway, but 

Dependencies and Fragility
--------------

This script depends on jQuery and jQuery UI. Both of those are included in edX normally, so you should not need to worry about it.

This script also depends on the particular structure of the web pages served by edX, which means that their later updates can potentially break the script. As long as I'm working at HarvardX I'll do my best to keep this script updated in a way that keeps it working.

Status
------

To the best of my knowledge, this script works in:

* Chrome on Mac and PC
* Firefox on Mac
* Safari on Mac
* Safari Mobile

This script works with every problem type except for:

* The standard Custom Javascript Display and Input problem that is included in edX. Haven't tested it with other custom JS problems yet.
* The current Peer Assessment / Open Response problems. These are kind of too long to put into the middle of a video anyway, if you ask me.

To Do list
-----------

* Testing in more browsers
* Work to reduce fragility
* I still have some vague UI concerns, and if you feel this not working in ways that you would expect, I'd like to hear it.

Wish List
----------

* If someone wants to make an XBlock out of this, I would not complain. Mi codigo es su codigo.