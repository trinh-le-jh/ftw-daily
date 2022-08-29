import React from 'react';
import ActionBarMaybe from './ActionBarMaybe';

import css from './EquipmentListingPage.module.css';
import ImageSlider from './ImageSlider';

const SectionImages = props => {
  const {
    listing,
    isOwnListing,
    editParams,
  } = props;

  // Action bar is wrapped with a div that prevents the click events
  // to the parent that would otherwise open the image carousel
  const actionBar = listing.id ? (
    <div onClick={e => e.stopPropagation()}>
      <ActionBarMaybe isOwnListing={isOwnListing} listing={listing} editParams={editParams} />
    </div>
  ) : null;


  return (
    <div className={css.sectionImages}>
      <div className={css.threeToTwoWrapper}>
        <div className={css.aspectWrapper}>
          {actionBar}
          <ImageSlider images={listing.images}/>
        </div>
      </div>
    </div>
  );
};

export default SectionImages;
