/*
 Zhongwen - A Chinese-English Pop-Up Dictionary
 Copyright (C) 2010-2019 Christian Schiller
 https://chrome.google.com/extensions/detail/kkmlkkjojmombglmlpbpapmhcaljjkde

 ---

 Originally based on Rikaikun 0.8
 Copyright (C) 2010 Erek Speed
 http://code.google.com/p/rikaikun/

 ---

 Originally based on Rikaichan 1.07
 by Jonathan Zarate
 http://www.polarcloud.com/

 ---

 Originally based on RikaiXUL 0.4 by Todd Rudick
 http://www.rikai.com/
 http://rikaixul.mozdev.org/

 ---

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

 ---

 Please do not change or remove any of the copyrights or links to web pages
 when modifying any of the files.

 */

/* global globalThis */

'use strict';

let config;

let enableKeyboardShortcuts = false;

let noChineseHasBeenSeen = true;

let savedTarget;

let savedRangeNode;

let savedRangeOffset;

let selFrom; // The window from which the current selection was made

let selText;

let selDoc;

let selElement;

let selElementCursor;

let selRects;

let clientX;

let clientY;

let selStartDelta;

let selStartIncrement;

let observer;

let popX = 0;

let popY = 0;

let timer;

let deferredMouseMove;

let mouseMoveTimer;

let altView = 0;

// let shiftY = 0;

let savedSearchResults = [];

let savedSelStartOffset = 0;

let savedSelEndList = [];

// regular expression for zero-width non-joiner U+200C &zwnj;
const zwnj = /\u200c/g;

function enableTab () {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('message', onWindowMessage);
}

function disableTab () {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('keydown', onKeyDown);

  if (observer) {
    observer.disconnect();
    observer = undefined;
  }

  const popup = document.getElementById('zhongwen-window');
  if (popup) {
    popup.parentNode.removeChild(popup);
  }

  clearHighlight();
}

function onKeyDown (keyDown) {
  if (
    keyDown.ctrlKey &&
    keyDown.altKey &&
    keyDown.keyCode === 75 // 'k'
  ) {
    enableKeyboardShortcuts = !enableKeyboardShortcuts;
  }

  if (enableKeyboardShortcuts) {
    if (keyDown.ctrlKey || keyDown.metaKey) {
      return;
    }

    if (keyDown.keyCode === 27) {
      // esc key pressed
      hidePopup();
      return;
    }

    if (keyDown.altKey && keyDown.keyCode === 87) {
      // Alt + w
      chrome.runtime.sendMessage({
        type: 'open',
        tabType: 'wordlist',
        url: '/wordlist.html'
      });
      return;
    }

    switch (keyDown.keyCode) {
    case 65: // 'a'
      setAltView({
        data: {
          type: 'set-alt-view',
          altView: (altView + 1) % 3,
          shift: 0
        }
      });
      break;

    case 67: // 'c'
      copyToClipboard({
        data: {
          type: 'copy-to-clipboard'
        }
      });
      break;

    case 66: // 'b'
      selectPrevious();
      break;

    case 71: // 'g'
      if (config.grammar !== 'no' && savedSearchResults.grammar) {
        const sel = encodeURIComponent(window.getSelection().toString());

        // https://resources.allsetlearning.com/chinese/grammar/%E4%B8%AA
        const allset = 'https://resources.allsetlearning.com/chinese/grammar/' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'grammar',
          url: allset
        });
      }
      break;

    case 77: // 'm'
      selectNext({
        data: {
          type: 'select-next',
          byWord: true
        }
      });
      break;

    case 78: // 'n'
      selectNext({
        data: {
          type: 'select-next'
        }
      });
      break;

    case 82: // 'r'
      {
        const entries = [];
        for (let j = 0; j < savedSearchResults.length; j++) {
          const entry = {
            simplified: savedSearchResults[j][0],
            traditional: savedSearchResults[j][1],
            pinyin: savedSearchResults[j][2],
            definition: savedSearchResults[j][3]
          };
          entries.push(entry);
        }

        chrome.runtime.sendMessage({
          type: 'add',
          entries: entries
        });

        showPopup('Added to word list.<p>Press Alt+W to open word list.', null, -1, -1);
      }
      break;

    case 83: // 's'
      {
        // https://www.skritter.com/vocab/api/add?from=Chrome&lang=zh&word=浏览&trad=瀏 覽&rdng=liú lǎn&defn=to skim over; to browse

        let skritter = 'https://legacy.skritter.com';
        if (config.skritterTLD === 'cn') {
          skritter = 'https://legacy.skritter.cn';
        }

        skritter +=
                    '/vocab/api/add?from=Zhongwen&siteref=Zhongwen&lang=zh&word=' +
                    encodeURIComponent(savedSearchResults[0][0]) +
                    '&trad=' + encodeURIComponent(savedSearchResults[0][1]) +
                    '&rdng=' + encodeURIComponent(savedSearchResults[0][4]) +
                    '&defn=' + encodeURIComponent(savedSearchResults[0][3]);

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'skritter',
          url: skritter
        });
      }
      break;

    case 84: // 't'
      {
        const sel = encodeURIComponent(selText);

        // https://tatoeba.org/eng/sentences/search?from=cmn&to=eng&query=%E8%BF%9B%E8%A1%8C
        const tatoeba = 'https://tatoeba.org/eng/sentences/search?from=cmn&to=eng&query=' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'tatoeba',
          url: tatoeba
        });
      }
      break;

    case 88: // 'x'
      setAltView({
        data: {
          type: 'set-alt-view',
          altView: 0,
          shift: -20
        }
      });
      break;

    case 89: // 'y'
      setAltView({
        data: {
          type: 'set-alt-view',
          altView: 0,
          shift: 20
        }
      });
      break;

    case 49: // '1'
      if (keyDown.altKey && selText) {
        const sel = encodeURIComponent(selText);

        // https://dict.naver.com/linedict/zhendict/dict.html#/cnen/search?query=%E4%B8%AD%E6%96%87
        const linedict = 'https://dict.naver.com/linedict/zhendict/dict.html#/cnen/search?query=' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'linedict',
          url: linedict
        });
      }
      break;

    case 50: // '2'
      if (keyDown.altKey && selText) {
        const sel = encodeURIComponent(selText);

        // https://forvo.com/search/%E4%B8%AD%E6%96%87/zh/
        const forvo = 'https://forvo.com/search/' + sel + '/zh/';

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'forvo',
          url: forvo
        });
      }
      break;

    case 51: // '3'
      if (keyDown.altKey && selText) {
        const sel = encodeURIComponent(selText);

        // https://dict.cn/%E7%BF%BB%E8%AF%91
        const dictcn = 'https://dict.cn/' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'dictcn',
          url: dictcn
        });
      }
      break;

    case 52: // '4'
      if (keyDown.altKey && selText) {
        const sel = encodeURIComponent(selText);

        // https://www.iciba.com/%E4%B8%AD%E9%A4%90
        const iciba = 'https://www.iciba.com/' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'iciba',
          url: iciba
        });
      }
      break;

    case 53: // '5'
      if (keyDown.altKey && selText) {
        const mdbg = 'https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=' + encodeURIComponent(selText);

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'mdbg',
          url: mdbg
        });
      }
      break;

    case 54: // '6'
      if (keyDown.altKey && selText) {
        const sel = encodeURIComponent(selText);

        // http://jukuu.com/show-%E8%AF%8D%E5%85%B8-0.html
        // https returns 403 errors
        const jukuu = 'http://jukuu.com/show-' + sel + '-0.html';

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'jukuu',
          url: jukuu
        });
      }
      break;

    case 55: // '7'
      if (keyDown.altKey && selText) {
        const sel = encodeURIComponent(selText);

        // https://www.moedict.tw/~%E4%B8%AD%E6%96%87
        const moedict = 'https://www.moedict.tw/~' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'moedict',
          url: moedict
        });
      }
      break;

    default:
    }
  }
}

// Rate limit processing of mouse move events
function onMouseMove (mouseMove) {
  deferredMouseMove = mouseMove;
  if (!mouseMoveTimer) {
    deferMouseMoveProcessing(50);
  }
}

function deferMouseMoveProcessing (delay) {
  mouseMoveTimer = setTimeout(() => {
    mouseMoveTimer = null;
    if (deferredMouseMove) {
      processMouseMove(deferredMouseMove);
      deferredMouseMove = null;
      deferMouseMoveProcessing(200);
    }
  }, delay);
}

function processMouseMove (mouseMove) {
  try {
    // Ignore mouse moves over the zhongwen pop-up
    if (mouseMove.target.id === 'zhongwen-window') {
      return;
    }

    // Ignore consecutive mouse events for same coordinates
    // This is a tiny optimization. The vast majority of mouse move events
    // will be with different coordinates.
    if (
      clientX && clientY &&
      mouseMove.clientX === clientX &&
      mouseMove.clientY === clientY
    ) {
      return;
    }
    clientX = mouseMove.clientX;
    clientY = mouseMove.clientY;

    let { rangeNode, rangeOffset } = getRangeDetails(mouseMove);

    if (
      rangeNode &&
      rangeNode.nodeName.match(/^(#text|TEXTAREA|INPUT)$/) && (
        rangeOffset !== savedRangeOffset ||
        rangeNode !== savedRangeNode
      ) && (
        rangeNode.parentNode === mouseMove.target ||
        rangeNode.nodeName !== '#text'
      )
    ) {
      if (rangeNode.data && rangeOffset === rangeNode.data.length) {
        rangeNode = findNextTextNode(rangeNode.parentNode, rangeNode);
        rangeOffset = 0;
      }

      savedTarget = mouseMove.target;
      savedRangeNode = rangeNode;
      savedRangeOffset = rangeOffset;

      selStartDelta = 0;
      selStartIncrement = 1;

      popX = mouseMove.clientX;
      popY = mouseMove.clientY;

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => triggerSearch(), 50);
    } else if (
      rangeOffset !== savedRangeOffset ||
      rangeNode !== savedRangeNode ||
      mouseMove.target !== savedTarget
    ) {
      clearHighlight();
      hidePopup();
      savedTarget = null;
      savedRangeNode = null;
      savedRangeOffset = null;
    }
  } catch (err) {
    console.log('processMouseMove failed with: ', err);
  }
}

