/* MediaWiki:FundraisingBanners/CoreJS-2018.js
 * Core code for banner forms, with new inline error messages
 */

var frb = frb || {};
frb.loadedTime = Date.now();
frb.didSelectAmount = false;

frb.optinRequiredCountries = 
    [ 'AT', 'BE', 'DK', 'ES', 'FR', 'GB', 'HU', 'IE', 'IT', 'LU', 
      'LV', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SK', 'UA' ];
frb.optinRequired = frb.optinRequiredCountries.indexOf(mw.centralNotice.data.country) !== -1;

frb.maxUSD = 12000;

/**
 * Main function to submit to paymentswiki
 *
 * @param  {Object} options
 * - method (required)
 * - submethod (optional)
 * - gateway (optional)
 * - ffname (optional)
 * - skipValidation (optional boolean, for pp-usd. Not yet implemented.)
 * @param  {Boolean} isEndowment
 */
frb.submitForm = function(options, isEndowment) {

    var uri = new mw.Uri('https://payments.wikimedia.org/index.php/Special:GatewayFormChooser');
    var params = {};

    if ( !frb.validateForm( options ) ) {
        frb.extraData.validateError = 1; // Flag they had an error, even if fixed later
        return false; // Error, bail out of submitting
    }

    /* Form selection data */
    params.payment_method = options.method;
    if ( options.submethod ) {
        params.payment_submethod = options.submethod;
    }
    if ( options.gateway ) {
        params.gateway = options.gateway;
    }
    if ( options.ffname ) {
        params.ffname = options.ffname;
    }
    if ( options.variant ) {
        params.variant = options.variant;
    }
    params.recurring = frb.getRecurring();

    params.currency_code = frb.getCurrency(mw.centralNotice.data.country) || 'USD';

    params.uselang = mw.centralNotice.data.uselang || 'en';
    params.country = mw.centralNotice.data.country || 'XX';

    if ( params.uselang === 'pt' && params.country === 'BR' ) {
        params.uselang = 'pt-br';
    }
    if ( params.uselang === 'es' &&
        ( params.country === 'AR' || params.country === 'CL' ||
          params.country === 'CO' || params.country === 'MX' ||
          params.country === 'PE' || params.country === 'UY' )
    ) {
        params.uselang = 'es-419';
    }

    /* Adyen override. frb.ccAdyenCountries is defined in LocalizeJS-2017.js */
    if ( params.payment_method === 'cc' && frb.ccAdyenCountries.indexOf( params.country ) !== -1 ) {
        params.gateway = 'adyen';
    }

    /* Amount */
    var amount = frb.getAmount();
    if ( $('#frb-ptf-checkbox').prop('checked') ) {
        amount = amount + frb.calculateFee(amount);
        frb.extraData.ptf = 1;
    }
    params.amount = amount;

    /* Email optin */
    if ( $('input[name="opt_in"]').length > 0 ) {
        var opt_inValue = $('input[name="opt_in"]:checked').val();
        params.opt_in   = opt_inValue; // frb.validateForm() already checked it's 1 or 0
    }

    /* Tracking info */
    if ( isEndowment ) {
        params.utm_medium = 'endowment';
        params.appeal = 'EndowmentQuote';
    } else {
        params.utm_medium = 'sitenotice';
    }
    params.utm_campaign = mw.centralNotice.data.campaign || 'test';
    params.utm_source   = frb.buildUtmSource(params);

    frb.extraData.vw = window.innerWidth;
    frb.extraData.vh = window.innerHeight;
    frb.extraData.time = Math.round( (Date.now() - frb.loadedTime)/1000 );

    if ( !$.isEmptyObject( frb.extraData ) ) {
        params.utm_key = frb.buildUtmKey( frb.extraData );
    }

    /* Link to Banner History if enabled */
    var mixins = mw.centralNotice.getDataProperty( 'mixins' );
    if ( mixins && mixins.bannerHistoryLogger ) {
        params.bannerhistlog = mw.centralNotice.bannerHistoryLogger.id;
    }

    uri.extend(params);

    if ( mixins && mixins.bannerHistoryLogger ) {
        mw.centralNotice.bannerHistoryLogger.ensureLogSent().always(function() {
            frb.goToPayments( uri );
        });
    } else {
        frb.goToPayments( uri );
    }

};

frb.goToPayments = function( uri ) {
    if ( window.top !== window.self ) {
        // banner is in a frame, open payments in a new tab
        window.open( uri.toString() );
    } else {
        window.location.href = uri.toString();
    }
}

/**
 * Check the form for errors.
 * Called on submission, can also be called on input.
 */
frb.validateForm = function( options ) {
    var error = false;

    /* Reset all errors */
    $('.frb-haserror').removeClass('frb-haserror');
    $('.frb-error').hide();

    if ( !options.method ) {
        error = true;
        $('.frb-methods').addClass('frb-haserror');
        $('.frb-error-method').show();
    }

    if ( !frb.validateAmount() ) {
        error = true;
    }

    /* Email optin */
    if ( frb.optinRequired && $('.frb-optin').is(':visible') ) {
        var opt_inValue = $('input[name="opt_in"]:checked').val();
        if ( opt_inValue !== '1' && opt_inValue !== '0' ) {
            $('.frb-optin').addClass('frb-haserror');
            $('.frb-error-optin').show();
            error = true;
        }
    }

    return !error;
};

/**
 * Check if selected amount is valid i.e. a positive number, between minimum and maximum.
 * If not, show an error and return false.
 */
frb.validateAmount = function() {

    var amount = frb.getAmount();
    var currency  = frb.getCurrency( mw.centralNotice.data.country );
    var minAmount = frb.amounts.minimums[ currency ];

    if ( amount === null || isNaN(amount) || amount <= 0 || amount < minAmount ) {
        $('fieldset.frb-amounts').addClass('frb-haserror');
        $('.frb-error-bigamount').hide();
        $('.frb-error-smallamount').show();
        return false;
    } else if ( amount > frb.maxUSD * minAmount ) {
        $('fieldset.frb-amounts').addClass('frb-haserror');
        $('.frb-error-bigamount').show();
        return false;
    } else {
        $('fieldset.frb-amounts').removeClass('frb-haserror');
        $('.frb-error-smallamount, .frb-error-bigamount').hide();
        return true;
    }
};

/**
 * Build the utm_source for analytics.
 *
 * Own function so it can be overriden for weird tests
 *
 * @param  {Object} params
 * @return {string} utm_source
 */
frb.buildUtmSource = function(params) {

    var utm_source;
    var fullDottedPaymentMethod = params.payment_method;
    if ( params.recurring ) {
        fullDottedPaymentMethod = 'r' + fullDottedPaymentMethod;
    }
    if ( params.payment_submethod ) {
        fullDottedPaymentMethod = fullDottedPaymentMethod + '.' + params.payment_submethod;
    }

    utm_source = mw.centralNotice.data.banner;

    // Keeping opt-in in utm_source for safety for now
    // Eventually remove it, or move to utm_key?
    if ( params.opt_in ) {
        utm_source += '_optIn' + params.opt_in;
    }

    utm_source += '.no-LP.' + fullDottedPaymentMethod;

    return utm_source;
};

/**
 * Build a string for utm_key from extra tracking data
 *
 * @param  {Object} data
 * @return {string} utm_key
 */
frb.buildUtmKey = function(data) {
    var dataArray = [];
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            dataArray.push( key + '_' + data[key] );
        }
    }
    return dataArray.join('~');
};

