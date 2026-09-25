import ScrollReveal from './ScrollReveal'

export default function PageBanner({ eyebrow, title, copy, images, variant }) {
  return (
    <ScrollReveal className={`page-banner ${variant}`}>
      <div className="page-banner-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      <div className="page-banner-visual" aria-hidden="true">
        {images.map((image, index) => <img src={image} alt="" key={image} className={`banner-image-${index + 1}`} />)}
      </div>
    </ScrollReveal>
  )
}
