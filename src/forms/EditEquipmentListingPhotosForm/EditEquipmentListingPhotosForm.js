import React, { Component, useEffect, useState } from 'react';
import { array, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, Field } from 'react-final-form';
import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { nonEmptyArray, composeValidators } from '../../util/validators';
import { isUploadImageOverLimitError } from '../../util/errors';
import { AddImages, Button, Form, ListingLink, ValidationError } from '../../components';

import css from './EditEquipmentListingPhotosForm.module.css';

const ACCEPT_IMAGES = 'image/*';

export class EditListingPhotosFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { imageUploadRequested: false };
    this.onImageUploadHandler = this.onImageUploadHandler.bind(this);
    this.submittedImages = [];
  }

  onImageUploadHandler(file) {
    if (file) {
      this.setState({ imageUploadRequested: true });
      this.props
        .onImageUpload({ id: `${file.name}_${Date.now()}`, file })
        .then(() => {
          this.setState({ imageUploadRequested: false });
        })
        .catch(() => {
          this.setState({ imageUploadRequested: false });
        });
    }
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        onImageUploadHandler={this.onImageUploadHandler}
        imageUploadRequested={this.state.imageUploadRequested}
        initialValues={{
          images: this.props.images
        }}
        render={formRenderProps => {
          const {
            form,
            className,
            fetchErrors,
            handleSubmit,
            images,
            imageUploadRequested,
            intl,
            invalid,
            onImageUploadHandler,
            onRemoveImage,
            disabled,
            ready,
            saveActionMsg,
            updated,
            updateInProgress,
            mainPhotoUuid,
          } = formRenderProps;

          const [ currentMainPhotoUuid, setCurrentMainPhotoUuid ] = useState(mainPhotoUuid)
          const [ mainImage, setMainImage ] = useState(
            mainPhotoUuid && images.length
              ? images.filter((img) => img.id.uuid == currentMainPhotoUuid)
              : []
          );

          const [ subImage, setSubImage ] = useState(
            images
              ? images.filter((img) => img.id.uuid !== currentMainPhotoUuid)
              : []
          );

          const [ isUploadMainPhoto, setIsUploadMainPhoto ] = useState(false)

          useEffect(() => {
            const lastImage = images[images.length -1];

            if (isUploadMainPhoto && !lastImage.imageId ) {
              setMainImage(
                images.filter((img, idx) =>
                  idx === images.length -1
                )
              );
              if (images.length !== 1) {
                setSubImage(
                  images.filter((img, idx) =>
                    idx !== images.length -1
                  )
                );
              }
              return;
            }

            if (isUploadMainPhoto && lastImage.imageId && lastImage.imageId.uuid ) {
              const newMainPhotoUuid = lastImage.imageId.uuid;

              setMainImage(
                images.filter((img) =>
                  img.imageId && img.imageId.uuid === newMainPhotoUuid
                )
              );

              setSubImage(
                images.filter((img) =>
                  !img.imageId || img.imageId.uuid !== newMainPhotoUuid
                )
              );

              setCurrentMainPhotoUuid(newMainPhotoUuid);
              setIsUploadMainPhoto(false);
              return;
            }

            setSubImage(
              images.filter((img) =>
                !img.imageId || img.imageId.uuid !== currentMainPhotoUuid
              )
            );

          }, [ images ])

          const chooseImageText = (id) => (
            <span className={css.chooseImageText}>
              <span className={css.chooseImage}>
                <FormattedMessage id={id} />
              </span>
              <span className={css.imageTypes}>
                <FormattedMessage id="EditListingPhotosForm.imageTypes" />
              </span>
            </span>
          );

          const imageRequiredMessage = intl.formatMessage({
            id: 'EditListingPhotosForm.imageRequired',
          });

          const { publishListingError, showListingsError, updateListingError, uploadImageError } =
            fetchErrors || {};
          const uploadOverLimit = isUploadImageOverLimitError(uploadImageError);

          let uploadImageFailed = null;

          if (uploadOverLimit) {
            uploadImageFailed = (
              <p className={css.error}>
                <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadOverLimit" />
              </p>
            );
          } else if (uploadImageError) {
            uploadImageFailed = (
              <p className={css.error}>
                <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadFailed" />
              </p>
            );
          }

          // NOTE: These error messages are here since Photos panel is the last visible panel
          // before creating a new listing. If that order is changed, these should be changed too.
          // Create and show listing errors are shown above submit button
          const publishListingFailed = publishListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPhotosForm.publishListingFailed" />
            </p>
          ) : null;
          const showListingFailed = showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPhotosForm.showListingFailed" />
            </p>
          ) : null;

          const submittedOnce = this.submittedImages.length > 0;
          // imgs can contain added images (with temp ids) and submitted images with uniq ids.
          const arrayOfImgIds = imgs =>
            imgs.map(i => (typeof i.id === 'string' ? i.imageId : i.id));
          const imageIdsFromProps = arrayOfImgIds(images);
          const imageIdsFromPreviousSubmit = arrayOfImgIds(this.submittedImages);
          const imageArrayHasSameImages = isEqual(imageIdsFromProps, imageIdsFromPreviousSubmit);
          const pristineSinceLastSubmit = submittedOnce && imageArrayHasSameImages;

          const submitReady = (updated && pristineSinceLastSubmit) || ready;
          const submitInProgress = updateInProgress;
          const submitDisabled =
            invalid || disabled || submitInProgress || imageUploadRequested || ready || !mainImage.length;

          const classes = classNames(css.root, className);

          const altText = intl.formatMessage({
            id: 'EditListingPhotosForm.savedImageAltText',
          })

          return (
            <Form
              className={classes}
              onSubmit={e => {
                const formState = form.getState();
                formState.values.mainPhotoUuid = currentMainPhotoUuid;
                handleSubmit(e);
              }}
            >
              {updateListingError ? (
                <p className={css.error}>
                  <FormattedMessage id="EditListingPhotosForm.updateFailed" />
                </p>
              ) : null}
              <h2 className={css.title}>
                <FormattedMessage id="EditListingPhotoPanel.mainPhotoTitle" />
              </h2>
              <AddImages
                className={css.imagesField}
                images={mainImage}
                thumbnailClassName={css.thumbnail}
                savedImageAltText={altText}
                onRemoveImage={onRemoveImage}
                isShowRemoveButton={false}
              >
                <Field
                  id="addMainImage"
                  name="addMainImage"
                  accept={ACCEPT_IMAGES}
                  form={null}
                  label={chooseImageText("EditListingPhotosForm.chooseMainImage")}
                  type="file"
                  disabled={imageUploadRequested}
                >
                  {fieldprops => {
                    const { accept, input, label, disabled: fieldDisabled } = fieldprops;
                    const { name, type } = input;
                    const onChange = e => {
                      setIsUploadMainPhoto(true);
                      const file = e.target.files[0];
                      form.change(`addMainImage`, file);
                      form.blur(`addMainImage`);
                      onImageUploadHandler(file);
                    };
                    const inputProps = { accept, id: name, name, onChange, type };
                    return (
                      <div className={css.addImageWrapper}>
                        <div className={css.aspectRatioWrapper}>
                          {fieldDisabled ? null : (
                            <input {...inputProps} className={css.addImageInput} />
                          )}
                          <label htmlFor={name} className={css.addImage}>
                            {label}
                          </label>
                        </div>
                      </div>
                    );
                  }}
                </Field>

                <Field
                  component={props => {
                    const { input, meta } = props;
                    return (
                      <div className={css.imageRequiredWrapper}>
                        <input {...input} />
                        <ValidationError fieldMeta={meta} />
                      </div>
                    );
                  }}
                  name="images"
                  type="hidden"
                  validate={composeValidators(nonEmptyArray(imageRequiredMessage))}
                />
              </AddImages>

              <h2 className={css.title}>
                <FormattedMessage id="EditListingPhotoPanel.subPhotoTitle" />
              </h2>
              <AddImages
                className={css.imagesField}
                images={subImage}
                thumbnailClassName={css.thumbnail}
                savedImageAltText={altText}
                onRemoveImage={onRemoveImage}
              >
                <Field
                  id="addImage"
                  name="addImage"
                  accept={ACCEPT_IMAGES}
                  form={null}
                  label={chooseImageText("EditListingPhotosForm.chooseSubImage")}
                  type="file"
                  disabled={imageUploadRequested}
                >
                  {fieldprops => {
                    const { accept, input, label, disabled: fieldDisabled } = fieldprops;
                    const { name, type } = input;
                    const onChange = e => {
                      const file = e.target.files[0];
                      form.change(`addImage`, file);
                      form.blur(`addImage`);
                      onImageUploadHandler(file);
                    };
                    const inputProps = { accept, id: name, name, onChange, type };
                    return (
                      <div className={css.addImageWrapper}>
                        <div className={css.aspectRatioWrapper}>
                          {fieldDisabled ? null : (
                            <input {...inputProps} className={css.addImageInput} />
                          )}
                          <label htmlFor={name} className={css.addImage}>
                            {label}
                          </label>
                        </div>
                      </div>
                    );
                  }}
                </Field>

                <Field
                  component={props => {
                    const { input, meta } = props;
                    return (
                      <div className={css.imageRequiredWrapper}>
                        <input {...input} />
                        <ValidationError fieldMeta={meta} />
                      </div>
                    );
                  }}
                  name="images"
                  type="hidden"
                  validate={composeValidators(nonEmptyArray(imageRequiredMessage))}
                />
              </AddImages>
              {uploadImageFailed}

              <p className={css.tip}>
                <FormattedMessage id="EditListingPhotosForm.addImagesTip" />
              </p>
              {publishListingFailed}
              {showListingFailed}

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
  }
}

EditListingPhotosFormComponent.defaultProps = { fetchErrors: null, images: [] };

EditListingPhotosFormComponent.propTypes = {
  fetchErrors: shape({
    publishListingError: propTypes.error,
    showListingsError: propTypes.error,
    uploadImageError: propTypes.error,
    updateListingError: propTypes.error,
  }),
  images: array,
  intl: intlShape.isRequired,
  onImageUpload: func.isRequired,
  onUpdateImageOrder: func.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  onRemoveImage: func.isRequired,
  mainPhotoUuid: string,
};

export default compose(injectIntl)(EditListingPhotosFormComponent);