// Get the node and offset of the range at the mouse position
function getRangeDetails (mouseMove) {
  const ownerDocument = mouseMove.target.ownerDocument;
  if (ownerDocument.caretPositionFromPoint) {
    // caretPositionFromPoint is standard but only supported by Firefox
    const range =
        ownerDocument.caretPositionFromPoint(
          mouseMove.clientX,
          mouseMove.clientY
        );
    if (range) {
      return {
        rangeNode: range.offsetNode,
        rangeOffset: range.offset
      };
    }
  } else if (ownerDocument.caretRangeFromPoint) {
    // caretRangeFromPoint is supported by all browsers except Firefox
    const range =
        ownerDocument.caretRangeFromPoint(
          mouseMove.clientX,
          mouseMove.clientY
        );
    if (range) {
      return {
        rangeNode: range.startContainer,
        rangeOffset: range.startOffset
      };
    }
  } else {
    return {};
  }
}

function triggerSearch () {
  const rangeNode = savedRangeNode;
  const selStartOffset = savedRangeOffset + selStartDelta;

  const nodeText =
      rangeNode.nodeName === '#text'
        ? rangeNode.data
        : (
          rangeNode.nodeName === 'TEXTAREA' ||
          rangeNode.nodeName === 'INPUT'
        )
          ? rangeNode.value
          : '';

  selStartIncrement = 1;

  if (!rangeNode) {
    clearHighlight();
    hidePopup();
    return 1;
  }

  if (selStartOffset < 0 || nodeText.length <= selStartOffset) {
    clearHighlight();
    hidePopup();
    return 2;
  }

  const u = nodeText.charCodeAt(selStartOffset);

  // selStartOffset is out of range of nodeText
  if (isNaN(u)) {
    clearHighlight();
    hidePopup();
    return 3;
  }

  // Don't search if no Chinese has been seen and u isn't a Chinese character
  if (
    noChineseHasBeenSeen &&
    u !== 0x25CB &&
    (u < 0x3400 || u > 0x9FFF) &&
    (u < 0xF900 || u > 0xFAFF) &&
    (u < 0xFF21 || u > 0xFF3A) &&
    (u < 0xFF41 || u > 0xFF5A)
  ) {
    clearHighlight();
    hidePopup();
    return 3;
  } else {
    noChineseHasBeenSeen = false;
  }

  const selEndList = [];
  const originalText = getText(rangeNode, selStartOffset, selEndList, 30 /* maxlength */);

  // Workaround for Google Docs: remove zero-width non-joiner &zwnj;
  const text = originalText.replace(zwnj, '');

  savedSelStartOffset = selStartOffset;
  savedSelEndList = selEndList;

  chrome.runtime.sendMessage({
    type: 'search',
    text: text,
    originalText: originalText
  },
  processSearchResult
  );

  return 0;
}

function processSearchResult (result) {
  const selStartOffset = savedSelStartOffset;
  const selEndList = savedSelEndList;

  try {
    if (!result) {
      hidePopup();
      clearHighlight();
      return;
    }

    let index = 0;
    for (let i = 0; i < result.matchLen; i++) {
      // Google Docs workaround: determine the correct highlight length
      while (result.originalText[index] === '\u200c') {
        index++;
      }
      index++;
    }
    const highlightLength = index;

    selStartIncrement = result.matchLen;
    selStartDelta = (selStartOffset - savedRangeOffset);

    const rangeNode = savedRangeNode;
    const doc = rangeNode.ownerDocument;
    if (!doc) {
      clearHighlight();
      hidePopup();
      return;
    }
    highlightMatch(doc, rangeNode, selStartOffset, highlightLength, selEndList);

    showPopup(makeHtml(result, config.tonecolors !== 'no'), savedTarget, popX, popY, false);
  } catch (err) {
    console.log('processMatch failed with: ', err);
  }
}

// modifies selEndList as a side-effect
function getText (startNode, offset, selEndList, maxLength) {
  let text = '';
  let endIndex;

  if (startNode.nodeName === '#text') {
    endIndex = Math.min(startNode.data.length, offset + maxLength);
    text += startNode.data.substring(offset, endIndex);
    selEndList.push({
      node: startNode,
      offset: endIndex
    });

    let nextNode = startNode;
    while ((text.length < maxLength) && ((nextNode = findNextTextNode(nextNode.parentNode, nextNode)) !== null)) {
      text += getTextFromSingleNode(nextNode, selEndList, maxLength - text.length);
    }
  } else if (
    startNode.nodeName === 'INPUT' ||
      startNode.nodeName === 'TEXTAREA'
  ) {
    endIndex = Math.min(startNode.value.length, offset + maxLength);
    text += startNode.value.substring(offset, endIndex);
    selEndList.push({
      node: startNode,
      offset: endIndex
    });
  } else {
    console.log('Unsupported nodeType: ', startNode);
  }

  return text;
}

