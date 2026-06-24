'use client'

import { ChangeEvent, ReactNode } from 'react'
import { Combobox, ComboboxOption } from './Combobox'

type Option = ComboboxOption

type LegacyEvent = ChangeEvent<HTMLSelectElement>

type Props = {
  label: string
  value: string
  /** Receives a synthesized ChangeEvent so existing callsites built
   *  around `onChange={(e) => setX(e.target.value)}` keep working. */
  onChange: (event: LegacyEvent) => void
  options: Option[]
  icon?: ReactNode
  error?: string
  hint?: string
  disabled?: boolean
  placeholder?: string
  name?: string
}

/**
 * Backwards-compatible wrapper around the searchable Combobox.
 *
 * SelectField used to render a native `<select>`. It now delegates to
 * Combobox so every dropdown across the app gets a built-in search box,
 * keyboard navigation, and a polished list. The legacy onChange event
 * shape is preserved — callers using `e.target.value` continue to work.
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  icon,
  error,
  hint,
  disabled,
  placeholder,
  name,
}: Props) {
  return (
    <Combobox
      label={label}
      value={value}
      onChange={(next) => {
        // Synthesize a select-change event so callers using
        // `(e) => e.target.value` keep working without modification.
        const synthetic = {
          target: { value: next, name: name ?? '' },
          currentTarget: { value: next, name: name ?? '' },
        } as unknown as LegacyEvent
        onChange(synthetic)
      }}
      options={options}
      icon={icon}
      error={error}
      hint={hint}
      disabled={disabled}
      placeholder={placeholder}
      name={name}
      searchable={options.length > 6}
    />
  )
}
