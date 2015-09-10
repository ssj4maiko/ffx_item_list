# Final Fantasy X - Item List

This is a list using a gamefaqs Item FAQ as the DB.

This dynamic list lets you:
- Search items by Item Name, Aeon Ability, Weapon Customization Ability and Monster Drops/Steal/Bribe
- You can "copy" your result to a Scrap area. This will also save your results on your browser and auto load them when you reapen the page.
- In case you want to change browsers, a "save state" textarea will let you copy somewhere else and load it.
- There are probably mistakes thanks to me not checking every item available for errors.
- The DB is reworkable, though you may need the right source and do a few modifications. Instructions below

Everything is completely front-end, so you don't need any complex server, just open the files in your browser or if someone decide to host them. I used dropbox myself, worked flawlessly.

Files:
- FX_item_list - The list that you want
- FFX_DB_maker - If you want to remake the DB files
- _*.json - The DB itself

To remake the DB, you need the txt file (printable version) located on http://www.gamefaqs.com/ps3/643146-final-fantasy-x-x-2-hd-remaster/faqs/4458 .

Then using a text editor, delete all Character Headers like:

\------------------------------------------------------------------------------

&nbsp;                                     A

\------------------------------------------------------------------------------

Then turn on your console log, run the script and check for errors. There are a few mistakes, like using "-" instead of "=", and you need to correct from the file, some of the logs should give you the consecutive numbers, those are the lines from the text file, so you can easily locate them. There are not many of them, and when it runs everything, there will be buttons so you can download and rewrite the whole DB easily.

Live demo:

DB Maker - https://dl.dropboxusercontent.com/u/33510176/KHBBS/FFX.html

Item List - https://dl.dropboxusercontent.com/u/33510176/KHBBS/FF10.html
