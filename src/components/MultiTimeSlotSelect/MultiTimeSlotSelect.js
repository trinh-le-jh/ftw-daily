import React from 'react';
import { injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import {
  FieldSelect,
  InlineTextButton,
  IconClose,
} from '../../components';
import css from './MultiTimeSlotSelect.module.css';
import { FieldArray } from 'react-final-form-arrays';

const printHourStrings = h => (h > 9 ? `${h}:00` : `0${h}:00`);

// list option
const HOURS = Array(24).fill();
const ALL_START_HOURS = HOURS.map((v, i) => printHourStrings(i));
const ALL_END_HOURS = HOURS.map((v, i) => printHourStrings(i + 1));

const findEntryFn = entry => e => e.startTime === entry.startTime && e.endTime === entry.endTime;


const sortEntries = (defaultCompareReturn = 0) => (a, b) => {
  if (a.startTime && b.startTime) {
    const aStart = Number.parseInt(a.startTime.toString().split(':')[0]);
    const bStart = Number.parseInt(b.startTime.toString().split(':')[0]);
    return aStart - bStart;
  }
  return defaultCompareReturn;
};

const filterStartHours = (availableStartHours, values, index) => {
  const dayOfWeek = 'freePlan';
  const entries = values[dayOfWeek];
  const currentEntry = entries[index];

  // If there is no end time selected, return all the available start times
  if (!currentEntry.endTime) {
    return availableStartHours;
  }

  const sortedEntries = [...entries].sort(sortEntries());

  const currentIndex = sortedEntries.findIndex(findEntryFn(currentEntry));

  const prevEntry = sortedEntries[currentIndex - 1];
  const pickBefore = time => h => h < time;
  const pickBetween = (start, end) => h => h >= start && h < end;

  return !prevEntry || !prevEntry.endTime
    ? availableStartHours.filter(pickBefore(currentEntry.endTime))
    : availableStartHours.filter(pickBetween(prevEntry.endTime, currentEntry.endTime));
};

const filterEndHours = (availableEndHours, values, index) => {
  const dayOfWeek = 'freePlan';
  const entries = values[dayOfWeek];
  const currentEntry = entries[index];

  // If there is no start time selected, return an empty array;
  if (!currentEntry.startTime) {
    return [];
  }

  const sortedEntries = [...entries].sort(sortEntries(-1));

  const currentIndex = sortedEntries.findIndex(findEntryFn(currentEntry));

  const nextEntry = sortedEntries[currentIndex + 1];
  const pickAfter = time => h => h > time;
  const pickBetween = (start, end) => h => h > start && h <= end;

  return !nextEntry || !nextEntry.startTime
    ? availableEndHours.filter(pickAfter(currentEntry.startTime))
    : availableEndHours.filter(pickBetween(currentEntry.startTime, nextEntry.startTime));
};

const getEntryBoundaries = (values, dayOfWeek, intl, findStartHours) => index => {
  const entries = values[dayOfWeek];
  const boundaryDiff = findStartHours ? 0 : 1;

  return entries.reduce((allHours, entry, i) => {
    const { startTime, endTime } = entry || {};

    if (i !== index && startTime && endTime) {
      const startHour = Number.parseInt(startTime.toString().split(':')[0]);
      const endHour = Number.parseInt(endTime.toString().split(':')[0]);
      const hoursBetween = Array(endHour - startHour)
        .fill()
        .map((v, i) => printHourStrings(startHour + i + boundaryDiff));

      return allHours.concat(hoursBetween);
    }

    return allHours;
  }, []);
};

const MultiTimeSlotSelectComponent = props => {
  const { values, intl } = props;
  const dayOfWeek = 'freePlan';
  const getEntryStartTimes = getEntryBoundaries(values, dayOfWeek, intl, true);

  const getEntryEndTimes = getEntryBoundaries(values, dayOfWeek, intl, false);
  return (
    <div className={classNames(css.weekDay, values ? css.hasEntries : null)}>
      <label>
        <FormattedMessage id="MultiTimeSlotSelect.label" />
      </label>


      <FieldArray name="freePlan">
        {({ fields }) => {
          return (
            <div className={css.timePicker}>
              {fields.map((name, index) => {
                // Pick available start hours
                const pickUnreservedStartHours = h => !getEntryStartTimes(index).includes(h);
                const availableStartHours = ALL_START_HOURS.filter(pickUnreservedStartHours);

                // Pick available end hours
                const pickUnreservedEndHours = h => !getEntryEndTimes(index).includes(h);
                const availableEndHours = ALL_END_HOURS.filter(pickUnreservedEndHours);

                return (
                  <div className={css.fieldWrapper} key={name}>
                    <div className={css.formRow}>
                      <div className={css.field}>
                        <FieldSelect
                          id={`${name}.startTime`}
                          name={`${name}.startTime`}
                        >
                          <option disabled value="">
                            Choose start time
                          </option>
                          {filterStartHours(availableStartHours, values, index).map(
                            s => (
                              <option value={s} key={s}>
                                {s}
                              </option>
                            )
                          )}
                        </FieldSelect>
                      </div>
                      <span className={css.dashBetweenTimes}>-</span>
                      <div className={css.field}>
                        <FieldSelect
                          id={`${name}.endTime`}
                          name={`${name}.endTime`}
                        >
                          <option disabled value="">
                            Choose end time
                          </option>
                          {filterEndHours(availableEndHours, values, index).map(s => (
                            <option value={s} key={s}>
                              {s}
                            </option>
                          ))}
                        </FieldSelect>
                      </div>
                    </div>
                    <div
                      className={css.fieldArrayRemove}
                      onClick={() => fields.remove(index)}
                      style={{ cursor: 'pointer' }}
                    >
                      <IconClose rootClassName={css.closeIcon} />
                    </div>
                  </div>
                );
              })}

              {fields.length === 0 ? (
                <InlineTextButton
                  type="button"
                  className={css.buttonSetHours}
                  onClick={() => fields.push({ startTime: null, endTime: null })}
                >
                  <FormattedMessage id="MultiTimeSlotSelect.createTimeSlot" />
                </InlineTextButton>
              ) : (
                <InlineTextButton
                  type="button"
                  className={css.buttonAddNew}
                  onClick={() => fields.push({ startTime: null, endTime: null })}
                >
                  <FormattedMessage id="MultiTimeSlotSelect.addAnotherTimeSlot" />
                </InlineTextButton>
              )}
            </div>
          );
        }}
      </FieldArray>
      <br/>
      <label>
        <FormattedMessage id="MultiTimeSlotSelect.subLabel" />
      </label>
      <br/>
    </div>
  );
}


const MultiTimeSlotSelect = injectIntl(MultiTimeSlotSelectComponent);

export default MultiTimeSlotSelect;
