function Block({ className = '' }) {
  return <span className={`route-skeleton-block ${className}`} aria-hidden="true" />
}

export default function RouteSkeleton({ pathname }) {
  if (pathname === '/login') {
    return <main className="route-skeleton route-skeleton-login"><section><Block className="title" /><Block className="line" /><Block className="field" /><Block className="field" /><Block className="button" /></section><Block className="login-image" /></main>
  }

  if (pathname === '/account') {
    return <main className="route-skeleton route-skeleton-profile"><aside><Block className="title" /><Block className="nav-item" /><Block className="nav-item" /><Block className="nav-item" /><Block className="nav-item" /></aside><section><Block className="profile-avatar" /><Block className="title" /><Block className="line" /><div className="route-skeleton-fields"><Block className="field" /><Block className="field" /><Block className="field" /><Block className="field" /></div><Block className="button" /></section></main>
  }

  if (pathname === '/admin') {
    return <main className="route-skeleton route-skeleton-admin"><div className="route-skeleton-admin-body"><aside><Block className="nav-item" /><Block className="nav-item" /><Block className="nav-item" /></aside><section><div className="route-skeleton-kpis"><Block /><Block /><Block /><Block /></div><Block className="admin-chart" /><div className="route-skeleton-cards"><Block /><Block /></div></section></div></main>
  }

  if (pathname === '/checkout') {
    return <main className="route-skeleton route-skeleton-checkout"><Block className="title" /><Block className="line" /><div><section><Block className="section-title" /><Block className="field" /><Block className="field" /><Block className="section-title" /><Block className="field" /><Block className="field" /></section><aside><Block className="section-title" /><Block className="summary-item" /><Block className="summary-item" /><Block className="button" /></aside></div></main>
  }

  if (pathname === '/shop') {
    return <main className="route-skeleton route-skeleton-shop"><Block className="shop-hero" /><div className="route-skeleton-products">{Array.from({ length: 8 }, (_, index) => <Block key={index} />)}</div></main>
  }

  return <main className="route-skeleton route-skeleton-editorial"><section><div><Block className="title" /><Block className="line" /><Block className="line short" /><Block className="button" /></div><Block className="editorial-image" /></section></main>
}
