# Test plan

## Overview

This addon runs a 9 week study that takes place in 3 phases that are each 3 
weeks long.

At the start of each phase we present the user with a survey.

During the first three week phase we simply log the users dwell time on 
websites.

During the second three week phase we continue to log the users dwell time but 
each user is put into one of two buckets. They are either in a control group
where nothing happens, or they are in a treatment group which receives a special
doorhanger popup once a day when they visit any of the 500 websites listed in 
`domains.json`. This doorhanger includes a visual indicator of the bias rating
of the website and prompts the user to either agree or disagree with that rating.

During the last three week phase we return to simply logging user dwell time.

At the end of the study a final survey is show to the user.

## Installation

Please install the Firefox Pioneer addon to test this study.

If you install the addon without the Firefox Pioneer addon installed, the study 
addon will be immediately uninstalled and will send an ineligible event ping to
Telemetry.

There are some preferences for this addon which can be set before the addon is
installed. If they are set once the addon has been installed you will need to 
restart the browser for the change to take effect.

### Available preferences

`extensions.pioneer-online-news.telemetryEnv`

**Values:** `stage`, `prod`

**Default:** `prod`

If you have configured telemetry to submit to the stage environment you should
set this to `stage` to ensure that the correct encryption key is used.

`extensions.pioneer-online-news.updateTimerInterval`

**Default:** `86400000`

This sets the frequency in milliseconds that the state should be updated. It 
defaults to one day.

`extensions.pioneer-online-news.showDoorhangerInterval`

**Default:** `86400000`

This sets the minimum time in milliseconds before the each doorhanger should be 
reshown to a user. It defaults to one day.

`extensions.pioneer-online-news.logSubmissionInterval`

**Default:** `86400000`

This sets the minimum time in milliseconds before the log data is submitted to 
Telemetry and then the log is purged. It defaults to one day.

`extensions.pioneer-online-news.preTreatmentDuration`

**Default:** `1814400000`

This sets the duration of the first phase of the study. By default it is 3
weeks long.

`extensions.pioneer-online-news.treatmentDuration`

**Default:** `1814400000`

This sets the duration of the second phase of the study. By default it is 3
weeks long.

`extensions.pioneer-online-news.postTreatmentDuration`

**Default:** `1814400000`

This sets the duration of the third phase of the study. By default it is 3
weeks long.

`extensions.pioneer-online-news.postStudyDuration`

**Default:** `604800000`

This sets the duration after the study ends during which to show the final 
survey doorhanger. After this duration is over the addon will be uninstalled.
By default it is 1 week long.

`extensions.pioneer-online-news.studyBranch`

**Values:** `treatment`, `control`

This is set during the second phase of the study.

`treatment` is the branch where the bias rating doorhanger is shown.

`control` is the branch where no bias rating doorhanger is shown.


### Installing the addon

1. In your Firefox profile open `about:config`
2. Find the pref `extensions.legacy.enabled` and make sure it is set to `true`.
3. Find the pref `devtools.chrome.enabled` and make sure it is set to `true`.
4. Go to `about:addons` > `extensions`.
5. Open the drop-down menu with the cog icon in the upper right corner and choose
   `Install Add-on From File`.

## Test Conditions

### Before each test

Before running each test please make sure you create a new clean profile. The 
easiest way is to go to `about:profiles`. More information can be found here:
https://developer.mozilla.org/en-US/Firefox/Multiple_profiles

### Tests to perform

#### Test the state update timer and phase duration

Before beginning this test it is best to set the appropriate preference in your
profile. 

You can set `extensions.pioneer-online-news.updateTimerInterval` to something 
small like once every minute `60000`. Which will cause the addon to check for a 
change in state every minute. The way that timers are created is different for 
values under 10 minutes (`60000`). So it is recommended to do at least one test
with the timer set to at least 10 minutes.

You should also lower the phase durations to something more sane for testing 
than the defaults which are on the scale of weeks. You should make sure that
the duration of each phase is longer than the update timer interval that you 
set before this.

