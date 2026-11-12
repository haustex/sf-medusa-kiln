import { Label } from "@modules/common/components/ui"
import React, { useEffect, useId, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
  /** Accessible names of the show/hide button on password fields */
  toggleLabels?: { show: string; hide: string }
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched: _touched, required, topLabel, toggleLabels = { show: "Tampilkan kata sandi", hide: "Sembunyikan kata sandi" }, id, ...props }, ref) => {
    // The floating label needs an id to point at (was htmlFor={inputId} with no matching id)
    const autoId = useId()
    const inputId = id ?? `${name}-${autoId}`
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="flex flex-col w-full">
        {topLabel && (
          <Label className="mb-stack-sm text-sm font-medium">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full text-sm">
          <input
            type={inputType}
            id={inputId}
            name={name}
            placeholder=" "
            required={required}
            className="block h-12 w-full appearance-none rounded-[var(--field-radius)] border border-field-border bg-field-background px-4 pb-1 pt-4 text-base transition-colors hover:border-muted focus:border-foreground focus:outline-none focus:ring-2 focus:ring-focus"
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={inputId}
            onClick={() => inputRef.current?.focus()}
            className="absolute top-3.5 -z-1 mx-3 flex origin-0 items-center justify-center px-1 text-muted transition-all duration-300"
          >
            {label}
            {required && <span className="text-danger">*</span>}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? toggleLabels.hide : toggleLabels.show}
              aria-pressed={showPassword}
              className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-[var(--field-radius)] text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
