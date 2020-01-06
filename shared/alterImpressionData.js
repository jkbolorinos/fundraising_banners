/** Provides alterImpressionData hook for CentralNotice
 *  This info will be sent back with Special:RecordImpression
 */

mediaWiki.centralNotice.bannerData.alterImpressionData = function( impressionData ) {
    // Returning true from this function indicates the banner was shown
    if (mediaWiki.centralNotice.bannerData.hideReason) {
        impressionData.reason = mediaWiki.centralNotice.bannerData.hideReason;
    }
    if (mediaWiki.centralNotice.bannerData.cookieCount) {
        impressionData.banner_count = mediaWiki.centralNotice.bannerData.cookieCount;
    }
    
    return !mediaWiki.centralNotice.bannerData.hideResult;
};