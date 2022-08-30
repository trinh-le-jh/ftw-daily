import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { injectIntl, intlShape } from '../../util/reactIntl';
import config from '../../config';
import { array, arrayOf, bool, func, node, oneOfType, shape, string } from 'prop-types';
import { propTypes } from '../../util/types';
import classNames from 'classnames';
import { FieldDateInput, ModalInMobile } from '../../components';
import { BookingDateTimeForm } from '../../forms';

import css from './BookingDateTimePanel.module.css';

const MODAL_BREAKPOINT = 1023;

const BookingDateTimePanel = props => {
  const {
    rootClassName,
    className,
    onManageDisableScrolling,
    listing,
    isOwnListing,
    onSubmit,
    timeSlots,
    unitType,
    fetchTimeSlotsError,
    onFetchTransactionLineItems,
    lineItems,
    fetchLineItemsError,
    fetchLineItemsInProgress,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const price = listing.attributes.price;
  const maxTimeUsing = listing.attributes.publicData.numberHour;
  return (
    <div className={classes}>
      <ModalInMobile
        containerClassName={css.modalContainer}
        id="BookingDateTimeFirmInModal"
        isModalOpenOnMobile={false}
        showAsModalMaxWidth={MODAL_BREAKPOINT}
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <BookingDateTimeForm
          formId="BookingDTPanel"
          price={price}
          className={css.bookingForm}
          submitButtonWrapperClassName={css.bookingDatesSubmitButtonWrapper}
          unitType={unitType}
          onSubmit={onSubmit}
          listingId={listing.id}
          isOwnListing={isOwnListing}
          timeSlots={timeSlots}
          fetchTimeSlotsError={fetchTimeSlotsError}
          onFetchTransactionLineItems={onFetchTransactionLineItems}
          lineItems={lineItems}
          fetchLineItemsInProgress={fetchLineItemsInProgress}
          fetchLineItemsError={fetchLineItemsError}
          maxTimeUsing={maxTimeUsing}
        />
      </ModalInMobile>
    </div>
  )

}

BookingDateTimePanel.defaultProps = {
  rootClassName: null,
  className: null,
  titleClassName: null,
  isOwnListing: false,
  subTitle: null,
  unitType: config.bookingUnitType,
  timeSlots: null,
  fetchTimeSlotsError: null,
  lineItems: null,
  fetchLineItemsError: null,
};

BookingDateTimePanel.propTypes = {
  rootClassName: string,
  className: string,
  titleClassName: string,
  listing: oneOfType([propTypes.listing, propTypes.ownListing]),
  isOwnListing: bool,
  unitType: propTypes.bookingUnitType,
  onSubmit: func.isRequired,
  title: oneOfType([node, string]).isRequired,
  subTitle: oneOfType([node, string]),
  authorDisplayName: oneOfType([node, string]).isRequired,
  onManageDisableScrolling: func.isRequired,
  timeSlots: arrayOf(propTypes.timeSlot),
  fetchTimeSlotsError: propTypes.error,
  onFetchTransactionLineItems: func.isRequired,
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // from withRouter
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string,
  }).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

export default compose(withRouter, injectIntl)(BookingDateTimePanel);