'use client'

import { City, Country, ICity, IState, State } from 'country-state-city'
import { useEffect, useMemo, useState } from 'react'
import { MapPinIcon } from './icons'
import { SelectField } from './SelectField'
import { TextField } from './TextField'

type Props = {
  country: string
  state: string
  city: string
  onChange: (next: { country: string; state: string; city: string }) => void
  /** Default country name when nothing is selected yet. */
  defaultCountry?: string
}

/**
 * Three cascading fields — Country → State → City — backed by the
 * country-state-city dataset. Stores the human-readable name in the
 * parent state (not ISO codes) so existing DB rows roundtrip cleanly.
 *
 * If the dataset has no cities for the picked state, the City field
 * falls back to a plain text input — typing in your local district is
 * always allowed.
 */
export function CountryStateCityFields({
  country,
  state,
  city,
  onChange,
  defaultCountry = 'Nigeria',
}: Props) {
  const countries = useMemo(() => Country.getAllCountries(), [])
  const countryByName = useMemo(
    () => new Map(countries.map((c) => [c.name.toLowerCase(), c])),
    [countries],
  )

  const activeCountry = countryByName.get((country || '').toLowerCase()) ?? null

  const states: IState[] = useMemo(
    () => (activeCountry ? State.getStatesOfCountry(activeCountry.isoCode) : []),
    [activeCountry],
  )
  const stateByName = useMemo(
    () => new Map(states.map((s) => [s.name.toLowerCase(), s])),
    [states],
  )
  const activeState = stateByName.get((state || '').toLowerCase()) ?? null

  const cities: ICity[] = useMemo(() => {
    if (!activeCountry || !activeState) return []
    return City.getCitiesOfState(activeCountry.isoCode, activeState.isoCode)
  }, [activeCountry, activeState])

  // Default the country on first mount when empty.
  useEffect(() => {
    if (!country && defaultCountry) {
      onChange({ country: defaultCountry, state: '', city: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When the picked country no longer matches the saved state, clear it.
  // Same for city when the state changes.
  function pickCountry(name: string) {
    onChange({ country: name, state: '', city: '' })
  }
  function pickState(name: string) {
    onChange({ country, state: name, city: '' })
  }
  function pickCity(name: string) {
    onChange({ country, state, city: name })
  }

  const stateOptions = [
    { value: '', label: states.length ? '— select a state —' : '— no states for country —' },
    ...states.map((s) => ({ value: s.name, label: s.name })),
  ]

  // Show the city dropdown only when we actually have cities for the state.
  const hasCityOptions = cities.length > 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <SelectField
        label="Country"
        value={country}
        onChange={(e) => pickCountry(e.target.value)}
        icon={<MapPinIcon />}
        options={[
          { value: '', label: '— select country —' },
          ...countries.map((c) => ({ value: c.name, label: `${c.flag ?? ''} ${c.name}`.trim() })),
        ]}
      />

      <SelectField
        label="State"
        value={state}
        onChange={(e) => pickState(e.target.value)}
        icon={<MapPinIcon />}
        disabled={!activeCountry || states.length === 0}
        options={stateOptions}
      />

      {hasCityOptions ? (
        <div className="space-y-1.5">
          <SelectField
            label="City"
            value={city}
            onChange={(e) => pickCity(e.target.value)}
            icon={<MapPinIcon />}
            disabled={!activeState}
            options={[
              { value: '', label: '— select city —' },
              ...cities.map((c) => ({ value: c.name, label: c.name })),
            ]}
          />
        </div>
      ) : (
        <TextField
          label="City"
          value={city}
          onChange={(e) => pickCity(e.target.value)}
          icon={<MapPinIcon />}
          hint={
            activeState
              ? 'No city list available — type it in.'
              : activeCountry
                ? 'Pick a state first, or type the city.'
                : 'e.g. Lagos'
          }
        />
      )}
    </div>
  )
}