// modifies selEndList as a side-effect
function getTextFromSingleNode (node, selEndList, maxLength) {
  let endIndex;

  if (node.nodeName === '#text') {
    endIndex = Math.min(maxLength, node.data.length);
    selEndList.push({
      node: node,
      offset: endIndex
    });
    return node.data.substring(0, endIndex);
  } else {
    return '';
  }
}

/**
 * If an element is passed, pop-up position is:
 *   - top-left of viewport if altView === 1
 *   - bottom-right of viewport if altView === 2
 *   - relative to the option element if element is a select option
 *   - relative to the (x, y) coordinates otherwise
 *
 * If no element is passed, pop-up position is top-left of viewport.
 *
 * If the pop-up is not at top-left or bottom-right, then if a select
 * option element is given, it is positioned relative to that element.
 * Otherwise it is positioned relative to the given (x, y) coordinates
 * or, if selTop and selBottom are set, then these are used for y.
 *
 * For relative positioning we want three coordinates:
 *  avoidLeft - left edge of the rectangle to avoid
 *  avoidTop - top edge of the rectangle to avoid
 *  avoidBottom - bottom edge of the rectangle to avoid
 *
 * Pop-up location:
 *  - immediately below avoid rectangle, left aligned with it
 *  - immediately below avoid rectangle, to the right edge of viewport
 *  - immediately above avoid rectangle, left aligned with it
 *  - immediately above avoid rectangle, to the right edge of viewport
 *  - top-left of viewport
 *  - bottom-right of viewport
 *
 */
function showPopup (html, elem, x, y, looseWidth) {
  try {
    const message = {
      type: 'show-pop-up',
      position: 'unchanged',
      looseWidth: looseWidth,
      html: html,
      selText: selText
    };

    if (!x || !y) {
      x = y = 0;
    }

    if (elem) {
      if (altView === 1) { // top left
        message.position = 'top-left';
      } else if (altView === 2) { // bottom right
        message.position = 'bottom-right';
      } else if (elem instanceof window.HTMLOptionElement) {
        x = 0;
        y = 0;

        let p = elem;
        while (p) {
          x += p.offsetLeft;
          y += p.offsetTop;
          p = p.offsetParent;
        }

        if (elem.offsetTop > elem.parentNode.clientHeight) {
          y -= elem.offsetTop;
        }

        x += elem.parentNode.offsetWidth + 5;

        message.position = 'avoid';
        message.avoidRects = [{
          top: y,
          bottom: y + elem.parentNode.clientHeight,
          left: x,
          right: x + elem.parentNode.clientWidth
        }];
      } else {
        // x += window.scrollX;
        // y += window.scrollY;
        message.position = 'avoid';
        message.avoidRects = selRects;
      }
    } else {
      message.position = 'top-left';
    }

    if (window === window.top) {
      topShowPopup({ data: message });
    } else {
      selFrom = window;
      window.parent.postMessage(message, '*');
    }
  } catch (err) {
    console.log('showPopup failed with: ', err);
  }
}

/**
 * onWindowMessage handles messages sent by window.postMessage().
 */
function onWindowMessage (event) {
  if (event.data.type === 'show-pop-up') {
    bubbleShowPopup(event);
  } else if (event.data.type === 'hide-pop-up') {
    bubbleHidePopup(event);
  } else if (event.data.type === 'select-next') {
    selectNext(event);
  } else if (event.data.type === 'select-previous') {
    selectPrevious(event);
  } else if (event.data.type === 'set-alt-view') {
    setAltView(event);
  } else if (event.data.type === 'copy-to-clipboard') {
    copyToClipboard(event);
  } else {
    console.log('Unsupported window message: ', event.data.type);
  }
}

function copyToClipboard (event) {
  if (
    window !== window.top &&
    (!event || event.source !== window.parent)
  ) {
    window.parent.postMessage(event.data, '*');
  } else if (selFrom !== window) {
    if (selText) {
      selFrom.postMessage(event.data, '*');
    }
  } else {
    chrome.runtime.sendMessage({
      type: 'copy',
      data: getTextForClipboard()
    });

    showPopup('Copied to clipboard', null, -1, -1);
  }
}

function setAltView (event) {
  altView = event.data.altView;
  // shiftY += event.data.shift || 0;
  if (
    window !== window.top &&
    (!event || event.source !== window.parent)
  ) {
    window.parent.postMessage(event.data, '*');
  } else if (selFrom !== window) {
    if (selText) {
      selFrom.postMessage(event.data, '*');
    }
  } else {
    triggerSearch();
  }
}

function selectPrevious (event) {
  if (
    window !== window.top &&
    (!event || event.source !== window.parent)
  ) {
    window.parent.postMessage({ type: 'select-previous' }, '*');
  } else if (selFrom !== window) {
    if (selText) {
      selFrom.postMessage({ type: 'select-previous' }, '*');
    }
  } else {
    let offset = selStartDelta;
    for (let i = 0; i < 10; i++) {
      selStartDelta = --offset;
      const ret = triggerSearch();
      if (ret === 0) {
        break;
      } else if (ret === 2) {
        savedRangeNode = findPreviousTextNode(savedRangeNode.parentNode, savedRangeNode);
        savedRangeOffset = 0;
        offset = savedRangeNode.data.length;
      }
    }
  }
}

