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
    onStateChange: function(aWebProgress, aRequest, aFlag, aStatus){
      if(aFlag & this.STATE_STOP){        
        if( aStatus == 0){          
          var site = aWebProgress.DOMWindow;
          BorkenLink.borkenLinks[site] = BorkenLink.borkenLinks[site] || [];
          BorkenLink.canHasBorkenLinks[site] = BorkenLink.canHasBorkenLinks[site] || false;
          
          if(BorkenLink.canHasBorkenLinks[site]){
            BorkenLink.displayLinks(site);
            
            $('head', window.content.document).append(
              //This works because we have contentaccessible=yes in chrome.manifest?
              "<link type='text/css' rel='stylesheet' href='chrome://linkage-fail/content/stylo.css'></link>");
          }
        }else{
          error("Underlying request failed... code=" + aStatus);
        }
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
    observe: function( /* nsIHttpChannel */ req, aTopic, aData){
      var http = req.QueryInterface(Components.interfaces.nsIHttpChannel);
      
      if( parseInt(http.responseStatus ) > 399 && http.notificationCallbacks ){
        var interfaceRequestor = http.notificationCallbacks.QueryInterface(Components.interfaces.nsIInterfaceRequestor);
        var win;
        try{
          win = interfaceRequestor.getInterface(Components.interfaces.nsIDOMWindow);
          
          //Has user clicked on a bad link?
          if(win.location == http.originalURI.asciiSpec) return;
        }catch(e){
          log("Unable to figure out which tab we are in ... " + e);
          return;
        }
        var links = BorkenLink.borkenLinks;
        var site = win;
        links[site] = links[site] || [];
        
        links[site].push({
          status: parseInt(http.responseStatus),
          message: http.responseStatusText,
          url: http.originalURI.asciiSpec
        });        
        BorkenLink.canHasBorkenLinks[site] = BorkenLink.canHasBorkenLinks[site] || false;
        
        if( ! BorkenLink.canHasBorkenLinks[site] ){
          if( ! /.*favicon.ico$/.test(req.originalURI.asciiSpec)){
            BorkenLink.canHasBorkenLinks[site] = true;
          }
        }
      }
    }
  },
  borkenLinks: [],
  canHasBorkenLinks: [],
  displayLinks: function(site){
    BorkenLink.borkenLinks[site] = BorkenLink.borkenLinks[site] || [];
    
    var ulPresent = $('#borkenLink-list', window.content.document).length;
    if(ulPresent == 0){
      $('body', window.content.document).append(
        '<div id="borkenLink-panel"><h2>Linkage</h2><button>Close</button><ul id="borkenLink-list"></ul><span class="fail">FAIL</span></div>'
      );
    }
    for(var i=0; i < BorkenLink.borkenLinks[site].length; i++){    
      var link = BorkenLink.borkenLinks[site][i];
      $('#borkenLink-list', window.content.document).append(
        "<li>" + link.status +
        " : " + link.message +
        "<p>" + link.url + "</p></li>");
    }
    BorkenLink.borkenLinks[site] = [];
    BorkenLink.canHasBorkenLinks[site] = false;
    $('#borkenLink-panel button', window.content.document).click(function(e){
      //executes in browser window, not xul window
      $('#borkenLink-panel', window.content.document).toggle();
     });
  }
};

var observer = window.Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
observer.addObserver(BorkenLink.httpObserver, "http-on-examine-response", false);

//Load progress listeners at window load ala
//https://addons.mozilla.org/en-US/firefox/addon/1433 extended status bar
window.addEventListener("load", function(){
  window.getBrowser().addProgressListener(BorkenLink.webProgressListener, Components.interfaces.nsIWebProgressListener.STATE_START);
  }, false);
window.addEventListener("unload", function(){
  window.getBrowser().removeProgressListener(BorkenLink.webProgressListener, Components.interfaces.nsIWebProgressListener.STATE_STOP);
  }, false);

