import React from 'react'
import { useLocation } from 'react-router-dom'

import { routes } from '../routes'

import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

const AppBreadcrumb = () => {
  const currentLocation = useLocation().pathname

  const getRouteName = (pathname, routes) => {
    const currentRoute = routes.find((route) => route.path === pathname)
    return currentRoute ? currentRoute.name : false
  }

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []

    location.split('/').reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`
      const routeName = getRouteName(currentPathname, routes)

      routeName &&
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length ? true : false,
        })

      return currentPathname
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <CBreadcrumb
      className="my-0"
      style={{
        padding: '10px 0',
        fontSize: '12px',
        alignItems: 'center',
      }}
    >
      {/* HOME */}

      <CBreadcrumbItem
        href="/"
        style={{
          color: '#6b7280',
          fontWeight: '600',
          textDecoration: 'none',
        }}
      >
        Home
      </CBreadcrumbItem>

      {/* ROUTES */}

      {breadcrumbs.map((breadcrumb, index) => {
        return (
          <CBreadcrumbItem
            {...(breadcrumb.active ? { active: true } : { href: breadcrumb.pathname })}
            key={index}
            style={{
              color: breadcrumb.active ? '#111827' : '#6b7280',
              fontWeight: breadcrumb.active ? '800' : '600',
            }}
          >
            {breadcrumb.name}
          </CBreadcrumbItem>
        )
      })}
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)
