/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is borkenLink.
 *
 * The Initial Developer of the Original Code is
 * Austin King shout@ozten.com.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */

function log(aMessage) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage("borkenLink: " + aMessage + " :" + Date());
}
function error(aMessage){
  Components.utils.reportError("borkenLink:" + aMessage);
}

var BorkenLink = {
  onBrowserWindowLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("test-strings"); 
  },
  webProgressListener: {
    STATE_START: Components.interfaces.nsIWebProgressListener.STATE_START,
    STATE_STOP: Components.interfaces.nsIWebProgressListener.STATE_STOP,
    QueryInterface: function(aIID){
      if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
          aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
          aIID.equals(Components.interfaces.nsISupports))
        return this;
      throw Components.results.NS_NOINTERFACE;
    },
    domWindowList: [],
    onStateChange: function(aWebProgress, aRequest, aFlag, aStatus){
    // If you use webProgressListener for more than one tab/window, use
    // aWebProgress.DOMWindow to obtain the tab/window which triggers the state change
      /* if(aFlag & this.STATE_START){
      // This fires when the load event is initiated
        log('STATE_START');
        //TODO clean up links here, based on tab
        this.domWindowList.push(aWebProgress.DOMWindow.content.location);
        //log('aWebProgress.DOMWindow=' + aWebProgress.DOMWindow.content.location);
      }*/
      if(aFlag & this.STATE_STOP){
        if( aStatus == 0){
          if(BorkenLink.borkenLinks.length > 0){
            BorkenLink.displayLinks();
          }
        }else{
          error("Underlying request failed... code=" + aStatus);
        }
        $('head', window.content.document).append(
          //This works because we have contentaccessible=yes in chrome.manifest
          "<link type='text/css' rel='stylesheet' href='chrome://borkenLink/content/stylo.css'></link>");
      }
      
      return 0;
    
    },
    onLocationChange: function(aProgress, aRequest, aURI){
      // This fires when the location bar changes; i.e load event is confirmed
      // or when the user switches tabs. If you use webProgressListener for more than one tab/window,
      // use aProgress.DOMWindow to obtain the tab/window which triggered the change.

      return 0;
    },

    // For definitions of the remaining functions see XULPlanet.com
    onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress,
                               aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress){
      /* log("aWebProgress=" + aWebProgress + " nsIRequest=" + aRequest +
                       " aCurSelfProgress=" + aCurSelfProgress +
                      " aMaxSelfProgress=" + aMaxSelfProgress + 
                      " aCurTotalProgress=" + aCurTotalProgress +
                      " aMaxTotalProgress=" + aMaxTotalProgress); */
      return 0;
    },
    onStatusChange: function() {return 0;},
    onSecurityChange: function() {return 0;},
    onLinkIconAvailable: function() {return 0;}
  },
  httpObserver:{
    QueryInterface: function(aIID){
      if (aIID.equals(Components.interfaces.nsIObserver) ||
          aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
          aIID.equals(Components.interfaces.nsISupports))
        return this;
      throw Components.results.NS_NOINTERFACE;
    },
    observe: function( /* nsIHttpChannel */ req, /* String */ aTopic, /* String */ aData){
      if( parseInt(req.responseStatus ) > 399 ){
        //TODO this list must be per tab
        BorkenLink.borkenLinks.push({
          status: parseInt(req.responseStatus),
          message: req.responseStatusText,
          url: req.originalURI.asciiSpec
        });
      }
    }
  },
  borkenLinks: [],
  displayLinks: function(){
    var ulPresent = $('#borkenLink-list', window.content.document).length;
    if(ulPresent == 0){
      $('body', window.content.document).append(
        '<div id="borkenLink-panel"><h2>Borken Link</h2><button>Close</button><ul id="borkenLink-list"></ul><span class="fail">FAIL</span></div>'
      );
    }
    for(var i=0; i < BorkenLink.borkenLinks.length; i++){    
      var link = BorkenLink.borkenLinks[i];
      $('#borkenLink-list', window.content.document).append(
        "<li>" + link.status +
        " : " + link.message +
        "<p>" + link.url + "</p></li>");
    }
    BorkenLink.borkenLinks = [];
    $('#borkenLink-panel button', window.content.document).click(function(){
      //executes in browser window, not xul window
      $('#borkenLink-panel', window.content.document).toggle();
     });
  }
};

// I think this load is for the origonal browser and not subsequent pages
//aok window.addEventListener("load", function(e) { BorkenLink.onBrowserWindowLoad(e); }, false);

//log('getBrowser()' + getBrowser());

//aok var observer = window.Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
//aok observer.addObserver(BorkenLink.httpObserver, "http-on-examine-response", false);

getBrowser().addProgressListener(BorkenLink.webProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_ALL);
/* window.addEventListener("unload", function(e) {
    getBrowser().removeProgressListener(BorkenLink.webProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_ALL);
  }, false);
*/
//messing with https://developer.mozilla.org/en/Code_snippets/On_page_load
//and https://developer.mozilla.org/en/Code_snippets/Progress_Listeners
window.addEventListener("load", function() {
  //This fires once per XUL Window
  log("LOADING window.addEventListener");
  myExtension.init(); }, false);
window.addEventListener("unload", function() {
  //This fires once per XUL Window
  log("UNLOADING window.addEventListener"); }, false);

var myExtension = {
  init: function() {
    var appcontent = document.getElementById("appcontent");   // browser
    if(appcontent){
        appcontent.addEventListener("DOMContentLoaded", myExtension.onPageLoad, true);
        //appcontent.addEventListener("DOMContentUnLoaded", myExtension.onPageUnLoad, true);

    }
  },
  onPageLoad: function(aEvent) {
    //This fires once each time a 'page' loads. This could be just an about:blank XUL Window, or a webpage loading up.
    var doc = aEvent.originalTarget; // doc is document that triggered "onload" event
    log("LOADING appcontent.addEventListener(DOMContentLoaded doc.location=" + doc.location);
    // do something with the loaded page.
    // doc.location is a Location object (see below for a link).
    // You can use it to make your code executed on certain pages only.
    //if(doc.location.href.search("forum") > -1)
    //  alert("a forum page is loaded");
  }
}