/**
 * Determine if we should show recurring choice on step 2
 * @param  {Object} options     Including method and optional gateway
 * @param  {String} country
 * @return {boolean}
 */
frb.shouldShowRecurring = function(options, country) {

    if ( frb.noRecurringCountries.indexOf( country ) !== -1 ) { // Defined in LocalizeJS-2017.js
        return false;
    }
    if ( options.method === 'paypal' ) {
        return true;
    }
    if ( options.method === 'cc' ) {
        if ( options.gateway === 'adyen' || frb.ccAdyenCountries.indexOf( country ) !== -1 ) { // Defined in LocalizeJS-2017.js
            return false;
        } else {
            return true;
        }
    }
    return false;
};

/* Is recurring method selected? This function can be overriden for different forms */
frb.getRecurring = function() {
    var form = document.getElementById('frb-form');
    return form.frequency.value === 'monthly';
};

/* Return amount selected */
frb.getAmount = function() {
    var form = document.getElementById('frb-form');
    var amount = null;
    frb.extraData.otherAmt = 0;

    // If there are some amount radio buttons, then look for the checked one
    if (form.amount) {
        for (var i = 0; i < form.amount.length; i++) {
            if (form.amount[i].checked) {
                amount = form.amount[i].value;
            }
        }
    }

    // Check the "other" amount box
    if (form.otherAmount.value !== '') {
        var otherAmount = form.otherAmount.value;
        otherAmount = otherAmount.replace(/[,.](\d)$/, ':$10');
        otherAmount = otherAmount.replace(/[,.](\d)(\d)$/, ':$1$2');
        otherAmount = otherAmount.replace(/[$£€¥,.]/g, '');
        otherAmount = otherAmount.replace(/:/, '.');
        amount = otherAmount;
        frb.extraData.otherAmt = 1;
    }

    amount = parseFloat(amount);

    if ( isNaN(amount) ) {
        return 0;
    } else {
        return amount;
    }

};

