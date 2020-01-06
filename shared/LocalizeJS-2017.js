/* == MediaWiki:FundraisingBanners/LocalizeJS-2017.js == */

/**
 * Get the currency for a given country
 *
 * NOTE: The following currency mapping is WMF-specific based on payment
 * provider availability, NOT necessarily the official currency of the country
 *
 * @param  {string} country code
 * @return {string} currency code
 */
frb.getCurrency = function(country) {
    switch ( country ) {
        // Big 6
        case 'US': return 'USD';
        case 'CA': return 'CAD';
        case 'GB': return 'GBP';
        case 'IE': return 'EUR';
        case 'AU': return 'AUD';
        case 'NZ': return 'NZD';
        // Euro countries
        case 'AT':
        case 'BE':
        case 'ES':
        case 'FR':
        case 'IE':
        case 'IT':
        case 'LU':
        case 'LV':
        case 'NL':
        case 'PT':
        case 'SK':
            return 'EUR';
        // Others
        case 'DK': return 'DKK';
        case 'HU': return 'HUF';
        case 'IL': return 'ILS';
        case 'IN': return 'INR';
        case 'JP': return 'JPY';
        case 'MY': return 'MYR';
        case 'NO': return 'NOK';
        case 'PL': return 'PLN';
        case 'RO': return 'RON';
        case 'SE': return 'SEK';
        case 'UA': return 'UAH';
        case 'ZA': return 'ZAR';
        // Latin America
        case 'BR': return 'BRL';
        case 'AR': return 'ARS';
        case 'CL': return 'CLP';
        case 'CO': return 'COP';
        case 'MX': return 'MXN';
        case 'PE': return 'PEN';
        case 'UY': return 'UYU';
        // Fall back to USD
        default:
            return 'USD';
    }
};

/**
 * Format a currency value
 *
 * @param  {string} currency code. Leave undefined to get without symbol.
 * @param  {number} amount
 * @param  {string} language code
 * @return {string} formatted string e.g. '$3', '£5', '10 €'
 */
frb.formatCurrency = function(currency, amount, language) {

    var locale, formatterOptions, formatter, fmAmount;

    if (isNaN(amount) || amount === '') {
        // Not a number, it's probably the 'other' string or box
        // TODO: better way of doing this?
        fmAmount = amount;
    } else {
        if (window.Intl && typeof window.Intl === 'object') {
            // Use this for fancy number formatting - thousands separators etc
            locale = language + '-' + Geo.country;
            if ( amount % 1 !== 0 ) { // Not a whole number
                formatterOptions = { minimumFractionDigits: 2 };
            } else {
                formatterOptions = {};
            }
            formatter = new Intl.NumberFormat(locale, formatterOptions);
        } else {
            // Bad browser. Just do the basics: 2 decimal places if needed, or none
            formatter = {};
            formatter.format = function(number) {
                if ( amount % 1 !== 0 ) { // Not a whole number
                    return number.toFixed(2);
                } else {
                    return number.toString();
                }
            };
        }
        fmAmount = formatter.format(amount);
    }

    // No symbol needed
    if ( currency === undefined ) {
        return fmAmount;
    }

    // Better dive into the formatting object
    if ( frb.currencyFormats[currency] === undefined ) {
        return currency + '&nbsp;' + fmAmount;
    }
    if ( frb.currencyFormats[currency] instanceof Object ) { // not a string
        if ( frb.currencyFormats[currency][language] !== undefined ) {
            return frb.currencyFormats[currency][language].replace('\t', fmAmount);
        }
        return frb.currencyFormats[currency]['default'].replace('\t', fmAmount);
    }

    return frb.currencyFormats[currency].replace('\t', fmAmount);
};


/*
 * Select the correct amount or array of amounts from object in "source"
 *
 * @param {Object} source   - the amounts data object e.g. frb.amounts.options7, frb.amounts.averages
 * @param {string} currency - ISO code of currency
 * @param {string} country  - ISO code of country (optional)
 * @return {array/number}   - depending on source
 */
frb.pickAmounts = function(source, currency, country) {

    if ( source[currency]['default'] ) { // we need to go deeper
        if ( source[currency][country] !== undefined ) {
            return source[currency][country];
        } else {
            return source[currency]['default'];
        }
    } else {
        return source[currency];
    }
};

