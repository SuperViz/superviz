import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'


import { RouterProvider } from 'react-router-dom'
import { router } from './router/router.tsx'
import { HelmetProvider } from 'react-helmet-async'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </React.StrictMode>,
)