function selectNext (event) {
  if (
    window !== window.top &&
    (!event || event.source !== window.parent)
  ) {
    window.parent.postMessage(event.data, '*');
  } else if (selFrom !== window) {
    if (selText) {
      selFrom.postMessage(event.data, '*');
    }
  } else {
    if (event.data.byWord) selStartIncrement = 1;
    for (let i = 0; i < 10; i++) {
      selStartDelta += selStartIncrement;
      const ret = triggerSearch();
      if (ret === 0) {
        break;
      } else if (ret === 2) {
        savedRangeNode = findNextTextNode(savedRangeNode.parentNode, savedRangeNode);
        savedRangeOffset = 0;
        selStartDelta = 0;
        selStartIncrement = 0;
      }
    }
  }
}

function bubbleHidePopup (event) {
  if (window === window.top) {
    topHidePopup(event.data);
  } else {
    window.parent.postMessage(event.data, '*');
  }
}

function topHidePopup (data) {
  const popup = document.getElementById('zhongwen-window');
  if (popup) {
    popup.style.display = 'none';
    popup.textContent = '';
  }
}

function bubbleShowPopup (event) {
  if (event.data.position === 'avoid') {
    // Offset coordinates into this window
    const iframes = document.getElementsByTagName('iframe');
    for (const iframe of iframes) {
      if (iframe.contentWindow !== event.source) continue;
      const { x, y } = iframe.getBoundingClientRect();
      if (event.data.avoidRects) {
        for (let i = 0; i < event.data.avoidRects.length; i++) {
          const rect = event.data.avoidRects[i];
          rect.top += y;
          rect.bottom += y;
          rect.left += x;
          rect.right += x;
        }
      }
    }
  }

  if (window === window.top) {
    topShowPopup(event);
  } else {
    // bubble up
    selFrom = event.source;
    window.parent.postMessage(event.data, '*');
  }
}

/**
 * topShowPopup shows the pop-up in this, the top window
 *
 * This actually renders and reveals the pop-up
 */
function topShowPopup (messageEvent) {
  try {
    const data = messageEvent.data;
    selFrom = messageEvent.source || window;
    selText = data.selText;
    let popup = document.getElementById('zhongwen-window');
    const looseWidth = false; // It seems not used but placeholder, in case...

    if (!popup) {
      popup = document.createElement('div');
      popup.setAttribute('id', 'zhongwen-window');
      document.documentElement.appendChild(popup);
    }

    popup.style.width = 'auto';
    popup.style.height = 'auto';
    popup.style.maxWidth = (looseWidth ? '' : '600px');
    popup.className =
      `background-${config.css} tonecolor-${config.toneColorScheme}`;

    $(popup).html(data.html);
    popup.style.top = '-1000px';
    popup.style.left = '0px';
    popup.style.display = ''; // Need it displayed so dimensions are correct

    let x = -1;
    let y = -1;

    let pW = popup.offsetWidth;
    let pH = popup.offsetHeight;

    if (pW <= 0) {
      pW = 200;
    }
    if (pH <= 0) {
      pH = 0;
      let j = 0;
      while ((j = data.html.indexOf('<br/>', j)) !== -1) {
        j += 5;
        pH += 22;
      }
      pH += 25;
    }

    if (altView === 1 || data.position === 'top-left') {
      x = window.scrollX;
      y = window.scrollY;
    } else if (altView === 2 || data.position === 'bottom-right') {
      x = (window.innerWidth - (pW + 20)) + window.scrollX;
      y = (window.innerHeight - (pH + 20)) + window.scrollY;
    } else if (data.position === 'avoid') {
      const result = below() || above() || topLeft() || bottomRight();
      [x, y] = result;

      function below () {
        if (data.avoidRects[0].bottom + (pH + 20) < window.innerHeight) {
          x = Math.min(
            window.innerWidth - (pW + 20),
            data.avoidRects[0].left
          );
          y = data.avoidRects[0].bottom + 5;
          for (let i = 0; i < data.avoidRects.length; i++) {
            const rect = data.avoidRects[i];
            if (
              rect.left < x + pW + 20 &&
              rect.right > x - 5 &&
              rect.top < y + pH + 20 &&
              rect.bottom > y - 5
            ) {
              if (rect.right + (pW + 20) < window.innerWidth) {
                x = rect.right + 5;
              } else if (rect.bottom + (pH + 20) < window.innerHeight) {
                y = rect.bottom + 5;
              } else {
                return;
              }
            }
          }
          return [x, y];
        }
      }

      function above () {
        if (data.avoidRects[0].top > pH + 5) {
          x = Math.min(
            window.innerWidth - (pW + 20),
            data.avoidRects[0].left
          );
          y = data.avoidRects[0].top - (pH + 5);
          for (let i = 0; i < data.avoidRects.length; i++) {
            const rect = data.avoidRects[i];
            if (
              rect.left < x + pW + 20 &&
              rect.right > x - 5 &&
              rect.top < y + pH + 5 &&
              rect.bottom > y - 5
            ) {
              if (rect.left > (pW + 20)) {
                x = rect.left - (pW + 5);
              } else if (rect.top > pH + 20) {
                y = rect.top - (pH + 5);
              } else {
                return;
              }
            }
          }
          return [x, y];
        }
      }

      function topLeft () {
        x = 0;
        y = 0;
        for (let i = 0; i < data.avoidRects.length; i++) {
          const rect = data.avoidRects[i];
          if (
            rect.left < x + pW + 20 &&
            rect.right > x - 5 &&
            rect.top < y + pH + 20 &&
            rect.bottom > y - 5
          ) {
            return;
          }
        }
        return [x, y];
      }

      function bottomRight () {
        x = window.innerWidth - (pW + 5);
        y = window.innerHeight - (pH + 5);
        for (let i = 0; i < data.avoidRects.length; i++) {
          const rect = data.avoidRects[i];
          if (
            rect.left < x + pW + 20 &&
            rect.right > x - 5 &&
            rect.top < y + pH + 20 &&
            rect.bottom > y - 5
          ) {
            if (data.avoidRects[0].left > window.innerWidth / 2) {
              x = 0;
            } else {
              x = window.innerWidth - (pW + 5);
            }
            if (data.avoidRects[0].top > window.innerHeight / 2) {
              y = 0;
            } else {
              y = window.innerHeight - (pH + 5);
            }
            return [x, y];
          }
        }
        return [x, y];
      }

      x += window.scrollX;
      y += window.scrollY;
    } else {
      console.log('Unsupported show-pop-up position: ', data.position);
    }

    // (-1, -1) indicates: leave position unchanged
    if (x !== -1 && y !== -1) {
      popup.style.top = y + 'px';
      popup.style.left = x + 'px';
      popup.style.display = '';
    }
  } catch (err) {
    console.log('topShowPopup failed with: ', err);
  }
}

