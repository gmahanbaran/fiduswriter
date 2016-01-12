// Update UI (adapted from ProseMirror's src/menu/update.js)

const MIN_FLUSH_DELAY = 200
const UPDATE_TIMEOUT = 200

const BLOCK_LABELS = {
  'paragraph': gettext('Normal Text'),
  'heading_1': gettext('1st Heading'),
  'heading_2': gettext('2nd Heading'),
  'heading_3': gettext('3rd Heading'),
  'heading_4': gettext('4th Heading'),
  'heading_5': gettext('5th Heading'),
  'heading_6': gettext('6th Heading'),
  'code_block': gettext('Code')
}

export class UpdateUI {
  constructor(pm, events) {
    this.pm = pm

    this.mustUpdate = false
    this.updateInfo = null
    this.timeout = null
    this.lastFlush = 0
    this.placeHolderCss = ''

    this.events = events.split(" ")
    this.onEvent = this.onEvent.bind(this)
    this.force = this.force.bind(this)
    this.events.forEach(event => pm.on(event, this.onEvent))
    pm.on("flushed", this.onFlushed = this.onFlushed.bind(this))
    this.updateUI()
  }

  detach() {
    clearTimeout(this.timeout)
    this.events.forEach(event => this.pm.off(event, this.onEvent))
    this.pm.off("flush", this.onFlush)
    this.pm.off("flushed", this.onFlushed)
  }

  onFlushed() {
    let now = Date.now()
    if (this.mustUpdate && (now - this.lastFlush) >= MIN_FLUSH_DELAY) {
      this.lastFlush = now
      clearTimeout(this.timeout)
      this.mustUpdate = false
      this.updateUI()
    }
  }

  onEvent() {
    this.mustUpdate = true
    clearTimeout(this.timeout)
    this.timeout = setTimeout(this.force, UPDATE_TIMEOUT)
  }

  force() {
    if (this.pm.operation) {
      this.onEvent()
    } else {
      this.mustUpdate = false
      this.updateInfo = null
      this.lastFlush = Date.now()
      clearTimeout(this.timeout)
      this.updateUI()
    }
  }

