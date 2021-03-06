var webFrame = require('web-frame');
var ipcRenderer = require('electron').ipcRenderer;

(function() {
  var webFrameSetZoomFactor = webFrame.setZoomFactor;
  webFrame.setZoomFactor = function () {
    var oldZoom = webFrame.getZoomFactor();
    var ret = webFrameSetZoomFactor.apply(this, arguments);
    if (oldZoom != webFrame.getZoomFactor()) {
      ipcRenderer.send('zoom-factor-changed', webFrame.getZoomFactor());
    }
    return ret;
  };
})();

window._zoomIn = function () {
  webFrame.setZoomFactor(webFrame.getZoomFactor() + 0.1);
};

window._zoomOut = function () {
  webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.1);
};

window._zoomActualSize = function() {
  webFrame.setZoomFactor(1);
};

window._openChannelPalette = function () {
  jQuery.event.trigger({ type: 'keydown', ctrlKey: true, which: "K".charCodeAt(0) });
};

window._movePrevChannel = function () {
  jQuery.event.trigger({ type: 'keydown', altKey: true, which: 38 });
};

window._moveNextChannel = function () {
  jQuery.event.trigger({ type: 'keydown', altKey: true, which: 40 });
};

window._movePrevUnreadChannel = function () {
  jQuery.event.trigger({ type: 'keydown', altKey: true, shiftKey: true, which: 38 });
};

window._moveNextUnreadChannel = function () {
  jQuery.event.trigger({ type: 'keydown', altKey: true, shiftKey: true, which: 40 });
};

window._movePreviouslySelectedChannel = function () {
  if (oldSelectedChannel !== null)
    oldSelectedChannel.click();
};

function getSelectedChannel () {
  return document.querySelector("#buffers .buffer.selected span[href]")
}

var selectedChannel = null;
var oldSelectedChannel = null;

var docObserver = new MutationObserver(function () {
  var buffers = document.querySelector("#buffers");
  if (buffers !== null) {
    docObserver.disconnect();

    var buffersObserver = new MutationObserver(function () {
      var selected = getSelectedChannel();

      if (selectedChannel !== selected && (!selectedChannel || !selected ||
          (selectedChannel.getAttribute("href") != selected.getAttribute("href")))) {
        oldSelectedChannel = selectedChannel;
        selectedChannel = selected;
      }
    });

    buffersObserver.observe(buffers, { attributes: true, attributeFilter: ['class', 'href'], subtree: true });
  }
});

docObserver.observe(document, {subtree: true, attributes: true, childList: true, attributeFilter: ['id'] });

var remote = require('remote');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');
var linkMenu = new Menu();

linkMenu.append(new MenuItem({
  label: 'Open Link',
  accelerator: 'CommandOrControl+O',
  click: function (evt) {
    window.open(document.activeElement.href);
  }
}));
linkMenu.append(new MenuItem({
  label: 'Copy Link',
  accelerator: 'CommandOrControl+C',
  click: function (evt) {
    require('electron').clipboard.writeText(document.activeElement.href);
  }
}));

var copyMenu = new Menu();
copyMenu.append(new MenuItem({
  label: 'Copy',
  accelerator: 'CommandOrControl+C',
  role: 'copy'
}));

var pasteMenu = new Menu();
pasteMenu.append(new MenuItem({
  label: 'Paste',
  accelerator: 'CommandOrControl+V',
  role: 'paste'
}));

var inputSelectionMenu = new Menu();
inputSelectionMenu.append(copyMenu.items[0]);
inputSelectionMenu.append(new MenuItem({
  label: 'Cut',
  accelerator: 'CommandOrControl+X',
  role: 'cut'
}));
inputSelectionMenu.append(pasteMenu.items[0]);

window.addEventListener('contextmenu', function (event) {
  var clickedElement = document.activeElement;
  var anySelection = (document.getSelection().toString().length > 0);

  if (clickedElement.tagName == 'INPUT' || clickedElement.tagName == 'TEXTAREA') {
    event.preventDefault();
    console.log(document.getSelection().toString())

    if (!clickedElement.disabled) {
      var menu = anySelection ? inputSelectionMenu : pasteMenu;
      menu.popup(remote.getCurrentWindow());
    } else if (anySelection) {
      copyMenu.popup(remote.getCurrentWindow());
    }
  } else if (anySelection) {
    event.preventDefault();
    copyMenu.popup(remote.getCurrentWindow());
  } else if (clickedElement.tagName == 'A' && clickedElement.href.length > 0) {
    event.preventDefault();
    linkMenu.popup(remote.getCurrentWindow());
  }
}, false);