/* Credit card types so we can show the correct logos */
frb.cardTypes = {
    // Big 6
    'US' : 'vmad',
    'CA' : 'vma',
    'GB' : 'vmaj',
    'IE' : 'vmaj',
    'AU' : 'vmaj',
    'NZ' : 'vma',
    // Euro countries
    'AT' : 'vmaj',
    'BE' : 'vmaj',
    'ES' : 'vmaj',
    'FR' : 'CBvma',
    'IT' : 'vmaj',
    'LU' : 'vmaj',
    'LV' : 'vma',
    'NL' : 'vmaj',
    'PT' : 'vmaj',
    'SK' : 'vmaj',
    // Others
    'DK' : 'vma',
    'HU' : 'vma',
    'IL' : 'vmad', // Adyen
    'JP' : 'vmaj',
    'MY' : 'vmaj',
    'NO' : 'vma',
    'PL' : 'vma',
    'RO' : 'vma',
    'SE' : 'vma',
    'UA' : 'vma', // Adyen
    'ZA' : 'vm'
};

/**
 * Display the correct payment methods for current country
 *
 * Methods should be labeled with class 'frb-pm-xxxx'
 * TODO: clean this function up more
 *
 * @param  {string} country
 */
frb.localizeMethods = function(country) {

    // Hide recurring completely for some countries
    if ( frb.noRecurringCountries.indexOf(country) !== -1 ) {
        $('.frb-frequency, .recurring-details').hide();
    }

    // Remove any leftover WorldPay and Adyen
    $('.frb-pm-cc-wp').remove();
    $('.frb-pm-cc-adyen').remove();

    // Countries using Adyen for credit card
    if ( frb.ccAdyenCountries.indexOf( country ) !== -1 ) {
        $('.frb-pm-cc').addClass('no-monthly');
    }

    // Countries with no PayPal option
    var noPP = ['IN', 'RU', 'SG', 'AE', 'QA', 'OM', 'BD', 'BO', 'PA',
                'PY', 'GT', 'JM', 'TT', 'DZ'];
    if ($.inArray(country, noPP) !== -1) {
        $('.frb-pm-pp').remove();
        $('.frb-pm-pp-usd').remove();
    }

    // Countries with no PayPal for mobile only - https://phabricator.wikimedia.org/T173001
    var noPPmobile = ['PH', 'ID', 'TH', 'KR', 'MY', 'VN'];
    var mobileRegex = /(_mob_|_ipd_|_m_)/;
    if ($.inArray(country, noPPmobile) !== -1) {
        if (mw.centralNotice.data.banner.search(mobileRegex) !== -1) {
            $('.frb-pm-pp').remove();
            $('.frb-pm-pp-usd').remove();
        }
    }

    // Countries where PayPal must be in USD
    var ppUSD = ['BG', 'HR', 'LT', 'MK', 'RO', 'UA', 'SA', 'CN', 'ID', 'KR',
                 'KZ', 'MY', 'VN', 'AR', 'CL', 'DO', 'CO', 'NI', 'UY', 'ZA',
                 'BH', 'LB', 'VE', 'TR', 'IS', 'BA', 'MV', 'BB', 'BM', 'BZ',
                 'CR', 'CW', 'SX', 'HN', 'KN', 'DM', 'AG', 'LC', 'GD', 'FJ',
                 'TN', 'BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG', 'BR',
                 'PE'];
    if ($.inArray(country, ppUSD) !== -1) {
        $('.frb-pm-pp').remove();
        $('.frb-pm-pp-usd').show();
    } else {
        $('.frb-pm-pp').show();
        $('.frb-pm-pp-usd').remove();
    }

    // Show any extra local payment methods, or remove them if not needed
    var extrapaymentmethods = {
        'amazon'   : ['US'],
        'bpay'     : [],
        'ideal'    : ['NL'],
        'bt'       : ['BR', 'AR', 'CO', 'CL', 'IN'], // Bank Transfer (Astropay)
        'cash'     : ['BR', 'MX', 'AR', 'CO', 'UY']  // 'Cash' methods (Astropay)
    };

    // Methods with different labels per country

    var language = mw.config.get('wgUserLanguage');
    var cashTranslation = 'Cash';
    var btTranslation = 'Bank Transfer';

    if (language === 'en') {

        if (country === 'BR') {
            cashTranslation = 'Boletos';
        }
        if (country === 'UY') {
            cashTranslation = 'RedPagos';
        }

    } else if (language === 'pt') {

        if (country === 'BR') {
            btTranslation   = 'Transferência Bancária';
            cashTranslation = 'Boletos';
        }

    } else if (language === 'es') {

        if (country === 'AR') {
            btTranslation   = 'Transferência Bancária';
            cashTranslation = 'Efectivo';
        }
        if (country === 'CL') {
            btTranslation   = 'WebPay';
        }
        if (country === 'CO') {
            btTranslation   = 'PSE Pagos';
            cashTranslation = 'Efectivo';
        }
        if (country === 'MX') {
            cashTranslation = 'Efectivo';
        }
        if (country === 'UY') {
            cashTranslation = 'RedPagos';
        }

    }

    $('.frb-pm-bt button,   .frb-pm-bt label,   button.frb-pm-bt'  ).text( btTranslation );
    $('.frb-pm-cash button, .frb-pm-cash label, button.frb-pm-cash').text( cashTranslation );

    for (var method in extrapaymentmethods) {
        var $methodbutton = $('.frb-pm-' + method);
        if ( $.inArray(country, extrapaymentmethods[method]) !== -1 ) { // country is in the list
            $methodbutton.show();
        } else {
            $methodbutton.remove();
        }
    }

    /* Add card types class to credit card button, so we can show correct logos */
    if ( frb.cardTypes[country] ) {
        $('.frb-pm-cc').addClass('frb-cctypes-' + frb.cardTypes[country] );
    }
};

