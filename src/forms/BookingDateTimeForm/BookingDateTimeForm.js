import React, { Component, useState, memo, useMemo, useEffect } from 'react';
import { string, bool, arrayOf, array, func, number } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import classNames from 'classnames';
import moment from 'moment';
import config from '../../config';
import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { required, bookingDatesRequired, composeValidators } from '../../util/validators';
import { START_DATE, END_DATE } from '../../util/dates';
import { propTypes } from '../../util/types';
import { Form, IconSpinner, PrimaryButton, FieldDateRangeInput, FieldDateInput, FieldSelect } from '../../components';
import EstimatedBreakdownMaybe from './EstimatedBreakdownMaybe';

import css from './BookingDateTimeForm.module.css';
import { momentObj } from 'react-moment-proptypes';
import * as validators from '../../util/validators';
import loginForm from '../LoginForm/LoginForm';

const identity = v => v;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = ONE_HOUR * 24;
const START_HOUR= 'bookingStartHour';
const END_HOUR= 'bookingEndHour';

const addTime = (date, time, bonusTime) => {
  return {
    date: time + bonusTime > 24
      ? new Date(date.getTime() + ONE_DAY).getDate()
      : date.getDate(),
    time: (( time + bonusTime ) % 24) === 0 ? 24 : ( time + bonusTime ) % 24,
  }
}