function hidePopup () {
  const message = {
    type: 'hide-pop-up'
  };
  if (window === window.top) {
    topHidePopup(message);
  } else {
    window.parent.postMessage(message, '*');
  }
}

/**
 * Highlight the text matched by lookup.
 *
 * The matched text begins at rangeStartOffset into rangeStartNode and
 * extends for matchLen characters. This may span multiple nodes.
 *
 * selEndList is an array of objects containing nodes that may contain
 * matched text. The match begins in the node of the first element and
 * extends until matchLen characters have been spanned.
 *
 * If savedTarget is a form element (i.e. has a 'form' attribute) then
 * the selection is not set, so the matched text is not highlighted. This
 * is for historical reasons. The original motivation for avoiding
 * selecting text in form elements is unknown.
 */
function highlightMatch (doc, rangeStartNode, rangeStartOffset, matchLen, selEndList) {
  if (rangeStartNode.nodeName === '#text') {
    if (!selEndList || selEndList.length === 0) return;

    let selEnd;
    let offset = rangeStartOffset + matchLen;

    for (let i = 0, len = selEndList.length; i < len; i++) {
      selEnd = selEndList[i];
      if (offset <= selEnd.offset) {
        break;
      }
      offset -= selEnd.offset;
    }

    const range = doc.createRange();
    range.setStart(rangeStartNode, rangeStartOffset);
    range.setEnd(selEnd.node, offset);
    selRects = makeRectsArray(range.getClientRects());

    // Don't highlight in form elements
    if (!('form' in savedTarget)) {
      const sel = doc.getSelection();
      if (!sel.isCollapsed && selText !== sel.toString()) { return; }
      sel.empty();
      sel.addRange(range);
      selText = sel.toString();
      selDoc = doc;
      const el = sel.anchorNode.parentElement;
      if (el) {
        if (selElement && selElement !== el) {
          selElement.style.cursor = selElementCursor;
        }
        if (selElement !== el) {
          selElement = el;
          selElementCursor = selElement.style.cursor;
          selElement.style.cursor = 'url(' +
            chrome.runtime.getURL('images/cursor.png') +
            ') 32 16, crosshair';
        }
      }
    }
  } else if (
    rangeStartNode.nodeName === 'INPUT' ||
    rangeStartNode.nodeName === 'TEXTAREA'
  ) {
    // TODO: determine the position of the matched text within the input
    // rather than the position of the entire input element.
    selRects = makeRectsArray(rangeStartNode.getClientRects());
    selDoc = doc;
    rangeStartNode.setSelectionRange(
      rangeStartOffset,
      rangeStartOffset + matchLen
    );
  } else {
    console.log("Don't highlight " + rangeStartNode.nodeName);
  }
}

/**
 * makeRectsArray returns an array or rectangles from a client rectangles
 * object which is array like but not an array and not clonable.
 */
function makeRectsArray (rects) {
  const array = [];
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    array.push({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right
    });
  }
  return array;
}