/**
 * Check scheduled payment method outages and hide buttons if needed
 *
 * Data at https://meta.wikimedia.org/wiki/MediaWiki:FR2013/Resources/PaymentOutages.js
 * Methods should be labeled with class 'frb-pm-xxxx'
 *
 * @param  {string} country code
 */
frb.checkMethodOutages = function(country) {

    // TODO - can we load this a better way?
    {{MediaWiki:FR2013/Resources/PaymentOutages.js}}
    var now = new Date();

    for (var i = outages.length - 1; i >= 0; i--) {
        if ( now > outages[i].start && now < outages[i].end ) {
            if (outages[i].country === undefined || outages[i].country == country) {
                $('.frb-pm-' + outages[i].method).hide();
            }
        }
    }
};

/**
 * Adjust the amount options and their labels
 *
 * Inputs should have id frb-amt-psX where X is the index number (starting from 1)
 *
 * @param  {Object}  source     - object with amounts e.g. frb.amounts.options7
 * @param  {string}  currency   - currency code e.g. 'USD'
 * @param  {string}  country    - country code  e.g. 'FR' Some currencies can have different options per country.
 * @param  {string}  language   - language code e.g. 'en' For symbol formatting
 * @param  {boolean} useSymbols - use currency symbols on labels or not? (3 vs $3)
 */
frb.localizeAmountOptions = function(source, currency, country, language, useSymbols) {

    var amountOptions = frb.pickAmounts(source, currency, country);

    $('#frb-form input[name="amount"]').each(function(index) {
        var $input = $(this);
        var $label = $input.siblings('label');

        var i = $input.attr('id').replace('frb-amt-ps', '');
        var amount = amountOptions[i-1]; // because IDs start from 1

        if ( amount ) {
            $input.val( amount );
            if ( useSymbols ) {
                $label.text( frb.formatCurrency( currency, amount, language) );
            } else {
                $label.text( frb.formatCurrency( undefined, amount, language) );
            }
        }
    });

};

/**
 * Make an element into a link
 *
 * @param  {string} selector    CSS selector for elements to convert to a link
 * @param  {string} baseUrl     URL of link (function will add language parameter)
 */
frb.makeLink = function( selector, baseUrl ) {
    var url = baseUrl + '&language=' + mw.config.get( 'wgUserLanguage' ); // TODO: pt-br and es-419
    $( selector ).each( function() {
        var $link = $( '<a></a>' );
        $link.html( $( this ).html() );
        $link.attr( { href: url, target: '_blank' } );
        $( this ).replaceWith( $link );
    });
};

frb.noRecurringCountries = ['AR', 'CL', 'CO', 'MX', 'PE', 'UY', 'BR', 'IN'];
frb.ccAdyenCountries     = ['FR', 'IL', 'UA'];

/* These countries use potentially ambiguous $ sign.
Use ISO code instead in text (but still $ for buttons) */
frb.textAmountIsoCountries = ['AR', 'CL', 'CO', 'MX'];