export class BookingDateTimeFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { focusedInput: null };
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.onFocusedInputChange = this.onFocusedInputChange.bind(this);
    this.handleOnChange = this.handleOnChange.bind(this);
  }

  // Function that can be passed to nested components
  // so that they can notify this component when the
  // focused input changes.
  onFocusedInputChange(focusedInput) {
    this.setState({ focusedInput });
  }

  // In case start or end date for the booking is missing
  // focus on that input, otherwise continue with the
  // default handleSubmit function.
  handleFormSubmit(e) {
    const { startDate, endDate, bookingStartHour, bookingEndHour } = e;
    if (!startDate) {
      e.preventDefault();
      this.setState({ focusedInput: START_DATE });
    } else if (!endDate) {
      e.preventDefault();
      this.setState({ focusedInput: END_DATE });
    } else if (!bookingStartHour) {
      e.preventDefault();
      this.setState({ focusedInput: START_HOUR });
    } else if (!bookingEndHour) {
      e.preventDefault();
      this.setState({ focusedInput: END_HOUR });
    } else {
      this.props.onSubmit(e);
    }
  }

  // When the values of the form are updated we need to fetch
  // lineItems from FTW backend for the EstimatedTransactionMaybe
  // In case you add more fields to the form, make sure you add
  // the values here to the bookingData object.
  handleOnChange(formValues) {
    const listingId = this.props.listingId;
    const isOwnListing = this.props.isOwnListing;

    const {
      bookingStartHour,
      bookingEndHour
    } = formValues.values

    if (
      formValues.values.startDate &&
      bookingStartHour &&
      formValues.values.endDate &&
      bookingEndHour && 
      !this.props.fetchLineItemsInProgress
    ) {

      const startDateForFetch = new Date(formValues.values.startDate.date);
      startDateForFetch.setHours(Number(bookingStartHour.replace(/[^\d]/g, '')));

      const endDateForFetch = new Date(formValues.values.endDate.date);
      endDateForFetch.setHours(Number(bookingEndHour.replace(/[^\d]/g, '')));

      this.props.onFetchTransactionLineItems({
        bookingData: {
          startDate: startDateForFetch,
          endDate: endDateForFetch,
          unitType: 'line-item/hour',
          displayStart: startDateForFetch,
          displayEnd: endDateForFetch,
        },
        listingId,
        isOwnListing,
      });
    }
  }

  render() {
    const { rootClassName, className, price: unitPrice, ...rest } = this.props;
    const classes = classNames(rootClassName || css.root, className);

    if (!unitPrice) {
      return (
        <div className={classes}>
          <p className={css.error}>
            <FormattedMessage id='BookingDatesForm.listingPriceMissing' />
          </p>
        </div>
      );
    }
    if (unitPrice.currency !== config.currency) {
      return (
        <div className={classes}>
          <p className={css.error}>
            <FormattedMessage id='BookingDatesForm.listingCurrencyInvalid' />
          </p>
        </div>
      );
    }

    return (
      <FinalForm
        {...rest}
        unitPrice={unitPrice}
        onSubmit={this.handleFormSubmit}
        render={fieldRenderProps => {
          const {
            endDatePlaceholder,
            startDatePlaceholder,
            handleSubmit,
            intl,
            isOwnListing,
            submitButtonWrapperClassName,
            unitType,
            values,
            form,
            timeSlots,
            fetchTimeSlotsError,
            lineItems,
            fetchLineItemsInProgress,
            fetchLineItemsError,
            maxTimeUsing,
          } = fieldRenderProps;

          const selectOption = useMemo(() => Array.from(
              Array(25),
              (i, index) => `${index} ${index < 13 ? 'AM' : 'PM'}`,
            )
            , []);

          const {
            startDate,
            endDate,
            bookingStartHour,
            bookingEndHour
          } = values;

          const today = moment().startOf('day').toDate();
          const tomorrow = moment()
            .startOf('day')
            .add(1, 'days')
            .toDate();
          const dateFormatOptions = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          };
          const startDatePlaceholderText =
            startDatePlaceholder || intl.formatDate(today, dateFormatOptions);
          const endDatePlaceholderText =
            endDatePlaceholder || intl.formatDate(tomorrow, dateFormatOptions);
          const submitButtonClasses = classNames(
            submitButtonWrapperClassName || css.submitButtonWrapper,
          );
          const timeSlotsError = fetchTimeSlotsError ? (
            <p className={css.sideBarError}>
              <FormattedMessage id='BookingDatesForm.timeSlotsError' />
            </p>
          ) : null;

          // This is the place to collect breakdown estimation data.
          // Note: lineItems are calculated and fetched from FTW backend
          // so we need to pass only booking data that is needed otherwise
          // If you have added new fields to the form that will affect to pricing,
          // you need to add the values to handleOnChange function
          const bookingData =
            startDate && bookingStartHour && endDate && bookingEndHour
              ? {
                unitType,
                startDate: startDate.date,
                endDate: endDate.date,
                startHour: bookingStartHour,
                endHour: bookingEndHour,
              }
              : null;

          const showEstimatedBreakdown =
            bookingData &&
            lineItems &&
            !fetchLineItemsInProgress &&
            !fetchLineItemsError;

          const bookingInfoMaybe = showEstimatedBreakdown ? (
            <div className={css.priceBreakdownContainer}>
              <h3 className={css.priceBreakdownTitle}>
                <FormattedMessage id='BookingDatesForm.priceBreakdownTitle' />
              </h3>
              <EstimatedBreakdownMaybe bookingData={bookingData} lineItems={lineItems} />
            </div>
          ) : null;

          const loadingSpinnerMaybe = fetchLineItemsInProgress ? (
            <IconSpinner className={css.spinner} />
          ) : null;

          const bookingInfoErrorMaybe = fetchLineItemsError ? (
            <span className={css.sideBarError}>
              <FormattedMessage id='BookingDatesForm.fetchLineItemsError' />
            </span>
          ) : null;
          const dateSelected = values['startDate']?.date;


          const maxBookingDateTime = values['startDate'] && values['bookingStartHour']
            ? addTime(
                dateSelected,
                Number(values['bookingStartHour'].replace(/[^\d]/g, '')),
                maxTimeUsing)
            : undefined;

          const minBookingDateTime = values['startDate'] && values['bookingStartHour']
            ? addTime(
                dateSelected,
                Number(values['bookingStartHour'].replace(/[^\d]/g, '')),
                1)
            : undefined;

          const timeSlotsEnd = values['startDate'] && values['bookingStartHour']
            ? timeSlots.filter((slot) =>
                slot.attributes.start.getDate() === minBookingDateTime.date ||
                slot.attributes.start.getDate() === maxBookingDateTime.date
              )
            : [];
          const selectEndOption = values['endDate']
            ? new Date(values['endDate'].date).getDate() === minBookingDateTime.date
              ? selectOption.slice(
                minBookingDateTime.time,
                minBookingDateTime.date === maxBookingDateTime.date
                  ? maxBookingDateTime.time + 1
                  : selectOption.length )
              : selectOption.slice(
                0,
                maxBookingDateTime.time + 1)
            : [];
          useEffect(() => {
            form.change('endDate', null)
          }, [values.startDate])

          return (
            <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor='CheckoutPage'>
              {timeSlotsError}
              <FormSpy
                subscription={{ values: true }}
                onChange={values => {
                  this.handleOnChange(values);
                }}
              />
              <div className={css.dateTimeRow}>
                <FieldDateInput
                  className={css.bookingStartDate}
                  name='startDate'
                  id='startDate'
                  useMobileMargins
                  placeholderText={startDatePlaceholderText}
                  validate={validators.required('required')}
                  timeSlots={timeSlots}
                  label='Start date'
                />

                <FieldSelect
                  id='bookingStartHour'
                  name='bookingStartHour'
                  label='Pick up time'
                  disabled={!values['startDate']}
                  validate={validators.required('required')}
                  className={css.timeSelector}
                >
                  <option value="">Pick a time</option>
                  {
                    selectOption
                      .slice(
                        values.startDate?.date.getDate() === new Date().getUTCDate()
                          ? new Date().getUTCHours() + 1
                          : 0
                        , selectOption.length - 1)
                      .map(opt => (
                        <option value={opt} key={`${opt}-start`}>{opt}</option>
                      ))
                  }
                </FieldSelect>
              </div>

              {
                values['startDate'] && values['bookingStartHour'] &&
                (
                  <div className={css.dateTimeRow}>
                    <FieldDateInput
                      className={css.bookingEndDate}
                      name='endDate'
                      id='endDate'
                      useMobileMargins
                      placeholderText={endDatePlaceholderText}
                      timeSlots={timeSlotsEnd}
                      label='End date'
                      validate={validators.required('required')}
                    />

                    <FieldSelect
                      className={css.timeSelector}
                      id='bookingEndHour'
                      name='bookingEndHour'
                      label='Drop off time'
                      disabled={!values['endDate']}
                      validate={validators.required('required')}
                    >
                      <option value="">Pick a time</option>
                      {
                        selectEndOption.map(opt => (
                          <option value={opt} key={`${opt}-end`}>{opt}</option>
                        ))
                      }
                    </FieldSelect>
                  </div>
                )
              }

              {bookingInfoMaybe}
              {loadingSpinnerMaybe}
              {bookingInfoErrorMaybe}

              <p className={css.smallPrint}>
                <FormattedMessage
                  id={
                    isOwnListing
                      ? 'BookingDatesForm.ownListing'
                      : 'BookingDatesForm.youWontBeChargedInfo'
                  }
                />
              </p>
              <div className={submitButtonClasses}>
                <PrimaryButton type='submit'>
                  <FormattedMessage id='BookingDatesForm.requestToBook' />
                </PrimaryButton>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

BookingDateTimeFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  submitButtonWrapperClassName: null,
  price: null,
  isOwnListing: false,
  startDatePlaceholder: null,
  endDatePlaceholder: null,
  timeSlots: null,
  lineItems: null,
  fetchLineItemsError: null,
};

BookingDateTimeFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  submitButtonWrapperClassName: string,

  unitType: propTypes.bookingUnitType.isRequired,
  price: propTypes.money,
  isOwnListing: bool,
  timeSlots: arrayOf(propTypes.timeSlot),

  onFetchTransactionLineItems: func.isRequired,
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // from injectIntl
  intl: intlShape.isRequired,

  // for tests
  startDatePlaceholder: string,
  endDatePlaceholder: string,
  maxTimeUsing: number,
};

const BookingDateTimeForm = compose(injectIntl)(BookingDateTimeFormComponent);
BookingDateTimeForm.displayName = 'BookingDateTimeForm';

export default BookingDateTimeForm;
