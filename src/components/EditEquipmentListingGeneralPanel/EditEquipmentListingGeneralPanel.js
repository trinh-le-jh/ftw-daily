import React from 'react';
import { bool, func, object, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { ensureOwnListing } from '../../util/data';
import { findOptionsForSelectFilter } from '../../util/search';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { ListingLink } from '../../components';
import { EditEquipmentListingGeneralForm } from '../../forms';
import config from '../../config';

import css from './EditEquipmentListingGeneralPanel.module.css';

const EditEquipmentListingGeneralPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    onChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);
  const { description, title, publicData } = currentListing.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditEquipmentListingGeneralPanel.title"
      values={{ listingTitle: <ListingLink listing={listing} isEquipment={true} /> }}
    />
  ) : (
    <FormattedMessage id="EditEquipmentListingGeneralPanel.createListingTitle" />
  );

  const categoryOptions = findOptionsForSelectFilter('category', config.custom.filters);
  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>
      <EditEquipmentListingGeneralForm
        className={css.form}
        initialValues={{
          title,
          description,
          equipmentType: publicData.equipmentType,
          manufactureYear: publicData.manufactureYear,
          numberHour: publicData.numberHour,
          freePlan: publicData.freePlan || [],
        }}
        saveActionMsg={submitButtonText}
        onSubmit={values => {
          const {
            title,
            description,
            equipmentType = [],
            manufactureYear,
            numberHour,
            freePlan
          } = values;
          const updateValues = {
            title: title.trim(),
            description,
            publicData: {
              equipmentType,
              manufactureYear: Number(manufactureYear),
              numberHour: Number(numberHour),
              isEquipment: true,
            },
          };
          if (freePlan.length)
            updateValues.publicData.freePlan = freePlan;
          onSubmit(updateValues);
        }}
        onChange={onChange}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
        categories={categoryOptions}
      />
    </div>
  );
};

EditEquipmentListingGeneralPanel.defaultProps = {
  className: null,
  rootClassName: null,
  errors: null,
  listing: null,
};

EditEquipmentListingGeneralPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  onChange: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditEquipmentListingGeneralPanel;
