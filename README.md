# 中文 Zhongwen

## A Chinese Pop-Up Dictionary and Learning Tool

This is a modified fork of
[Zhongwen](https://github.com/cschiller/zhongwen).

Changes from the original include:
 * supports lookup in iframes
 (see [Zhongwen issue 85](https://github.com/cschiller/zhongwen/issues/85))
 * Improved positioning of pop-up

## Highlights
- Supports both traditional and simplified characters.
- Includes the widely used 
  [CC-CEDICT](https://cc-cedict.org/wiki) Chinese English dictionary
  updated to 20230225.
- Displays Hanyu Pinyin along both the simplified and traditional characters,
  however only showing either simplified or traditional characters
  can be configured as an option.
- As a learning aid it uses different colors for displaying the Pinyin
  syllables, depending on the tone of the Chinese character.
- Can be turned on and off with a single mouse-click.
- Highlights the characters whose translation is displayed in the pop-up
  window.
- Also supports keyboard navigation for translating the next character, the
  next word, or the previous character.
- Allows you to add words to a built-in word list. Words from this list can be
  exported to a text file for further processing, such as importing the words
  into [Anki](https://apps.ankiweb.net).
- Includes links to grammar and usage notes on the 
  [Chinese Grammar Wiki](https://resources.allsetlearning.com/chinese/grammar).
- Supports exporting words to the [Skritter](https://skritter.com) vocabulary 
  queue.


## Installation

### Firefox

Available as an
[add-on](https://addons.mozilla.org/en-US/firefox/addon/ig3-zhongwen/)

#### From the source

```
$ git clone https://github.com/ig3/zhongwen
$ cd zhongwen
$ npm install
$ npm run build
```

This will produce a zip file in the web-ext-artifacts directory.

In firefox, Add-ons Manager, load this file via 'Install add-on from File'.


### Chromium based browsers

Version 1.0.8 of the extension works in Chromium 111.0.5563.64 on Debian
Linux, installed in developer mode by 'Load unpacked', from a clone of the
GitHub repository.

## How Does It Work?

Once Zhongwen is installed on your computer you'll see a little icon showing
the Zhongwen logo near the upper right-hand corner of your browser. By
clicking on this icon you can turn the extension on and off. Click on it and
wait until you see the word "On" displayed in red and white on top of the icon.
This tells you that the dictionary is active. If you want to turn it off again,
just click on the icon again and the red "On" label disappears. So with a
single mouse-click you can activate or deactivate the dictionary.

Once Zhongwen has been turned on, showing the red "On" label on the icon, you
can go to a web page in Chinese and point your mouse at some Chinese characters.
A pop-up window opens up automatically showing you the translation of the word
you were pointing at.

Zhongwen can translate both simplified characters as well as traditional
characters.


## What Information Does It Show?
By default, the pop-up window shows the following pieces of information:

- The Chinese characters forming the word you're pointing at with your mouse. If
  the simplified and the traditional forms differ, then both forms are shown.
- The corresponding Pinyin. The individual Pinyin syllables are shown in 
  different colors (see below).
- The English translation. Sometimes, Zhongwen finds more than one matching 
  entry in its dictionary. In this case it shows you all of the matching 
  entries.


## Zhuyin
If you want to see Zhuyin, a.k.a. 
[Bopomofo](https://en.wikipedia.org/wiki/Bopomofo), you can enable it via the 
[options page](#more-options).


## Chinese Grammar Wiki
Zhongwen also allows you to learn more about Chinese grammar and usage. If
Zhongwen knows that there's an entry at the Chinese Grammar Wiki for the entry
you're just looking at, it will show you the following text at the bottom
of the pop-up window: 'Press "g" for grammar and usage notes.' If you then
press <kbd>G</kbd> on your keyboard, a new tab will open in your browser and it 
will take you directly to the corresponding page in the Chinese Grammar Wiki.


## Why Is Pinyin Shown in Different Colors?
If you're learning Chinese, Zhongwen helps you remember the tone of each
character by displaying it in a different color. By default it uses the 
following color scheme for showing Pinyin syllables:

- First tone syllables are shown in red.
- Second tone syllables are shown in orange.
- Third tone syllables are shown in green.
- Forth tone syllables are shown in blue.


## Keyboard Navigation
Some users don't use Zhongwen to look up individual words, they want to read
an entire paragraph or article. In this case, rather than having to trace all
the words with the mouse, you can use Zhongwen's built-in keyboard navigation
support: You can move from character to character or from word to word by
pressing keys on your keyboard:

- Pressing <kbd>N</kbd> on the keyboard takes you to the next word.
- Pressing <kbd>B</kbd> takes you back one character.
- Pressing <kbd>M</kbd> moves to the next character. (This is different from 
  pressing <kbd>N</kbd> if you're currently over a word that consists of two or 
  more characters.)
- Sometimes the pop-up window is hiding the text you're looking at. You can move
  it out of the way using <kbd>X</kbd> and <kbd>Y</kbd> on the keyboard (this 
  moves the pop-up window up or down), or hit <kbd>A</kbd> once or twice to move
  it to an altogether different location.


## Built-in Word List
So now that you can look up all those words when reading Chinese web sites, wouldn't
it be nice to add the new words you want to remember to some list that you can use for
studying? Zhongwen let's you do that, too! It has a built- in word list feature. You just
need to press <kbd>R</kbd> (short for "remember") on your keyboard and the entries you're looking
at in the currently opened pop-up window will be added to the built-in word list. How
do you get to see this list? It's easy, you need to use press the <kbd>Alt</kbd> and the <kbd>W</kbd> key
on your keyboard (<kbd>Alt</kbd> + <kbd>W</kbd>). The word list will then open in a new tab.


## Can I export the dictionary entries into a spreadsheet or import them into Anki?
Yes, if you want to copy the current dictionary entry, including the Chinese characters,
Pinyin, and the English translation, to the clipboard, just hit <kbd>C</kbd> on the keyboard to
copy to the clipboard. (Note: This is different from using <kbd>Ctrl</kbd> + <kbd>C</kbd> on a PC or
<kbd>⌘ Command</kbd> + <kbd>C</kbd> on a Mac, which only copies the Chinese characters without the translation.)
When you paste the clipboard into Excel or an OpenOffice spreadsheet, the individual
components of the entry are nicely put in different columns and rows. From there you can
also import them into Anki. (See the Anki manual for further details.)


## Skritter Support
If you're studying Chinese characters using Skritter you can easily add Chinese words
to your vocabulary queue: just hit <kbd>S</kbd> on the keyboard. This opens up a new tab that
takes you to the Skritter web site. If you're not logged into Skritter you'll see the
login page. After you're logged in, the word is automatically added to your study queue.


## Context Menu Items
When Zhongwen is enabled, you can right-click on a page to open the browser's
context menu. There will be a menu item for Zhongwen which you can use to access
a new tab showing a helpful summary of all the keyboard shortcuts. Another
menu item can be used for opening the word list as an alternative to the
<kbd>Alt</kbd> + <kbd>W</kbd> keyboard shortcut.


## What Built-In Dictionary Does It Use?
Zhongwen comes with a recent release of the CC-CEDICT dictionary. This dictionary is
constantly updated, and each Zhongwen release will include an updated version of the
dictionary.


## Support for Online Dictionaries
Sometimes, in addition to looking at the translation in the pop-up window, you might
want to look up a word in one of the freely available online dictionaries. Zhongwen
lets you quickly do that by some simple keyboard shortcuts.

* <kbd>Alt</kbd> + <kbd>1</kbd> looks up the selected word using [LINE Dict](https://dict.naver.com/linedict/zhendict).
* <kbd>Alt</kbd> + <kbd>2</kbd> lets you look up the pronunciation on [Forvo](https://forvo.com).
* <kbd>Alt</kbd> + <kbd>3</kbd> takes you to [Dict.cn](https://dict.cn).
* <kbd>Alt</kbd> + <kbd>4</kbd> uses [iCIBA](https://www.iciba.com).
* <kbd>Alt</kbd> + <kbd>5</kbd> looks up the word in the [MDBG dictionary](https://mdbg.net).
* <kbd>Alt</kbd> + <kbd>6</kbd> takes you to [JuKuu](https://jukuu.com).
* <kbd>Alt</kbd> + <kbd>7</kbd> takes you to [MoeDict](https://moedict.tw).
* <kbd>T</kbd> is for looking up example sentences at [Tatoeba](https://tatoeba.org).

Your browser will open a new tab and the word that was shown in the pop-up window
will be looked up in the corresponding online dictionary listed above.


## More Options
Zhongwen also has an options page which allows you to configure certain aspects
of its behavior. In order to get there just right-click on the Zhongwen logo
in the upper right-hand corner of the browser and choose "Options". A new tab
will open showing you all the available options with a brief explanation of
each one.

## Development

To build the add-on:

```
$ git clone git@github.com:ig3/zhongwen.git
$ cd zhongwen
$ npm install
$ npm run build
```

This will produce a zip file in web-ext-artifacts, ending with the version
of the add-on. This can be uploaded to Mozilla for signing or installed to
Firefox add-on manager, Install Add-on from file...

### Updating the dictionary

```
$ npm run update-cedict
```

## Legal
This program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License, Version 2, June 1991
as published by the Free Software Foundation

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

---

*Copyright (C) 2023 Ian Goodacre*
*Copyright (C) 2019 Christian Schiller*
