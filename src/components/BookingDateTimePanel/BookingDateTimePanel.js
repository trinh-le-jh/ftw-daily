import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import config from '../../config';
import { array, arrayOf, bool, func, node, oneOfType, shape, string } from 'prop-types';
import { LISTING_STATE_CLOSED, propTypes } from '../../util/types';
import classNames from 'classnames';
import { Button, FieldDateInput, ModalInMobile } from '../../components';
import { BookingDateTimeForm } from '../../forms';

import css from './BookingDateTimePanel.module.css';
import { parse, stringify } from '../../util/urlHelpers';
import omit from 'lodash/omit';
import { formatMoney } from '../../util/currency';

const MODAL_BREAKPOINT = 1023;

const closeBookModal = (history, location) => {
  const { pathname, search, state } = location;
  const searchParams = omit(parse(search), 'book');
  const searchString = `?${stringify(searchParams)}`;
  history.push(`${pathname}${searchString}`, state);
};

const openBookModal = (isOwnListing, isClosed, history, location) => {
  if (isOwnListing || isClosed) {
    window.scrollTo(0, 0);
  } else {
    const { pathname, search, state } = location;
    const searchString = `?${stringify({ ...parse(search), book: true })}`;
    history.push(`${pathname}${searchString}`, state);
  }
};

const priceData = (price, intl) => {
  if (price && price.currency === config.currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: `(${price.currency})`,
      priceTitle: `Unsupported currency (${price.currency})`,
    };
  }
  return {};
};

const sortOutFreePlanToArray = arrPlan => {
  return arrPlan.reduce((acc,cur) => {
    const start = Number.parseInt(cur.startTime.toString().split(':')[0])
    const end = Number.parseInt(cur.endTime.toString().split(':')[0])

    const length = end - start + 1;

    const lastItem = acc[acc.length - 1];
    const firstNewItem = `${start} ${start < 13? 'A': 'P'}M`

    if (lastItem === firstNewItem) {
      acc.pop();
    }

    acc.push(...(Array(length).fill().map((v, i) =>
      `${i+start} ${i+start < 13? 'A': 'P'}M`
    )))

    return acc
  }, [])
}

const BookingDateTimePanel = props => {
  const {
    rootClassName,
    className,
    titleClassName,
    onManageDisableScrolling,
    listing,
    isOwnListing,
    onSubmit,
    timeSlots,
    title,
    subTitle,
    authorDisplayName,
    unitType,
    history,
    location,
    fetchTimeSlotsError,
    onFetchTransactionLineItems,
    lineItems,
    fetchLineItemsError,
    fetchLineItemsInProgress,
    intl,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const price = listing.attributes.price;
  const hasListingState = !!listing.attributes.state;
  const isClosed = hasListingState && listing.attributes.state === LISTING_STATE_CLOSED;
  const maxTimeUsing = listing.attributes.publicData?.numberHour || 24;
  const showClosedListingHelpText = listing.id && isClosed;
  const showBookingDatesForm = hasListingState && !isClosed;
  const { formattedPrice, priceTitle } = priceData(price, intl);
  const isBook = !!parse(location.search).book;
  const titleClasses = classNames(titleClassName || css.bookingTitle);
  const subTitleText = !!subTitle
    ? subTitle
    : showClosedListingHelpText
      ? intl.formatMessage({ id: 'BookingPanel.subTitleClosedListing' })
      : null;
  const selectOption = sortOutFreePlanToArray(listing.attributes.publicData.freePlan);
  return (
    <div className={classes}>
      <ModalInMobile
        containerClassName={css.modalContainer}
        id="BookingDateTimeFirmInModal"
        isModalOpenOnMobile={isBook}
        onClose={() => closeBookModal(history, location)}
        showAsModalMaxWidth={MODAL_BREAKPOINT}
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <div className={css.modalHeading}>
          <h1 className={css.title}>{title}</h1>
          <div className={css.author}>
            <FormattedMessage id="BookingPanel.hostedBy" values={{ name: authorDisplayName }} />
          </div>
        </div>

        <div className={css.bookingHeading}>
          <h2 className={titleClasses}>{title}</h2>
          {subTitleText ? <div className={css.bookingHelp}>{subTitleText}</div> : null}
        </div>
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
          selectOption={selectOption}
        />
      </ModalInMobile>
      <div className={css.openBookingForm}>
        <div className={css.priceContainer}>
          <div className={css.priceValue} title={priceTitle}>
            {formattedPrice}
          </div>
          <div className={css.perUnit}>
            <FormattedMessage id="EquipmentListingPage.perHour" />
          </div>
        </div>

        {showBookingDatesForm ? (
          <Button
            rootClassName={css.bookButton}
            onClick={() => openBookModal(isOwnListing, isClosed, history, location)}
          >
            <FormattedMessage id="BookingPanel.ctaButtonMessage" />
          </Button>
        ) : isClosed ? (
          <div className={css.closedListingButton}>
            <FormattedMessage id="BookingPanel.closedListingButtonText" />
          </div>
        ) : null}
      </div>
    </div>
  )

}

BookingDateTimePanel.defaultProps = {
  rootClassName: null,
  className: null,
  titleClassName: null,
  isOwnListing: false,
  subTitle: null,
  unitType: config.bookingEquipmentUnitType,
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
