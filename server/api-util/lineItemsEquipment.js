const { calculateQuantityFromDates, calculateTotalFromLineItems } = require('./lineItemHelpers');
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

// This bookingUnitType needs to be one of the following:
// line-item/night, line-item/day or line-item/units
const PROVIDER_COMMISSION_PERCENTAGE = -25; // Provider commission is negative
const CUSTOMER_FIST_TIME_COMMISSION_PERCENTAGE = 15; // Customer commission is positive
const CUSTOMER_COMMISSION_PERCENTAGE = 55; // Customer commission is positive

/** Returns collection of lineItems (max 50)
 *
 * Each line items has following fields:
 * - `code`: string, mandatory, indentifies line item type (e.g. \"line-item/cleaning-fee\"), maximum length 64 characters.
 * - `unitPrice`: money, mandatory
 * - `lineTotal`: money
 * - `quantity`: number
 * - `percentage`: number (e.g. 15.5 for 15.5%)
 * - `seats`: number
 * - `units`: number
 * - `includeFor`: array containing strings \"customer\" or \"provider\", default [\":customer\"  \":provider\" ]
 *
 * Line item must have either `quantity` or `percentage` or both `seats` and `units`.
 *
 * `includeFor` defines commissions. Customer commission is added by defining `includeFor` array `["customer"]` and provider commission by `["provider"]`.
 *
 * @param {Object} listing
 * @param {Object} bookingData
 * @returns {Array} lineItems
 */
exports.transactionEquipmentLineItems = (listing, bookingData, isFirstTime = false) => {
  const unitPrice = listing.attributes.price;
  const { startDate, endDate } = bookingData;

  /**
   * If you want to use pre-defined component and translations for printing the lineItems base price for booking,
   * you should use one of the codes:
   * line-item/night, line-item/day or line-item/units (translated to persons).
   *
   * Pre-defined commission components expects line item code to be one of the following:
   * 'line-item/provider-commission', 'line-item/customer-commission'
   *
   * By default, BookingBreakdown prints line items inside LineItemUnknownItemsMaybe if the lineItem code is not recognized. */

  const booking = {
    code: 'line-item/hour',
    unitPrice,
    quantity: calculateQuantityFromDates(
      startDate,
      endDate,
      'line-item/hour'),
    includeFor: ['customer', 'provider'],
  };

  const providerCommission = {
    code: 'line-item/provider-commission',
    unitPrice: calculateTotalFromLineItems([booking]),
    percentage: PROVIDER_COMMISSION_PERCENTAGE,
    includeFor: ['provider'],
  };

  const customerCommission = {
    code: 'line-item/customer-commission',
    unitPrice: calculateTotalFromLineItems([booking]),
    percentage: isFirstTime
      ? CUSTOMER_FIST_TIME_COMMISSION_PERCENTAGE
      : CUSTOMER_COMMISSION_PERCENTAGE,
    includeFor: ['customer'],
  };

  const lineItems = [booking, providerCommission, customerCommission];

  return lineItems;
};