/**
 * Clear the current selection.
 * The selection might be in the outer document or in a document in an
 * iframe of the outer document. selDoc is the document containing the
 * selection. It should always be set if there is a selection.
 *
 * I don't know why there is conditional empty of the selection. Why not
 * empty it in every case?
 */
function clearHighlight () {
  if (!selDoc) return;

  const selection = selDoc.getSelection();
  if (selection.isCollapsed || selText === selection.toString()) {
    selection.empty();
    if (selElement) {
      selElement.style.cursor = selElementCursor;
      selElement = undefined;
    }
  }
  selText = null;
  selDoc = null;
}

function getTextForClipboard () {
  let result = '';
  for (let i = 0; i < savedSearchResults.length; i++) {
    result += savedSearchResults[i].slice(0, -1).join('\t');
    result += '\n';
  }
  return result;
}

function findNextTextNode (root, previous) {
  if (root === null) {
    return null;
  }
  const nodeIterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT, null);
  let node = nodeIterator.nextNode();
  while (node !== previous) {
    node = nodeIterator.nextNode();
    if (node === null) {
      return findNextTextNode(root.parentNode, previous);
    }
  }
  const result = nodeIterator.nextNode();
  if (result !== null) {
    return result;
  } else {
    return findNextTextNode(root.parentNode, previous);
  }
}

function findPreviousTextNode (root, previous) {
  if (root === null) {
    return null;
  }
  const nodeIterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT, null);
  let node = nodeIterator.nextNode();
  while (node !== previous) {
    node = nodeIterator.nextNode();
    if (node === null) {
      return findPreviousTextNode(root.parentNode, previous);
    }
  }
  nodeIterator.previousNode();
  const result = nodeIterator.previousNode();
  if (result !== null) {
    return result;
  } else {
    return findPreviousTextNode(root.parentNode, previous);
  }
}

