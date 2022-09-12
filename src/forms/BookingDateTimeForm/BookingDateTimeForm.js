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

const BOOKING_BY_HOUR = 'hour';
const BOOKING_BY_DAY = 'day';

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
    const { startDate, endDate, bookingStartHour, bookingEndHour, formType, bookingByDay } = e;
    if (formType === BOOKING_BY_HOUR && !startDate) {
      e.preventDefault();
      this.setState({ focusedInput: START_DATE });
    } else if (formType === BOOKING_BY_HOUR && !endDate) {
      e.preventDefault();
      this.setState({ focusedInput: END_DATE });
    } else if (formType === BOOKING_BY_HOUR && !bookingStartHour) {
      e.preventDefault();
      this.setState({ focusedInput: START_HOUR });
    } else if (formType === BOOKING_BY_HOUR && !bookingEndHour) {
      e.preventDefault();
      this.setState({focusedInput: END_HOUR});
    } else if (formType === BOOKING_BY_DAY && !bookingByDay && !bookingByDay.startDate) {
      e.preventDefault();
      this.setState({focusedInput: 'BookingByDay.bookingStartDate' })
    } else if (formType === BOOKING_BY_DAY && !bookingByDay && !bookingByDay.endDate) {
      e.preventDefault();
      this.setState({focusedInput: 'BookingByDay.bookingEndDate' })
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
      bookingEndHour,
      formType,
      startDate,
      endDate,
      bookingByDay,
    } = formValues.values

    if (
      formType === BOOKING_BY_HOUR &&
      formValues.values.startDate &&
      bookingStartHour &&
      formValues.values.endDate &&
      bookingEndHour &&
      !this.props.fetchLineItemsInProgress
    ) {

      const startDateForFetch = new Date(startDate.date);
      startDateForFetch.setHours(Number(bookingStartHour.replace(/[^\d]/g, '')));

      const endDateForFetch = new Date(endDate.date);
      endDateForFetch.setHours(Number(bookingEndHour.replace(/[^\d]/g, '')));

      this.props.onFetchTransactionLineItems({
        bookingData: {
          startDate: startDateForFetch,
          endDate: endDateForFetch,
          unitType: 'line-item/hour',
        },
        listingId,
        isOwnListing,
      });
    }
    if (formType === BOOKING_BY_DAY && bookingByDay && bookingByDay.startDate && bookingByDay.endDate) {
      this.props.onFetchTransactionLineItems({
        bookingData: {
          startDate: bookingByDay.startDate,
          endDate: bookingByDay.endDate,
          unitType: 'line-item/hour',
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
        initialValues={{
          formType: BOOKING_BY_HOUR,
        }}
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
            formType,
            // Value for booking by hour
            startDate,
            endDate,
            bookingStartHour,
            bookingEndHour,
            // Value for booking by day
            bookingByDay,
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
          const bookingStartLabel = intl.formatMessage({
            id: 'BookingDatesForm.bookingStartTitle',
          });
          const bookingEndLabel = intl.formatMessage({
            id: 'BookingDatesForm.bookingEndTitle',
          });

          // This is the place to collect breakdown estimation data.
          // Note: lineItems are calculated and fetched from FTW backend
          // so we need to pass only booking data that is needed otherwise
          // If you have added new fields to the form that will affect to pricing,
          // you need to add the values to handleOnChange function

          const bookingData = (
            formType === BOOKING_BY_HOUR
            && startDate
            && bookingStartHour
            && endDate
            && bookingEndHour
          )
              ? {
                unitType,
                startDate: startDate.date,
                endDate: endDate.date,
                startHour: bookingStartHour,
                endHour: bookingEndHour,
              }
              : formType === BOOKING_BY_DAY && bookingByDay
                ? {
                  unitType,
                  startDate: bookingByDay.startDate,
                  endDate: bookingByDay.endDate,
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
          const dateSelected = startDate?.date;

          const maxBookingDateTime = startDate && bookingStartHour
            ? addTime(
                dateSelected,
                Number(bookingStartHour.replace(/[^\d]/g, '')),
                maxTimeUsing)
            : undefined;

          const minBookingDateTime = startDate && bookingStartHour
            ? addTime(
                dateSelected,
                Number(bookingStartHour.replace(/[^\d]/g, '')),
                1)
            : undefined;

          const getListTimeSlotsEnd = () => {
            if (formType === BOOKING_BY_HOUR && startDate && bookingStartHour) {
              return timeSlots.filter((slot) =>
                slot.attributes.start.getDate() === minBookingDateTime.date ||
                slot.attributes.start.getDate() === maxBookingDateTime.date
              )
            }
            if (formType === BOOKING_BY_DAY && startDate) {
              return timeSlots.filter(slot =>
                new Date(slot.attributes.start).getTime() > new Date(startDate.date).getTime()
              )
            }
            return [];
          };

          const timeSlotsEnd = getListTimeSlotsEnd();

          const selectEndOption = endDate && bookingStartHour
            ? new Date(endDate.date).getDate() === minBookingDateTime.date
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
            form.change('bookingStartHour', null)
            form.change('bookingEndHour', null)
          }, [values.startDate, values.formType])

          const showDropOff = startDate && bookingStartHour;

          return (
            <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor='CheckoutPage'>
              {timeSlotsError}
              <FormSpy
                subscription={{ values: true }}
                onChange={values => {
                  this.handleOnChange(values);
                }}
              />
              <FieldSelect
                id="formType"
                name="formType"
                label="Do you want to rent this by the day or by the hour?"
                className={css.timeSelector}
              >
                <option value={BOOKING_BY_HOUR}>By hour</option>
                <option value={BOOKING_BY_DAY}>By day</option>
              </FieldSelect>
              <br/>

              {
                formType === BOOKING_BY_DAY && (
                  <FieldDateRangeInput
                    className={css.bookingDates}
                    name="bookingByDay"
                    unitType={unitType}
                    startDateId="BookingByDay.bookingStartDate"
                    startDateLabel={bookingStartLabel}
                    startDatePlaceholderText={startDatePlaceholderText}
                    endDateId="BookingByDay.bookingEndDate"
                    endDateLabel={bookingEndLabel}
                    endDatePlaceholderText={endDatePlaceholderText}
                    focusedInput={this.state.focusedInput}
                    onFocusedInputChange={this.onFocusedInputChange}
                    format={identity}
                    timeSlots={timeSlots}
                    useMobileMargins
                    disabled={fetchLineItemsInProgress}
                  />
                )
              }

              {
                formType === BOOKING_BY_HOUR && (
                  <>
                    <div className={css.dateTimeRow}>
                      <FieldDateInput
                        className={css.bookingStartDate}
                        name="startDate"
                        id="startDate"
                        useMobileMargins
                        placeholderText={startDatePlaceholderText}
                        validate={validators.required('required')}
                        timeSlots={timeSlots}
                        label='Start date'
                      />

                      <FieldSelect
                        id={START_HOUR}
                        name={START_HOUR}
                        label="Pick up time"
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
                      showDropOff &&
                      (
                        <div className={css.dateTimeRow}>
                          <FieldDateInput
                            className={css.bookingEndDate}
                            name="endDate"
                            id="endDate"
                            useMobileMargins
                            placeholderText={endDatePlaceholderText}
                            timeSlots={timeSlotsEnd}
                            label="End date"
                            validate={validators.required('required')}
                          />
                          {
                            formType === BOOKING_BY_HOUR && (
                              <FieldSelect
                                className={css.timeSelector}
                                id="bookingEndHour"
                                name="bookingEndHour"
                                label="Drop off time"
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
                            )
                          }
                        </div>
                      )
                    }
                  </>
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
                <PrimaryButton type="submit">
                  <FormattedMessage id="BookingDatesForm.requestToBook" />
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