/* Localize the amount errors. Call when initialising banner. */
frb.localizeErrors = function() {
    var currency  = frb.getCurrency( mw.centralNotice.data.country );
    var minAmount = frb.amounts.minimums[ currency ];

    $('.frb-error-smallamount').text( function( index, oldText ) {
        return oldText.replace( '$1', minAmount + ' ' + currency );
    });

    if ( currency === 'USD' ) {
        // we don't need to include the conversion
        $('.frb-error-bigamount').text( function( index, oldText ) {
            return oldText.replace( '($1 $2) ', '' )
                          .replace( '($1&nbsp;$2) ', '' );
        });
    }

    $('.frb-error-bigamount').text( function( index, oldText ) {
        return oldText.replace( '$1', frb.maxUSD * minAmount )
                      .replace( '$2', currency )
                      .replace( '$3', 'benefactors@wikimedia.org' )
                      .replace( '$4', frb.maxUSD );
    });
};

/**
 * Shared code for amount input handling
 */
frb.initAmountOptions = function() {

    // Reset "Other" input if user clicks a preset amount
    $('#frb-form [id^=frb-amt-ps]').click(function() {
        $('#frb-amt-other-input').val('');
    });

    // Track if they selected and then later changed amount
    // Only for radios, not for every keystroke in Other and not for PTF
    $('.frb-amounts input[type="radio"]').on('change', function(e) {
        if ( frb.didSelectAmount ) {
            frb.extraData.changedAmt = 1;
        }
        frb.didSelectAmount = true;
    });

    // Block typing non-numerics in input field, otherwise Safari allows them and then chokes
    // https://phabricator.wikimedia.org/T118741, https://phabricator.wikimedia.org/T173431
    var blockNonNumeric = function(e) {
        // Allow special keys in Firefox
        if ((e.code == 'ArrowLeft') || (e.code == 'ArrowRight') ||
            (e.code == 'ArrowUp') || (e.code == 'ArrowDown') ||
            (e.code == 'Delete') || (e.code == 'Backspace')) {
            return;
        }
        var chr = String.fromCharCode(e.which);
        if ("0123456789., ".indexOf(chr) === -1) {
            return false;
        }
    };
    $('#frb-amt-other-input').on('keypress', blockNonNumeric);
    $('#frb-amt-monthly-other-input').on('keypress', blockNonNumeric);

};

/**
 * Calculate approximate transaction fee on given amount
 * @param  {number} amount
 * @return {number}        Rounded to 2 decimal places
 */
frb.calculateFee = function(amount) {
    var currency = frb.getCurrency(mw.centralNotice.data.country),
        feeMultiplier = 0.04,
        feeMinimum = frb.amounts.feeMinimums[currency] || 0.35,
        feeAmount = amount * feeMultiplier;

    if ( feeAmount < feeMinimum ) {
      feeAmount = feeMinimum;
    }
    return parseFloat(feeAmount.toFixed(2));
};

frb.updateFeeDisplay = function() {
    var currency = frb.getCurrency(mw.centralNotice.data.country),
        language = mw.centralNotice.data.uselang,
        amount, feeAmount, totalAmount;

    amount = frb.getAmount();
    feeAmount = frb.calculateFee(amount);
    if ( $('#frb-ptf-checkbox').prop('checked') ) {
        totalAmount = amount + feeAmount;
    } else {
        totalAmount = amount;
    }

    var feeAmountFormatted = frb.formatCurrency(currency, feeAmount, language);
    $('.frb-ptf-fee').text(feeAmountFormatted);

    var totalAmountFormatted = frb.formatCurrency(currency, totalAmount, language);
    $('.frb-ptf-total').text(totalAmountFormatted);

    $('.frb-ptf').slideDown();
};

/** Debug function to highlight dynamically replaced elements */
frb.highlightReplacements = function() {
    $('.frb [class^="frb-replace"], .frb-ptf-fee, .frb-ptf-total, .frb-upsell-ask').css('background-color', '#fa0');
};

/* End of MediaWiki:FundraisingBanners/CoreJS-2018.js */