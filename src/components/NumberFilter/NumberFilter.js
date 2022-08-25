import React, { Component } from 'react';
import { arrayOf, func, number, object, shape, string } from 'prop-types';
import classNames from 'classnames';
import { injectIntl, intlShape } from '../../util/reactIntl';
import debounce from 'lodash/debounce';
import { FieldTextInput } from '../../components';

import { FilterPopup, FilterPlain } from '../../components';
import css from './NumberFilter.module.css';
import { validateYear, validateHour } from '../../util/validators';

// When user types, we wait for new keystrokes a while before searching new content
const DEBOUNCE_WAIT_TIME = 600;
// Short search queries (e.g. 2 letters) have a longer timeout before search is made
const TIMEOUT_FOR_SHORT_QUERIES = 2000;

const getKeywordQueryParam = queryParamNames => {
  return Array.isArray(queryParamNames)
    ? queryParamNames[0]
    : typeof queryParamNames === 'string'
      ? queryParamNames
      : 'keywords';
};

class NumberFilter extends Component {
  constructor(props) {
    super(props);

    this.filter = null;
    this.filterContent = null;
    this.shortKeywordTimeout = null;
    this.mobileInputRef = React.createRef();

    this.positionStyleForContent = this.positionStyleForContent.bind(this);
  }

  componentWillUnmount() {
    window.clearTimeout(this.shortKeywordTimeout);
  }

  positionStyleForContent() {
    if (this.filter && this.filterContent) {
      // Render the filter content to the right from the menu
      // unless there's no space in which case it is rendered
      // to the left
      const distanceToRight = window.innerWidth - this.filter.getBoundingClientRect().right;
      const labelWidth = this.filter.offsetWidth;
      const contentWidth = this.filterContent.offsetWidth;
      const contentWidthBiggerThanLabel = contentWidth - labelWidth;
      const renderToRight = distanceToRight > contentWidthBiggerThanLabel;
      const contentPlacementOffset = this.props.contentPlacementOffset;

      const offset = renderToRight
        ? { left: contentPlacementOffset }
        : { right: contentPlacementOffset };
      // set a min-width if the content is narrower than the label
      const minWidth = contentWidth < labelWidth ? { minWidth: labelWidth } : null;

      return { ...offset, ...minWidth };
    }
    return {};
  }

