import React from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { maxLength, required, composeValidators } from '../../util/validators';
import { Form, Button, FieldTextInput, FieldCheckboxGroup } from '../../components';

import css from './EditEquipmentListingGeneralForm.module.css';
import config from '../../config';
import { findOptionsForSelectFilter } from '../../util/search';
import arrayMutators from 'final-form-arrays';

const TITLE_MAX_LENGTH = 60;

const EditEquipmentListingGeneralFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        filterConfig,
      } = formRenderProps;

      const titleMessage = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.title'
      });
      const equipmentTypeLabel = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.equipmentTypeTitle'
      });
      const titlePlaceholderMessage = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.titlePlaceholder',
      });
      const titleRequiredMessage = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.titleRequired',
      });
      const maxLengthMessage = intl.formatMessage(
        { id: 'EditEquipmentListingGeneralForm.maxLength' },
        {
          maxLength: TITLE_MAX_LENGTH,
        }
      );

      const descriptionMessage = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.description',
      });
      const descriptionPlaceholderMessage = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.descriptionPlaceholder',
      });
      const maxLength60Message = maxLength(maxLengthMessage, TITLE_MAX_LENGTH);
      const descriptionRequiredMessage = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.descriptionRequired',
      });

      const rulesLabelMessage = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.rulesLabel',
      });
      const rulesPlaceholderMessage = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.rulesPlaceholder',
      });

      const manufactureYearLabelMessage = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.manufactureLabel',
      });
      const manufactureYearPlaceholderMessage = intl.formatMessage({
        id: 'EditEquipmentListingGeneralForm.manufacturePlaceholder',
      });

      const {
        updateListingError,
        createListingDraftError,
        showListingsError
      } = fetchErrors || {};
      const errorMessageUpdateListing = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingDescriptionForm.updateFailed" />
        </p>
      ) : null;

      // This error happens only on first tab (of EditListingWizard)
      const errorMessageCreateListingDraft = createListingDraftError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingDescriptionForm.createListingDraftError" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingDescriptionForm.showListingFailed" />
        </p>
      ) : null;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      const options = findOptionsForSelectFilter('equipment', filterConfig);

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {errorMessageCreateListingDraft}
          {errorMessageUpdateListing}
          {errorMessageShowListing}
          {/*Equipment name*/}
          <FieldTextInput
            id="title"
            name="title"
            className={css.fieldContainer}
            type="text"
            label={titleMessage}
            placeholder={titlePlaceholderMessage}
            maxLength={TITLE_MAX_LENGTH}
            validate={composeValidators(required(titleRequiredMessage), maxLength60Message)}
            autoFocus
          />
          {/*Equipment description*/}
          <FieldTextInput
            id="description"
            name="description"
            className={css.fieldContainer}
            type="textarea"
            label={descriptionMessage}
            placeholder={descriptionPlaceholderMessage}
            validate={composeValidators(required(descriptionRequiredMessage))}
          />

          {/*Equipment type*/}
          <div className={css.fieldContainer}>
            <label htmlFor="equipmentType">{equipmentTypeLabel}</label>
            <FieldCheckboxGroup
              id="type"
              name="type"
              options={options}
            />
          </div>
          {/*Equipment manufacture*/}
          <FieldTextInput
            id="manufacture"
            name="manufacture"
            className={css.fieldContainer}
            inputRootClass={css.inputNumber}
            type="number"
            label={manufactureYearLabelMessage}
            placeholder={manufactureYearPlaceholderMessage}
          />
          {/*Equipment rules*/}
          <FieldTextInput
            id="rules"
            name="rules"
            className={css.fieldContainer}
            type="textarea"
            label={rulesLabelMessage}
            placeholder={rulesPlaceholderMessage}
          />

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

EditEquipmentListingGeneralFormComponent.defaultProps = {
  className: null,
  fetchErrors: null,
  filterConfig: config.custom.filters,
};

EditEquipmentListingGeneralFormComponent.propTypes = {
  className: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    createListingDraftError: propTypes.error,
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
  categories: arrayOf(
    shape({
      key: string.isRequired,
      label: string.isRequired,
    })
  ),
  filterConfig: propTypes.filterConfig,
};

export default compose(injectIntl)(EditEquipmentListingGeneralFormComponent);