  updateUI() {
    /* Fidus Writer code */

    // We count on the this precise order in all documents.
    let nodes = {
        'title': this.pm.doc.firstChild,
        'subtitle': this.pm.doc.child(1),
        'authors': this.pm.doc.child(2),
        'abstract': this.pm.doc.child(3),
        'keywords': this.pm.doc.child(4),
        'contents': this.pm.doc.child(5)
    }

    let documentTitle = nodes.title.textContent

        if (documentTitle.length === 0) {
            documentTitle = gettext('Untitled Document')
        }
        jQuery('title').html('Fidus Writer - ' + documentTitle)
        jQuery('#header h1').html(documentTitle)

    let marks = this.pm.activeMarks()
    let strong = marks.some(function(mark){return (mark.type.name==='strong')})

    if (strong) {
        jQuery('#button-bold').addClass('ui-state-active')
    } else {
        jQuery('#button-bold').removeClass('ui-state-active')
    }

    let em = marks.some(function(mark){return (mark.type.name==='em')})

    if (em) {
        jQuery('#button-italic').addClass('ui-state-active')
    } else {
        jQuery('#button-italic').removeClass('ui-state-active')
    }

    let link = marks.some(function(mark){return (mark.type.name==='link')})

    if (link) {
        jQuery('#button-link').addClass('ui-state-active')
    } else {
        jQuery('#button-link').removeClass('ui-state-active')
    }

    /* Block level selector */
    if (this.pm.selection.head) {
        var headPath = this.pm.selection.head.path,
        anchorPath = this.pm.selection.anchor.path
    } else {
        var headPath = this.pm.selection.from.path,
        anchorPath = this.pm.selection.to.path
    }

    var headElement = this.pm.doc.path([headPath[0]]),
    anchorElement = this.pm.doc.path([anchorPath[0]])

    this.calculatePlaceHolderCss(headElement, nodes);

    if (headElement !== anchorElement) {
        /* Selection goes across document parts */
        jQuery('.editortoolbar button').addClass('disabled')
        jQuery('#block-style-label').html('')

    } else {

        switch (headElement) {
            case nodes.title:
                jQuery('.edit-button').addClass('disabled')
                jQuery('#block-style-label').html('')
                jQuery('#current-position').html(gettext('Title'))
                break
            case nodes.subtitle:
                jQuery('.edit-button').addClass('disabled')
                jQuery('#block-style-label').html('')
                jQuery('#current-position').html(gettext('Subtitle'))
                break
            case nodes.authors:
                jQuery('.edit-button').addClass('disabled')
                jQuery('#block-style-label').html('')
                jQuery('#current-position').html(gettext('Authors'))
                break
            case nodes.keywords:
                jQuery('.edit-button').addClass('disabled')
                jQuery('#block-style-label').html('')
                jQuery('#current-position').html(gettext('Keywords'))
                break
            case nodes.abstract:
                jQuery('.edit-button').removeClass('disabled')
                jQuery('#button-figure').addClass('disabled')
                jQuery('#current-position').html(gettext('Abstract'))

                var blockNodeType = true, blockNode, nextBlockNodeType

                if (_(headPath).isEqual(anchorPath)) {
                  // Selection within a single block.
                  blockNode = this.pm.doc.path(anchorPath)
                  blockNodeType = blockNode.type.name === 'heading' ? blockNode.type.name + '_' + blockNode.attrs.level : blockNode.type.name
                  jQuery('#block-style-label').html(BLOCK_LABELS[blockNodeType])
                } else {
                    this.pm.doc.nodesBetween({path:headPath,offset:0},{path:anchorPath,offset:0}, function(node, path, parent) {
                      if (node.isBlock) {
                        nextBlockNodeType = node.type.name === 'heading' ? node.type.name + '_' + node.attrs.level : node.type.name
                        if (blockNodeType===true) {
                          blockNodeType = nextBlockNodeType
                        }
                        if (blockNodeType!==nextBlockNodeType){
                          blockNodeType = false
                        }


                      }
                    })


                    if (blockNodeType) {
                        jQuery('#block-style-label').html(BLOCK_LABELS[blockNodeType])
                    } else {
                        jQuery('#block-style-label').html('')
                    }
                }

                break
            case nodes.contents:
            jQuery('.edit-button').removeClass('disabled')
            jQuery('#button-figure').addClass('disabled')
            jQuery('#current-position').html(gettext('Body'))

            var blockNodeType = true, blockNode, nextBlockNodeType

            if (_(headPath).isEqual(anchorPath)) {
              // Selection within a single block.
              blockNode = this.pm.doc.path(anchorPath)
              blockNodeType = blockNode.type.name === 'heading' ? blockNode.type.name + '_' + blockNode.attrs.level : blockNode.type.name
              jQuery('#block-style-label').html(BLOCK_LABELS[blockNodeType])
            } else {
                this.pm.doc.nodesBetween({path:headPath,offset:0},{path:anchorPath,offset:0}, function(node, path, parent) {
                  if (node.isBlock) {
                    nextBlockNodeType = node.type.name === 'heading' ? node.type.name + '_' + node.attrs.level : node.type.name
                    if (blockNodeType===true) {
                      blockNodeType = nextBlockNodeType
                    }
                    if (blockNodeType!==nextBlockNodeType){
                      blockNodeType = false
                    }


                  }
                })


                if (blockNodeType) {
                    jQuery('#block-style-label').html(BLOCK_LABELS[blockNodeType])
                } else {
                    jQuery('#block-style-label').html('')
                }
            }

            break
        }
    }


    return true;
  }

  /** Show or hide placeholders ('Contents...', 'Title...', etc.) depending on
  whether these elements are empty or not.*/
  calculatePlaceHolderCss (headElement, nodes) {
    var newPlaceHolderCss = ''
    for (var elementType of [
      {'type': 'title', 'selector': '#document-title', 'placeholder': gettext('Title...')},
      {'type': 'subtitle', 'selector': '#metadata-subtitle', 'placeholder': gettext('Subtitle...')},
      {'type': 'authors', 'selector': '#metadata-authors', 'placeholder': gettext('Authors...')},
      {'type': 'abstract', 'selector': '#metadata-abstract', 'placeholder': gettext('Abstract...')},
      {'type': 'keywords', 'selector': '#metadata-keywords', 'placeholder': gettext('Keywords...')},
      {'type': 'contents', 'selector': '#document-contents', 'placeholder': gettext('Body...')}
    ]) {
      if (nodes[elementType.type].textContent.length === 0 &&
          (headElement != nodes[elementType.type] || !this.pm.hasFocus())) {
          newPlaceHolderCss += elementType.selector + ':before {content: "' +
              elementType.placeholder + '"}\n';
      }
    }
    if (this.placeHolderCss !== newPlaceHolderCss) {
      this.placeHolderCss = newPlaceHolderCss
      jQuery('#placeholderStyles')[0].innerHTML = newPlaceHolderCss;
    }
  }
}