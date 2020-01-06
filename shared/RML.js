frb.rml = {

    post: function() {
        /* Create the iframe for the form and use it as the form's target */
        var frameName = 'remindFrame';
        var $form = $('#frb-rml-form');
        if ( $("iframe[name=" + frameName + "]").length === 0 ) {
            var $iframe = $('<iframe style="display: none;" name="' + frameName + '"></iframe>');
            $form.attr("target", $iframe.attr("name"));
            $form.after($iframe);
        }
        $form[0].submit();
    },

    getCurrentDate: function() {
        /* Get current date in correct format for Silverpop */
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; // January is 0!
        var yyyy = today.getFullYear();

        if( dd < 10 ) {
            dd = '0' + dd;
        }
        if( mm < 10 ) {
            mm = '0' + mm;
        }

        return mm+'/'+dd+'/'+yyyy;
    },

    init: function() {
        /* Prep the reminder form */

        var form = document.getElementById('frb-rml-form');
        if ( !form ) return;

        form.rml_country.value    = mw.centralNotice.data.country;
        form.rml_language.value   = mw.centralNotice.data.uselang;
        form.rml_submitDate.value = frb.rml.getCurrentDate();
        form.rml_segment.value    = Math.floor((Math.random() * 100) + 1);

        $('.frb-rml-link').click(function() {
            $('.frb-rml-form').toggle();
            $('#frb-rml-email').focus();
        });

        $('#frb-rml-submit').click(function() {
            if ( mw.util.validateEmail( form.Email.value ) ) {
                frb.rml.post();
                $('.frb-rml-form, .frb-rml-link').hide();
                $('.frb-rml-ty').show();
                mw.centralNotice.internal.hide.setHideWithCloseButtonCookies(); // Hide future banners for 7 days
                return false;
            } else {
                $('#frb-rml-email').addClass('error').focus();
                $('.frb-rml-error').show();
                return false;
            }
        });
    }

};

$(function() {
    mw.loader.using(['mediawiki.util']).then(function() {
        frb.rml.init();
    });
});