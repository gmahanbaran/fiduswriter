/* A class that holds information about images uploaded by the user. */

export class ImageDB {
    constructor(userId) {
        this.userId = userId
        this.db = {}
        this.cats = []
    }

    getDB(callback) {
        let that = this
        this.db = {}
        this.cats = []

        $.activateWait()

        $.ajax({
            url: '/usermedia/images/',
            data: {
                'owner_id': this.userId
            },
            type: 'POST',
            dataType: 'json',
            success: function (response, textStatus, jqXHR) {
                that.cats = response.imageCategories
                for (let i = 0; i < response.images.length; i++) {
                    response.images[i].image = response.images[i].image.split('?')[0]
                    that.db[response.images[i]['pk']] = response.images[i]
                }
                if (callback) {
                    callback()
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.addAlert('error', jqXHR.responseText)
            },
            complete: function () {
                $.deactivateWait()
            }
        })

    }

    createImage(postData, callback) {
        let that = this
        $.activateWait();
        $.ajax({
            url: '/usermedia/save/',
            data: postData,
            type: 'POST',
            dataType: 'json',
            success: function (response, textStatus, jqXHR) {
                if (that.displayCreateImageError(response.errormsg)) {
                    that.db[response.values.pk] = response.values
                    $.addAlert('success', gettext('The image has been uploaded'));
                    callback(response.values.pk)
                } else {
                    $.addAlert('error', gettext(
                        'Some errors are found. Please examine the form.'
                    ));
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $.addAlert('error', jqXHR.responseText);
            },
            complete: function () {
                $.deactivateWait();
            },
            cache: false,
            contentType: false,
            processData: false
        });
    }

    displayCreateImageError(errors) {
        let noError = true;
        for (let e_key in errors) {
            e_msg = '<div class="warning">' + errors[e_key] + '</div>';
            if ('error' == e_key) {
                jQuery('#createimage').prepend(e_msg);
            } else {
                jQuery('#id_' + e_key).after(e_msg);
            }
            noError = false;
        }
        return noError;
    }

}