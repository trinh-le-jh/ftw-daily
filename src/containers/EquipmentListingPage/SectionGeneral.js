import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { richText } from '../../util/richText';

import css from './EquipmentListingPage.module.css';
import { PropertyGroup } from '../../components';

const MIN_LENGTH_FOR_LONG_WORDS_IN_DESCRIPTION = 20;

const TextSection = props => {
  const { cssSection, cssTitle, cssText, textId, text } = props;
  return (
    <div className={cssSection}>
      <h2 className={cssTitle}>
        <FormattedMessage id={textId}/>
      </h2>
      <p className={cssText}>
        {richText(text, {
          longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS_IN_DESCRIPTION,
          longWordClass: css.longWord,
        })}
      </p>
    </div>
  )
}

const SectionGeneral = props => {
  const { description, typeOptions, selectedType, rules, manufacture } = props;

  const descriptionSection = description ? (
    <TextSection
      cssSection={css.sectionDescription}
      cssTitle={css.descriptionTitle}
      cssText={css.description}
      textId="EquipmentListingPage.generalTitle"
      text={description}
    />
  ) : null;

  const typeSection = typeOptions ? (
    <div className={css.sectionDescription}>
      <h2 className={css.featuresTitle}>
        <FormattedMessage id="EquipmentListingPage.typeTitle" />
      </h2>
      <PropertyGroup
        id="EquipmentListingPage.type"
        options={typeOptions}
        selectedOptions={selectedType}
        twoColumns={true}
      />
    </div>
  ) : null;

  const rulesSection = rules ? (
    <TextSection
      cssSection={css.sectionDescription}
      cssTitle={css.descriptionTitle}
      cssText={css.description}
      textId="EquipmentListingPage.rulesTitle"
      text={rules}
    />
  ) : null;

  const manufactureSection = rules ? (
    <TextSection
      cssSection={css.sectionDescription}
      cssTitle={css.descriptionTitle}
      cssText={css.description}
      textId="EquipmentListingPage.manufactureTitle"
      text={manufacture}
    />
  ) : null;
  return (
    <>
      {descriptionSection}
      {typeSection}
      {rulesSection}
      {manufactureSection}
    </>
  )
};

export default SectionGeneral;
