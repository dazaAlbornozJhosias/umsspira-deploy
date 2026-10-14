'use client'

import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin, ArrowUp } from 'lucide-react'
import Logo from './logo'

const PLATFORM_LINKS = [
  { href: '/companies', label: 'Empresas' },
  { href: '/job-postings', label: 'Ofertas' },
  { href: '/events', label: 'Eventos' },
  { href: '/benefits', label: 'Beneficios' },
]

const ACCOUNT_LINKS = [
  { href: '/login', label: 'Iniciar sesion' },
  { href: '/register', label: 'Registrarse' },
  { href: '/profile', label: 'Mi perfil' },
  { href: '/settings', label: 'Configuracion' },
]

const LEGAL_LINKS = [
  { href: '/terminos', label: 'Terminos' },
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/cookies', label: 'Cookies' },
]

const SOCIALS = [
  { href: 'https://facebook.com', label: 'Facebook', icon: Facebook },
  { href: 'https://instagram.com', label: 'Instagram', icon: Instagram },
  { href: 'https://linkedin.com', label: 'LinkedIn', icon: Linkedin },
  { href: 'https://twitter.com', label: 'Twitter', icon: Twitter },
]

export function PortalSiteFooter() {
  const year = new Date().getFullYear()

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer className="mt-16 border-t border-white/10 bg-umss-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="[&_span]:!text-white">
              <Logo />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Egresados que inspiran, talento que conecta. La comunidad oficial de
              titulados de la Universidad Mayor de San Simon.
            </p>

            <div className="mt-6">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
                Siguenos
              </h4>
              <div className="flex gap-2">
                {SOCIALS.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-umss-orange hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <nav aria-label="Plataforma" className="lg:col-span-2">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Plataforma
            </h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              {PLATFORM_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-umss-orange">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Cuenta" className="lg:col-span-2">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Cuenta
            </h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              {ACCOUNT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-umss-orange">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-umss-orange" />
                <a href="mailto:contacto@umsspira.umss.edu.bo" className="transition-colors hover:text-umss-orange">
                  contacto@umsspira.umss.edu.bo
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-umss-orange" />
                <a href="tel:+5914000000" className="transition-colors hover:text-umss-orange">
                  +591 4 000 0000
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-umss-orange" />
                <span>
                  Av. Ballivian s/n, Campus UMSS
                  <br />
                  Cochabamba, Bolivia
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 sm:px-6 md:flex-row lg:px-8">
          <p className="text-center text-xs text-white/60 md:text-left">
            (c) {year} <span className="font-semibold text-white/80">UMSSPIRA</span> - Titulados UMSS. Todos los derechos reservados.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs text-white/60 transition-colors hover:text-umss-orange">
                {label}
              </Link>
            ))}

            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Volver arriba"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-umss-orange hover:text-white"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PortalSiteFooter