  render() {
    const {
      rootClassName,
      className,
      id,
      name,
      label,
      initialValues,
      contentPlacementOffset,
      onSubmit,
      queryParamNames,
      intl,
      showAsPopup,
      config,
      inputConfig,
      ...rest
    } = this.props;

    const classes = classNames(rootClassName || css.root, className);

    const urlParam = getKeywordQueryParam(queryParamNames);
    const hasInitialValues =
      !!initialValues && !!initialValues[urlParam] && initialValues[urlParam].length > 0;
    let initValue = '';
    if (hasInitialValues && inputConfig && inputConfig.type === 'year') {
      initValue = 'Year: ' + initialValues[urlParam]
    }
    if (hasInitialValues && inputConfig && inputConfig.type === 'hour') {
      initValue = 'Hour: ' + initialValues[urlParam].replace('0,', '')
    }
    const labelForPopup = hasInitialValues
      ? intl.formatMessage(
        { id: 'NumberFilter.labelSelected' },
        { labelText: initValue }
      )
      : label;

    const labelForPlain = hasInitialValues
      ? intl.formatMessage(
        { id: 'NumberFilterPlainForm.labelSelected' },
        { labelText: initValue }
      )
      : label;

    const filterText = intl.formatMessage({ id: 'NumberFilter.filterText' });

    const placeholder = intl.formatMessage({ id: 'NumberFilter.placeholder' });

    const contentStyle = this.positionStyleForContent();

    // pass the initial values with the name key so that
    // they can be passed to the correct field
    const namedInitialValues = {
      [name]: hasInitialValues
        ? initialValues[urlParam].replace('0,', '')
        : ''
    };

    const handleSubmit = values => {
      let usedValue = values ? values[name] : values;
      if (name === 'numberhour' && usedValue.length) {
        usedValue = `0,${usedValue}`
      }
      if(!usedValue.length) {
        usedValue = undefined;
      }
      onSubmit({ [urlParam]: usedValue });
    };

    const debouncedSubmit = debounce(handleSubmit, DEBOUNCE_WAIT_TIME, {
      leading: false,
      trailing: true,
    });
    // Use timeout for shart queries and debounce for queries with any length
    const handleChangeWithDebounce = values => {
      // handleSubmit gets values as params.
      // If this field ("keyword") is short, create timeout
      const hasKeywordValue = values && values[name];
      const keywordValue = hasKeywordValue ? values && values[name] : '';
      if (!hasKeywordValue || (hasKeywordValue && keywordValue.length >= 3)) {
        if (this.shortKeywordTimeout) {
          window.clearTimeout(this.shortKeywordTimeout);
        }
        return debouncedSubmit(values);
      } else {
        this.shortKeywordTimeout = window.setTimeout(() => {
          // if mobileInputRef exists, use the most up-to-date value from there
          return this.mobileInputRef && this.mobileInputRef.current
            ? handleSubmit({ ...values, [name]: this.mobileInputRef.current.value })
            : handleSubmit(values);
        }, TIMEOUT_FOR_SHORT_QUERIES);
      }
    };

    // Uncontrolled input needs to be cleared through the reference to DOM element.
    const handleClear = () => {
      if (this.mobileInputRef && this.mobileInputRef.current) {
        this.mobileInputRef.current.value = '';
      }
    };

    const yearErrorMessage = intl.formatMessage({
      id: 'EditEquipmentListingGeneralForm.manufactureYearErrorMessage',
    });

    const hourErrorMessage = intl.formatMessage({
      id: 'EditEquipmentListingGeneralForm.numberHourErrorMessage',
    });

    let validationFunction = () => undefined;
    if (inputConfig.type === 'year') {
      validationFunction = (value) => {
        return validateYear(yearErrorMessage, value);
      }
    }
    if (inputConfig.type === 'hour') {
      validationFunction = (value) => {
        return validateHour(hourErrorMessage, value);
      }
    }

    return showAsPopup ? (
      <FilterPopup
        className={classes}
        rootClassName={rootClassName}
        popupClassName={css.popupSize}
        name={name}
        label={labelForPopup}
        isSelected={hasInitialValues}
        id={`${id}.popup`}
        inputName={name}
        showAsPopup
        labelMaxWidth={250}
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        isNumber
        initialValues={namedInitialValues}
        keepDirtyOnReinitialize
        {...rest}
      >
        <FieldTextInput
          className={css.field}
          name={name}
          id={`${id}-input`}
          type="text"
          maxLength={inputConfig.maxLength}
          label={filterText}
          placeholder={placeholder}
          autoComplete="off"
          validate={(values) => validationFunction(values)}
        />
      </FilterPopup>
    ) : (
      <FilterPlain
        className={className}
        rootClassName={rootClassName}
        label={labelForPlain}
        isSelected={hasInitialValues}
        id={`${id}.plain`}
        label={label}
        inputName={name}
        isNumber
        liveEdit
        contentPlacementOffset={contentStyle}
        onSubmit={handleChangeWithDebounce}
        onClear={handleClear}
        initialValues={namedInitialValues}
        {...rest}
      >
        <fieldset className={css.fieldPlain}>
          <label>{filterText}</label>
          <FieldTextInput
            name={name}
            id={`${id}-input`}
            maxLength={inputConfig.maxLength}
            inputRef={this.mobileInputRef}
            type="text"
            placeholder={placeholder}
            autoComplete="off"
            validate={(values) => validationFunction(values)}
          />
        </fieldset>
      </FilterPlain>
    );
  }
}

NumberFilter.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: null,
  contentPlacementOffset: 0,
};

NumberFilter.propTypes = {
  rootClassName: string,
  className: string,
  id: string.isRequired,
  name: string.isRequired,
  queryParamNames: arrayOf(string).isRequired,
  label: string.isRequired,
  onSubmit: func.isRequired,
  initialValues: shape({
    keyword: string,
  }),
  contentPlacementOffset: number,

  // form injectIntl
  intl: intlShape.isRequired,
  inputConfig: object,
};

export default injectIntl(NumberFilter);
