import { Carousel } from 'react-carousel-minimal';
import React from 'react';

import css from './EquipmentListingPage.module.css';

const ImageSlider = ({images}) => {
  const listImage = images.map((image) => {
    const variant = image.attributes.variants['landscape-crop'];
    return ({image: `${variant.url}${variant.width}w`})
  })

  if (!listImage.length) return null;

  return (
    <div className={css.sectionDescription}>
      <Carousel
        data={listImage}
        time={2000}
        width="100%"
        height="500px"
        captionPosition="top"
        automatic
        pauseIconColor="white"
        pauseIconSize="40px"
        slideBackgroundColor="darkgrey"
        slideImageFit="cover"
        thumbnails={true}
        thumbnailWidth="100px"
        style={{
          textAlign: "center",
          margin: "40px auto",
        }}
      />
    </div>

  )
}

export default ImageSlider;
