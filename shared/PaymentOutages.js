/* This file can be used to schedule hiding of individual payment methods from banners
 * e.g. if they have scheduled downtime.
 *
 * Valid methods are:
 *	ideal, cc, pp, amazon, bpay, webmoney, cash, pp-usd
 * (most of the time it's 'ideal'...)
 * Can also limit outage to a specific country with country: "XX" (where XX is an ISO code)
 *
 * Note that in JavaScript dates the months (and only the months) start at 0.
 * Jan=0, Feb=1, Mar=2, Apr=3 etc. How hateful.
 *
 * Be sure to also update donatewiki if needed e.g. by commenting the method templates
 * found at https://donate.wikimedia.org/wiki/Template:2012FR/Form-section/Paymentmethods
 * 
 */
var outages = [
    {
        start:      new Date(Date.UTC(2016, 8, 18, 1)),
        end:        new Date(Date.UTC(2016, 8, 18, 7)),
        method:     "ideal"
    }
];