/*
    screenContoller.js
    this is meant to be a base class from which you will extend contollers for
    wcScreen descendant objects.

    this controlls the web-component by having app logic outside the DOM.
    via events from the wc and y'know ... we're gonna keep it stupid simple
    to start and move from there
*/
import { noiceObjectCore, noiceCoreChildClass } from './noiceCore.js';
import { noiceAutonomousCustomElement } from './noiceAutonomousCustomElement.js';
import { wcScreen } from './webComponents/wcScreen.js';
import { wcScreenHolder } from './webComponents/wcScreenHolder.js';

class screenController extends noiceCoreChildClass {




// constructor
constructor(args, defaults, callback){
    let _classDefaults = noiceObjectCore.mergeClassDefaults({
        _version: 1,
        _className: 'screenContoller',
        _element: null
    }, defaults);

    // set it up
    super(args, _classDefaults, callback);
}




/*
    element getter and setter
    noiceAutonomousCustomElement events:
     * DOMConnected {self}
     * log {self, message, time} / logCallback attribute

    wcScreen events:
     * gain_focus {screen (self), focus: <true>, focusReturnArgs <obj>}
     * focus_error { screen (self), focus: <true>, focuError <obj>}
     * lose_focus { focus: <false>, screen (self), focusReturnArgs <obj> }
    NOTE: these are triggered on the .then() and .catch() of these callbacks
    that yes ... sigh .. are function refs in the webComponent. We need to
    make that right in here, and be sure those hooks are minimal and safe at least
     * async gainFocusCallback(focusArgs, self)
     * async loseFocusCallback(focusArgs, self)

    wcScreenHolder events:
     * initialized { self }
     * ui_added { self, screenName <string>, screen <element> }
     * ui_focus { focus <bool>, screenName <string>, screen <element>}
*/
set element(el){ if (el instanceof noiceAutonomousCustomElement){
    let that = this;
    that._element = el;
    el.addEventListener('DOMConnected', (evt) => { if (that.DOMConnectedCallback instanceof Function){ that.DOMConnectedCallback(evt); } });
    el.addEventListener('initialized', (evt) => { if (that.initializeCallback instanceof Function){ that.initializeCallback(evt); } });
    el.addEventListener('log', (evt) => { if (that.logCallback instanceof Function){ that.logCallback(evt); } });
    if (el instanceof wcScreen){
        if (that.gainFocusCallback instanceof Function){ el.gainFocusCallback = that.gainFocusCallback; };
        el.addEventListener('gain_focus', (evt) => { if (that.gainedFocusCallback instanceof Function){ that.gainedFocusCallback(evt); } });
        if (that.loseFocusCallback instanceof Function){ el.loseFocusCallback = that.loseFocusCallback; };
        el.addEventListener('lose_focus', (evt) => { if (that.lostFocusCallback instanceof Function){ that.lostFocusCallback(evt); } });
        el.addEventListener('focus_error', (evt) => { if (that.focusErrorCallback instanceof Function){ that.focusErrorCallback(evt); } });
    }
    if (el instanceof wcScreenHolder) {
        el.addEventListener('ui_added', (evt) => { if (that.ui_addedCallback instanceof Function){ that.ui_addedCallback(evt); } });
        el.addEventListener('ui_focus', (evt) => { if (that.ui_focusCallback instanceof Function){ that.ui_focusCallback(evt); } });
    }
    if (that.setElementCallback instanceof Function){ that.setElementCallback(el); }
}}
get element(){ return(this._element); }




/*
    ----------------------------------------------------------------------
    OVERRIDE ME!!
    everything down here are example function stubs.
    ----------------------------------------------------------------------
*/




/*
    DOMConnectedCallback(event)
    this gonna get fired each time the element gets added to a DOM tree
    NOTE: it doesn't fire on remove
    the interesting stuff is on event.detail
*/
DOMConnectedCallback(evt){
    // console.log(`DOMConnected! `, evt.detail);
}




/*
    initializeCallback(event)
    fires *after* initialization, which is to say the first time we get added
    to a visible DOM tree
*/
initializeCallback(evt){
    // console.log(`initialized! `, evt.detail);
}




/*
    gainFocusCallback(focusArgs, slf)
    this async function gets called before the requested focus change
    is executed -- which is to say the focus change will await resolution
    of this function, and if you wanna abort the focus change, boot it
    else toot the self reference
*/
gainFocusCallback(focusArgs, slf){
    let that = this;
    return(new Promise((toot, boot) => {
        //console.log(`gainFocusCallback() is here!`);
        toot(slf);
    }));
}




/*
    gainedFocusCallback(event)
    this fires after the requested focus change is executed.
    this is more like a notification that it happened. This is
    not abortable
*/
gainedFocusCallback(evt){
    // console.log(`gainedFocusCallback() is here!`);
}




/*
    loseFocusCallback(focusArgs, slf)
    this is gainFocusCallback except for losing focus.
    boot it if you wanna abort, toot the self reference if
    you wanna allow the loss of focus. Perhaps after doing
    some asyncronous things, y'know?
*/
loseFocusCallback(focusArgs, slf){
    let that = this;
    return(new Promise((toot, boot) => {
        // console.log(`loseFocusCallback() is here!`);
        toot(slf);
    }));
}




/*
    lostFocusCallback(event)
    this fires after the requested focus change is executed.
    this is more like a notification that it happened. This is
    not abortable
*/
lostFocusCallback(evt){
    // console.log(`lostFocusCallback() is here!`);
}




/*
    focusErrorCallback(event)
    if gainFocusCallback or loseFocusCallback booted, preventing a focus change
    (or if any other random uncaught error prevented it), this will fire and
    you'll get all the deets on evt.detail
*/
focusErrorCallback(evt){
    // console.log(`focusErrorCallback() is here with: `, evt.detail);
}




/*
    logCallback(event)
    this catches log calls from the element.
    log data is on event.detail
    here you might wanna hook it into the app's logging system or whatever
*/
logCallback(evt){
    // console.log(`logCallback with: [${evt.detail.time}] ${evt.detail.message}`);
}

}
export { screenController };