Once these preference have been set install the addon. You should see a survey
doorhanger at the start of each phase that prompts you to take a survey.

You may also wish to adjust the 
`extensions.pioneer-online-news.showDoorhangerInterval` preference to test that
the survey doorhangers are re-shown to the user, at most 3 times per phase, at 
the set interval.

#### Test the dwell time logging

You should not need to tweak any preferences before testing this feature. Simply
install the addon. You should now be in the first phase of the study which will
include the logging feature. You can navigate to a few websites to create 
`focus-start` and `focus-end` events in the log. If you idle on the page (do not
move the mouse or interact with your computer) for five second it will begin
the idle logging by create an `idle-start` event and as soon as there is user
interaction an `idle-end` event will be created. The idle events will only be
created when the browser is in focus. 

You can get the contents of the log by opening the browser console from 
`Tools > Web Developer > Browser Console` and running the following lines of 
code:

```js
Cu.import("resource://pioneer-study-online-news/lib/LogStorage.jsm");
LogStorage.getAll().then(v => { console.log(v); });
```

This should log an array of objects to the console which you can inspect further
to see the exact contents of the log you should have a number of objects that each
look something like:

```js
{
  url: "http://www.website.com/something.html",
  details: "focus-start",
  timestamp: 123456789
}
```

#### Test the bias rating doorhanger

You do not *need* to tweak any preferences before testing this feature, however 
you may choose to reduce `extensions.pioneer-online-news.showDoorhangerInterval`
to test that the doorhanger only gets shown once per interval. 

After installing the addon open the browser console from 
`Tools > Web Developer > Browser Console` and run the following lines of code:

```js
Cu.import("resource://pioneer-study-online-news/lib/Phases.jsm");
Phases.gotoNextPhase();
```

This will manually advance you to the second phase of the study where you can
observe the doorhanger behaviour.

There are two branches to this phase. One is the `control` branch where the
doorhanger is not shown to the user. And the other is the `treatment` branch
where the doorhanger is shown to the user.

You can change this preference at any time to switch the branch that you are 
testing. No restart should be necessary for the change to take effect.

You may now navigate to any of the websites listed in `domains.json` and 
depending on which branch you are in you should see a doorhanger with a bias
rating, for the website, indicated. You should also see a pair of buttons that 
allow you to agree or disagree with the rating. Click either of these buttons
or the close button (X) in the corner of the doorhanger will permanently dismiss
the doorhanger for the given website. However, if you do not click any of the
buttons the doorhanger will be shown when visiting the website again after the 
interval specified in `extensions.pioneer-online-news.showDoorhangerInterval`.

#### Test that telemetry pings are being sent

Please note that you will not be able to read the payload data that is being
sent to telemetry as it will all be encrypted before submission. You can assume 
that the data is correct and correctly formatted. You can however check the
`schemaName` property of the ping to ensure that the correct ping(s) are being
submitted.

The easiest way to confirm that a ping is sent is to go to `about:telemetry` and
click on "current ping" in the top left corner. This should open a dropdown where
you can select "Archived ping data" and you can filter down the ping type to 
"pioneer-study". You can then select the relevant ping from the select box and 
click on "Raw JSON" in the bottom left corner of the screen to see the actual
contents of the ping.

##### Test the log ping

The log pings are batched and a submission is attempted 3 hours, however they 
are only submitted once a day. You may change the 
`extensions.pioneer-online-news.logSubmissionInterval`
preference to less than 3 hours and it will submit the log every 3 hours. You
will need to restart Firefox or set this pref before installing for this pref 
change to take effect.

To generate a log simply visit a few websites after installing the addon.

These pings should have the `schemaName` set to `online-news-log`.

##### Test the agree/disagree pings

After following steps to show the bias doorhanger you can click on the agree or
disagree button of the doorhanger to trigger a submission of a log ping.

These pings should also have the `schemaName` set to `online-news-log`.

##### Event pings

You may additionally see event pings (pings with the `schemaName` set to `event`)
which are triggered when the study ends. These are also triggered if you attempt
to install the addon without the Firefox Pioneer addon installed.