function makeHtml (result, showToneColors) {
  let entry;
  let html = '';
  const texts = [];
  let hanziClass;

  if (result === null) return '';

  for (let i = 0; i < result.data.length; ++i) {
    entry = result.data[i][0].match(/^([^\s]+?)\s+([^\s]+?)\s+\[(.*?)\]?\s*\/(.+)\//);
    if (!entry) continue;

    // Hanzi

    if (config.simpTrad === 'auto') {
      const word = result.data[i][1];

      hanziClass = 'w-hanzi';
      if (config.fontSize === 'small') {
        hanziClass += '-small';
      }
      html += '<span class="' + hanziClass + '">' + word + '</span>&nbsp;';
    } else {
      hanziClass = 'w-hanzi';
      if (config.fontSize === 'small') {
        hanziClass += '-small';
      }
      html += '<span class="' + hanziClass + '">' + entry[2] + '</span>&nbsp;';
      if (entry[1] !== entry[2]) {
        html += '<span class="' + hanziClass + '">' + entry[1] + '</span>&nbsp;';
      }
    }

    // Pinyin

    let pinyinClass = 'w-pinyin';
    if (config.fontSize === 'small') {
      pinyinClass += '-small';
    }
    const p = pinyinAndZhuyin(entry[3], showToneColors, pinyinClass);
    html += p[0];

    // Zhuyin

    if (config.zhuyin === 'yes') {
      html += '<br>' + p[2];
    }

    // Definition

    let defClass = 'w-def';
    if (config.fontSize === 'small') {
      defClass += '-small';
    }
    const translation = entry[4].replace(/\//g, '; ');
    html += '<br><span class="' + defClass + '">' + translation + '</span><br>';

    // Grammar
    if (config.grammar !== 'no' && result.grammar && result.grammar.index === i) {
      html += '<br><span class="grammar">Press "g" for grammar and usage notes.</span><br><br>';
    }

    texts[i] = [entry[2], entry[1], p[1], translation, entry[3]];
  }
  if (result.more) {
    html += '&hellip;<br/>';
  }

  savedSearchResults = texts;
  savedSearchResults.grammar = result.grammar;

  return html;
}

const tones = {
  1: '&#772;',
  2: '&#769;',
  3: '&#780;',
  4: '&#768;',
  5: ''
};

const utones = {
  1: '\u0304',
  2: '\u0301',
  3: '\u030C',
  4: '\u0300',
  5: ''
};

function parse (s) {
  return s.match(/([^AEIOU:aeiou]*)([AEIOUaeiou:]+)([^aeiou:]*)([1-5])/);
}

function tonify (vowels, tone) {
  let html = '';
  let text = '';

  if (vowels === 'ou') {
    html = 'o' + tones[tone] + 'u';
    text = 'o' + utones[tone] + 'u';
  } else {
    let tonified = false;
    for (let i = 0; i < vowels.length; i++) {
      const c = vowels.charAt(i);
      html += c;
      text += c;
      if (c === 'a' || c === 'e') {
        html += tones[tone];
        text += utones[tone];
        tonified = true;
      } else if (i === vowels.length - 1 && !tonified) {
        html += tones[tone];
        text += utones[tone];
        tonified = true;
      }
    }
    html = html.replace(/u:/, '&uuml;');
    text = text.replace(/u:/, '\u00FC');
  }

  return [html, text];
}

function pinyinAndZhuyin (syllables, showToneColors, pinyinClass) {
  let text = '';
  let html = '';
  let zhuyin = '';
  let zhuyinClass = 'w-zhuyin';
  if (config.fontSize === 'small') {
    zhuyinClass += '-small';
  }

  const a = syllables.split(/[\s·]+/);
  for (let i = 0; i < a.length; i++) {
    const syllable = a[i];

    // ',' in pinyin
    if (syllable === ',') {
      html += ' ,';
      text += ' ,';
      continue;
    }

    if (i > 0) {
      html += '&nbsp;';
      text += ' ';
      zhuyin += '&nbsp;';
    }
    if (syllable === 'r5') {
      if (showToneColors) {
        html += '<span class="' + pinyinClass + ' tone5">r</span>';
      } else {
        html += '<span class="' + pinyinClass + '">r</span>';
      }
      text += 'r';
      continue;
    }
    if (syllable === 'xx5') {
      if (showToneColors) {
        html += '<span class="' + pinyinClass + ' tone5">??</span>';
      } else {
        html += '<span class="' + pinyinClass + '">??</span>';
      }
      text += '??';
      continue;
    }
    const m = parse(syllable);
    if (m) {
      if (showToneColors) {
        html += '<span class="' + pinyinClass + ' tone' + m[4] + '">';
      } else {
        html += '<span class="' + pinyinClass + '">';
      }
      const t = tonify(m[2], m[4]);
      html += m[1] + t[0] + m[3];
      html += '</span>';
      text += m[1] + t[1] + m[3];

      zhuyin += '<span class="tone' + m[4] + ' ' + zhuyinClass + '">' +
              globalThis.numericPinyin2Zhuyin(syllable) + '</span>';
    } else {
      html += '<span class="' + pinyinClass + ' tone5">' + syllable + '</span>';
      text += syllable;
      zhuyin += '<span class="' + zhuyinClass + '">' + syllable + '</span>';
    }
  }
  return [html, text, zhuyin];
}

const miniHelp = `
    <span style="font-weight: bold;">Zhongwen Chinese-English Dictionary</span><br><br>
    <p>Keyboard shortcuts:<p>
    <table style="margin: 10px;" cellspacing=5 cellpadding=5>
    <tr><td><b>Ctrl + Alt + k&nbsp;:</b></td><td>&nbsp;Toggle keyboard shortcuts on/off</td></tr>
    <tr><td><b>n&nbsp;:</b></td><td>&nbsp;Next word</td></tr>
    <tr><td><b>b&nbsp;:</b></td><td>&nbsp;Previous character</td></tr>
    <tr><td><b>m&nbsp;:</b></td><td>&nbsp;Next character</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>a&nbsp;:</b></td><td>&nbsp;Alternate pop-up location</td></tr>
    <tr><td><b>y&nbsp;:</b></td><td>&nbsp;Move pop-up location down</td></tr>
    <tr><td><b>x&nbsp;:</b></td><td>&nbsp;Move pop-up location up</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>c&nbsp;:</b></td><td>&nbsp;Copy translation to clipboard</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>r&nbsp;:</b></td><td>&nbsp;Remember word by adding it to the built-in word list</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>Alt w&nbsp;:</b></td><td>&nbsp;Show the built-in word list in a new tab</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>s&nbsp;:</b></td><td>&nbsp;Add word to Skritter queue</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td colspan="2">Look up selected text in online resources:</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>Alt + 1 :</b></td><td>&nbsp;LINE Dict</td></tr>
    <tr><td><b>Alt + 2 :</b></td><td>&nbsp;Forvo</td></tr>
    <tr><td><b>Alt + 3 :</b></td><td>&nbsp;Dict.cn</td></tr>
    <tr><td><b>Alt + 4&nbsp;:</b></td><td>&nbsp;iCIBA</td></tr>
    <tr><td><b>Alt + 5&nbsp;:</b></td><td>&nbsp;MDBG</td></tr>
    <tr><td><b>Alt + 6&nbsp;:</b></td><td>&nbsp;JuKuu</td></tr>
    <tr><td><b>Alt + 7&nbsp;:</b></td><td>&nbsp;MoE Dict</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>t&nbsp;:</b></td><td>&nbsp;Tatoeba</td></tr>
    </table>`;

// event listener
// Only listen for messages in the top frame - not in iframes
// if (window.top === window.self) {
chrome.runtime.onMessage.addListener(
  function (request) {
    switch (request.type) {
    case 'enable':
      enableTab();
      config = request.config;
      break;
    case 'disable':
      disableTab();
      break;
    case 'showPopup':
      if (window === window.top) {
        showPopup(request.text);
      }
      break;
    case 'showHelp':
      if (window === window.top) {
        showPopup(miniHelp);
      }
      break;
    default:
    }
  }
);

chrome.runtime.sendMessage({
  type: 'loaded'
},
(response) => {
  config = response.config;
  if (response.enabled) {
    enableTab();
  } else {
    disableTab();
  }
}
);
// }