$(function() {

    var language = mw.centralNotice.data.uselang;
    var country  = mw.centralNotice.data.country;
    var currency = frb.getCurrency(country);

    // Payment methods
    frb.localizeMethods(country);
    frb.checkMethodOutages(country);

    // Basic replacements
    $('.frb-replace-currencysymbol').text( frb.formatCurrency( currency, '', language ).replace(' ', '') );
    $('.frb-replace-currencycode').text( currency );

    // Country name
    var countryName;
    if ( frb.countryNames[language] ) {
        countryName = frb.countryNames[language][country] || frb.countryNames.en[country];
    } else {
        countryName = frb.countryNames.en[country];
    }
    $('.frb-replace-countryname').text( countryName );

    // Day of week
    var now = new Date();
    var dayNumber = now.getDay();
    var capitalizeText = function( text ) {
        // Capitalize first letter, for use at start of sentence
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    if ( $('.frb-replace-dayofweek, .frb-replace-dayofweek-capitalize').length > 0 ) {
        if ( frb.dayNames[language] ) {
            $('.frb-replace-dayofweek').text( frb.dayNames[language][dayNumber] );
            $('.frb-replace-dayofweek-capitalize').text( capitalizeText( frb.dayNames[language][dayNumber] ) );
        } else {
            console.log('Warning: banner should contain a day of the week, but no translations found.');
        }
    }

    if ( $('.frb-replace-dayofweek-this, .frb-replace-dayofweek-this-capitalize').length > 0 ) {
        if ( frb.dayNamesThis[language] ) {
            $('.frb-replace-dayofweek-this').text( frb.dayNamesThis[language][dayNumber] );
            $('.frb-replace-dayofweek-this-capitalize').text( capitalizeText( frb.dayNamesThis[language][dayNumber] ) );
        } else {
            console.log('Warning: banner should contain "this DAY", but no translations found.');
        }
    }

    // Capitalize
    $('.frb-capitalize').text(function( index, text ) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    });

    // Replace device with iPad if needed
    var ua = navigator.userAgent;
    if ( ua.match( /ipad/i ) ) {
        $('.frb-replace-device').text( frb.iPadTranslations[language] || frb.iPadTranslations.en );
    }

    // Replace %AVERAGE% with formatted "average" amount
    var average = frb.pickAmounts(frb.amounts.averages, currency, country);
    if ( frb.textAmountIsoCountries.indexOf(country) !== -1 ) {
        var avgString = average + '&nbsp;' + currency;
    } else {
        var avgString = frb.formatCurrency(currency, average, language).replace(/\.$/, ''); // strip any period from end for use in running text
    }
    $('.frb').each(function(index){
        var newHtml = $(this).html().replace(/%AVERAGE%/g, avgString );
        $(this).html(newHtml);
    });

    // Replace %MINIMUM% with formatted "if everyone" amount
    var ifEveryone = frb.pickAmounts(frb.amounts.ifEveryone, currency, country);
    if ( frb.textAmountIsoCountries.indexOf(country) !== -1 ) {
        var ifString = ifEveryone + '&nbsp;' + currency;
    } else {
        var ifString = frb.formatCurrency(currency, ifEveryone, language).replace(/\.$/, ''); // strip any period from end for use in running text
    }
    $('.frb').each(function(index){
        var newHtml = $(this).html().replace(/%MINIMUM%/g, ifString );
        $(this).html(newHtml);
    });

    /* Links (in smallprint) TODO: merge with frb.makeLink() */
    $('.frb-localize-links a').each(function() {
        // Add parameters for LandingCheck
        var uri = new mw.Uri( $(this).attr('href') );
        uri.extend({
            country:      country,
            language:     language,
            uselang:      language,
            utm_medium:   'sitenotice',
            utm_campaign: mw.centralNotice.data.campaign || 'test',
            utm_source:   mw.centralNotice.data.banner
        });
        $(this).attr('href', uri.toString());
        $(this).attr('target', '_blank'); // Make links open in new tab
    });

    // Add links
    frb.makeLink( '.frb-link-privacy', 'https://foundation.wikimedia.org/wiki/Special:LandingCheck?basic=true&landing_page=Donor_privacy_policy' );
    frb.makeLink( '.frb-link-tax',     'https://donate.wikimedia.org/wiki/Special:LandingCheck?basic=true&landing_page=Tax_deductibility' );
    frb.makeLink( '.frb-link-cancel',  'https://donate.wikimedia.org/wiki/Special:LandingCheck?basic=true&landing_page=Cancel_or_change_recurring_giving' );

    // Legal text variants
    if (country === 'US') {
        $('.frb-legal-US').show();
        $('.frb-legal-nonUS, .frb-legal-NL').hide();
    } else if (country === 'NL') {
        $('.frb-legal-NL').show();
        $('.frb-legal-US, .frb-legal-nonUS').hide();
    } else {
        $('.frb-legal-nonUS').show();
        $('.frb-legal-US, .frb-legal-NL').hide();
    }

    // Countries where Remind Me Later should be shown
    rmlCountries = ['US', 'CA', 'GB', 'IE', 'AU', 'NZ',
                    'SE', 'IT', 'NL', 'ES', 'JP', 'FR'];

    if ( rmlCountries.indexOf(country) === -1 ) {
        $('.frb').addClass('frb-rml-disabled');
    } else {
        $('.frb').addClass('frb-rml-enabled');
    }

});

/* == end of MediaWiki:FundraisingBanners/LocalizeJS-2017.js == */