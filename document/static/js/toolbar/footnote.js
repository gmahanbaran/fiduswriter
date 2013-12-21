/**
 * @copyright This file is part of <a href='http://www.fiduswriter.org'>Fidus Writer</a>.
 *
 * Copyright (C) 2013 Takuto Kojima, Johannes Wilm.
 *
 * @license This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <a href='http://www.gnu.org/licenses'>http://www.gnu.org/licenses</a>.
 *
 */

// toolbar footnote
(function (jQuery) {
    return jQuery.widget("IKS.toolbarfootnote", {
        options: {
            editable: null,
            uuid: "",
            link: true,
            image: true,
            butonCssClass: null
        },
        populateToolbar: function (toolbar) {
            var buttonize, buttonset, widget, _this = this;
            widget = this;
            buttonset = $.Fidus.buttonset.prototype.createButtonset.call(this, widget.widgetName, 1);
            buttonize = function (type) {
                var button, id;
                id = "" + _this.options.uuid + "-" + type;
                button = jQuery('<button></button>');
                button.makebutton({
                    label: 'Footnote',
                    icon: 'icon-footnote',
                    editable: _this.options.editable,
                    command: 'footnote',
                    queryState: false,
                    uuid: _this.options.uuid,
                    cssClass: _this.options.buttonCssClass
                });
                button.attr('class', 'fw-button fw-light fw-large fw-square');
                buttonset.append(button);
                button.bind("click", function (event) {
                    var range, selection, fn, startContainer, innerFootnote, scrollView;
                    // The tracker gets a range created with rangy rather than the native browser version

                    selection = rangy.getSelection();
                    range = selection.getRangeAt(0);

                    startContainer = range.startContainer;
                    if (jQuery(startContainer).closest('.pagination-footnote > span').length > 0) {
                        // If user is trying to create a footnote inside another footnote, we stop.
                        return false;
                    }
                    fn = document.createDocumentFragment();
                    
                    innerFootnote = document.createElement('br')
                    
                    fn.appendChild(innerFootnote);
                    
                    fn = nodeConverter.createFootnoteView(fn);
                    
                    // Make sure to get out of any track changes node if tracking is disabled.
                    range = dom.noTrackIfDisabled(range);
                    // Make sure to get out of any citation node.
                    range = dom.noCitationOrLinkNode(range);
                    // Insert the footnote
                    manualEdits.insert(fn, range);
                    if (nodeConverter.beforeFootnote) {
                        fn.parentNode.insertBefore(nodeConverter.beforeFootnote(), fn);
                    }
                    nodeConverter.redoFootnotes();

                    range.selectNodeContents(innerFootnote);
                    range.collapse();
                    selection = rangy.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);

                    scrollView = function () {
                        innerFootnote.scrollIntoView();
                    }
                    // We wait for the footnote to be created before we scroll to it.
                    setTimeout(scrollView, 1);

                    return true;
                });
                return true;
            };
            buttonize("FOOTNOTE");
            buttonset.hallobuttonset();
            return toolbar.append(buttonset);
        },
        _init: function () {}
    });
})(jQuery);