import { forwardRef } from 'react'

export const GlassEffect = forwardRef(function GlassEffect(
  {
    children,
    className = '',
    contentClassName = '',
    style = {},
    href,
    target = '_blank',
  },
  ref,
) {
  const glass = (
    <div
      ref={ref}
      className={`liquid-glass-effect relative isolate overflow-hidden text-white ${className}`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.15)',
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        className="liquid-glass-distortion absolute inset-0 z-0 rounded-[inherit] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="liquid-glass-tint absolute inset-0 z-10 rounded-[inherit] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="liquid-glass-highlight absolute inset-0 z-20 rounded-[inherit] pointer-events-none"
      />

      <div className={`relative z-30 ${contentClassName}`}>{children}</div>
    </div>
  )

  if (!href) return glass

  return (
    <a href={href} target={target} rel="noopener noreferrer" className="block">
      {glass}
    </a>
  )
})

export function GlassFilter() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="absolute w-0 h-0 overflow-hidden pointer-events-none"
    >
      <defs>
        <filter
          id="glass-distortion"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.001 0.005"
            numOctaves="1"
            seed="17"
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>
          <feGaussianBlur in="mapped" stdDeviation="3" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="2"
            specularConstant="0.25"
            specularExponent="35"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale="28"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feBlend in="displaced" in2="specLight" mode="screen" />
        </filter>
      </defs>
    </svg>
  )
}
